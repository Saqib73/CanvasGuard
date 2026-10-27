import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export const inputClass =
  "block w-full rounded-xl border border-base-300 bg-base-100 px-3.5 py-2.5 text-sm text-base-content placeholder:text-cg-muted/70 transition focus:outline-none focus:border-primary focus:ring-2 focus:ring-cg-primary/30 disabled:opacity-60";

export const primaryButtonClass =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-content shadow-sm transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-cg-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-base-100 disabled:cursor-not-allowed disabled:opacity-60";

export const linkButtonClass =
  "font-semibold text-primary hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed";

export const Spinner = () => (
  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />
);

export const Field = ({ label, htmlFor, hint, optional, children, className = "" }) => (
  <div className={className}>
    <label htmlFor={htmlFor} className="mb-1.5 flex items-baseline justify-between text-sm font-medium">
      <span>{label}</span>
      {optional && <span className="text-xs font-normal text-cg-muted">Optional</span>}
    </label>
    {children}
    {hint && <p className="mt-1.5 text-xs text-cg-muted">{hint}</p>}
  </div>
);

export const PasswordInput = ({ id, ...props }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input id={id} type={visible ? "text" : "password"} className={`${inputClass} pr-11`} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-cg-muted hover:text-base-content"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <FaEyeSlash /> : <FaEye />}
      </button>
    </div>
  );
};
