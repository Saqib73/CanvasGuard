import { useState } from "react";
import toast from "react-hot-toast";
import { MdOutlineShield } from "react-icons/md";
import SignupForm from "./SignUpForm";
import AuthLayout from "../components/AuthLayout";
import OtpVerification from "../components/OtpVerification";
import { Field, PasswordInput, Spinner, inputClass, linkButtonClass, primaryButtonClass } from "../components/fields";
import { useLogin } from "../api/auth.hooks";
import { getErrorMessage } from "../../../lib/api-client";

const LOGIN_PANEL = {
  icon: <MdOutlineShield />,
  heading: "Welcome back to CanvasGuard",
  body: "Share your art with protection built in: watermarks, theft detection and a community that respects creators.",
  points: [
    "Visible and invisible watermarks on your uploads",
    "Find copies of your art, even cropped or re-compressed",
    "Take commissions from people who value your work",
  ],
};

// Shown on the login page so visitors can try the app without signing up
const DEMO_ACCOUNT = { identifier: "raaina", password: "123456" };

export default function Login() {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [pendingVerification, setPendingVerification] = useState(null);
  const { mutateAsync: login, isPending: isLoading } = useLogin();

  const handleLogin = async (e) => {
    e.preventDefault();
    const toastId = toast.loading("Signing in...");

    try {
      const data = await login({ identifier: identifier.trim(), password });
      toast.success(data.message || "Signed in", { id: toastId });
    } catch (error) {
      const body = error?.response?.data;
      // Account exists but its email was never verified: continue with the code step
      if (body?.needsVerification) {
        setPendingVerification(body.data);
        toast(body.message, { id: toastId, icon: "📧" });
        return;
      }
      toast.error(getErrorMessage(error, "Could not sign in"), { id: toastId });
    }
  };

  if (mode === "signup") return <SignupForm onSwitchToLogin={() => setMode("login")} />;

  if (pendingVerification) {
    return (
      <AuthLayout
        panel={LOGIN_PANEL}
        eyebrow="One more step"
        title="Verify your email"
        subtitle="Your account isn't verified yet. Enter the code to finish signing in."
      >
        <OtpVerification
          userId={pendingVerification.userId}
          email={pendingVerification.email}
          initialCooldown={pendingVerification.resendAvailableIn}
          onBack={() => setPendingVerification(null)}
          backLabel="Back to sign in"
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      panel={LOGIN_PANEL}
      title="Sign in to your account"
      subtitle="Use your email address or username."
      footer={
        <>
          New to CanvasGuard?{" "}
          <button onClick={() => setMode("signup")} className={linkButtonClass}>
            Create an account
          </button>
        </>
      }
    >
      <form className="space-y-5" onSubmit={handleLogin}>
        <Field label="Email or username" htmlFor="identifier">
          <input
            id="identifier"
            name="identifier"
            type="text"
            required
            autoComplete="username"
            placeholder="you@example.com or yourname"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Password" htmlFor="password">
          <PasswordInput
            id="password"
            name="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        <button type="submit" disabled={isLoading} className={primaryButtonClass}>
          {isLoading && <Spinner />}
          {isLoading ? "Signing in..." : "Sign in"}
        </button>

        <div className="rounded-xl border border-dashed border-base-300 p-3 text-center text-xs text-cg-muted">
          Just looking around? Use the demo account:{" "}
          <span className="font-medium text-base-content">{DEMO_ACCOUNT.identifier}</span>
          {" / "}
          <span className="font-medium text-base-content">{DEMO_ACCOUNT.password}</span>
          {" · "}
          <button
            type="button"
            onClick={() => {
              setIdentifier(DEMO_ACCOUNT.identifier);
              setPassword(DEMO_ACCOUNT.password);
            }}
            className={linkButtonClass}
          >
            Fill in
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
