import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { LuBrush, LuCalendarClock, LuIndianRupee, LuMapPin, LuMonitor } from "react-icons/lu";
import { useRespondToCommission } from "../api/commissions.hooks";
import { getAvatarUrl } from "../../../lib/avatar";
import { getErrorMessage } from "../../../lib/api-client";
import { formatDate, formatRelative } from "../../../lib/utils";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import OptimizedImage from "../../../components/ui/OptimizedImage";

const STATUS_STYLES = {
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  accepted: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  declined: "bg-cg-hover text-cg-muted",
};
const STATUS_LABELS = { pending: "Pending", accepted: "Accepted", declined: "Declined" };

const DESCRIPTION_CLAMP = 180; // characters before "Show more"

/**
 * One commission request. role "received": the other person is the customer and
 * pending requests can be accepted/declined. role "sent": the other person is the artist.
 */
export default function CommissionRequestCard({ request, role }) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDecline, setConfirmDecline] = useState(false);
  const { mutateAsync: respond, isPending, variables } = useRespondToCommission();

  // Very old requests stored an artist-profile id, which doesn't populate to a user
  const person = (role === "received" ? request.customerId : request.artistId) || null;
  const status = request.status || "pending";
  const description = request.description || "";
  const long = description.length > DESCRIPTION_CLAMP;

  const deadline = request.deadline ? new Date(request.deadline) : null;
  const overdue = deadline && deadline < new Date() && status !== "declined";
  const shipping = request.shippingDetails || {};
  const shipsTo = [shipping.city, shipping.country].filter(Boolean).join(", ");

  const handleRespond = async (accept) => {
    try {
      await respond({ id: request._id, accept });
      setConfirmDecline(false);
      toast.success(accept ? "Commission accepted" : "Request declined");
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not update the request"));
    }
  };

  return (
    <article className="border-b border-cg-border px-4 py-4">
      <div className="flex items-start gap-3">
        {person?.userName ? (
          <Link to={`/artist/${person.userName}`} className="flex-shrink-0">
            <img src={getAvatarUrl(person)} alt="" className="h-10 w-10 rounded-full object-cover ring-1 ring-cg-border" />
          </Link>
        ) : (
          <img src={getAvatarUrl(null)} alt="" className="h-10 w-10 flex-shrink-0 rounded-full ring-1 ring-cg-border" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <div className="min-w-0 text-sm">
              {person?.userName ? (
                <Link to={`/artist/${person.userName}`} className="hover:underline">
                  <span className="font-semibold">{person.name}</span>{" "}
                  <span className="text-cg-muted">@{person.userName}</span>
                </Link>
              ) : (
                <span className="font-semibold text-cg-muted">
                  {role === "received" ? "Unknown customer" : "Unknown artist"}
                </span>
              )}
              <span className="text-cg-muted"> · {formatRelative(request.createdAt)}</span>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
              {STATUS_LABELS[status]}
            </span>
          </div>

          <p className="mt-0.5 text-xs text-cg-muted">
            {role === "received" ? "wants to commission you" : "Your request"}
          </p>

          {description && (
            <p className="mt-2 whitespace-pre-wrap break-words text-[15px] leading-5">
              {long && !expanded ? `${description.slice(0, DESCRIPTION_CLAMP).trimEnd()}…` : description}
              {long && (
                <button
                  type="button"
                  onClick={() => setExpanded((e) => !e)}
                  className="ml-1 text-sm font-medium text-cg-primary hover:underline"
                >
                  {expanded ? "Show less" : "Show more"}
                </button>
              )}
            </p>
          )}

          <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-cg-muted">
            {request.artStyle && (
              <div className="inline-flex items-center gap-1.5">
                <dt className="sr-only">Art style</dt>
                <LuBrush aria-hidden="true" />
                <dd className="text-cg-text">{request.artStyle}</dd>
              </div>
            )}
            {request.price > 0 && (
              <div className="inline-flex items-center gap-1">
                <dt className="sr-only">Offered price</dt>
                <LuIndianRupee aria-hidden="true" />
                <dd className="font-semibold text-cg-text">{request.price.toLocaleString("en-IN")}</dd>
              </div>
            )}
            {deadline && (
              <div className={`inline-flex items-center gap-1.5 ${overdue ? "text-error" : ""}`}>
                <dt className="sr-only">Deadline</dt>
                <LuCalendarClock aria-hidden="true" />
                <dd>
                  <span className={overdue ? "" : "text-cg-text"}>Due {formatDate(deadline)}</span>
                  {" · "}
                  {overdue ? "deadline passed" : formatRelative(deadline)}
                </dd>
              </div>
            )}
            {request.deliveryType === "digital" ? (
              <div className="inline-flex items-center gap-1.5">
                <dt className="sr-only">Delivery</dt>
                <LuMonitor aria-hidden="true" />
                <dd>Digital delivery</dd>
              </div>
            ) : (
              shipsTo && (
                <div className="inline-flex items-center gap-1.5">
                  <dt className="sr-only">Ships to</dt>
                  <LuMapPin aria-hidden="true" />
                  <dd>Ships to {shipsTo}</dd>
                </div>
              )
            )}
          </dl>

          {request.refrences?.url && (
            <a
              href={request.refrences.url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 block w-fit overflow-hidden rounded-xl border border-cg-border transition hover:opacity-90"
              title="Open reference image"
            >
              <OptimizedImage
                src={request.refrences.url}
                alt="Reference image"
                sizes="160px"
                wrapperClassName="h-28 w-40 bg-cg-hover"
                className="h-full w-full object-cover"
              />
            </a>
          )}

          {role === "received" && status === "pending" && (
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => handleRespond(true)}
                disabled={isPending}
                className="btn btn-sm rounded-full border-0 bg-cg-primary px-5 text-white hover:bg-cg-primary/90 dark:text-[#082f49]"
              >
                {isPending && variables?.accept ? "Accepting..." : "Accept"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDecline(true)}
                disabled={isPending}
                className="btn btn-sm rounded-full border border-cg-border bg-transparent px-5 text-cg-text shadow-none hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-500"
              >
                Decline
              </button>
            </div>
          )}
        </div>
      </div>

      {confirmDecline && (
        <ConfirmDialog
          title="Decline this request?"
          body={`${person?.name || "The customer"} will see that you declined. This can't be undone.`}
          confirmLabel="Decline"
          pendingLabel="Declining..."
          pending={isPending}
          onCancel={() => setConfirmDecline(false)}
          onConfirm={() => handleRespond(false)}
        />
      )}
    </article>
  );
}
