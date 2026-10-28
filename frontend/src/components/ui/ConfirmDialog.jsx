import { useEffect } from "react";

/**
 * X-style confirmation: title, short explanation, a strong confirm button and Cancel.
 * Escape or a click outside cancels.
 */
export default function ConfirmDialog({
  title,
  body,
  confirmLabel,
  pendingLabel = "Working...",
  pending = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onCancel();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="w-80 rounded-2xl border border-cg-border bg-cg-surface p-6 shadow-xl"
      >
        <h2 id="confirm-dialog-title" className="text-xl font-semibold">
          {title}
        </h2>
        {body && <p className="mt-2 text-sm text-cg-muted">{body}</p>}
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            autoFocus
            className="btn rounded-full border-0 bg-cg-text text-cg-bg hover:bg-cg-text/90"
          >
            {pending ? pendingLabel : confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn rounded-full border border-cg-border bg-transparent text-cg-text shadow-none hover:bg-cg-hover"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
