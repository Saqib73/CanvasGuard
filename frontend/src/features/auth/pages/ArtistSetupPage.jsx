import { useState } from "react";
import toast from "react-hot-toast";
import { MdOutlineBrush } from "react-icons/md";
import StyleChipsInput from "../components/StyleChipsInput";
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

const MAX_STYLES = 10;
const MAX_BIO = 200;

export default function ArtistSetupForm() {
  const { data: user } = useCurrentUser();
  const { mutateAsync: completeArtistSetup, isPending: loading } = useCompleteArtistSetup();
  const { mutate: logout } = useLogout();

  const [styles, setStyles] = useState([]);
  const [form, setForm] = useState({
    baseFee: "",
    deliveryTime: "",
    bio: "",
    openForCommission: true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Text still in the style box was added when the input lost focus on submit
    const artStyles = styles;
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
          <StyleChipsInput id="artStyles" styles={styles} onChange={setStyles} max={MAX_STYLES} />
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
