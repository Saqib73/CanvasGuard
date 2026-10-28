import { useState } from "react";
import { FaTimes } from "react-icons/fa";

const SUGGESTED_STYLES = [
  "Digital painting", "Anime", "Character design", "Concept art",
  "Watercolor", "Realism", "Pixel art", "Line art", "3D",
];

/**
 * Art styles as removable chips: type and press Enter or comma, click a suggestion,
 * Backspace on an empty box removes the last one. Text left in the box is added on blur,
 * so clicking a submit button picks it up. Used by artist setup and Edit profile.
 */
export default function StyleChipsInput({ id, styles, onChange, max = 10 }) {
  const [input, setInput] = useState("");

  const add = (raw) => {
    const style = raw.trim().replace(/,$/, "");
    setInput("");
    if (!style) return;
    if (styles.length >= max || styles.some((s) => s.toLowerCase() === style.toLowerCase())) return;
    onChange([...styles, style]);
  };

  const remove = (style) => onChange(styles.filter((s) => s !== style));

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(input);
    } else if (e.key === "Backspace" && !input && styles.length) {
      remove(styles[styles.length - 1]);
    }
  };

  const suggestions = SUGGESTED_STYLES.filter(
    (s) => !styles.some((x) => x.toLowerCase() === s.toLowerCase())
  );

  return (
    <>
      <div className="flex min-h-[46px] flex-wrap items-center gap-2 rounded-xl border border-cg-border bg-cg-bg px-2.5 py-2 transition focus-within:border-cg-primary focus-within:ring-2 focus-within:ring-cg-primary/30">
        {styles.map((style) => (
          <span key={style} className="inline-flex items-center gap-1.5 rounded-full bg-cg-primary/10 px-2.5 py-1 text-xs font-medium text-cg-primary">
            {style}
            <button type="button" onClick={() => remove(style)} aria-label={`Remove ${style}`} className="hover:opacity-70">
              <FaTimes className="text-[10px]" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => add(input)}
          placeholder={styles.length ? "" : "e.g. Anime, Watercolor"}
          disabled={styles.length >= max}
          className="min-w-[120px] flex-1 bg-transparent px-1 text-sm text-cg-text placeholder:text-cg-muted/70 focus:outline-none"
        />
      </div>
      {suggestions.length > 0 && styles.length < max && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="rounded-full border border-cg-border px-2.5 py-1 text-xs text-cg-muted transition hover:border-cg-primary hover:text-cg-primary"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
