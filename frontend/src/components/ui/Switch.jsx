/** On/off switch backed by a real checkbox, so labels, keyboard and screen readers work. */
export default function Switch({ id, checked, onChange, ...rest }) {
  return (
    <span className="relative inline-flex flex-shrink-0">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
        {...rest}
      />
      <span className="h-6 w-11 rounded-full bg-cg-border transition peer-checked:bg-cg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-cg-primary/40" />
      <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
    </span>
  );
}
