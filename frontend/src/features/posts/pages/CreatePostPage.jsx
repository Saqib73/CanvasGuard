import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaArrowLeft, FaTimes } from "react-icons/fa";
import { MdOutlineBrush, MdOutlineImage, MdOutlineShield } from "react-icons/md";
import { LuChevronDown, LuGlobe, LuUsers } from "react-icons/lu";
import { useCurrentUser } from "../../auth/api/auth.hooks";
import { useMyCommunities } from "../../communities/api/communities.hooks";
import { getAvatarUrl } from "../../../lib/avatar";
import { extractHashtags } from "../../../lib/hashtags";
import { submitPost } from "../pendingPosts";
import { postButtonClass } from "../styles";

const MAX_FILE_BYTES = 5 * 1024 * 1024; // matches the server's upload limit

const USAGE_LABELS = [
  { value: "no_ai", label: "No AI training" },
  { value: "credit_required", label: "Credit required" },
  { value: "no_commercial", label: "No commercial use" },
];

function Switch({ id, checked, onChange }) {
  return (
    <span className="relative inline-flex flex-shrink-0">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span className="h-6 w-11 rounded-full bg-cg-border transition peer-checked:bg-cg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-cg-primary/40" />
      <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
    </span>
  );
}

function OptionRow({ id, icon, title, description, checked, onChange }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center justify-between gap-4 px-4 py-3">
      <span className="flex items-start gap-3 text-sm">
        <span className="mt-0.5 text-lg text-cg-primary">{icon}</span>
        <span>
          <span className="block font-medium">{title}</span>
          <span className="mt-0.5 block text-xs text-cg-muted">{description}</span>
        </span>
      </span>
      <Switch id={id} checked={checked} onChange={onChange} />
    </label>
  );
}

