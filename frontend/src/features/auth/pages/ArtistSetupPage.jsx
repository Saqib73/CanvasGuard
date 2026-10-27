import { useState } from "react";
import toast from "react-hot-toast";
import { FaTimes } from "react-icons/fa";
import { MdOutlineBrush } from "react-icons/md";
import { useCompleteArtistSetup, useCurrentUser, useLogout } from "../api/auth.hooks";
import { getErrorMessage } from "../../../lib/api-client";
import AuthLayout from "../components/AuthLayout";
import { Field, Spinner, inputClass, linkButtonClass, primaryButtonClass } from "../components/fields";

const ARTIST_PANEL = {
  icon: <MdOutlineBrush />,
  heading: "Set up your artist profile",
  body: "This is what people see when they browse artists on the Commissions page. You can change it later.",
  points: [
    "Your art styles help clients find you",
    "Your starting price sets expectations before anyone reaches out",
    "Open your profile when you're ready to take commissions",
  ],
};

const SUGGESTED_STYLES = [
  "Digital painting", "Anime", "Character design", "Concept art",
  "Watercolor", "Realism", "Pixel art", "Line art", "3D",
];

const MAX_STYLES = 10;
const MAX_BIO = 200;

export default function ArtistSetupForm() {
  const { data: user } = useCurrentUser();
  const { mutateAsync: completeArtistSetup, isPending: loading } = useCompleteArtistSetup();
  const { mutate: logout } = useLogout();

  const [styles, setStyles] = useState([]);
  const [styleInput, setStyleInput] = useState("");
  const [form, setForm] = useState({
    baseFee: "",
    deliveryTime: "",
    bio: "",
    openForCommission: true,
  });

  const addStyle = (raw) => {
    const style = raw.trim().replace(/,$/, "");
    if (!style) return;
    setStyles((prev) =>
      prev.length >= MAX_STYLES || prev.some((s) => s.toLowerCase() === style.toLowerCase())
        ? prev
        : [...prev, style]
    );
    setStyleInput("");
  };

  const removeStyle = (style) => setStyles((prev) => prev.filter((s) => s !== style));

  const handleStyleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addStyle(styleInput);
    } else if (e.key === "Backspace" && !styleInput && styles.length) {
      removeStyle(styles[styles.length - 1]);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Include whatever is still typed in the style box
    const artStyles = styleInput.trim() ? [...styles, styleInput.trim()] : styles;
    if (artStyles.length === 0) return toast.error("Add at least one art style");

    const toastId = toast.loading("Setting up your artist profile...");
    try {
      const data = await completeArtistSetup({
        ...form,
        baseFee: Number(form.baseFee),
        artStyles,
      });
      toast.success(data.message || "Your artist profile is live!", { id: toastId });
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not save your artist profile"), { id: toastId });
    }
  };

  const unusedSuggestions = SUGGESTED_STYLES.filter(
    (s) => !styles.some((x) => x.toLowerCase() === s.toLowerCase())
  );

  return (
    <AuthLayout
      panel={ARTIST_PANEL}
      eyebrow="Last step · Artist profile"
      title="Tell clients about your art"
      subtitle={`You signed up as an artist${user?.name ? `, ${user.name.split(" ")[0]}` : ""}. Fill this in so people can find you and request commissions.`}
      footer={
        <>
          Signed in as <span className="font-medium text-base-content">@{user?.userName}</span>
          {" · "}
          <button type="button" onClick={() => logout()} className={linkButtonClass}>
            Log out
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Field
          label="Art styles"
          htmlFor="artStyles"
          hint={`Press Enter or comma to add. Up to ${MAX_STYLES}.`}
        >
          <div className="flex min-h-[46px] flex-wrap items-center gap-2 rounded-xl border border-base-300 bg-base-100 px-2.5 py-2 transition focus-within:border-primary focus-within:ring-2 focus-within:ring-cg-primary/30">
            {styles.map((style) => (
              <span key={style} className="inline-flex items-center gap-1.5 rounded-full bg-cg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {style}
                <button type="button" onClick={() => removeStyle(style)} aria-label={`Remove ${style}`} className="hover:opacity-70">
                  <FaTimes className="text-[10px]" />
                </button>
              </span>
            ))}
            <input
              id="artStyles"
              value={styleInput}
              onChange={(e) => setStyleInput(e.target.value)}
              onKeyDown={handleStyleKeyDown}
              onBlur={() => addStyle(styleInput)}
              placeholder={styles.length ? "" : "e.g. Anime, Watercolor"}
              disabled={styles.length >= MAX_STYLES}
              className="min-w-[120px] flex-1 bg-transparent px-1 text-sm text-base-content placeholder:text-cg-muted/70 focus:outline-none"
            />
          </div>
          {unusedSuggestions.length > 0 && styles.length < MAX_STYLES && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {unusedSuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addStyle(s)}
                  className="rounded-full border border-base-300 px-2.5 py-1 text-xs text-cg-muted transition hover:border-primary hover:text-primary"
                >
                  + {s}
                </button>
              ))}
            </div>
          )}
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Starting price" htmlFor="baseFee" hint="The minimum for a commission">
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm text-cg-muted">₹</span>
              <input
                id="baseFee"
                name="baseFee"
                type="number"
                min="0"
                step="1"
                required
                placeholder="500"
                value={form.baseFee}
                onChange={handleChange}
                className={`${inputClass} pl-8`}
              />
            </div>
          </Field>
          <Field label="Typical delivery" htmlFor="deliveryTime" optional hint="How long a piece usually takes">
            <input
              id="deliveryTime"
              name="deliveryTime"
              type="text"
              placeholder="e.g. 1–2 weeks"
              value={form.deliveryTime}
              onChange={handleChange}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="About your work" htmlFor="bio" hint={`${form.bio.length}/${MAX_BIO}`}>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            maxLength={MAX_BIO}
            required
            placeholder="What do you love to draw? What can clients expect when they commission you?"
            value={form.bio}
            onChange={handleChange}
            className={`${inputClass} resize-none`}
          />
        </Field>

        <label htmlFor="openForCommission" className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-base-300 p-4">
          <span className="text-sm">
            <span className="block font-medium">Open for commissions</span>
            <span className="mt-0.5 block text-xs text-cg-muted">
              {form.openForCommission
                ? "Clients can send you commission requests right away."
                : "Your profile is visible, but marked as closed for requests."}
            </span>
          </span>
          <span className="relative inline-flex flex-shrink-0">
            <input
              id="openForCommission"
              name="openForCommission"
              type="checkbox"
              checked={form.openForCommission}
              onChange={handleChange}
              className="peer sr-only"
            />
            <span className="h-6 w-11 rounded-full bg-base-300 transition peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-cg-primary/40" />
            <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
          </span>
        </label>

        <button type="submit" disabled={loading} className={primaryButtonClass}>
          {loading && <Spinner />}
          {loading ? "Saving..." : "Finish setup"}
        </button>
      </form>
    </AuthLayout>
  );
}
