import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { FaCamera, FaTimes } from "react-icons/fa";
import { MdOutlineBrush, MdOutlinePalette } from "react-icons/md";
import { useSignup } from "../api/auth.hooks";
import { getErrorMessage } from "../../../lib/api-client";
import { getPlaceholderAvatar } from "../../../lib/avatar";
import AuthLayout from "../components/AuthLayout";
import OtpVerification from "../components/OtpVerification";
import { Field, PasswordInput, Spinner, inputClass, linkButtonClass, primaryButtonClass } from "../components/fields";

const SIGNUP_PANEL = {
  icon: <MdOutlinePalette />,
  heading: "Join a community that protects artists",
  body: "Create your account to post your work, follow other artists and keep track of where your art ends up.",
  points: [
    "Watermark your art before you post it",
    "Get alerted when your work is reposted",
    "Artists can open their profile for paid commissions",
  ],
};

const USERNAME_RE = /^[a-zA-Z0-9_.]{3,20}$/;

export default function SignupForm({ onSwitchToLogin }) {
  const [form, setForm] = useState({
    name: "",
    userName: "",
    email: "",
    password: "",
    confirmPassword: "",
    isArtist: false,
  });
  const [profilePic, setProfilePic] = useState(null);
  // Set once the code is sent; the form state is kept so "Change email" can go back to it
  const [pending, setPending] = useState(null);

  const { mutateAsync: signup, isPending: isSigningUp } = useSignup();

  const previewUrl = useMemo(
    () => (profilePic ? URL.createObjectURL(profilePic) : null),
    [profilePic]
  );
  useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const userNameInvalid = form.userName !== "" && !USERNAME_RE.test(form.userName);
  const passwordsMismatch = form.confirmPassword !== "" && form.password !== form.confirmPassword;

  const handleSignup = async (e) => {
    e.preventDefault();
    if (userNameInvalid) return toast.error("Username must be 3–20 characters: letters, numbers, _ or .");
    if (form.password.length < 6) return toast.error("Password must have at least 6 characters");
    if (passwordsMismatch) return toast.error("Passwords do not match");

    const toastId = toast.loading("Creating your account...");
    try {
      const formData = new FormData();
      for (const key in form) formData.append(key, form[key]);
      if (profilePic) formData.append("profile", profilePic);

      const data = await signup(formData);
      setPending(data.data);
      toast.success(data.message || `We sent a code to ${data.data.email}`, { id: toastId });
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not create your account"), { id: toastId });
    }
  };

  if (pending) {
    return (
      <AuthLayout
        panel={SIGNUP_PANEL}
        eyebrow="Step 2 of 2"
        title="Check your email"
        subtitle="Enter the code we sent to confirm your email address."
      >
        <OtpVerification
          userId={pending.userId}
          email={pending.email}
          initialCooldown={pending.resendAvailableIn}
          onBack={() => setPending(null)}
          backLabel="Change email"
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      panel={SIGNUP_PANEL}
      eyebrow="Step 1 of 2"
      title="Create your account"
      subtitle="It takes a minute. We'll email you a code to verify your address."
      footer={
        <>
          Already have an account?{" "}
          <button onClick={onSwitchToLogin} className={linkButtonClass}>
            Sign in
          </button>
        </>
      }
    >
      <form className="space-y-5" onSubmit={handleSignup}>
        {/* Profile picture (optional) */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={previewUrl || getPlaceholderAvatar(form.name, form.userName)}
              alt="Profile preview"
              className="h-20 w-20 rounded-full object-cover ring-1 ring-base-300"
            />
            <label
              htmlFor="profilePic"
              className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-content shadow ring-2 ring-base-100 hover:brightness-110"
              title="Upload a profile picture"
            >
              <FaCamera className="text-xs" />
              <input
                id="profilePic"
                type="file"
                accept="image/*"
                onChange={(e) => setProfilePic(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
          </div>
          <div className="text-sm">
            <p className="font-medium">Profile picture <span className="font-normal text-cg-muted">(optional)</span></p>
            <p className="text-xs text-cg-muted">
              {profilePic ? profilePic.name : "We'll use your initials until you add one."}
            </p>
            {profilePic && (
              <button
                type="button"
                onClick={() => setProfilePic(null)}
                className="mt-1 inline-flex items-center gap-1 text-xs text-cg-muted hover:text-error"
              >
                <FaTimes /> Remove
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full name" htmlFor="name">
            <input id="name" name="name" type="text" required autoComplete="name"
              placeholder="Ada Lovelace" value={form.name} onChange={handleChange} className={inputClass} />
          </Field>
          <Field
            label="Username"
            htmlFor="userName"
            hint={userNameInvalid ? "3–20 characters: letters, numbers, _ or ." : undefined}
          >
            <input id="userName" name="userName" type="text" required autoComplete="username"
              placeholder="ada_draws" value={form.userName} onChange={handleChange}
              aria-invalid={userNameInvalid}
              className={`${inputClass} ${userNameInvalid ? "border-error focus:border-error focus:ring-error/30" : ""}`} />
          </Field>
        </div>

        <Field label="Email" htmlFor="email">
          <input id="email" name="email" type="email" required autoComplete="email"
            placeholder="you@example.com" value={form.email} onChange={handleChange} className={inputClass} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Password" htmlFor="password" hint="At least 6 characters">
            <PasswordInput id="password" name="password" required minLength={6} autoComplete="new-password"
              value={form.password} onChange={handleChange} />
          </Field>
          <Field
            label="Confirm password"
            htmlFor="confirmPassword"
            hint={passwordsMismatch ? "Passwords don't match" : undefined}
          >
            <PasswordInput id="confirmPassword" name="confirmPassword" required autoComplete="new-password"
              value={form.confirmPassword} onChange={handleChange} aria-invalid={passwordsMismatch} />
          </Field>
        </div>

        <label
          htmlFor="isArtist"
          className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
            form.isArtist ? "border-primary bg-cg-primary/5" : "border-base-300 hover:border-cg-muted/60"
          }`}
        >
          <input id="isArtist" name="isArtist" type="checkbox" checked={form.isArtist} onChange={handleChange}
            className="mt-1 h-4 w-4 accent-cg-primary" />
          <span className="text-sm">
            <span className="flex items-center gap-2 font-medium">
              <MdOutlineBrush className="text-primary" /> I'm an artist
            </span>
            <span className="mt-0.5 block text-xs text-cg-muted">
              You'll set up an artist profile next so people can find you and request commissions.
            </span>
          </span>
        </label>

        <button type="submit" disabled={isSigningUp} className={primaryButtonClass}>
          {isSigningUp && <Spinner />}
          {isSigningUp ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}
