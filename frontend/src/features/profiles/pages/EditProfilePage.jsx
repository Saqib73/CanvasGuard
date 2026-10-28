import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaArrowLeft } from "react-icons/fa";
import { LuBrush, LuCamera, LuImagePlus, LuTrash2 } from "react-icons/lu";
import { useUpdateArtistProfile, useUpdateProfile } from "../api/profiles.hooks.js";
import { useCurrentUser } from "../../auth/api/auth.hooks";
import { useCommissionArtist } from "../../commissions/api/commissions.hooks";
import { Field, inputClass } from "../../auth/components/fields";
import StyleChipsInput from "../../auth/components/StyleChipsInput";
import { postButtonClass } from "../../posts/styles";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import Switch from "../../../components/ui/Switch";
import { getAvatarUrl, getPlaceholderAvatar } from "../../../lib/avatar";
import { getErrorMessage } from "../../../lib/api-client";

const MAX_FILE_BYTES = 5 * 1024 * 1024; // the server's upload limit
// Same limits as the server
const LIMITS = { name: 50, bio: 200, artistBio: 200, deliveryTime: 50, styles: 10 };

function Counter({ value, max }) {
  return (
    <span className={`text-xs font-normal tabular-nums ${value.length >= max ? "text-warning" : "text-cg-muted"}`}>
      {value.length}/{max}
    </span>
  );
}

const sameStyles = (a, b) => a.length === b.length && a.every((s, i) => s === b[i]);

