import { useEffect, useState, useRef } from "react";
import { MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import StatusBadge from "../components/StatusBadge";

const statusOptions = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "error", label: "Error" },
];

const orderOptions = [
  { value: "name", label: "Name" },
  { value: "createdAt", label: "Creation date" },
  { value: "status", label: "Status" },
  { value: "lastActivity", label: "Last activity" },
];

const API_BASE = "http://localhost:5052";

// Solo traer swarms con status 'assigned'
const fetchSwarms = async () => {
  const res = await fetch(`${API_BASE}/swarms?status=assigned`);
  if (!res.ok) throw new Error("Error al obtener swarms");
  const json = await res.json();
  return (
    json.data?.swarms?.map((s) => ({
      id: s.id,
      name: s.name,
      status: s.status,
      devices: Array.isArray(s.devices) ? s.devices.length : 0,
      maxDevices: s.maxDevices || 0,
      createdAt: s.created_at ? s.created_at.substring(0, 10) : "",
      lastActivity: s.lastActivity ? s.lastActivity.substring(0, 10) : "",
    })) || []
  );
};

const deleteSwarm = async (id) => {
  const res = await fetch(`${API_BASE}/swarms/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar swarm");
  return true;
};

const duplicateSwarm = async (swarm) => {
  const body = {
    name: `${swarm.name} (Copy)`,
    description: swarm.description || "",
    maxDevices: swarm.maxDevices,
    requesterId: swarm.requesterId,
  };
  const res = await fetch(`${API_BASE}/swarms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Error al duplicar swarm");
  const json = await res.json();
  return json.data?.swarm;
};

export default function MySwarmCatalog() {
  const navigate = useNavigate();
  const [swarms, setSwarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [orderBy, setOrderBy] = useState("name");
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedSwarm, setSelectedSwarm] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetchSwarms()
      .then((data) => {
        setSwarms(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

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

  let filteredSwarms = swarms.filter(
    (s) =>
      (!statusFilter || s.status === statusFilter) &&
      (!search || s.name.toLowerCase().includes(search.toLowerCase())) &&
      (!dateFilter || s.createdAt === dateFilter)
  );

  filteredSwarms = filteredSwarms.sort((a, b) => {
    if (orderBy === "name") {
      return a.name.localeCompare(b.name);
    }
    if (orderBy === "createdAt") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    if (orderBy === "status") {
      return a.status.localeCompare(b.status);
    }
    if (orderBy === "lastActivity") {
      return new Date(b.lastActivity) - new Date(a.lastActivity);
    }
    return 0;
  });

  const handleDelete = async (id) => {
    setLoading(true);
    setError(false);
    try {
      await deleteSwarm(id);
      setSwarms((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setError(true);
    }
    setLoading(false);
    setAnchorEl(null);
  };

  const handleDuplicate = async (swarm) => {
    setLoading(true);
    setError(false);
    try {
      const newSwarm = await duplicateSwarm(swarm);
      setSwarms((prev) => [
        ...prev,
        {
          id: newSwarm.id,
          name: newSwarm.name,
          status: newSwarm.status,
          devices: 0,
          maxDevices: newSwarm.maxDevices,
          createdAt: newSwarm.createdAt?.substring(0, 10) || "",
          lastActivity: "",
        },
      ]);
    } catch {
      setError(true);
    }
    setLoading(false);
    setAnchorEl(null);
  };

  if (loading) {
    return <LoadingSpinner message="Loading swarm catalog..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        error="Failed to load swarm catalog."
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (swarms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
          You have no swarms in your catalog
        </p>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors">
          View requests
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="mb-4 lg:mb-0">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            My Swarm Catalog ({filteredSwarms.length})
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Manage and monitor all your swarms in one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 w-full lg:w-auto lg:ml-auto justify-end">
          <select
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
          <input
            type="text"
            placeholder="Search by name"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700"
            value={orderBy}
            onChange={(e) => setOrderBy(e.target.value)}
          >
            {orderOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                Order by {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Swarm Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSwarms.map((swarm) => (
          <div
            key={swarm.id}
            className="relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 flex flex-col gap-2 transition-shadow"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                {swarm.name}
              </h2>
              <StatusBadge status={swarm.status} />
              <button
                className="ml-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                onClick={() => {
                  setAnchorEl(swarm.id);
                  setSelectedSwarm(swarm);
                }}
              >
                <MoreVertical size={16} />
              </button>
            </div>
            <div className="text-gray-500 dark:text-gray-400 text-sm">
              {swarm.devices}/{swarm.maxDevices} devices
            </div>
            <div className="text-gray-500 dark:text-gray-400 text-sm">
              Created: {swarm.createdAt}
            </div>
            <div className="text-gray-500 dark:text-gray-400 text-sm">
              Last activity: {swarm.lastActivity}
            </div>
            <div className="flex justify-center gap-2 mt-3 ">
              <button
                className="px-20 py-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                onClick={() => {
                  navigate(`/swarm/SwarmDetail/${swarm.id}`);
                }}
              >
                View Detail
              </button>
            </div>
            {/* Simple dropdown menu */}
            {anchorEl === swarm.id && (
              <div
                ref={menuRef}
                className="absolute right-8 mt-2 w-32 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded shadow-lg dark:shadow-gray-900/50 z-10"
              >
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  onClick={() => handleDelete(swarm.id)}
                >
                  Delete
                </button>
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  onClick={() => handleDuplicate(swarm)}
                >
                  Duplicate
                </button>
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  onClick={() => setAnchorEl(null)}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}