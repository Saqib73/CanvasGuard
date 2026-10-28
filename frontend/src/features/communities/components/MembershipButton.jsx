import { useState } from "react";
import toast from "react-hot-toast";
import { useCurrentUser } from "../../auth/api/auth.hooks";
import { useJoinCommunity, useLeaveCommunity } from "../api/communities.hooks";
import { getErrorMessage } from "../../../lib/api-client";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { isCreatorOf, isMemberOf } from "../membership";

/**
 * Join / Joined (hover: Leave, with confirmation) / Creator badge.
 * Each instance has its own mutation, so pending state stays on the clicked card.
 */
export default function MembershipButton({ community, size = "btn-sm", className = "" }) {
  const { data: user } = useCurrentUser();
  const { mutateAsync: join, isPending: joining } = useJoinCommunity();
  const { mutateAsync: leave, isPending: leaving } = useLeaveCommunity();
  const [confirmLeave, setConfirmLeave] = useState(false);

  if (isCreatorOf(community, user?._id)) {
    return (
      <span className={`inline-flex items-center rounded-full border border-cg-border px-3 py-1 text-xs font-medium text-cg-muted ${className}`}>
        Creator
      </span>
    );
  }

  const handleJoin = async () => {
    try {
      await join(community._id);
      toast.success(`Joined ${community.name}`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not join community"));
    }
  };

  const handleLeave = async () => {
    try {
      await leave(community._id);
      setConfirmLeave(false);
      toast.success(`Left ${community.name}`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not leave community"));
    }
  };

  if (!isMemberOf(community, user?._id)) {
    return (
      <button
        type="button"
        onClick={handleJoin}
        disabled={joining}
        className={`btn ${size} rounded-full border-0 bg-cg-primary px-4 text-white hover:bg-cg-primary/90 dark:text-[#082f49] ${className}`}
      >
        {joining ? "Joining..." : "Join"}
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmLeave(true)}
        className={`group btn ${size} min-w-20 rounded-full border border-cg-border bg-transparent px-4 text-cg-text shadow-none hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-500 ${className}`}
      >
        <span className="group-hover:hidden">Joined</span>
        <span className="hidden group-hover:inline">Leave</span>
      </button>
      {confirmLeave && (
        <ConfirmDialog
          title={`Leave ${community.name}?`}
          body="You won't see its posts in your communities feed, and you can't post in it until you join again."
          confirmLabel="Leave"
          pendingLabel="Leaving..."
          pending={leaving}
          onCancel={() => setConfirmLeave(false)}
          onConfirm={handleLeave}
        />
      )}
    </>
  );
}
