
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../services/api";
import SupervisorSidebar from "../components/SupervisorSidebar";
import LogoutModal from "../components/LogoutModal";
import { useTheme } from "../context/ThemeContext";

function SupervisorComplaints() {
  const location = useLocation();
  const { darkMode } = useTheme();

  const [complaints, setComplaints] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assigningId, setAssigningId] = useState(null);

  const [selectedTechnician, setSelectedTechnician] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [showLogout, setShowLogout] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [expandedComplaintId, setExpandedComplaintId] = useState(null);

  const selectedComplaintId = location.state?.complaintId || null;

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const assignedBlocks = user?.assignedBlocks || [];

  // --------------------------------------------------
  // THEME CLASSES
  // --------------------------------------------------

  const surface = darkMode
    ? "border-slate-700 bg-slate-800"
    : "border-slate-200 bg-white";

  const mutedSurface = darkMode
    ? "border-slate-700 bg-slate-900"
    : "border-slate-200 bg-slate-50";

  const headingText = darkMode
    ? "text-slate-100"
    : "text-slate-900";

  const bodyText = darkMode
    ? "text-slate-300"
    : "text-slate-700";

  const secondaryText = darkMode
    ? "text-slate-400"
    : "text-slate-500";

  const inputClass = darkMode
    ? "border-slate-600 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
    : "border-slate-200 bg-slate-50 text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100";

  // --------------------------------------------------
  // FETCH COMPLAINTS
  // --------------------------------------------------

  const fetchComplaints = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setErrorMessage("");

      const response = await api.get("/supervisor/complaints");

      setComplaints(response.data.complaints || []);
    } catch (error) {
      console.error("FETCH SUPERVISOR COMPLAINTS ERROR:", error);

      setErrorMessage(
        error.response?.data?.message ||
        "Failed to load complaints."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // --------------------------------------------------
  // FETCH TECHNICIANS
  // --------------------------------------------------

  const fetchTechnicians = async () => {
    try {
      const response = await api.get("/supervisor/technicians");

      setTechnicians(response.data.technicians || []);
    } catch (error) {
      console.error("FETCH TECHNICIANS ERROR:", error);

      setErrorMessage(
        error.response?.data?.message ||
        "Failed to load technicians."
      );
    }
  };

  useEffect(() => {
    fetchComplaints();
    fetchTechnicians();
  }, []);

  // --------------------------------------------------
  // SPECIALIZATION MAPPING
  // --------------------------------------------------

  const specializationMap = {
    Computer: "Computer Technician",
    Fan: "Electrician",
    Light: "Electrician",
    AC: "AC Technician",
    Door: "Carpenter",
    Furniture: "Carpenter",
  };

  const getTechniciansForComplaint = (category) => {
    const requiredSpecialization = specializationMap[category];

    if (!requiredSpecialization) {
      return technicians;
    }

    return technicians.filter(
      (technician) =>
        technician.specialization === requiredSpecialization
    );
  };

  // --------------------------------------------------
  // ASSIGN TECHNICIAN
  // --------------------------------------------------

  const handleAssignTechnician = async (complaintId) => {
    const technicianId = selectedTechnician[complaintId];

    if (!technicianId) {
      setErrorMessage("Please select a technician first.");
      return;
    }

    try {
      setAssigningId(complaintId);
      setMessage("");
      setErrorMessage("");

      const response = await api.patch(
        `/supervisor/complaints/${complaintId}/assign-technician`,
        { technicianId }
      );

      setMessage(
        response.data.message ||
        "Technician assigned successfully."
      );

      await fetchComplaints();

      setSelectedTechnician((previous) => {
        const updated = { ...previous };
        delete updated[complaintId];
        return updated;
      });
    } catch (error) {
      console.error("ASSIGN TECHNICIAN ERROR:", error);

      setErrorMessage(
        error.response?.data?.message ||
        "Failed to assign technician."
      );
    } finally {
      setAssigningId(null);
    }
  };

  // --------------------------------------------------
  // FILTER COMPLAINTS
  // --------------------------------------------------

  const filteredComplaints = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return complaints.filter((complaint) => {
      const matchesSearch =
        !search ||
        complaint.block?.toLowerCase().includes(search) ||
        complaint.floor?.toString().toLowerCase().includes(search) ||
        complaint.room?.toString().toLowerCase().includes(search) ||
        complaint.category?.toLowerCase().includes(search) ||
        complaint.description?.toLowerCase().includes(search) ||
        complaint.technician?.name?.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "All" ||
        complaint.status === statusFilter;

      const matchesPriority =
        priorityFilter === "All" ||
        complaint.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [complaints, searchTerm, statusFilter, priorityFilter]);

  // --------------------------------------------------
  // SINGLE SELECTED COMPLAINT
  // --------------------------------------------------

  const visibleComplaints = useMemo(() => {
    if (!selectedComplaintId) {
      return filteredComplaints;
    }

    return complaints.filter(
      (complaint) => complaint._id === selectedComplaintId
    );
  }, [complaints, filteredComplaints, selectedComplaintId]);

  // --------------------------------------------------
  // STATISTICS
  // --------------------------------------------------

  const totalComplaints = complaints.length;

  const pendingComplaints = complaints.filter(
    (complaint) =>
      complaint.status === "Pending" || !complaint.technician
  ).length;

  const activeComplaints = complaints.filter(
    (complaint) =>
      complaint.status === "Assigned" ||
      complaint.status === "In Progress"
  ).length;

  const resolvedComplaints = complaints.filter(
    (complaint) => complaint.status === "Resolved"
  ).length;

  const highPriorityComplaints = complaints.filter(
    (complaint) => complaint.priority === "High"
  ).length;

  // --------------------------------------------------
  // STATUS COLORS
  // --------------------------------------------------

  const getStatusColor = (status) => {
    const colors = {
      Pending: darkMode
        ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
        : "border-amber-200 bg-amber-50 text-amber-700",

      Assigned: darkMode
        ? "border-blue-500/30 bg-blue-500/10 text-blue-300"
        : "border-blue-200 bg-blue-50 text-blue-700",

      "In Progress": darkMode
        ? "border-violet-500/30 bg-violet-500/10 text-violet-300"
        : "border-violet-200 bg-violet-50 text-violet-700",

      Resolved: darkMode
        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
        : "border-emerald-200 bg-emerald-50 text-emerald-700",
    };

    return colors[status] || (
      darkMode
        ? "border-slate-600 bg-slate-700 text-slate-300"
        : "border-slate-200 bg-slate-50 text-slate-700"
    );
  };

  // --------------------------------------------------
  // PRIORITY COLORS
  // --------------------------------------------------

  const getPriorityColor = (priority) => {
    const colors = {
      High: darkMode
        ? "border-red-500/30 bg-red-500/10 text-red-300"
        : "border-red-200 bg-red-50 text-red-700",

      Medium: darkMode
        ? "border-orange-500/30 bg-orange-500/10 text-orange-300"
        : "border-orange-200 bg-orange-50 text-orange-700",

      Low: darkMode
        ? "border-green-500/30 bg-green-500/10 text-green-300"
        : "border-green-200 bg-green-50 text-green-700",
    };

    return colors[priority] || (
      darkMode
        ? "border-slate-600 bg-slate-700 text-slate-300"
        : "border-slate-200 bg-slate-50 text-slate-700"
    );
  };

  // --------------------------------------------------
  // DATE FORMAT
  // --------------------------------------------------

  const formatDateTime = (date) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // --------------------------------------------------
  // FILTER COUNT
  // --------------------------------------------------

  const getFilterCount = (filter) => {
    if (filter === "All") return complaints.length;

    if (filter === "Pending") return pendingComplaints;

    if (filter === "Assigned") {
      return complaints.filter(
        (complaint) => complaint.status === "Assigned"
      ).length;
    }

    if (filter === "In Progress") {
      return complaints.filter(
        (complaint) => complaint.status === "In Progress"
      ).length;
    }

    if (filter === "Resolved") return resolvedComplaints;

    return 0;
  };

  // --------------------------------------------------
  // BACK TO ALL COMPLAINTS
  // --------------------------------------------------

  const handleBackToAll = () => {
    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );

    window.location.reload();
  };

  // --------------------------------------------------
  // READ MORE
  // --------------------------------------------------

  const toggleDescription = (complaintId) => {
    setExpandedComplaintId((previous) =>
      previous === complaintId ? null : complaintId
    );
  };

  // --------------------------------------------------
  // STAT CARD
  // --------------------------------------------------

  const StatCard = ({ title, value, icon, color, iconBg }) => (
    <div
      className={`group rounded-2xl border p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg ${surface}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-xs font-bold uppercase tracking-wider ${secondaryText}`}>
            {title}
          </p>

          <p className={`mt-2 text-3xl font-black ${color}`}>
            {value}
          </p>
        </div>

        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl ${iconBg}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      <SupervisorSidebar
        onLogout={() => setShowLogout(true)}
      />

      <main className="min-h-screen lg:ml-72">
        <div className="p-4 sm:p-6 lg:p-8">

          {/* HEADER */}

          <section className="relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 p-6 text-white shadow-xl sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 right-1/3 h-48 w-48 rounded-full bg-violet-300/20 blur-3xl" />

            <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
                  Supervisor Operations
                </div>

                <h1 className="text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
                  Complaint Management
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100">
                  Review maintenance complaints, inspect reported issues
                  and assign the right technician to resolve them.
                </p>
              </div>

              <div className="min-w-52 rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-md">
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">
                  Supervisor Access
                </p>

                <p className="mt-2 text-xl font-black">
                  {assignedBlocks.length
                    ? assignedBlocks.join(", ")
                    : "All Campus"}
                </p>

                <div className="mt-3 flex items-center gap-2 text-xs text-indigo-100">
                  <span className="h-2 w-2 rounded-full bg-emerald-300" />
                  {totalComplaints} total complaints
                </div>
              </div>
            </div>
          </section>

          {/* SELECTED COMPLAINT BANNER */}

          {selectedComplaintId && (
            <div
              className={`mb-6 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
                darkMode
                  ? "border-indigo-500/30 bg-indigo-500/10"
                  : "border-indigo-200 bg-indigo-50"
              }`}
            >
              <div>
                <p className={`text-sm font-black ${darkMode ? "text-indigo-200" : "text-indigo-900"}`}>
                  Viewing Selected Complaint
                </p>

                <p className={`mt-1 text-xs ${darkMode ? "text-indigo-300" : "text-indigo-700"}`}>
                  You opened this complaint from the dashboard or notification.
                </p>
              </div>

              <button
                type="button"
                onClick={handleBackToAll}
                className="w-fit rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-indigo-700"
              >
                ← Back to All Complaints
              </button>
            </div>
          )}

          {/* SUCCESS MESSAGE */}

          {message && (
            <div className={`mb-5 flex items-center gap-3 rounded-2xl border p-4 text-sm font-semibold ${
              darkMode
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15">
                ✓
              </span>
              <span>{message}</span>

              <button
                type="button"
                onClick={() => setMessage("")}
                className="ml-auto"
              >
                ✕
              </button>
            </div>
          )}

          {/* ERROR MESSAGE */}

          {errorMessage && (
            <div className={`mb-5 flex items-center gap-3 rounded-2xl border p-4 text-sm font-semibold ${
              darkMode
                ? "border-red-500/30 bg-red-500/10 text-red-300"
                : "border-red-200 bg-red-50 text-red-700"
            }`}>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/15">
                !
              </span>

              <span>{errorMessage}</span>

              <button
                type="button"
                onClick={() => setErrorMessage("")}
                className="ml-auto"
              >
                ✕
              </button>
            </div>
          )}

          {/* STATISTICS */}

          {!selectedComplaintId && (
            <section className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <StatCard
                title="Total Complaints"
                value={totalComplaints}
                icon="📋"
                color={headingText}
                iconBg={darkMode ? "bg-indigo-500/15" : "bg-indigo-50"}
              />

              <StatCard
                title="Pending"
                value={pendingComplaints}
                icon="⏳"
                color="text-amber-500"
                iconBg={darkMode ? "bg-amber-500/15" : "bg-amber-50"}
              />

              <StatCard
                title="Active"
                value={activeComplaints}
                icon="🔧"
                color="text-violet-500"
                iconBg={darkMode ? "bg-violet-500/15" : "bg-violet-50"}
              />

              <StatCard
                title="Resolved"
                value={resolvedComplaints}
                icon="✓"
                color="text-emerald-500"
                iconBg={darkMode ? "bg-emerald-500/15" : "bg-emerald-50"}
              />

              <StatCard
                title="High Priority"
                value={highPriorityComplaints}
                icon="⚠️"
                color="text-red-500"
                iconBg={darkMode ? "bg-red-500/15" : "bg-red-50"}
              />
            </section>
          )}

          {/* SEARCH AND FILTERS */}

          {!selectedComplaintId && (
            <section className={`mb-7 rounded-2xl border p-4 shadow-sm sm:p-5 ${surface}`}>
              <div className="mb-5">
                <h2 className={`text-base font-black ${headingText}`}>
                  Find Complaints
                </h2>

                <p className={`mt-1 text-xs ${secondaryText}`}>
                  Search and filter maintenance complaints.
                </p>
              </div>

              <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_auto]">
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    🔎
                  </span>

                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search block, floor, room, category..."
                    className={`w-full rounded-xl border py-3 pl-11 pr-4 text-sm outline-none transition ${inputClass}`}
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold outline-none transition ${inputClass}`}
                >
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold outline-none transition ${inputClass}`}
                >
                  <option value="All">All Priority</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>

                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("All");
                    setPriorityFilter("All");
                  }}
                  className={`rounded-xl border px-5 py-3 text-sm font-bold transition ${
                    darkMode
                      ? "border-slate-600 bg-slate-700 text-slate-200 hover:bg-slate-600"
                      : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                  }`}
                >
                  Reset Filters
                </button>
              </div>

              <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
                {[
                  "All",
                  "Pending",
                  "Assigned",
                  "In Progress",
                  "Resolved",
                ].map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setStatusFilter(filter)}
                    className={`whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-bold transition ${
                      statusFilter === filter
                        ? "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                        : darkMode
                          ? "border-slate-700 bg-slate-900 text-slate-300 hover:border-indigo-500"
                          : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50"
                    }`}
                  >
                    {filter}

                    <span className={`ml-1.5 rounded-md px-1.5 py-0.5 text-[10px] ${
                      statusFilter === filter
                        ? "bg-white/20"
                        : darkMode
                          ? "bg-slate-700"
                          : "bg-slate-100"
                    }`}>
                      {getFilterCount(filter)}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* COMPLAINT LIST TITLE */}

          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className={`text-xl font-black ${headingText}`}>
                {selectedComplaintId
                  ? "Complaint Details"
                  : "Maintenance Complaints"}
              </h2>

              <p className={`mt-1 text-xs ${secondaryText}`}>
                {selectedComplaintId
                  ? "Detailed view of the selected maintenance complaint."
                  : `Showing ${visibleComplaints.length} of ${totalComplaints} complaints`}
              </p>
            </div>

            {!selectedComplaintId && (
              <button
                type="button"
                disabled={refreshing}
                onClick={() => {
                  fetchComplaints(true);
                  fetchTechnicians();
                }}
                className={`w-fit rounded-xl border px-4 py-2.5 text-xs font-black transition disabled:opacity-60 ${
                  darkMode
                    ? "border-slate-700 bg-slate-800 text-slate-200 hover:border-indigo-500 hover:text-indigo-300"
                    : "border-slate-200 bg-white text-slate-700 shadow-sm hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                }`}
              >
                {refreshing ? "↻ Refreshing..." : "↻ Refresh"}
              </button>
            )}
          </div>

          {/* LOADING */}

          {loading ? (
            <div className={`rounded-3xl border p-14 text-center shadow-sm ${surface}`}>
              <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-slate-300 border-t-indigo-600" />

              <p className={`mt-5 text-sm font-bold ${headingText}`}>
                Loading complaints...
              </p>

              <p className={`mt-1 text-xs ${secondaryText}`}>
                Fetching current maintenance operations.
              </p>
            </div>
          ) : visibleComplaints.length === 0 ? (
            /* EMPTY STATE */

            <div className={`rounded-3xl border border-dashed p-14 text-center shadow-sm ${surface}`}>
              <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-3xl ${
                darkMode ? "bg-slate-700" : "bg-slate-100"
              }`}>
                📋
              </div>

              <h2 className={`mt-5 text-lg font-black ${headingText}`}>
                {selectedComplaintId
                  ? "Complaint not found"
                  : "No complaints found"}
              </h2>

              <p className={`mx-auto mt-2 max-w-md text-sm leading-6 ${secondaryText}`}>
                {selectedComplaintId
                  ? "This complaint may no longer be available or you may not have access to it."
                  : "No complaints match your current search and filter settings."}
              </p>

              {selectedComplaintId && (
                <button
                  type="button"
                  onClick={handleBackToAll}
                  className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-black text-white hover:bg-indigo-700"
                >
                  ← Back to All Complaints
                </button>
              )}
            </div>
          ) : (
            /* COMPLAINT CARDS */

            <div className={
              selectedComplaintId
                ? "mx-auto max-w-4xl"
                : "grid gap-5 xl:grid-cols-2"
            }>
              {visibleComplaints.map((complaint) => {
                const categoryTechnicians =
                  getTechniciansForComplaint(complaint.category);

                const isResolved = complaint.status === "Resolved";

                const currentTechnician =
                  complaint.technician?._id || "";

                const selectedValue =
                  selectedTechnician[complaint._id] ||
                  currentTechnician;

                const requiredSkill =
                  specializationMap[complaint.category] ||
                  "General Technician";

                const isExpanded =
                  expandedComplaintId === complaint._id;

                const description =
                  complaint.description ||
                  "No description provided.";

                return (
                  <article
                    id={`complaint-${complaint._id}`}
                    key={complaint._id}
                    className={`overflow-hidden rounded-3xl border shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-xl ${
                      darkMode
                        ? "border-slate-700 bg-slate-800 hover:border-indigo-500/50"
                        : "border-slate-200 bg-white hover:border-indigo-200"
                    }`}
                  >
                    {/* CARD HEADER */}

                    <div className={`border-b p-4 sm:p-5 ${
                      darkMode
                        ? "border-slate-700 bg-slate-900/70"
                        : "border-slate-100 bg-slate-50"
                    }`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap gap-2">
                            <span className={`rounded-lg px-2.5 py-1 text-[11px] font-black ${
                              darkMode
                                ? "bg-indigo-500/15 text-indigo-300"
                                : "bg-indigo-100 text-indigo-700"
                            }`}>
                              {complaint.category}
                            </span>

                            <span className={`rounded-lg border px-2.5 py-1 text-[11px] font-black ${getPriorityColor(complaint.priority)}`}>
                              {complaint.priority || "Normal"}
                            </span>

                            <span className={`rounded-lg border px-2.5 py-1 text-[11px] font-black ${getStatusColor(complaint.status)}`}>
                              {complaint.status}
                            </span>
                          </div>

                          <h3 className={`mt-3 text-base font-black ${headingText}`}>
                            {complaint.category} Maintenance
                          </h3>

                          <p className={`mt-1 text-xs font-semibold ${secondaryText}`}>
                            ID: {complaint._id?.slice(-10)}
                          </p>
                        </div>

                        <div className={`shrink-0 rounded-xl border px-3 py-2 text-right ${
                          darkMode
                            ? "border-slate-600 bg-slate-800"
                            : "border-slate-200 bg-white"
                        }`}>
                          <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">
                            Location
                          </p>

                          <p className={`mt-1 text-xs font-black ${bodyText}`}>
                            {complaint.block || "N/A"}
                            {complaint.floor ? ` • F${complaint.floor}` : ""}
                            {complaint.room ? ` • R${complaint.room}` : ""}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* CARD BODY */}

                    <div className="p-4 sm:p-5">
                      {/* IMAGE + DESCRIPTION */}

                      <div className={
                        selectedComplaintId
                          ? "flex flex-col gap-5"
                          : "flex gap-4"
                      }>
                        <div className={
                          selectedComplaintId
                            ? "w-full"
                            : "w-28 shrink-0 sm:w-32"
                        }>
                          {complaint.image ? (
                            <button
                              type="button"
                              onClick={() => setPreviewImage(complaint.image)}
                              className={`group relative block w-full overflow-hidden rounded-2xl border ${
                                darkMode
                                  ? "border-slate-600 bg-slate-700"
                                  : "border-slate-200 bg-slate-100"
                              } ${
                                selectedComplaintId
                                  ? "h-64 sm:h-80"
                                  : "h-28 sm:h-32"
                              }`}
                              title="View complaint photo"
                            >
                              <img
                                src={complaint.image}
                                alt="Complaint"
                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                              />

                              <span className="absolute bottom-2 right-2 rounded-lg bg-black/70 px-2 py-1 text-[9px] font-bold text-white">
                                View Photo
                              </span>
                            </button>
                          ) : (
                            <div className={`flex w-full items-center justify-center rounded-2xl border border-dashed text-3xl ${
                              darkMode
                                ? "border-slate-600 bg-slate-900"
                                : "border-slate-300 bg-slate-50"
                            } ${
                              selectedComplaintId
                                ? "h-64 sm:h-80"
                                : "h-28 sm:h-32"
                            }`}>
                              🧰
                            </div>
                          )}

                          <p className="mt-2 text-center text-[9px] font-bold uppercase tracking-wide text-slate-400">
                            Complaint Photo
                          </p>
                        </div>

                        {/* DESCRIPTION */}

                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Issue Description
                          </p>

                          <p className={`mt-2 text-sm leading-6 ${bodyText} ${
                            isExpanded ? "" : "line-clamp-4"
                          }`}>
                            {description}
                          </p>

                          {description.length > 180 && (
                            <button
                              type="button"
                              onClick={() => toggleDescription(complaint._id)}
                              className="mt-2 text-xs font-black text-indigo-500 hover:text-indigo-400 hover:underline"
                            >
                              {isExpanded ? "Read Less ↑" : "Read More →"}
                            </button>
                          )}

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className={`rounded-lg px-2.5 py-1 text-[10px] font-bold ${
                              darkMode
                                ? "bg-slate-700 text-slate-300"
                                : "bg-slate-100 text-slate-600"
                            }`}>
                              📍 {complaint.block || "Block N/A"}
                            </span>

                            {complaint.floor && (
                              <span className={`rounded-lg px-2.5 py-1 text-[10px] font-bold ${
                                darkMode
                                  ? "bg-slate-700 text-slate-300"
                                  : "bg-slate-100 text-slate-600"
                              }`}>
                                🏢 Floor {complaint.floor}
                              </span>
                            )}

                            {complaint.room && (
                              <span className={`rounded-lg px-2.5 py-1 text-[10px] font-bold ${
                                darkMode
                                  ? "bg-slate-700 text-slate-300"
                                  : "bg-slate-100 text-slate-600"
                              }`}>
                                🚪 Room {complaint.room}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* COMPLETION PHOTO */}

                      {complaint.completionImage && (
                        <div className={`mt-4 rounded-2xl border p-3 ${
                          darkMode
                            ? "border-emerald-500/30 bg-emerald-500/10"
                            : "border-emerald-200 bg-emerald-50"
                        }`}>
                          <div className="flex items-center justify-between gap-3">
                            <p className={`text-[10px] font-black uppercase tracking-wide ${
                              darkMode ? "text-emerald-300" : "text-emerald-700"
                            }`}>
                              ✓ Completion Photo
                            </p>

                            <button
                              type="button"
                              onClick={() => setPreviewImage(complaint.completionImage)}
                              className={`text-[10px] font-black hover:underline ${
                                darkMode ? "text-emerald-300" : "text-emerald-700"
                              }`}
                            >
                              View Photo
                            </button>
                          </div>
                        </div>
                      )}

                      {/* TECHNICIAN ASSIGNMENT */}

                      <div className={`mt-5 rounded-2xl border p-4 ${
                        darkMode
                          ? "border-indigo-500/30 bg-indigo-500/5"
                          : "border-indigo-100 bg-indigo-50/60"
                      }`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-wide text-indigo-500">
                              Technician Assignment
                            </p>

                            <h4 className={`mt-1 text-sm font-black ${headingText}`}>
                              {complaint.technician
                                ? "Current Technician"
                                : "Needs Technician"}
                            </h4>
                          </div>

                          <div className={`rounded-xl px-3 py-2 text-center shadow-sm ${
                            darkMode ? "bg-slate-700" : "bg-white"
                          }`}>
                            <p className="text-sm font-black text-indigo-500">
                              {categoryTechnicians.length}
                            </p>

                            <p className="text-[8px] font-black uppercase tracking-wide text-slate-400">
                              Qualified
                            </p>
                          </div>
                        </div>

                        {complaint.technician && (
                          <div className={`mt-3 flex items-center justify-between gap-3 rounded-xl border p-3 ${
                            darkMode
                              ? "border-slate-600 bg-slate-800"
                              : "border-blue-100 bg-white"
                          }`}>
                            <div className="flex min-w-0 items-center gap-3">
                              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm ${
                                darkMode ? "bg-blue-500/15" : "bg-blue-100"
                              }`}>
                                🛠️
                              </div>

                              <div className="min-w-0">
                                <p className={`truncate text-xs font-black ${headingText}`}>
                                  {complaint.technician.name}
                                </p>

                                <p className={`mt-0.5 truncate text-[10px] font-semibold ${secondaryText}`}>
                                  {complaint.technician.specialization}
                                </p>
                              </div>
                            </div>

                            <span className={`shrink-0 rounded-lg px-2 py-1 text-[9px] font-black ${
                              darkMode
                                ? "bg-blue-500/15 text-blue-300"
                                : "bg-blue-50 text-blue-700"
                            }`}>
                              Assigned
                            </span>
                          </div>
                        )}

                        {isResolved ? (
                          <div className={`mt-3 rounded-xl border p-3 ${
                            darkMode
                              ? "border-emerald-500/30 bg-emerald-500/10"
                              : "border-emerald-200 bg-emerald-50"
                          }`}>
                            <p className={`text-xs font-black ${
                              darkMode ? "text-emerald-300" : "text-emerald-700"
                            }`}>
                              ✓ Complaint Resolved
                            </p>

                            <p className={`mt-1 text-[10px] leading-4 ${
                              darkMode ? "text-emerald-400" : "text-emerald-600"
                            }`}>
                              This complaint is completed and cannot be reassigned.
                            </p>
                          </div>
                        ) : (
                          <div className="mt-4">
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                              <label className={`text-xs font-black ${bodyText}`}>
                                Select Technician
                              </label>

                              <span className="text-[10px] font-bold text-indigo-500">
                                Required: {requiredSkill}
                              </span>
                            </div>

                            <select
                              value={selectedValue}
                              onChange={(e) =>
                                setSelectedTechnician((previous) => ({
                                  ...previous,
                                  [complaint._id]: e.target.value,
                                }))
                              }
                              className={`w-full rounded-xl border px-3 py-3 text-xs font-semibold outline-none transition ${
                                darkMode
                                  ? "border-slate-600 bg-slate-900 text-slate-100 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                                  : "border-slate-200 bg-white text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                              }`}
                            >
                              <option value="">
                                Select qualified technician
                              </option>

                              {categoryTechnicians.map((technician) => (
                                <option
                                  key={technician._id}
                                  value={technician._id}
                                >
                                  {technician.name} — {technician.specialization}
                                </option>
                              ))}
                            </select>

                            {categoryTechnicians.length === 0 && (
                              <div className={`mt-2 rounded-xl border p-3 ${
                                darkMode
                                  ? "border-amber-500/30 bg-amber-500/10"
                                  : "border-amber-200 bg-amber-50"
                              }`}>
                                <p className={`text-[10px] font-bold leading-4 ${
                                  darkMode ? "text-amber-300" : "text-amber-700"
                                }`}>
                                  No qualified technician is currently available for this complaint category.
                                </p>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => handleAssignTechnician(complaint._id)}
                              disabled={
                                !selectedValue ||
                                assigningId === complaint._id ||
                                categoryTechnicians.length === 0
                              }
                              className="mt-3 w-full rounded-xl bg-indigo-600 px-4 py-3 text-xs font-black text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-500 disabled:shadow-none"
                            >
                              {assigningId === complaint._id
                                ? "Assigning Technician..."
                                : complaint.technician
                                  ? "Reassign Technician"
                                  : "Assign Technician"}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* TIMELINE */}

                      <div className={`mt-5 rounded-2xl border p-4 ${mutedSurface}`}>
                        <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                          Complaint Timeline
                        </p>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          {[
                            {
                              title: "Created",
                              date: complaint.createdAt,
                              color: "bg-indigo-500",
                            },
                            {
                              title: "Supervisor Assigned",
                              date: complaint.assignedAt,
                              color: "bg-blue-500",
                            },
                            {
                              title: "Technician Assigned",
                              date: complaint.technicianAssignedAt,
                              color: "bg-violet-500",
                            },
                            {
                              title: "Resolved",
                              date: complaint.resolvedAt,
                              color: "bg-emerald-500",
                            },
                          ].map((item) => (
                            <div key={item.title} className="flex gap-3">
                              <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${item.color}`} />

                              <div>
                                <p className={`text-[10px] font-black ${bodyText}`}>
                                  {item.title}
                                </p>

                                <p className={`mt-0.5 text-[9px] ${secondaryText}`}>
                                  {formatDateTime(item.date)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* BACK BUTTON */}

                      {selectedComplaintId && (
                        <button
                          type="button"
                          onClick={handleBackToAll}
                          className={`mt-5 w-full rounded-xl border px-4 py-3 text-xs font-black transition ${
                            darkMode
                              ? "border-slate-600 bg-slate-700 text-slate-200 hover:border-indigo-500 hover:text-indigo-300"
                              : "border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                          }`}
                        >
                          ← Back to All Complaints
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* IMAGE PREVIEW MODAL */}

      {previewImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className={`relative max-h-[90vh] max-w-5xl overflow-hidden rounded-2xl p-2 shadow-2xl ${
              darkMode ? "bg-slate-800" : "bg-white"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-lg font-bold text-white transition hover:bg-black"
              aria-label="Close image preview"
            >
              ✕
            </button>

            <img
              src={previewImage}
              alt="Complaint preview"
              className="max-h-[85vh] max-w-full rounded-xl object-contain"
            />
          </div>
        </div>
      )}

      {/* LOGOUT MODAL */}

      {showLogout && (
        <LogoutModal
          onClose={() => setShowLogout(false)}
        />
      )}
    </div>
  );
}

export default SupervisorComplaints;
