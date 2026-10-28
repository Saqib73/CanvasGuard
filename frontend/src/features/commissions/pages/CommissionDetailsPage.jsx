import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { FaArrowLeft, FaTimes } from "react-icons/fa";
import { MdOutlineImage } from "react-icons/md";
import { LuMonitor, LuPackage } from "react-icons/lu";
import { useCommissionArtist, useCreateCommissionRequest } from "../api/commissions.hooks";
import { useCurrentUser } from "../../auth/api/auth.hooks";
import ArtistCard from "../components/ArtistCard";
import { ArtistCardSkeleton } from "../../../components/ui/Skeleton";
import { Field, inputClass } from "../../auth/components/fields";
import { postButtonClass } from "../../posts/styles";
import { getErrorMessage } from "../../../lib/api-client";

const MAX_FILE_BYTES = 5 * 1024 * 1024; // the server's upload limit
const MAX_DESCRIPTION = 1000;
const COUNTRIES = [
  "India", "United States", "United Kingdom", "Canada", "Australia", "Germany", "France",
  "Netherlands", "Spain", "Italy", "Japan", "South Korea", "Singapore", "United Arab Emirates",
  "New Zealand", "Ireland", "Brazil", "Mexico",
];

const toDateInput = (date) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); // local date, not UTC
  return d.toISOString().split("T")[0];
};
const daysFromNow = (days) => toDateInput(Date.now() + days * 24 * 3600 * 1000);
const DEADLINE_PRESETS = [
  ["1 week", 7],
  ["2 weeks", 14],
  ["1 month", 30],
];

const DELIVERY_OPTIONS = [
  { key: "digital", Icon: LuMonitor, title: "Digital file", description: "Sent to you online" },
  { key: "physical", Icon: LuPackage, title: "Physical piece", description: "Shipped to your address" },
];

const chipClass = (selected) =>
  `rounded-full border px-3 py-1 text-sm font-medium transition ${
    selected
      ? "border-cg-primary bg-cg-primary/10 text-cg-primary"
      : "border-cg-border text-cg-muted hover:border-cg-primary hover:text-cg-primary"
  }`;

