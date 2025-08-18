import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import ConfirmationModal from "../components/ConfirmationModal";
import SuccessToast from "../components/SuccessToast";
// Import our services
import swarmService from "../services/SwarmService";

export default function SelectSwarmRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [maxDevicesFilter, setMaxDevicesFilter] = useState("");
  const [orderBy, setOrderBy] = useState("createdAt");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Function to load swarm requests using the service
  const loadSwarmRequests = async () => {
    setLoading(true);
    setError(false);

    try {
      const data = await swarmService.getSwarmRequests();
      setRequests(data);
    } catch (error) {
      console.error('Error loading swarm requests:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSwarmRequests();
  }, []);

  const filteredRequests = requests.filter(
    (r) =>
      (!search || r.name.toLowerCase().includes(search.toLowerCase())) &&
      (!dateFilter || r.createdAt === dateFilter) &&
      (!maxDevicesFilter || r.maxDevices <= parseInt(maxDevicesFilter))
  );

  // Sort requests
  const sortedRequests = filteredRequests.sort((a, b) => {
    if (orderBy === "name") {
      return a.name.localeCompare(b.name);
    }
    if (orderBy === "createdAt") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    if (orderBy === "maxDevices") {
      return b.maxDevices - a.maxDevices;
    }
    return 0;
  });

  const handleAddToCatalog = async (req) => {
    setAssigning(true);
    
    try {
      // Use the assignSwarmToMe service method
      console.log("SWARM ID", req)
      await swarmService.assignSwarmToMe(req.id);
      
      // Remove the request from the local list since it's now assigned
      setRequests(prevRequests => 
        prevRequests.filter(request => request.id !== req.id)
      );
      
      setSuccessMessage(`'${req.name}' added to your catalog successfully!`);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error assigning swarm:', error);
      setSuccessMessage(`Error adding '${req.name}' to your catalog. Please try again.`);
    } finally {
      setAssigning(false);
    }
  };

  const handleRetry = () => {
    loadSwarmRequests();
  };

  const clearFilters = () => {
    setSearch("");
    setDateFilter("");
    setMaxDevicesFilter("");
  };

  // Show loading spinner while loading
  if (loading) {
    return <LoadingSpinner message="Loading swarm requests..." />;
  }

  // Show error message with retry option
  if (error) {
    return (
      <ErrorMessage
        error="Failed to load swarm requests."
        onRetry={handleRetry}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header - SIEMPRE VISIBLE */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="mb-4 lg:mb-0">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Pending Swarm Requests ({sortedRequests.length})
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Review and add swarm requests to your catalog.
          </p>
        </div>
        
        {/* Filters - SIEMPRE VISIBLES */}
        <div className="flex flex-wrap gap-3 w-full lg:w-auto lg:ml-auto justify-end">
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
            title="Filter by creation date"
          />
          <input
            type="number"
            placeholder="Max devices"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            value={maxDevicesFilter}
            onChange={(e) => setMaxDevicesFilter(e.target.value)}
          />
          <select
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700"
            value={orderBy}
            onChange={(e) => setOrderBy(e.target.value)}
          >
            <option value="createdAt">Order by Date</option>
            <option value="name">Order by Name</option>
            <option value="maxDevices">Order by Max Devices</option>
          </select>
          {/* Clear filters button - solo visible si hay filtros activos */}
          {(search || dateFilter || maxDevicesFilter) && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Clear all filters"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      {sortedRequests.length === 0 ? (
        /* Empty State - Mejorado y más informativo */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-3xl text-white">📋</span>
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {requests.length === 0 ? "No pending requests found" : "No requests match your filters"}
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
              {requests.length === 0 
                ? "There are currently no swarm requests waiting for assignment. Check back later or refresh to see new requests."
                : `We found ${requests.length} total request${requests.length !== 1 ? 's' : ''}, but none match your current filters. Try adjusting your search criteria.`
              }
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {requests.length === 0 ? (
                <>
                  <button
                    onClick={handleRetry}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    🔄 Refresh
                  </button>
                  <button
                    onClick={() => navigate('/swarm')}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                  >
                    View My Catalog
                  </button>
                </>
              ) : (
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Swarm Requests Grid - Mejorado para consistencia */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedRequests.map((req) => (
            <div
              key={req.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600"
            >
              <div className="flex-1">
                <div className="flex justify-between items-start mb-3">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
                    {req.name}
                  </h2>
                  <div className="ml-2 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs rounded-full font-medium">
                    Pending
                  </div>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                  {req.description || "No description provided"}
                </p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-500">Requested by:</span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                      {req.requestedBy}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-500">Request date:</span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {req.createdAt}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-500">Max devices:</span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                      {req.maxDevices}
                    </span>
                  </div>
                </div>
              </div>
              
              <button
                className="mt-6 w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                onClick={() => setSelectedRequest(req)}
                disabled={assigning}
              >
                {assigning ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Adding...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    ➕ Add to my catalog
                  </span>
                )}
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
        confirmText={assigning ? "Adding..." : "Confirm"}
        cancelText="Cancel"
        isLoading={assigning}
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