export default function EditProfile() {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const isArtist = Boolean(user?.isArtist && user?.artistProfile);
  const artistQuery = useCommissionArtist(isArtist ? user.artistProfile : null);
  const savedArtist = artistQuery.data?.artist;

  const { mutateAsync: updateProfile, isPending: savingProfile } = useUpdateProfile();
  const { mutateAsync: updateArtist, isPending: savingArtist } = useUpdateArtistProfile();
  const saving = savingProfile || savingArtist;

  // Profile
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [file, setFile] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [photoMenu, setPhotoMenu] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const fileInputRef = useRef(null);
  const photoMenuRef = useRef(null);

  // Artist profile, filled in once it has loaded
  const [artist, setArtist] = useState(null);
  useEffect(() => {
    if (savedArtist && !artist) {
      setArtist({
        artStyles: savedArtist.artStyles || [],
        baseFee: String(savedArtist.baseFee ?? 0),
        deliveryTime: savedArtist.deliveryTime || "",
        bio: savedArtist.bio || "",
        openForCommission: Boolean(savedArtist.openForCommission),
      });
    }
  }, [savedArtist, artist]);
  const setArtistField = (key) => (value) => setArtist((a) => ({ ...a, [key]: value }));

  const filePreview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => filePreview && URL.revokeObjectURL(filePreview), [filePreview]);
  const avatarSrc = filePreview || (removePhoto ? getPlaceholderAvatar(name, user?.userName) : getAvatarUrl({ ...user, name }));
  const hasPhoto = Boolean(file || (!removePhoto && user?.profilePic?.url));

  useEffect(() => {
    if (!photoMenu) return;
    const close = (e) => !photoMenuRef.current?.contains(e.target) && setPhotoMenu(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [photoMenu]);

  // What changed since the page opened
  const profileDirty =
    name.trim() !== (user?.name || "") || bio.trim() !== (user?.bio || "").trim() || Boolean(file) || removePhoto;
  const artistDirty =
    Boolean(artist && savedArtist) &&
    (!sameStyles(artist.artStyles, savedArtist.artStyles || []) ||
      Number(artist.baseFee) !== (savedArtist.baseFee ?? 0) ||
      artist.deliveryTime.trim() !== (savedArtist.deliveryTime || "") ||
      artist.bio.trim() !== (savedArtist.bio || "") ||
      artist.openForCommission !== Boolean(savedArtist.openForCommission));
  const dirty = profileDirty || artistDirty;

  const errors = {
    name: !name.trim() ? "Your name can't be empty" : "",
    styles: artist && artist.artStyles.length === 0 ? "Add at least one art style" : "",
    baseFee: artist && (artist.baseFee === "" || Number(artist.baseFee) < 0) ? "Enter a price of 0 or more" : "",
  };
  const valid = Object.values(errors).every((e) => !e);

  const pickFile = (f) => {
    setPhotoMenu(false);
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast.error("Please choose an image file");
    if (f.size > MAX_FILE_BYTES) return toast.error("Profile pictures can be up to 5 MB");
    setFile(f);
    setRemovePhoto(false);
  };

  const goToProfile = () => navigate(`/artist/${user?.userName}`, { replace: true });
  const handleBack = () => (dirty ? setConfirmLeave(true) : goToProfile());

  const handleSave = async () => {
    if (!dirty || saving) return;
    if (!valid) return toast.error(Object.values(errors).find(Boolean));

    try {
      if (profileDirty) {
        const fd = new FormData();
        fd.append("name", name.trim());
        fd.append("bio", bio.trim());
        if (file) fd.append("profile", file);
        else if (removePhoto) fd.append("removePhoto", "true");
        await updateProfile(fd);
      }
      if (artistDirty) {
        await updateArtist({
          artStyles: artist.artStyles,
          baseFee: Number(artist.baseFee),
          deliveryTime: artist.deliveryTime.trim(),
          bio: artist.bio.trim(),
          openForCommission: artist.openForCommission,
        });
      }
      toast.success("Profile saved");
      goToProfile();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not save your profile"));
    }
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-cg-border bg-cg-bg/80 px-4 py-2 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button type="button" onClick={handleBack} className="btn btn-ghost btn-sm btn-circle" aria-label="Go back">
            <FaArrowLeft />
          </button>
          <h1 className="text-lg font-bold">Edit profile</h1>
        </div>
        <button type="button" onClick={handleSave} disabled={!dirty || saving} className={postButtonClass}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {/* Same cover and avatar placement as the profile page */}
      <div className="relative h-36 overflow-hidden bg-gradient-to-br from-sky-600 via-sky-800 to-slate-950 dark:from-sky-950 dark:via-zinc-950 dark:to-black">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "repeating-linear-gradient(-30deg, #fff 0 1px, transparent 1px 28px)" }}
        />
      </div>

      <div ref={photoMenuRef} className="relative -mt-12 w-fit px-4">
        <button
          type="button"
          onClick={() => setPhotoMenu((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={photoMenu}
          className="group relative block rounded-full"
          title="Change profile picture"
        >
          <img src={avatarSrc} alt="" className="h-24 w-24 rounded-full object-cover ring-4 ring-cg-bg" />
          <span className="absolute inset-0 grid place-items-center rounded-full bg-black/40 text-white opacity-90 transition group-hover:bg-black/55">
            <LuCamera className="text-2xl" aria-hidden="true" />
          </span>
        </button>
        {photoMenu && (
          <div role="menu" className="absolute left-4 z-20 mt-2 w-48 rounded-2xl border border-cg-border bg-cg-surface p-1 shadow-lg">
            <button
              type="button"
              role="menuitem"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-cg-hover"
            >
              <LuImagePlus aria-hidden="true" /> Upload photo
            </button>
            {hasPhoto && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setFile(null);
                  setRemovePhoto(Boolean(user?.profilePic?.url));
                  setPhotoMenu(false);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-error hover:bg-cg-hover"
              >
                <LuTrash2 aria-hidden="true" /> Remove photo
              </button>
            )}
          </div>
        )}
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
      <p className="mt-2 px-4 text-xs text-cg-muted">
        {file ? "New photo selected. Save to apply it." : removePhoto ? "Your photo will be replaced with your initials." : "Click your photo to change it."}
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="space-y-5 border-b border-cg-border px-4 py-5"
      >
        <Field label="Name" htmlFor="name" error={errors.name} aside={<Counter value={name} max={LIMITS.name} />}>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={LIMITS.name}
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            className={`${inputClass} ${errors.name ? "border-error" : ""}`}
          />
        </Field>
        <Field label="Bio" htmlFor="bio" aside={<Counter value={bio} max={LIMITS.bio} />}>
          <textarea
            id="bio"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={LIMITS.bio}
            placeholder="Tell people a little about yourself"
            className={`${inputClass} resize-none`}
          />
        </Field>
      </form>

      {isArtist && (
        <section className="space-y-5 px-4 py-5">
          <div>
            <h2 className="flex items-center gap-2 font-semibold">
              <LuBrush className="text-cg-primary" aria-hidden="true" /> Artist profile
            </h2>
            <p className="mt-0.5 text-sm text-cg-muted">What clients see on the Commissions page and your profile.</p>
          </div>

          {!artist ? (
            <p className="text-sm text-cg-muted">{artistQuery.isError ? "Could not load your artist profile." : "Loading your artist profile…"}</p>
          ) : (
            <>
              <label htmlFor="openForCommission" className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-cg-border p-4">
                <span className="text-sm">
                  <span className="block font-medium">Open for commissions</span>
                  <span className="mt-0.5 block text-xs text-cg-muted">
                    {artist.openForCommission
                      ? "Clients can send you commission requests."
                      : "Your profile stays visible, but nobody can send you new requests."}
                  </span>
                </span>
                <Switch id="openForCommission" checked={artist.openForCommission} onChange={setArtistField("openForCommission")} />
              </label>

              <Field label="Art styles" htmlFor="artStyles" error={errors.styles} hint={`Press Enter or comma to add. Up to ${LIMITS.styles}.`}>
                <StyleChipsInput id="artStyles" styles={artist.artStyles} onChange={setArtistField("artStyles")} max={LIMITS.styles} />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Starting price" htmlFor="baseFee" error={errors.baseFee} hint="The minimum for a commission">
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm text-cg-muted">₹</span>
                    <input
                      id="baseFee"
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      value={artist.baseFee}
                      onChange={(e) => setArtistField("baseFee")(e.target.value)}
                      aria-invalid={Boolean(errors.baseFee)}
                      className={`${inputClass} pl-8 ${errors.baseFee ? "border-error" : ""}`}
                    />
                  </div>
                </Field>
                <Field label="Typical delivery" htmlFor="deliveryTime" optional hint="How long a piece usually takes">
                  <input
                    id="deliveryTime"
                    value={artist.deliveryTime}
                    onChange={(e) => setArtistField("deliveryTime")(e.target.value)}
                    maxLength={LIMITS.deliveryTime}
                    placeholder="e.g. 1–2 weeks"
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="About your work" htmlFor="artistBio" aside={<Counter value={artist.bio} max={LIMITS.artistBio} />}>
                <textarea
                  id="artistBio"
                  rows={3}
                  value={artist.bio}
                  onChange={(e) => setArtistField("bio")(e.target.value)}
                  maxLength={LIMITS.artistBio}
                  placeholder="What do you love to draw? What can clients expect?"
                  className={`${inputClass} resize-none`}
                />
              </Field>
            </>
          )}
        </section>
      )}

      {confirmLeave && (
        <ConfirmDialog
          title="Discard changes?"
          body="You have unsaved changes to your profile. If you leave now, they'll be lost."
          confirmLabel="Discard"
          onCancel={() => setConfirmLeave(false)}
          onConfirm={goToProfile}
        />
      )}
    </div>
  );
}
