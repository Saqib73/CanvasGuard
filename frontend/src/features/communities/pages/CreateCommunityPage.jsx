import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaArrowLeft, FaTimes } from "react-icons/fa";
import { MdOutlineImage } from "react-icons/md";
import { useCreateCommunity } from "../api/communities.hooks";
import { getErrorMessage } from "../../../lib/api-client";
import { Field, inputClass } from "../../auth/components/fields";
import { postButtonClass } from "../../posts/styles";

const MAX_FILE_BYTES = 5 * 1024 * 1024; // the server's upload limit
// Same limits as the server
const LIMITS = { name: 50, description: 300, rules: 1000 };

function Counter({ value, max }) {
  const left = max - value.length;
  return (
    <span className={`text-xs font-normal tabular-nums ${left < 0 ? "text-error" : left <= max * 0.1 ? "text-warning" : "text-cg-muted"}`}>
      {value.length}/{max}
    </span>
  );
}

export const CreateCommunityPage = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");
  const [cover, setCover] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [nameError, setNameError] = useState("");
  const fileInputRef = useRef(null);

  const navigate = useNavigate();
  const { mutateAsync: createCommunity, isPending } = useCreateCommunity();

  const previewUrl = useMemo(() => (cover ? URL.createObjectURL(cover) : null), [cover]);
  useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl]);

  const pickCover = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image file");
    if (file.size > MAX_FILE_BYTES) return toast.error("Cover images can be up to 5 MB");
    setCover(file);
  };

  const canCreate = Boolean(name.trim() && description.trim() && cover) && !isPending;

  const handleCreate = async () => {
    if (!canCreate) return;
    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("description", description.trim());
    formData.append("rules", rules.trim());
    formData.append("files", cover);

    try {
      const data = await createCommunity(formData);
      toast.success(`${data.community.name} is live!`);
      navigate(`/communities/${data.community._id}`, { replace: true });
    } catch (err) {
      // A taken name belongs under the Name field rather than in a toast
      if (err?.response?.status === 409) setNameError(getErrorMessage(err));
      else toast.error(getErrorMessage(err, "Could not create the community"));
    }
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-cg-border bg-cg-bg/80 px-4 py-2 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-ghost btn-sm btn-circle"
            aria-label="Go back"
          >
            <FaArrowLeft />
          </button>
          <h1 className="text-lg font-bold">Create community</h1>
        </div>
        <button type="button" onClick={handleCreate} disabled={!canCreate} className={postButtonClass}>
          {isPending ? "Creating..." : "Create"}
        </button>
      </div>

      {/* Cover banner: same size as on the community page, so this is what it'll look like */}
      {cover ? (
        <div className="relative h-44 w-full bg-cg-hover">
          <img src={previewUrl} alt="Cover preview" className="h-full w-full object-cover" />
          <div className="absolute right-3 top-3 flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition hover:bg-black/85"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => setCover(null)}
              aria-label="Remove cover"
              className="grid h-8 w-8 place-items-center rounded-full bg-black/70 text-white backdrop-blur transition hover:bg-black/85"
            >
              <FaTimes />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pickCover(e.dataTransfer.files?.[0]);
          }}
          className={`flex h-44 w-full flex-col items-center justify-center gap-2 border-b-2 border-dashed text-sm transition ${
            dragging ? "border-cg-primary bg-cg-primary/5" : "border-cg-border bg-cg-hover hover:bg-cg-primary/5"
          }`}
        >
          <MdOutlineImage className="text-3xl text-cg-primary" />
          <span className="font-medium">Add a cover image</span>
          <span className="text-xs text-cg-muted">Drag it here or click to browse · up to 5 MB</span>
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          pickCover(e.target.files?.[0]);
          e.target.value = "";
        }}
        className="hidden"
      />

      <form
        className="space-y-5 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          handleCreate();
        }}
      >
        <Field
          label="Name"
          htmlFor="name"
          aside={<Counter value={name} max={LIMITS.name} />}
          error={nameError}
          hint="Pick something people will recognise, like Watercolor Corner."
        >
          <input
            id="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setNameError("");
            }}
            maxLength={LIMITS.name}
            placeholder="e.g. Digital Painters"
            aria-invalid={Boolean(nameError)}
            aria-describedby={nameError ? "name-error" : undefined}
            className={`${inputClass} ${nameError ? "border-error focus:border-error" : ""}`}
          />
        </Field>

        <Field label="Description" htmlFor="description" aside={<Counter value={description} max={LIMITS.description} />}>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={LIMITS.description}
            placeholder="What is this community about?"
            className={`${inputClass} resize-none`}
          />
        </Field>

        <Field
          label="Rules"
          htmlFor="rules"
          aside={
            <span className="flex items-baseline gap-2">
              <span className="text-xs font-normal text-cg-muted">Optional</span>
              <Counter value={rules} max={LIMITS.rules} />
            </span>
          }
          hint="Shown on the community page. One rule per line works well."
        >
          <textarea
            id="rules"
            rows={4}
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            maxLength={LIMITS.rules}
            placeholder={"Be kind with critique\nCredit your references"}
            className={`${inputClass} resize-none`}
          />
        </Field>

        {!canCreate && !isPending && (
          <p className="text-xs text-cg-muted">
            {cover ? "Add a name and description to create your community." : "Add a cover image, a name and a description to create your community."}
          </p>
        )}
      </form>
    </div>
  );
};

export default CreateCommunityPage;
