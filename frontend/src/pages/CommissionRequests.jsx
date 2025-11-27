import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const CommissionRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const { data } = await axios.get(
        `${
          import.meta.env.VITE_SERVER
        }/api/v1/commissions/getCommissionReqs?artist=true`,
        { withCredentials: true }
      );

      // Add a local UI status field (default: pending)
      const withStatus = data.commissionReqs.map((req) => ({
        ...req,
        uiStatus: "pending",
      }));

      setRequests(withStatus);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const updateStatus = (id, status) => {
    setRequests((prev) =>
      prev.map((req) => (req._id === id ? { ...req, uiStatus: status } : req))
    );
  };

  const handleAccept = async (id) => {
    try {
      await axios.post(
        `${
          import.meta.env.VITE_SERVER
        }/api/v1/commissions/confirmCommissionReq/${id}`,
        { accept: true },
        { withCredentials: true }
      );

      updateStatus(id, "accepted");
    } catch (error) {
      console.log(error);
    }
  };

  const handleDecline = async (id) => {
    try {
      await axios.post(
        `${
          import.meta.env.VITE_SERVER
        }/api/v1/commissions/confirmCommissionReq/${id}`,
        { accept: false },
        { withCredentials: true }
      );

      updateStatus(id, "declined");
    } catch (error) {
      console.log(error);
    }
  };

  if (loading)
    return (
      <div className="w-full flex justify-center mt-20 text-gray-300">
        Loading...
      </div>
    );

  if (requests.length === 0)
    return (
      <div className="w-full flex justify-center mt-20 text-gray-400">
        No commission requests found
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto mt-10 px-4">
      <h1 className="text-xl font-semibold mb-6 text-white">
        Commission Requests
      </h1>

      <div className="overflow-x-auto rounded-lg shadow-lg border border-gray-700">
        <table className="w-full text-left text-gray-200">
          <thead className="bg-gray-800 text-gray-300 uppercase text-sm">
            <tr>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Deadline</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-700">
            {requests.map((req) => (
              <tr key={req._id}>
                <td className="py-3 px-4 flex items-center gap-3">
                  <Link to={`/artist/${req.customerId.userName}`}>
                    <img
                      src={req.customerId?.profilePic.url}
                      alt="pic"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  </Link>

                  <div>
                    <p className="font-medium">{req.customerId?.name}</p>
                    <p className="text-sm text-gray-400">
                      @{req.customerId?.userName}
                    </p>
                  </div>
                </td>

                <td className="py-3 px-4">
                  {new Date(req.deadline).toDateString()}
                </td>

                <td className="py-3 px-4 max-w-md truncate">
                  {req.description}
                </td>

                <td className="py-3 px-4">
                  {!req.isConfirmed && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(req._id)}
                        className="px-4 py-1 bg-green-600 hover:bg-green-700 rounded text-white"
                      >
                        Accept
                      </button>

                      <button
                        onClick={() => handleDecline(req._id)}
                        className="px-4 py-1 bg-red-600 hover:bg-red-700 rounded text-white"
                      >
                        Decline
                      </button>
                    </div>
                  )}

                  {req.isConfirmed && (
                    <span className="px-3 py-1 bg-blue-700 text-white rounded">
                      Ongoing Commission
                    </span>
                  )}

                  {req.uiStatus === "declined" && (
                    <span className="px-3 py-1 bg-gray-600 text-white rounded">
                      Declined Request
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CommissionRequests;
