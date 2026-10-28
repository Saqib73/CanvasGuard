import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { LuChevronDown, LuSearch, LuX } from "react-icons/lu";
import { useCommissionArtists } from "../api/commissions.hooks";
import { useCurrentUser } from "../../auth/api/auth.hooks";
import ArtistCard from "../components/ArtistCard";
import { ArtistGridSkeleton } from "../../../components/ui/Skeleton";

const SORTS = [
  ["newest", "Newest"],
  ["fee_low", "Lowest price"],
  ["fee_high", "Highest price"],
];

const chipClass = (active) =>
  `inline-flex flex-shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-sm font-medium transition ${
    active
      ? "border-cg-primary bg-cg-primary/10 text-cg-primary dark:border-cg-text dark:bg-cg-text dark:text-cg-bg"
      : "border-cg-border text-cg-muted hover:bg-cg-hover hover:text-cg-text"
  }`;

const useDebounced = (value, ms = 300) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
};

// Closes a popover on outside click or Escape
const useDismiss = (open, close) => {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => !ref.current?.contains(e.target) && close();
    const onKey = (e) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return ref;
};

// align: which edge of the chip the menu lines up with. Use "left" for chips on the
// left of the bar, so the menu opens into the column instead of under the sidebar.
function Popover({ label, active, align = "right", children }) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={chipClass(active)}
      >
        {label} <LuChevronDown aria-hidden="true" />
      </button>
      {open && (
        <div
          className={`absolute z-20 mt-2 w-56 rounded-2xl border border-cg-border bg-cg-surface p-2 shadow-lg ${
            align === "left" ? "left-0" : "right-0"
          }`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

const priceInputClass =
  "w-full rounded-lg border border-cg-border bg-cg-bg px-2.5 py-1.5 text-sm text-cg-text outline-none focus:border-cg-primary";

export default function CommissionsPage() {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();

  const [style, setStyle] = useState("");
  const [openOnly, setOpenOnly] = useState(true);
  const [sort, setSort] = useState("newest");
  const [minFee, setMinFee] = useState("");
  const [maxFee, setMaxFee] = useState("");

  const debouncedStyle = useDebounced(style.trim());
  const debouncedMin = useDebounced(minFee);
  const debouncedMax = useDebounced(maxFee);

  const filters = useMemo(() => {
    const f = { sort };
    if (openOnly) f.open = "true";
    if (debouncedStyle) f.style = debouncedStyle;
    if (debouncedMin !== "") f.minFee = debouncedMin;
    if (debouncedMax !== "") f.maxFee = debouncedMax;
    return f;
  }, [sort, openOnly, debouncedStyle, debouncedMin, debouncedMax]);

  const { data, isLoading, isError, isFetching } = useCommissionArtists(filters);
  const artists = data?.artists || [];

  const hasPrice = minFee !== "" || maxFee !== "";
  const filtered = Boolean(style.trim() || hasPrice || !openOnly);
  const priceLabel = hasPrice
    ? `₹${minFee || 0} – ${maxFee ? `₹${maxFee}` : "any"}`
    : "Price";

  const clearFilters = () => {
    setStyle("");
    setOpenOnly(true);
    setMinFee("");
    setMaxFee("");
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <div className="sticky top-0 z-10 border-b border-cg-border bg-cg-bg/80 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3 px-4 py-2">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-ghost btn-sm btn-circle"
              aria-label="Go back"
            >
              <FaArrowLeft />
            </button>
            <h1 className="text-xl font-bold">Commissions</h1>
          </div>
          <Link
            to="/commissionRequests"
            className="btn btn-sm rounded-full border border-cg-border bg-transparent px-4 text-cg-text shadow-none hover:bg-cg-hover"
          >
            My requests
          </Link>
        </div>

        <div className="px-4 pb-2">
          <label className="relative block">
            <span className="sr-only">Search art styles</span>
            <LuSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-cg-muted" aria-hidden="true" />
            <input
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              placeholder="Search styles, e.g. anime, watercolor"
              className="w-full rounded-full border border-cg-border bg-cg-surface py-2 pl-10 pr-9 text-sm text-cg-text outline-none transition placeholder:text-cg-muted focus:border-cg-primary focus:ring-2 focus:ring-cg-primary/20"
            />
            {style && (
              <button
                type="button"
                onClick={() => setStyle("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-cg-muted hover:bg-cg-hover hover:text-cg-text"
              >
                <LuX />
              </button>
            )}
          </label>
        </div>

        <div className="flex items-center gap-2 px-4 pb-2.5">
          <button type="button" aria-pressed={openOnly} onClick={() => setOpenOnly((o) => !o)} className={chipClass(openOnly)}>
            Open only
          </button>

          <Popover label={priceLabel} active={hasPrice} align="left">
            {(close) => (
              <div className="space-y-2 p-1">
                <p className="text-xs font-medium text-cg-muted">Starting price (₹)</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={minFee}
                    onChange={(e) => setMinFee(e.target.value)}
                    placeholder="Min"
                    aria-label="Minimum price"
                    className={priceInputClass}
                  />
                  <span className="text-cg-muted">–</span>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={maxFee}
                    onChange={(e) => setMaxFee(e.target.value)}
                    placeholder="Max"
                    aria-label="Maximum price"
                    className={priceInputClass}
                  />
                </div>
                <div className="flex justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMinFee("");
                      setMaxFee("");
                    }}
                    className="text-xs font-medium text-cg-muted hover:text-cg-text"
                  >
                    Clear
                  </button>
                  <button type="button" onClick={close} className="text-xs font-semibold text-cg-primary hover:underline">
                    Done
                  </button>
                </div>
              </div>
            )}
          </Popover>

          <div className="flex-1" />

          <Popover label={`Sort: ${SORTS.find(([k]) => k === sort)[1]}`} active={false}>
            {(close) =>
              SORTS.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setSort(key);
                    close();
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-cg-hover ${
                    sort === key ? "font-semibold text-cg-primary" : ""
                  }`}
                >
                  {label}
                  {sort === key && <span aria-hidden="true">✓</span>}
                </button>
              ))
            }
          </Popover>
        </div>
      </div>

      {isLoading ? (
        <ArtistGridSkeleton count={3} />
      ) : isError ? (
        <p className="p-6 text-center text-cg-muted">Could not load artists. Please try again.</p>
      ) : artists.length === 0 ? (
        <div className="px-8 py-12 text-center">
          <p className="text-lg font-semibold">{filtered ? "No artists match these filters" : "No artists are open right now"}</p>
          <p className="mt-1 text-sm text-cg-muted">
            {filtered ? "Try a different style or price range." : "Check back soon, or turn off \"Open only\" to see everyone."}
          </p>
          <button
            type="button"
            onClick={filtered ? clearFilters : () => setOpenOnly(false)}
            className="btn btn-sm mt-4 rounded-full border border-cg-border bg-transparent px-5 text-cg-text shadow-none hover:bg-cg-hover"
          >
            {filtered ? "Clear filters" : "Show all artists"}
          </button>
        </div>
      ) : (
        // Dim slightly while new filter results load over the old ones
        <div className={`transition-opacity ${isFetching ? "opacity-60" : ""}`}>
          {artists.map((a) => (
            <ArtistCard key={a._id} artist={a} isSelf={a.user?._id === user?._id} />
          ))}
        </div>
      )}
    </div>
  );
}

export const Commissions = CommissionsPage;