function Section({ title, description, children }) {
  return (
    <section className="space-y-4 border-b border-cg-border px-4 py-5">
      <div>
        <h2 className="font-semibold">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-cg-muted">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Notice({ title, body, children }) {
  return (
    <div className="px-8 py-10 text-center">
      <p className="text-lg font-semibold">{title}</p>
      <p className="mt-1 text-sm text-cg-muted">{body}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export default function CommissionDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const { data, isLoading, isError } = useCommissionArtist(id);
  const artist = data?.artist;
  const { mutateAsync: requestCommission, isPending } = useCreateCommissionRequest();

  const [artStyle, setArtStyle] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [delivery, setDelivery] = useState("digital");
  const [shipping, setShipping] = useState({ country: "India", state: "", city: "", postal: "" });
  const [triedSubmit, setTriedSubmit] = useState(false);
  const fileInputRef = useRef(null);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl]);

  // Start the budget at the artist's starting price once it's known
  useEffect(() => {
    if (artist?.baseFee && budget === "") setBudget(String(artist.baseFee));
  }, [artist?.baseFee]); // eslint-disable-line react-hooks/exhaustive-deps

  const baseFee = artist?.baseFee || 0;
  const today = toDateInput(Date.now());
  const errors = {
    budget:
      budget === "" ? "Add your budget" : Number(budget) < baseFee ? `At least the starting price, ₹${baseFee.toLocaleString("en-IN")}` : "",
    deadline: !deadline ? "Pick a deadline" : deadline < today ? "The deadline can't be in the past" : "",
    description: !description.trim() ? "Describe what you'd like" : "",
    country: delivery === "physical" && !shipping.country.trim() ? "Required" : "",
    state: delivery === "physical" && !shipping.state.trim() ? "Required" : "",
    postal: delivery === "physical" && !shipping.postal.trim() ? "Required" : "",
  };
  const shown = (key) => (triedSubmit ? errors[key] : "");
  const valid = Object.values(errors).every((e) => !e);

  const pickFile = (f) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast.error("Please choose an image file");
    if (f.size > MAX_FILE_BYTES) return toast.error("Reference images can be up to 5 MB");
    setFile(f);
  };

  const setShippingField = (key) => (e) => setShipping((s) => ({ ...s, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setTriedSubmit(true);
    if (!valid) return toast.error("Please fill in the highlighted fields");

    const formData = new FormData();
    formData.append("artistId", artist._id);
    formData.append("description", description.trim());
    formData.append("deadline", deadline);
    formData.append("price", budget);
    if (artStyle) formData.append("artStyle", artStyle);
    formData.append("deliveryType", delivery);
    if (delivery === "physical") formData.append("shippingDetails", JSON.stringify(shipping));
    if (file) formData.append("files", file);

    try {
      await requestCommission(formData);
      toast.success(`Request sent to @${artist.user.userName}`);
      navigate("/commissionRequests", { replace: true, state: { tab: "sent" } });
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not send the request"));
    }
  };

  const header = (
    <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-cg-border bg-cg-bg/80 px-4 py-2 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => navigate(-1)} className="btn btn-ghost btn-sm btn-circle" aria-label="Go back">
          <FaArrowLeft />
        </button>
        <h1 className="text-lg font-bold">Request commission</h1>
      </div>
      {artist?.openForCommission && artist.user?._id !== user?._id && (
        <button type="button" onClick={handleSubmit} disabled={isPending} className={postButtonClass}>
          {isPending ? "Sending..." : "Send request"}
        </button>
      )}
    </div>
  );

  if (isLoading)
    return (
      <div className="h-full overflow-y-auto no-scrollbar">
        {header}
        <ArtistCardSkeleton />
      </div>
    );

  if (isError || !artist)
    return (
      <div className="h-full overflow-y-auto no-scrollbar">
        {header}
        <Notice title="Artist not found" body="This artist may have removed their profile, or the link is wrong.">
          <Link to="/commissions" className="btn btn-sm rounded-full border border-cg-border bg-transparent px-5 text-cg-text shadow-none hover:bg-cg-hover">
            Browse artists
          </Link>
        </Notice>
      </div>
    );

  const isSelf = artist.user?._id === user?._id;

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      {header}
      <ArtistCard artist={artist} showAction={false} />

      {isSelf ? (
        <Notice title="This is your artist profile" body="People will use this form to request commissions from you.">
          <Link to="/commissionRequests" className="btn btn-sm rounded-full border border-cg-border bg-transparent px-5 text-cg-text shadow-none hover:bg-cg-hover">
            See your requests
          </Link>
        </Notice>
      ) : !artist.openForCommission ? (
        <Notice
          title={`@${artist.user.userName} isn't taking commissions right now`}
          body="Check back later, or find another artist whose style you like."
        >
          <Link to="/commissions" className="btn btn-sm rounded-full border-0 bg-cg-primary px-5 text-white hover:bg-cg-primary/90 dark:text-[#082f49]">
            Browse open artists
          </Link>
        </Notice>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <Section title="What would you like?" description="The more detail you give, the better the artist can quote and plan.">
            {artist.artStyles?.length > 0 && (
              <div>
                <p className="mb-2 flex items-baseline justify-between text-sm font-medium">
                  Style <span className="text-xs font-normal text-cg-muted">Optional</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {artist.artStyles.map((style) => (
                    <button
                      key={style}
                      type="button"
                      aria-pressed={artStyle === style}
                      onClick={() => setArtStyle((s) => (s === style ? "" : style))}
                      className={chipClass(artStyle === style)}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Field
              label="Description"
              htmlFor="description"
              error={shown("description")}
              aside={<span className="text-xs font-normal tabular-nums text-cg-muted">{description.length}/{MAX_DESCRIPTION}</span>}
            >
              <textarea
                id="description"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={MAX_DESCRIPTION}
                placeholder="Who or what should be in it, the mood, colours, size, and where you'll use it…"
                aria-invalid={Boolean(shown("description"))}
                className={`${inputClass} resize-none ${shown("description") ? "border-error" : ""}`}
              />
            </Field>

            <div>
              <p className="mb-1.5 flex items-baseline justify-between text-sm font-medium">
                Reference image <span className="text-xs font-normal text-cg-muted">Optional</span>
              </p>
              {file ? (
                <div className="relative w-fit overflow-hidden rounded-xl border border-cg-border">
                  <img src={previewUrl} alt="Reference preview" className="max-h-56 object-contain" />
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    aria-label="Remove reference image"
                    className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-white transition hover:bg-black/85"
                  >
                    <FaTimes className="text-xs" />
                  </button>
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
                    pickFile(e.dataTransfer.files?.[0]);
                  }}
                  className={`flex w-full flex-col items-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-6 text-sm transition ${
                    dragging ? "border-cg-primary bg-cg-primary/5" : "border-cg-border hover:border-cg-primary"
                  }`}
                >
                  <MdOutlineImage className="text-2xl text-cg-primary" />
                  <span className="font-medium">Add a reference</span>
                  <span className="text-xs text-cg-muted">Drag an image here or click to browse · up to 5 MB</span>
                </button>
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
          </Section>

          <Section title="Budget and timing">
            <Field
              label="Your budget"
              htmlFor="budget"
              error={shown("budget")}
              hint={`Starting price is ₹${baseFee.toLocaleString("en-IN")}. The artist may reply with a different quote.`}
            >
              <div className="relative max-w-56">
                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm text-cg-muted">₹</span>
                <input
                  id="budget"
                  type="number"
                  inputMode="numeric"
                  min={baseFee}
                  step="1"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  aria-invalid={Boolean(shown("budget"))}
                  className={`${inputClass} pl-8 ${shown("budget") ? "border-error" : ""}`}
                />
              </div>
            </Field>

            <Field
              label="Deadline"
              htmlFor="deadline"
              error={shown("deadline")}
              hint={artist.deliveryTime ? `@${artist.user.userName} usually delivers in ${artist.deliveryTime}.` : undefined}
            >
              <div className="flex flex-wrap items-center gap-2">
                {DEADLINE_PRESETS.map(([label, days]) => (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={deadline === daysFromNow(days)}
                    onClick={() => setDeadline(daysFromNow(days))}
                    className={chipClass(deadline === daysFromNow(days))}
                  >
                    {label}
                  </button>
                ))}
                <input
                  id="deadline"
                  type="date"
                  min={today}
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  aria-invalid={Boolean(shown("deadline"))}
                  className={`${inputClass} w-auto ${shown("deadline") ? "border-error" : ""}`}
                />
              </div>
            </Field>
          </Section>

          <Section title="Delivery">
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Delivery type">
              {DELIVERY_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  role="radio"
                  aria-checked={delivery === option.key}
                  onClick={() => setDelivery(option.key)}
                  className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                    delivery === option.key ? "border-cg-primary bg-cg-primary/5" : "border-cg-border hover:border-cg-primary/50"
                  }`}
                >
                  <option.Icon
                    className={`mt-0.5 text-lg ${delivery === option.key ? "text-cg-primary" : "text-cg-muted"}`}
                    aria-hidden="true"
                  />
                  <span>
                    <span className="block text-sm font-medium">{option.title}</span>
                    <span className="block text-xs text-cg-muted">{option.description}</span>
                  </span>
                </button>
              ))}
            </div>

            {delivery === "physical" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Country" htmlFor="country" error={shown("country")}>
                  <input
                    id="country"
                    list="country-options"
                    value={shipping.country}
                    onChange={setShippingField("country")}
                    autoComplete="country-name"
                    className={`${inputClass} ${shown("country") ? "border-error" : ""}`}
                  />
                  <datalist id="country-options">
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </Field>
                <Field label="State / province" htmlFor="state" error={shown("state")}>
                  <input
                    id="state"
                    value={shipping.state}
                    onChange={setShippingField("state")}
                    autoComplete="address-level1"
                    className={`${inputClass} ${shown("state") ? "border-error" : ""}`}
                  />
                </Field>
                <Field label="City" htmlFor="city" optional>
                  <input id="city" value={shipping.city} onChange={setShippingField("city")} autoComplete="address-level2" className={inputClass} />
                </Field>
                <Field label="Postal code" htmlFor="postal" error={shown("postal")}>
                  <input
                    id="postal"
                    value={shipping.postal}
                    onChange={setShippingField("postal")}
                    autoComplete="postal-code"
                    className={`${inputClass} ${shown("postal") ? "border-error" : ""}`}
                  />
                </Field>
              </div>
            )}
          </Section>

          <div className="flex items-center justify-end gap-3 px-4 py-5">
            <p className="mr-auto text-xs text-cg-muted">@{artist.user.userName} can accept or decline your request.</p>
            <button type="submit" disabled={isPending} className={postButtonClass}>
              {isPending ? "Sending..." : "Send request"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export const CommissionDetails = CommissionDetailsPage;
