import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useCommissionRequests, useRespondToCommission } from "../api/commissions.hooks";
import { Button } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/EmptyState";
import { CommissionRequestsSkeleton } from "../../../components/ui/Skeleton";

import { getAvatarUrl } from "../../../lib/avatar";
export const CommissionRequestsPage = () => {
  const { data, isLoading, isError } = useCommissionRequests();
  const {
    mutateAsync: respondToCommission,
    isPending: isResponding,
    variables: respondingTo,
  } = useRespondToCommission();

  // status is persisted by the server; the list refetches after each response
  const requests = data?.commissionReqs || [];

  const handleAction = async (id, accept) => {
    try {
      await respondToCommission({ id, accept });
      toast.success(accept ? "Commission accepted!" : "Commission declined");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update commission request");
    }
  };

  if (isLoading) {
    return (
      <div className="h-full overflow-hidden max-w-5xl mx-auto p-6">
        <div className="py-3 mb-6 border-b border-base-300">
          <h1 className="text-2xl font-bold">Commission Requests</h1>
        </div>
        <CommissionRequestsSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full flex justify-center mt-20 text-error">
        Failed to load commission requests.
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto no-scrollbar max-w-5xl mx-auto p-6">
      <div className="sticky top-0 z-10 backdrop-blur bg-base-100/80 py-3 mb-6 border-b border-base-300">
        <h1 className="text-2xl font-bold">Commission Requests</h1>
      </div>

      {requests.length === 0 ? (
        <EmptyState
          title="No commission requests found"
          description="You will see requests here when customers commission your art."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl shadow-lg border border-base-300 bg-base-200">
          <table className="w-full text-left text-base-content text-sm">
            <thead className="bg-base-300 text-base-content uppercase text-xs font-semibold">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Deadline</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-base-300">
              {requests.map((req) => (
                <tr key={req._id} className="hover:bg-base-100/50 transition-colors">
                  <td className="py-3 px-4 flex items-center gap-3">
                    <Link to={`/artist/${req.customerId?.userName}`}>
                      <img
                        src={getAvatarUrl(req.customerId)}
                        alt="pic"
                        className="w-10 h-10 rounded-full object-cover ring-1 ring-primary/20"
                      />
                    </Link>

                    <div>
                      <p className="font-medium">{req.customerId?.name}</p>
                      <p className="text-xs text-neutral-500">
                        @{req.customerId?.userName}
                      </p>
                    </div>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    {new Date(req.deadline).toLocaleDateString()}
                  </td>

                  <td className="py-3 px-4 max-w-md truncate">
                    {req.description}
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    {req.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          loading={isResponding && respondingTo?.id === req._id && respondingTo?.accept}
                          disabled={isResponding}
                          onClick={() => handleAction(req._id, true)}
                        >
                          Accept
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          loading={isResponding && respondingTo?.id === req._id && !respondingTo?.accept}
                          disabled={isResponding}
                          onClick={() => handleAction(req._id, false)}
                          className="text-error hover:bg-error/10"
                        >
                          Decline
                        </Button>
                      </div>
                    )}

                    {req.status === "accepted" && (
                      <span className="badge badge-primary py-3 px-3 font-medium">
                        Ongoing Commission
                      </span>
                    )}

                    {req.status === "declined" && (
                      <span className="badge badge-neutral py-3 px-3 font-medium">
                        Declined Request
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export const CommissionRequests = CommissionRequestsPage;
export default CommissionRequestsPage;
