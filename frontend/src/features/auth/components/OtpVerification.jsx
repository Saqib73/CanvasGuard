import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { FaArrowLeft } from "react-icons/fa";
import { MdOutlineMarkEmailUnread } from "react-icons/md";
import { useResendOtp, useVerifySignup } from "../api/auth.hooks";
import { getErrorMessage } from "../../../lib/api-client";
import { linkButtonClass, primaryButtonClass, Spinner } from "./fields";

const LENGTH = 6;

/**
 * "Enter the code we emailed you" step, shared by signup and by logging in
 * to an account that was never verified.
 */
export default function OtpVerification({
  userId,
  email,
  initialCooldown = 60,
  onBack,
  backLabel = "Change email",
}) {
  const [digits, setDigits] = useState(Array(LENGTH).fill(""));
  const [cooldown, setCooldown] = useState(initialCooldown);
  const inputs = useRef([]);

  const { mutateAsync: verify, isPending: isVerifying } = useVerifySignup();
  const { mutateAsync: resend, isPending: isResending } = useResendOtp();

  const code = digits.join("");

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const reset = () => {
    setDigits(Array(LENGTH).fill(""));
    inputs.current[0]?.focus();
  };

  const submit = async (value = code) => {
    if (value.length !== LENGTH || isVerifying) return;
    const toastId = toast.loading("Verifying your email...");
    try {
      const data = await verify({ userId, otp: value });
      // The router moves on once the current user is set
      toast.success(data.message || "Email verified!", { id: toastId });
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not verify the code"), { id: toastId });
      reset();
    }
  };

  const fill = (startIndex, text) => {
    const chars = text.replace(/\D/g, "").slice(0, LENGTH - startIndex).split("");
    if (chars.length === 0) return;
    const next = [...digits];
    chars.forEach((c, i) => (next[startIndex + i] = c));
    setDigits(next);
    const focusIndex = Math.min(startIndex + chars.length, LENGTH - 1);
    inputs.current[focusIndex]?.focus();
    if (next.every(Boolean)) submit(next.join(""));
  };

  const handleChange = (index, value) => {
    if (value === "") {
      const next = [...digits];
      next[index] = "";
      setDigits(next);
      return;
    }
    fill(index, value);
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleResend = async () => {
    const toastId = toast.loading("Sending a new code...");
    try {
      const data = await resend({ userId });
      toast.success(data.message || `New code sent to ${email}`, { id: toastId });
      setCooldown(data?.data?.resendAvailableIn ?? 60);
      reset();
    } catch (err) {
      const wait = err?.response?.data?.data?.resendAvailableIn;
      if (wait) setCooldown(wait);
      toast.error(getErrorMessage(err, "Could not resend the code"), { id: toastId });
    }
  };

  return (
    <div>
      <div className="flex items-start gap-3 rounded-2xl border border-base-300 bg-base-200 p-4">
        <MdOutlineMarkEmailUnread className="mt-0.5 flex-shrink-0 text-2xl text-primary" />
        <div className="min-w-0 text-sm">
          <p>We sent a 6-digit code to</p>
          <p className="font-semibold break-all">{email}</p>
          <p className="mt-1 text-xs text-cg-muted">
            It expires in 10 minutes. Check your spam folder if you don't see it.
          </p>
        </div>
      </div>

      <form
        className="mt-6"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label className="mb-2 block text-sm font-medium" htmlFor="otp-0">
          Verification code
        </label>
        <div className="flex justify-between gap-2" onPaste={(e) => {
          e.preventDefault();
          fill(0, e.clipboardData.getData("text"));
        }}>
          {digits.map((digit, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              ref={(el) => (inputs.current[i] = el)}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onFocus={(e) => e.target.select()}
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              maxLength={LENGTH}
              disabled={isVerifying}
              aria-label={`Digit ${i + 1}`}
              className="h-14 w-full min-w-0 rounded-xl border border-base-300 bg-base-100 text-center text-xl font-semibold tabular-nums text-base-content transition focus:outline-none focus:border-primary focus:ring-2 focus:ring-cg-primary/30 disabled:opacity-60"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={code.length !== LENGTH || isVerifying}
          className={`${primaryButtonClass} mt-6`}
        >
          {isVerifying && <Spinner />}
          {isVerifying ? "Verifying..." : "Verify email"}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-cg-muted hover:text-base-content"
        >
          <FaArrowLeft className="text-xs" />
          {backLabel}
        </button>

        <span className="text-cg-muted">
          Didn't get it?{" "}
          {cooldown > 0 ? (
            <span className="tabular-nums">Resend in {cooldown}s</span>
          ) : (
            <button type="button" onClick={handleResend} disabled={isResending} className={linkButtonClass}>
              Resend code
            </button>
          )}
        </span>
      </div>
    </div>
  );
}
