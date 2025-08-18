import { useEffect, useState, useRef } from "react";
import { MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import StatusBadge from "../components/StatusBadge";
import swarmService from "../services/SwarmService";

// Filter and sorting options
const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "assigned", label: "Assigned" },
  { value: "inactive", label: "Inactive" },
  { value: "error", label: "Error" },
];

const ORDER_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "createdAt", label: "Creation date" },
  { value: "status", label: "Status" },
  { value: "lastActivity", label: "Last activity" },
];

/**
 * MySwarmCatalog Component
 * Displays a grid of swarms assigned to the current user
 * Includes filtering, sorting, and swarm management actions
 */
export default function MySwarmCatalog() {
  const navigate = useNavigate();
  
  // Component state
  const [swarms, setSwarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // Filter and sort state
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [orderBy, setOrderBy] = useState("name");
  
  // UI state
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedSwarm, setSelectedSwarm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const menuRef = useRef(null);

  /**
   * Load user's swarms from the API
   */
  const loadSwarms = async () => {
    setLoading(true);
    setError(false);
    
    try {
      const data = await swarmService.getMySwarms();
      setSwarms(data);
    } catch (error) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Load swarms on component mount
  useEffect(() => {
    loadSwarms();
  }, []);

  // Handle clicks outside dropdown menu
  useEffect(() => {
    if (!anchorEl) return;
    
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setAnchorEl(null);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [anchorEl]);

  /**
   * Filter and sort swarms based on current filter settings
   */
  const getFilteredAndSortedSwarms = () => {
    let filtered = swarms.filter(
      (s) =>
        (!statusFilter || s.status === statusFilter) &&
        (!search || s.name.toLowerCase().includes(search.toLowerCase())) &&
        (!dateFilter || s.createdAt === dateFilter)
    );

    return filtered.sort((a, b) => {
      switch (orderBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "createdAt":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "status":
          return a.status.localeCompare(b.status);
        case "lastActivity":
          return new Date(b.lastActivity) - new Date(a.lastActivity);
        default:
          return 0;
      }
    });
  };

  const filteredSwarms = getFilteredAndSortedSwarms();

  /**
   * Delete a swarm and update local state
   * @param {string} id - Swarm ID to delete
   */
  const handleDelete = async (id) => {
    setActionLoading(true);
    setAnchorEl(null);
    
    try {
      await swarmService.deleteSwarm(id);
      setSwarms((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      setError(true);
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Duplicate a swarm and add to local state
   * @param {Object} swarm - Swarm object to duplicate
   */
  const handleDuplicate = async (swarm) => {
    setActionLoading(true);
    setAnchorEl(null);
    
    try {
      const newSwarm = await swarmService.duplicateSwarm(swarm);
      
      // Add duplicated swarm to local state
      setSwarms((prev) => [
        ...prev,
        {
          id: newSwarm.id,
          name: newSwarm.name,
          status: newSwarm.status,
          devices: 0,
          maxDevices: newSwarm.maxDevices,
          createdAt: newSwarm.created_at?.substring(0, 10) || "",
          lastActivity: "",
          description: newSwarm.description,
          requestedBy: newSwarm.requestedBy,
        },
      ]);
    } catch (error) {
      setError(true);
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Clear all active filters
   */
  const clearFilters = () => {
    setStatusFilter("");
    setSearch("");
    setDateFilter("");
  };

  /**
   * Retry loading swarms on error
   */
  const handleRetry = () => {
    loadSwarms();
  };

  // Check if any filters are active
  const hasActiveFilters = statusFilter || search || dateFilter;

  // Loading state
  if (loading) {
    return <LoadingSpinner message="Loading swarm catalog..." />;
  }

  // Error state
  if (error) {
    return (
      <ErrorMessage
        error="Failed to load swarm catalog."
        onRetry={handleRetry}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header Section - Always Visible */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="mb-4 lg:mb-0">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            My Swarm Catalog ({filteredSwarms.length})
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Manage and monitor all your swarms in one place.
          </p>
        </div>
        
        {/* Filters - Always Visible */}
        <div className="flex flex-wrap gap-3 w-full lg:w-auto lg:ml-auto justify-end">
          <select
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          
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
          
          <select
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700"
            value={orderBy}
            onChange={(e) => setOrderBy(e.target.value)}
          >
            {ORDER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                Order by {opt.label}
              </option>
            ))}
          </select>
          
          {/* Clear filters button - only shown when filters are active */}
          {hasActiveFilters && (
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
      {filteredSwarms.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-3xl text-white">🚀</span>
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {swarms.length === 0 ? "No swarms in your catalog" : "No swarms match your filters"}
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
              {swarms.length === 0 
                ? "You don't have any swarms assigned to you yet. Browse available requests to add swarms to your catalog."
                : `You have ${swarms.length} total swarm${swarms.length !== 1 ? 's' : ''}, but none match your current filters. Try adjusting your search criteria.`
              }
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {swarms.length === 0 ? (
                <>
                  <button
                    onClick={() => navigate('/swarm/requests')}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    📋 View Requests
                  </button>
                  <button
                    onClick={handleRetry}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                  >
                    🔄 Refresh
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
        /* Swarm Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSwarms.map((swarm) => (
            <div
              key={swarm.id}
              className="relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-3 transition-all duration-200 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600"
            >
              {/* Header with title and status */}
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 flex-1 mr-2">
                  {swarm.name}
                </h2>
                <div className="flex items-center gap-2">
                  <StatusBadge status={swarm.status} />
                  <button
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
                    onClick={() => {
                      setAnchorEl(swarm.id);
                      setSelectedSwarm(swarm);
                    }}
                    disabled={actionLoading}
                  >
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>
              
              {/* Swarm information */}
              <div className="space-y-2 text-sm flex-1">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-500">Devices:</span>
                  <span className="text-gray-900 dark:text-gray-100 font-medium">
                    {swarm.devices}/{swarm.maxDevices}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-500">Created:</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {swarm.createdAt}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-500">Last activity:</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {swarm.lastActivity || 'N/A'}
                  </span>
                </div>
                {swarm.description && (
                  <div className="pt-2">
                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                      {swarm.description}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Main action button */}
              <button
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                onClick={() => navigate(`/swarm/SwarmDetail/${swarm.id}`)}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Loading...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    👁️ View Details
                  </span>
                )}
              </button>
              
              {/* Dropdown menu */}
              {anchorEl === swarm.id && (
                <div
                  ref={menuRef}
                  className="absolute right-8 top-12 mt-2 w-40 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl dark:shadow-gray-900/50 z-20 py-1"
                >
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm transition-colors"
                    onClick={() => navigate(`/swarm/EditSwarm/${swarm.id}`)}
                    disabled={actionLoading}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm transition-colors"
                    onClick={() => handleDuplicate(swarm)}
                    disabled={actionLoading}
                  >
                    📋 Duplicate
                  </button>
                  <hr className="my-1 border-gray-200 dark:border-gray-600" />
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 text-sm transition-colors"
                    onClick={() => handleDelete(swarm.id)}
                    disabled={actionLoading}
                  >
                    🗑️ Delete
                  </button>
                  <hr className="my-1 border-gray-200 dark:border-gray-600" />
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm transition-colors"
                    onClick={() => setAnchorEl(null)}
                  >
                    ✕ Close
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}