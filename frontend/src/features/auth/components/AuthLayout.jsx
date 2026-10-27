import ThemeToggle from "../../../components/layout/ThemeToggle";

const Logo = ({ className = "" }) => (
  <span
    className={`bg-gradient-to-r from-sky-400 to-yellow-400 bg-clip-text text-transparent font-bold tracking-tight ${className}`}
  >
    CanvasGuard
  </span>
);

/**
 * Shared shell for login, signup, email verification and artist onboarding:
 * a brand panel (large screens) explaining the step, and the form on the right.
 */
export default function AuthLayout({ panel, title, subtitle, eyebrow, children, footer }) {
  return (
    <div className="min-h-screen flex bg-base-100 text-base-content transition-colors duration-200">
      {/* Brand panel */}
      <aside className="hidden lg:flex lg:w-[44%] xl:w-1/2 relative overflow-hidden bg-gradient-to-br from-sky-600 via-sky-800 to-slate-950 text-white">
        <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-yellow-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-sky-300/20 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-30deg, #fff 0 1px, transparent 1px 28px)",
          }}
        />

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          <div className="text-2xl font-bold">CanvasGuard</div>

          <div className="max-w-md">
            {panel.icon && (
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 text-2xl">
                {panel.icon}
              </div>
            )}
            <h1 className="text-4xl font-bold leading-tight">{panel.heading}</h1>
            <p className="mt-4 text-lg leading-relaxed text-sky-100/90">{panel.body}</p>
            {panel.points?.length > 0 && (
              <ul className="mt-8 space-y-3">
                {panel.points.map((point) => (
                  <li key={point} className="flex gap-3 text-sky-50/90">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-yellow-300" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="text-sm text-sky-100/60">Protecting artists and their work.</p>
        </div>
      </aside>

      {/* Form */}
      <main className="flex-1 flex flex-col min-h-screen">
        <header className="flex items-center justify-between px-4 sm:px-8 pt-6">
          <Logo className="text-xl lg:invisible" />
          <ThemeToggle />
        </header>

        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-10">
          <div className="w-full max-w-md">
            {eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
                {eyebrow}
              </p>
            )}
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h2>
            {subtitle && <p className="mt-2 text-sm text-cg-muted">{subtitle}</p>}

            <div className="mt-8">{children}</div>

            {footer && <div className="mt-8 text-center text-sm text-cg-muted">{footer}</div>}
          </div>
        </div>
      </main>
    </div>
  );
}
