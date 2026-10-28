import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { useCommissionRequests } from "../api/commissions.hooks";
import { useCurrentUser } from "../../auth/api/auth.hooks";
import CommissionRequestCard from "../components/CommissionRequestCard";
import { CommissionRequestsSkeleton } from "../../../components/ui/Skeleton";

const STATUS_FILTERS = [
  ["all", "All"],
  ["pending", "Pending"],
  ["accepted", "Accepted"],
  ["declined", "Declined"],
];

const TAB_ACTIVE =
  "border-b-2 border-cg-primary text-cg-primary dark:border-cg-text dark:text-cg-text";

function EmptyState({ role, filter }) {
  if (filter !== "all")
    return (
      <div className="px-8 py-12 text-center">
        <p className="text-lg font-semibold">No {filter} requests</p>
        <p className="mt-1 text-sm text-cg-muted">Try another filter.</p>
      </div>
    );

  return role === "received" ? (
    <div className="px-8 py-12 text-center">
      <p className="text-lg font-semibold">No requests yet</p>
      <p className="mt-1 text-sm text-cg-muted">
        When someone wants to commission you, it'll show up here. Make sure your artist profile is open for commissions.
      </p>
    </div>
  ) : (
    <div className="px-8 py-12 text-center">
      <p className="text-lg font-semibold">You haven't requested any commissions yet</p>
      <p className="mt-1 text-sm text-cg-muted">Find an artist whose style you love and send them a request.</p>
      <Link
        to="/commissions"
        className="btn btn-sm mt-4 rounded-full border-0 bg-cg-primary px-5 text-white hover:bg-cg-primary/90 dark:text-[#082f49]"
      >
        Browse artists
      </Link>
    </div>
  );
}

export const CommissionRequestsPage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { data: user } = useCurrentUser();
  const isArtist = Boolean(user?.isArtist);
  // Only artists receive requests; everyone can send them.
  // The request form sends people here with { tab: "sent" } after submitting.
  const [role, setRole] = useState(state?.tab === "sent" || !isArtist ? "sent" : "received");
  const [filter, setFilter] = useState("all");

  const activeRole = isArtist ? role : "sent";
  const { data, isLoading, isError } = useCommissionRequests(activeRole);
  const requests = data?.commissionReqs || [];

  const counts = requests.reduce(
    (acc, r) => ({ ...acc, [r.status]: (acc[r.status] || 0) + 1 }),
    { all: requests.length }
  );
  const visible = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  const switchRole = (next) => {
    setRole(next);
    setFilter("all");
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <div className="sticky top-0 z-10 bg-cg-bg/80 backdrop-blur-md">
        <div className="flex items-center gap-4 px-4 py-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-ghost btn-sm btn-circle"
            aria-label="Go back"
          >
            <FaArrowLeft />
          </button>
          <h1 className="text-xl font-bold">Commission requests</h1>
        </div>

        {isArtist && (
          <div className="grid grid-cols-2 text-center font-semibold" role="tablist">
            {[
              ["received", "Received"],
              ["sent", "Sent"],
            ].map(([key, label]) => (
              <button
                key={key}
                role="tab"
                aria-selected={activeRole === key}
                onClick={() => switchRole(key)}
                className={`py-3 transition-colors hover:bg-cg-hover ${activeRole === key ? TAB_ACTIVE : "text-cg-muted"}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto border-b border-cg-border px-4 py-2.5 no-scrollbar">
          {STATUS_FILTERS.map(([key, label]) => {
            const selected = filter === key;
            const count = counts[key] || 0;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={selected}
                onClick={() => setFilter(key)}
                className={`flex-shrink-0 rounded-full border px-3 py-1 text-sm font-medium transition ${
                  selected
                    ? "border-cg-primary bg-cg-primary/10 text-cg-primary dark:border-cg-text dark:bg-cg-text dark:text-cg-bg"
                    : "border-cg-border text-cg-muted hover:bg-cg-hover hover:text-cg-text"
                }`}
              >
                {label}
                {!isLoading && <span className="ml-1.5 tabular-nums opacity-70">{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <CommissionRequestsSkeleton />
      ) : isError ? (
        <p className="p-6 text-center text-cg-muted">Could not load commission requests. Please try again.</p>
      ) : visible.length === 0 ? (
        <EmptyState role={activeRole} filter={filter} />
      ) : (
        visible.map((r) => <CommissionRequestCard key={r._id} request={r} role={activeRole} />)
      )}
    </div>
  );
};

export const CommissionRequests = CommissionRequestsPage;
export default CommissionRequestsPage;
