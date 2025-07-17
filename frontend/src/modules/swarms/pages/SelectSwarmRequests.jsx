import { useEffect, useState } from "react";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import ConfirmationModal from "../components/ConfirmationModal";
import SuccessToast from "../components/SuccessToast";

const fakeRequests = [
  {
    id: 1,
    name: "Gamma Swarm",
    description: "Monitor forest fire risk zones",
    requestedBy: "UserA",
    requestedAt: "2024-06-25",
    maxDevices: 15,
    taken: false,
  },
  {
    id: 2,
    name: "Delta Swarm",
    description: "Smart farming monitoring system",
    requestedBy: "UserB",
    requestedAt: "2024-06-28",
    maxDevices: 12,
    taken: true,
  },
];

export default function SelectSwarmRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [maxDevicesFilter, setMaxDevicesFilter] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setLoading(true);
    setError(false);
    setTimeout(() => {
      setRequests(fakeRequests); // Replace with real fetch
      setLoading(false);
    }, 1000);
  }, []);

  const filteredRequests = requests.filter(
    (r) =>
      (!search || r.name.toLowerCase().includes(search.toLowerCase())) &&
      (!dateFilter || r.requestedAt === dateFilter) &&
      (!maxDevicesFilter || r.maxDevices <= parseInt(maxDevicesFilter))
  );

  function handleAddToCatalog(req) {
    setSuccessMessage(`'${req.name}' added to your catalog`);
    setSelectedRequest(null);
  }

  if (loading) {
    return <LoadingSpinner message="Loading swarm requests..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        error="Failed to load swarm requests."
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">
        Pending Swarm Requests
      </h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by name"
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          type="date"
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />
        <input
          type="number"
          placeholder="Max devices"
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          value={maxDevicesFilter}
          onChange={(e) => setMaxDevicesFilter(e.target.value)}
        />
      </div>

      {/* Empty state */}
      {filteredRequests.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-lg">No pending requests found</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className={`bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm dark:shadow-gray-900/20 flex flex-col justify-between transition-shadow hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-gray-900/30 ${
                req.taken ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  {req.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                  {req.description}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Requested by: <strong className="text-gray-700 dark:text-gray-300">{req.requestedBy}</strong>
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Request date: <span className="text-gray-700 dark:text-gray-300">{req.requestedAt}</span>
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Max devices: <span className="text-gray-700 dark:text-gray-300">{req.maxDevices}</span>
                </p>
              </div>
              <button
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                onClick={() => setSelectedRequest(req)}
              >
                Add to my catalog
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation modal */}
      <ConfirmationModal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onConfirm={() => handleAddToCatalog(selectedRequest)}
        title={`Add "${selectedRequest?.name}" to your catalog?`}
        message="This will add the swarm request to your personal catalog for management."
        confirmText="Confirm"
        cancelText="Cancel"
      />

      {/* Success feedback */}
      <SuccessToast
        message={successMessage}
        isVisible={!!successMessage}
        onClose={() => setSuccessMessage("")}
      />
    </div>
  );
}