// "Everyone ▾" pill that picks where the post goes, like X's audience picker
function AudiencePicker({ communities, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = communities.find((c) => c._id === value);

  useEffect(() => {
    if (!open) return;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (id) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center gap-1 rounded-full border border-cg-primary/40 px-3 py-0.5 text-sm font-semibold text-cg-primary transition hover:bg-cg-primary/10"
      >
        {selected ? selected.name : "Everyone"}
        <LuChevronDown aria-hidden="true" />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 z-20 mt-2 max-h-72 w-64 overflow-y-auto rounded-2xl border border-cg-border bg-cg-surface p-1 shadow-lg"
        >
          <li>
            <button
              type="button"
              role="option"
              aria-selected={!value}
              onClick={() => choose("")}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-cg-hover"
            >
              <LuGlobe className="text-cg-primary" /> Everyone
            </button>
          </li>
          {communities.length > 0 && (
            <li className="px-3 pb-1 pt-2 text-xs font-medium text-cg-muted">Your communities</li>
          )}
          {communities.map((c) => (
            <li key={c._id}>
              <button
                type="button"
                role="option"
                aria-selected={value === c._id}
                onClick={() => choose(c._id)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-cg-hover"
              >
                <LuUsers className="flex-shrink-0 text-cg-primary" />
                <span className="truncate">{c.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function CreatePostPage() {
  const navigate = useNavigate();
  // The home composer can hand over an image and the text typed so far;
  // a community's "Post here" button hands over that community
  const { state } = useLocation();
  const { data: user } = useCurrentUser();
  const [text, setText] = useState(state?.text || "");
  const [file, setFile] = useState(state?.file || null);
  const [communityId, setCommunityId] = useState(state?.communityId || "");
  const [isArt, setIsArt] = useState(false);
  const [watermark, setWatermark] = useState(true);
  const [license, setLicense] = useState([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  const { data: communitiesData } = useMyCommunities();
  const myCommunities = communitiesData?.communities || [];

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl]);

  const tags = useMemo(() => extractHashtags(text), [text]);

  const pickFile = (f) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast.error("Please choose an image file");
    if (f.size > MAX_FILE_BYTES) return toast.error("Images can be up to 5 MB");
    setFile(f);
  };

  const toggleLabel = (value) =>
    setLicense((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));

  const canPost = Boolean(text.trim() || file);

  const handlePost = () => {
    if (!canPost) return;
    const description = text.trim();
    const original = Boolean(file) && isArt;

    const formData = new FormData();
    formData.append("description", description);
    if (file) formData.append("files", file);
    if (communityId) formData.append("community", communityId);
    formData.append("isArt", String(original));
    if (original) {
      formData.append("watermark", String(watermark));
      license.forEach((value) => formData.append("license", value));
    }

    submitPost(formData, {
      description,
      previewUrl: file ? URL.createObjectURL(file) : null,
      watermark: original && watermark,
    });
    navigate("/");
  };

  return (
    <div
      className="relative h-full overflow-y-auto"
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        // Only when the pointer leaves the page, not when it moves between children
        if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        pickFile(e.dataTransfer.files?.[0]);
      }}
    >
      {dragging && (
        <div className="pointer-events-none absolute inset-2 z-30 grid place-items-center rounded-2xl border-2 border-dashed border-cg-primary bg-cg-bg/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2 text-cg-primary">
            <MdOutlineImage className="text-4xl" />
            <span className="font-medium">Drop your image to add it</span>
          </div>
        </div>
      )}

      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-cg-border bg-cg-bg/80 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-ghost btn-sm btn-circle"
            aria-label="Go back"
          >
            <FaArrowLeft />
          </button>
          <h1 className="text-lg font-semibold">New post</h1>
        </div>
        <button type="button" onClick={handlePost} disabled={!canPost} className={postButtonClass}>
          Post
        </button>
      </div>

      <div className="flex gap-3 border-b border-cg-border p-4">
        <img
          alt=""
          src={getAvatarUrl(user)}
          className="h-10 w-10 flex-shrink-0 rounded-full object-cover ring-1 ring-cg-border"
        />
        <div className="min-w-0 flex-1">
          <AudiencePicker communities={myCommunities} value={communityId} onChange={setCommunityId} />

          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handlePost();
            }}
            placeholder="What's happening?"
            rows={2}
            className="mt-2 block min-h-16 max-h-[50vh] w-full resize-none bg-transparent text-xl text-cg-text outline-none [field-sizing:content] placeholder:text-cg-muted"
          />

          {file && (
            <div className="relative mt-3 overflow-hidden rounded-2xl border border-cg-border">
              <img src={previewUrl} alt="Preview" className="max-h-[420px] w-full object-cover" />
              <button
                type="button"
                onClick={() => setFile(null)}
                aria-label="Remove image"
                className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/70 text-white backdrop-blur transition hover:bg-black/85"
              >
                <FaTimes />
              </button>
            </div>
          )}

          <p className="mt-3 min-h-4 text-xs text-cg-muted">
            {tags.length > 0 ? (
              <>
                Tags:{" "}
                {tags.map((t, i) => (
                  <span key={t}>
                    <span className="text-cg-primary">#{t}</span>
                    {i < tags.length - 1 && ", "}
                  </span>
                ))}
              </>
            ) : (
              <>Add <span className="text-cg-primary">#tags</span> like #watercolor or #wip so people can find it.</>
            )}
          </p>

          <div className="mt-3 flex items-center justify-between border-t border-cg-border pt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-ghost btn-sm btn-circle text-xl text-cg-primary hover:bg-cg-primary/10"
              title={file ? "Replace image" : "Add an image"}
              aria-label={file ? "Replace image" : "Add an image"}
            >
              <MdOutlineImage />
            </button>
            <span className="text-xs text-cg-muted">Ctrl + Enter to post</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              pickFile(e.target.files?.[0]);
              e.target.value = "";
            }}
            className="hidden"
          />
        </div>
      </div>

      {file && (
        <div className="m-4 divide-y divide-cg-border rounded-2xl border border-cg-border">
          <OptionRow
            id="isArt"
            icon={<MdOutlineBrush />}
            title="This is my original artwork"
            description="Turn on for art you made yourself. Leave off for photos, memes or anything else."
            checked={isArt}
            onChange={setIsArt}
          />

          {isArt && (
            <>
              <OptionRow
                id="watermark"
                icon={<MdOutlineShield />}
                title="Protect with watermark"
                description="Adds a small signature in the corner and an invisible ownership mark. Your post goes live once it's done."
                checked={watermark}
                onChange={setWatermark}
              />
              <div className="px-4 py-3">
                <p className="text-sm font-medium">Usage labels</p>
                <p className="mt-0.5 text-xs text-cg-muted">Optional. Shown on your post so people know how they may use it.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {USAGE_LABELS.map(({ value, label }) => {
                    const selected = license.includes(value);
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggleLabel(value)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                          selected
                            ? "border-cg-primary bg-cg-primary/10 text-cg-primary"
                            : "border-cg-border text-cg-muted hover:border-cg-primary hover:text-cg-primary"
                        }`}
                      >
                        {selected ? "✓ " : "+ "}
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
