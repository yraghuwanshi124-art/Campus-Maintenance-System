"use client";

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
  const [deadlineSavingId, setDeadlineSavingId] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);

  const [selectedTechnician, setSelectedTechnician] = useState({});
  const [assignmentReasons, setAssignmentReasons] = useState({});
  const [deadlineValues, setDeadlineValues] = useState({});
  const [deadlineReasons, setDeadlineReasons] = useState({});
  const [useSuggestedDeadline, setUseSuggestedDeadline] = useState({});

  const [verificationRemarks, setVerificationRemarks] = useState({});

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
  // THEME
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
    ? "border-slate-600 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:border-indigo-400"
    : "border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:border-indigo-500";

  // --------------------------------------------------
  // FETCH DATA
  // --------------------------------------------------

  const fetchComplaints = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      setErrorMessage("");

      const response = await api.get("/supervisor/complaints");

      setComplaints(response.data.complaints || []);
    } catch (error) {
      console.error("FETCH COMPLAINTS ERROR:", error);

      setErrorMessage(
        error.response?.data?.message ||
        "Failed to load complaints."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

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
  // SPECIALIZATION
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
    const required = specializationMap[category];

    return technicians.filter((technician) => {
      if (!required) return true;

      return (
        technician.specialization === required ||
        technician.specialization === "General"
      );
    });
  };

  // --------------------------------------------------
  // DATE HELPERS
  // --------------------------------------------------

  const formatDateTime = (date) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const toDateTimeLocal = (date) => {
    if (!date) return "";

    const value = new Date(date);

    const offset = value.getTimezoneOffset() * 60000;

    return new Date(value.getTime() - offset)
      .toISOString()
      .slice(0, 16);
  };

  const getDeadlineState = (complaint) => {
    if (!complaint.deadline) return "Not Set";

    if (complaint.status === "Resolved") return "Completed";

    return new Date(complaint.deadline) < new Date()
      ? "Overdue"
      : "On Track";
  };

  const getRemainingTime = (deadline) => {
    if (!deadline) return "No deadline";

    const difference =
      new Date(deadline).getTime() - Date.now();

    if (difference <= 0) return "Deadline passed";

    const hours = Math.floor(difference / 3600000);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day(s) remaining`;

    if (hours > 0) return `${hours} hour(s) remaining`;

    const minutes = Math.max(
      1,
      Math.floor(difference / 60000)
    );

    return `${minutes} minute(s) remaining`;
  };

  // --------------------------------------------------
  // ASSIGN / REASSIGN TECHNICIAN
  // --------------------------------------------------

  const handleAssignTechnician = async (complaintId) => {
    const technicianId = selectedTechnician[complaintId];
    const reason = assignmentReasons[complaintId]?.trim();

    if (!technicianId) {
      setErrorMessage("Please select a technician.");
      return;
    }

    if (!reason) {
      setErrorMessage("Please enter an assignment reason.");
      return;
    }

    try {
      setAssigningId(complaintId);
      setMessage("");
      setErrorMessage("");

      const response = await api.patch(
        `/supervisor/complaints/${complaintId}/assign-technician`,
        {
          technicianId,
          reason,
        }
      );

      setMessage(
        response.data.message ||
        "Technician assigned successfully."
      );

      setAssignmentReasons((previous) => ({
        ...previous,
        [complaintId]: "",
      }));

      setSelectedTechnician((previous) => ({
        ...previous,
        [complaintId]: "",
      }));

      await Promise.all([
        fetchComplaints(true),
        fetchTechnicians(),
      ]);
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
  // SET / CHANGE DEADLINE
  // --------------------------------------------------

  const handleSetDeadline = async (complaintId) => {
    const useSuggested = !!useSuggestedDeadline[complaintId];
    const deadline = deadlineValues[complaintId];
    const reason = deadlineReasons[complaintId]?.trim();

    if (!useSuggested && !deadline) {
      setErrorMessage("Please select a deadline.");
      return;
    }

    if (!useSuggested && !reason) {
      setErrorMessage(
        "A reason is required when changing the suggested deadline."
      );
      return;
    }

    if (
      !useSuggested &&
      new Date(deadline).getTime() <= Date.now()
    ) {
      setErrorMessage("Deadline must be in the future.");
      return;
    }

    try {
      setDeadlineSavingId(complaintId);
      setMessage("");
      setErrorMessage("");

      const payload = useSuggested
        ? { useSuggestedDeadline: true }
        : {
            deadline: new Date(deadline).toISOString(),
            reason,
          };

      const response = await api.patch(
        `/supervisor/complaints/${complaintId}/deadline`,
        payload
      );

      setMessage(
        response.data.message ||
        "Deadline updated successfully."
      );

      setDeadlineReasons((previous) => ({
        ...previous,
        [complaintId]: "",
      }));

      setDeadlineValues((previous) => ({
        ...previous,
        [complaintId]: "",
      }));

      await fetchComplaints(true);
    } catch (error) {
      console.error("SET DEADLINE ERROR:", error);

      setErrorMessage(
        error.response?.data?.message ||
        "Failed to update deadline."
      );
    } finally {
      setDeadlineSavingId(null);
    }
  };

  // --------------------------------------------------
  // VERIFY COMPLETION
  // --------------------------------------------------

  const handleVerification = async (complaintId, decision) => {
    const remarks =
      verificationRemarks[complaintId]?.trim() || "";

    if (decision === "Rejected" && !remarks) {
      setErrorMessage(
        "Please provide a reason for rejecting the completion."
      );
      return;
    }

    const confirmed = window.confirm(
      decision === "Approved"
        ? "Are you sure you want to approve this completion?"
        : "Are you sure you want to reject this completion?"
    );

    if (!confirmed) return;

    try {
      setVerifyingId(complaintId);
      setMessage("");
      setErrorMessage("");

      const response = await api.patch(
        `/supervisor/complaints/${complaintId}/verify`,
        {
          decision,
          remarks,
        }
      );

      setMessage(
        response.data.message ||
        `Completion ${decision.toLowerCase()} successfully.`
      );

      setVerificationRemarks((previous) => ({
        ...previous,
        [complaintId]: "",
      }));

      await fetchComplaints(true);
    } catch (error) {
      console.error("VERIFICATION ERROR:", error);

      setErrorMessage(
        error.response?.data?.message ||
        "Failed to verify completion."
      );
    } finally {
      setVerifyingId(null);
    }
  };

  // --------------------------------------------------
  // FILTERS
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

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority
      );
    });
  }, [
    complaints,
    searchTerm,
    statusFilter,
    priorityFilter,
  ]);

  const visibleComplaints = useMemo(() => {
    if (!selectedComplaintId) return filteredComplaints;

    return complaints.filter(
      (complaint) => complaint._id === selectedComplaintId
    );
  }, [
    complaints,
    filteredComplaints,
    selectedComplaintId,
  ]);

  // --------------------------------------------------
  // STATISTICS
  // --------------------------------------------------

  const totalComplaints = complaints.length;

  const pendingComplaints = complaints.filter(
    (complaint) =>
      complaint.status === "Pending" ||
      !complaint.technician
  ).length;

  const activeComplaints = complaints.filter(
    (complaint) =>
      complaint.status === "Assigned" ||
      complaint.status === "In Progress"
  ).length;

  const resolvedComplaints = complaints.filter(
    (complaint) => complaint.status === "Resolved"
  ).length;

  const overdueComplaints = complaints.filter(
    (complaint) =>
      complaint.status !== "Resolved" &&
      complaint.deadline &&
      new Date(complaint.deadline) < new Date()
  ).length;

  const awaitingVerification = complaints.filter(
    (complaint) =>
      complaint.verificationStatus === "Pending"
  ).length;

  // --------------------------------------------------
  // COLORS
  // --------------------------------------------------

  const getStatusColor = (status) => {
    const colors = {
      Pending: "border-amber-500/30 bg-amber-500/10 text-amber-500",
      Assigned: "border-blue-500/30 bg-blue-500/10 text-blue-500",
      "In Progress": "border-violet-500/30 bg-violet-500/10 text-violet-500",
      Resolved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
    };

    return colors[status] ||
      "border-slate-500/30 bg-slate-500/10 text-slate-500";
  };

  const getPriorityColor = (priority) => {
    const colors = {
      High: "border-red-500/30 bg-red-500/10 text-red-500",
      Medium: "border-orange-500/30 bg-orange-500/10 text-orange-500",
      Low: "border-green-500/30 bg-green-500/10 text-green-500",
    };

    return colors[priority] ||
      "border-slate-500/30 bg-slate-500/10 text-slate-500";
  };

  const getDeadlineColor = (state) => {
    if (state === "Overdue") {
      return "border-red-500/30 bg-red-500/10 text-red-500";
    }

    if (state === "Completed") {
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-500";
    }

    if (state === "On Track") {
      return "border-blue-500/30 bg-blue-500/10 text-blue-500";
    }

    return "border-slate-500/30 bg-slate-500/10 text-slate-500";
  };

  const getWorkloadColor = (level) => {
    if (level === "High") return "text-red-500";
    if (level === "Medium") return "text-orange-500";
    return "text-emerald-500";
  };

  // --------------------------------------------------
  // FILTER COUNT
  // --------------------------------------------------

  const getFilterCount = (filter) => {
    if (filter === "All") return complaints.length;
    if (filter === "Pending") return pendingComplaints;
    if (filter === "Resolved") return resolvedComplaints;

    return complaints.filter(
      (complaint) => complaint.status === filter
    ).length;
  };

  // --------------------------------------------------
  // NAVIGATION
  // --------------------------------------------------

  const handleBackToAll = () => {
    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );

    window.location.reload();
  };

  const toggleDescription = (id) => {
    setExpandedComplaintId((previous) =>
      previous === id ? null : id
    );
  };

  // --------------------------------------------------
  // STAT CARD
  // --------------------------------------------------

  const StatCard = ({ title, value, icon, color }) => (
    <div
      className={`rounded-2xl border p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${surface}`}
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

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-xl">
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
        darkMode
          ? "bg-slate-950 text-slate-100"
          : "bg-slate-50 text-slate-900"
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

            <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
                  Supervisor Operations
                </div>

                <h1 className="text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
                  Complaint Management
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100">
                  Manage assignments, monitor deadlines and verify
                  completed maintenance work.
                </p>
              </div>

              <div className="min-w-52 rounded-2xl border border-white/20 bg-white/10 p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">
                  Supervisor Access
                </p>

                <p className="mt-2 text-xl font-black">
                  {assignedBlocks.length
                    ? assignedBlocks.join(", ")
                    : "All Campus"}
                </p>

                <p className="mt-3 text-xs text-indigo-100">
                  {totalComplaints} total complaints
                </p>
              </div>
            </div>
          </section>

          {/* SELECTED COMPLAINT */}

          {selectedComplaintId && (
            <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-indigo-500">
                  Viewing Selected Complaint
                </p>
                <p className="mt-1 text-xs text-indigo-400">
                  Opened from dashboard or notification.
                </p>
              </div>

              <button
                type="button"
                onClick={handleBackToAll}
                className="w-fit rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white"
              >
                ← Back to All Complaints
              </button>
            </div>
          )}

          {/* MESSAGES */}

          {message && (
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-500">
              <span>✓</span>
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

          {errorMessage && (
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-semibold text-red-500">
              <span>!</span>
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
            <section className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
              <StatCard
                title="Total"
                value={totalComplaints}
                icon="📋"
                color={headingText}
              />

              <StatCard
                title="Pending"
                value={pendingComplaints}
                icon="⏳"
                color="text-amber-500"
              />

              <StatCard
                title="Active"
                value={activeComplaints}
                icon="🔧"
                color="text-violet-500"
              />

              <StatCard
                title="Overdue"
                value={overdueComplaints}
                icon="⚠️"
                color="text-red-500"
              />

              <StatCard
                title="Verification"
                value={awaitingVerification}
                icon="🔍"
                color="text-orange-500"
              />

              <StatCard
                title="Resolved"
                value={resolvedComplaints}
                icon="✓"
                color="text-emerald-500"
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
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search block, floor, room, category..."
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${inputClass}`}
                />

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`rounded-xl border px-4 py-3 text-sm outline-none ${inputClass}`}
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
                  className={`rounded-xl border px-4 py-3 text-sm outline-none ${inputClass}`}
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
                  className={`rounded-xl border px-5 py-3 text-sm font-bold ${
                    darkMode
                      ? "border-slate-600 bg-slate-700 text-slate-200"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  Reset
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
                    className={`whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-bold ${
                      statusFilter === filter
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : darkMode
                          ? "border-slate-700 bg-slate-900 text-slate-300"
                          : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    {filter}
                    <span className="ml-1.5 opacity-70">
                      {getFilterCount(filter)}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* LIST HEADER */}

          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className={`text-xl font-black ${headingText}`}>
                {selectedComplaintId
                  ? "Complaint Details"
                  : "Maintenance Complaints"}
              </h2>

              <p className={`mt-1 text-xs ${secondaryText}`}>
                Showing {visibleComplaints.length} complaints
              </p>
            </div>

            <button
              type="button"
              disabled={refreshing}
              onClick={() => {
                fetchComplaints(true);
                fetchTechnicians();
              }}
              className={`w-fit rounded-xl border px-4 py-2.5 text-xs font-black disabled:opacity-50 ${
                darkMode
                  ? "border-slate-700 bg-slate-800 text-slate-200"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              {refreshing ? "Refreshing..." : "↻ Refresh"}
            </button>
          </div>

          {/* LOADING */}

          {loading ? (
            <div className={`rounded-3xl border p-14 text-center ${surface}`}>
              <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-slate-300 border-t-indigo-600" />
              <p className={`mt-5 text-sm font-bold ${headingText}`}>
                Loading complaints...
              </p>
            </div>
          ) : visibleComplaints.length === 0 ? (
            <div className={`rounded-3xl border border-dashed p-14 text-center ${surface}`}>
              <div className="text-4xl">📋</div>

              <h2 className={`mt-5 text-lg font-black ${headingText}`}>
                No complaints found
              </h2>

              <p className={`mt-2 text-sm ${secondaryText}`}>
                No complaints match your current filters.
              </p>

              {selectedComplaintId && (
                <button
                  type="button"
                  onClick={handleBackToAll}
                  className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-black text-white"
                >
                  Back to All Complaints
                </button>
              )}
            </div>
          ) : (
            <div className={
              selectedComplaintId
                ? "mx-auto max-w-4xl"
                : "grid gap-5 xl:grid-cols-2"
            }>
              {visibleComplaints.map((complaint) => {
                const categoryTechnicians =
                  getTechniciansForComplaint(complaint.category);

                const isResolved =
                  complaint.status === "Resolved";

                const isOverdue =
                  getDeadlineState(complaint) === "Overdue";

                const currentTechnician =
                  complaint.technician?._id || "";

                const selectedValue =
                  selectedTechnician[complaint._id] ??
                  currentTechnician;

                const requiredSkill =
                  specializationMap[complaint.category] ||
                  "General Technician";

                const isExpanded =
                  expandedComplaintId === complaint._id;

                const description =
                  complaint.description ||
                  "No description provided.";

                const needsVerification =
                  complaint.verificationStatus === "Pending";

                const canAssign =
                  !isResolved &&
                  !needsVerification &&
                  complaint.verificationStatus !== "Approved";

                return (
                  <article
                    id={`complaint-${complaint._id}`}
                    key={complaint._id}
                    className={`overflow-hidden rounded-3xl border shadow-sm transition hover:shadow-xl ${
                      darkMode
                        ? "border-slate-700 bg-slate-800"
                        : "border-slate-200 bg-white"
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
                            <span className="rounded-lg bg-indigo-500/10 px-2.5 py-1 text-[11px] font-black text-indigo-500">
                              {complaint.category}
                            </span>

                            <span className={`rounded-lg border px-2.5 py-1 text-[11px] font-black ${getPriorityColor(complaint.priority)}`}>
                              {complaint.priority || "Normal"}
                            </span>

                            <span className={`rounded-lg border px-2.5 py-1 text-[11px] font-black ${getStatusColor(complaint.status)}`}>
                              {complaint.status}
                            </span>

                            {isOverdue && (
                              <span className="rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[11px] font-black text-red-500">
                                OVERDUE
                              </span>
                            )}
                          </div>

                          <h3 className={`mt-3 text-base font-black ${headingText}`}>
                            {complaint.category} Maintenance
                          </h3>

                          <p className={`mt-1 text-xs ${secondaryText}`}>
                            ID: {complaint._id?.slice(-10)}
                          </p>
                        </div>

                        <div className={`shrink-0 rounded-xl border px-3 py-2 text-right ${surface}`}>
                          <p className="text-[9px] font-black uppercase text-slate-400">
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

                    <div className="p-4 sm:p-5">

                      {/* COMPLAINT IMAGE + DESCRIPTION */}

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
                              className={`block w-full overflow-hidden rounded-2xl border ${
                                selectedComplaintId
                                  ? "h-64 sm:h-80"
                                  : "h-28 sm:h-32"
                              }`}
                            >
                              <img
                                src={complaint.image}
                                alt="Complaint"
                                className="h-full w-full object-cover"
                              />
                            </button>
                          ) : (
                            <div className={`flex items-center justify-center rounded-2xl border border-dashed text-3xl ${
                              selectedComplaintId
                                ? "h-64 sm:h-80"
                                : "h-28 sm:h-32"
                            } ${mutedSurface}`}>
                              🧰
                            </div>
                          )}

                          <p className="mt-2 text-center text-[9px] font-bold uppercase text-slate-400">
                            Complaint Photo
                          </p>
                        </div>

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
                              className="mt-2 text-xs font-black text-indigo-500"
                            >
                              {isExpanded ? "Read Less ↑" : "Read More →"}
                            </button>
                          )}

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-lg bg-slate-500/10 px-2.5 py-1 text-[10px] font-bold">
                              📍 {complaint.block || "Block N/A"}
                            </span>

                            {complaint.floor && (
                              <span className="rounded-lg bg-slate-500/10 px-2.5 py-1 text-[10px] font-bold">
                                Floor {complaint.floor}
                              </span>
                            )}

                            {complaint.room && (
                              <span className="rounded-lg bg-slate-500/10 px-2.5 py-1 text-[10px] font-bold">
                                Room {complaint.room}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* DEADLINE MANAGEMENT */}

                      <section className={`mt-5 rounded-2xl border p-4 ${
                        darkMode
                          ? "border-amber-500/30 bg-amber-500/5"
                          : "border-amber-200 bg-amber-50/60"
                      }`}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-wide text-amber-500">
                              Resolution Deadline
                            </p>

                            <h4 className={`mt-1 text-sm font-black ${headingText}`}>
                              {formatDateTime(complaint.deadline)}
                            </h4>

                            <p className={`mt-1 text-xs ${secondaryText}`}>
                              {getRemainingTime(complaint.deadline)}
                            </p>
                          </div>

                          <span className={`rounded-lg border px-3 py-2 text-[10px] font-black ${getDeadlineColor(getDeadlineState(complaint))}`}>
                            {getDeadlineState(complaint)}
                          </span>
                        </div>

                        {complaint.deadlineReason && (
                          <p className={`mt-3 text-xs ${secondaryText}`}>
                            <strong>Deadline reason:</strong>{" "}
                            {complaint.deadlineReason}
                          </p>
                        )}

                        {!isResolved && (
                          <div className="mt-4 border-t border-slate-500/20 pt-4">
                            <p className={`mb-3 text-xs font-black ${bodyText}`}>
                              Set or Change Deadline
                            </p>

                            <label className="mb-3 flex items-center gap-2 text-xs font-semibold">
                              <input
                                type="checkbox"
                                checked={!!useSuggestedDeadline[complaint._id]}
                                onChange={(e) =>
                                  setUseSuggestedDeadline((previous) => ({
                                    ...previous,
                                    [complaint._id]: e.target.checked,
                                  }))
                                }
                              />
                              Use system suggested deadline
                            </label>

                            {!useSuggestedDeadline[complaint._id] && (
                              <>
                                <input
                                  type="datetime-local"
                                  min={toDateTimeLocal(new Date())}
                                  value={
                                    deadlineValues[complaint._id] ||
                                    toDateTimeLocal(complaint.deadline)
                                  }
                                  onChange={(e) =>
                                    setDeadlineValues((previous) => ({
                                      ...previous,
                                      [complaint._id]: e.target.value,
                                    }))
                                  }
                                  className={`w-full rounded-xl border px-3 py-3 text-xs outline-none ${inputClass}`}
                                />

                                <textarea
                                  rows="2"
                                  value={deadlineReasons[complaint._id] || ""}
                                  onChange={(e) =>
                                    setDeadlineReasons((previous) => ({
                                      ...previous,
                                      [complaint._id]: e.target.value,
                                    }))
                                  }
                                  placeholder="Reason for setting/changing deadline..."
                                  className={`mt-3 w-full rounded-xl border px-3 py-3 text-xs outline-none ${inputClass}`}
                                />
                              </>
                            )}

                            <button
                              type="button"
                              disabled={deadlineSavingId === complaint._id}
                              onClick={() => handleSetDeadline(complaint._id)}
                              className="mt-3 w-full rounded-xl bg-amber-600 px-4 py-3 text-xs font-black text-white transition hover:bg-amber-700 disabled:opacity-50"
                            >
                              {deadlineSavingId === complaint._id
                                ? "Saving Deadline..."
                                : "Save Deadline"}
                            </button>
                          </div>
                        )}
                      </section>

                      {/* COMPLETION SUBMISSION */}

                      {(complaint.completionImage ||
                        complaint.resolutionRemarks ||
                        complaint.verificationStatus) && (
                        <section className={`mt-5 rounded-2xl border p-4 ${
                          darkMode
                            ? "border-emerald-500/30 bg-emerald-500/5"
                            : "border-emerald-200 bg-emerald-50/60"
                        }`}>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-[10px] font-black uppercase tracking-wide text-emerald-500">
                              Technician Completion Submission
                            </p>

                            <span className={`rounded-lg border px-2.5 py-1 text-[10px] font-black ${
                              complaint.verificationStatus === "Approved"
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                                : complaint.verificationStatus === "Rejected"
                                  ? "border-red-500/30 bg-red-500/10 text-red-500"
                                  : complaint.verificationStatus === "Pending"
                                    ? "border-amber-500/30 bg-amber-500/10 text-amber-500"
                                    : "border-slate-500/30 bg-slate-500/10 text-slate-500"
                            }`}>
                              {complaint.verificationStatus || "Not Submitted"}
                            </span>
                          </div>

                          {complaint.resolutionRemarks && (
                            <div className="mt-3">
                              <p className={`text-xs font-black ${bodyText}`}>
                                Technician Remarks
                              </p>

                              <p className={`mt-1 text-sm leading-6 ${secondaryText}`}>
                                {complaint.resolutionRemarks}
                              </p>
                            </div>
                          )}

                          {complaint.completionImage && (
                            <div className="mt-3">
                              <button
                                type="button"
                                onClick={() => setPreviewImage(complaint.completionImage)}
                                className="overflow-hidden rounded-xl border border-emerald-500/20"
                              >
                                <img
                                  src={complaint.completionImage}
                                  alt="Completion"
                                  className="h-40 w-full object-cover sm:w-64"
                                />
                              </button>

                              <p className="mt-1 text-[10px] font-bold text-emerald-500">
                                View submitted completion photo
                              </p>
                            </div>
                          )}

                          {complaint.verificationRemarks && (
                            <p className={`mt-3 text-xs ${secondaryText}`}>
                              <strong>Verification remarks:</strong>{" "}
                              {complaint.verificationRemarks}
                            </p>
                          )}

                          {needsVerification && (
                            <div className="mt-4 border-t border-slate-500/20 pt-4">
                              <p className={`mb-2 text-xs font-black ${bodyText}`}>
                                Supervisor Verification
                              </p>

                              <textarea
                                rows="2"
                                value={verificationRemarks[complaint._id] || ""}
                                onChange={(e) =>
                                  setVerificationRemarks((previous) => ({
                                    ...previous,
                                    [complaint._id]: e.target.value,
                                  }))
                                }
                                placeholder="Remarks (required if rejecting)..."
                                className={`w-full rounded-xl border px-3 py-3 text-xs outline-none ${inputClass}`}
                              />

                              <div className="mt-3 grid grid-cols-2 gap-3">
                                <button
                                  type="button"
                                  disabled={verifyingId === complaint._id}
                                  onClick={() =>
                                    handleVerification(complaint._id, "Approved")
                                  }
                                  className="rounded-xl bg-emerald-600 px-3 py-3 text-xs font-black text-white hover:bg-emerald-700 disabled:opacity-50"
                                >
                                  {verifyingId === complaint._id
                                    ? "Please wait..."
                                    : "✓ Approve"}
                                </button>

                                <button
                                  type="button"
                                  disabled={verifyingId === complaint._id}
                                  onClick={() =>
                                    handleVerification(complaint._id, "Rejected")
                                  }
                                  className="rounded-xl bg-red-600 px-3 py-3 text-xs font-black text-white hover:bg-red-700 disabled:opacity-50"
                                >
                                  ✕ Reject
                                </button>
                              </div>
                            </div>
                          )}
                        </section>
                      )}

                      {/* TECHNICIAN ASSIGNMENT */}

                      <section className={`mt-5 rounded-2xl border p-4 ${
                        darkMode
                          ? "border-indigo-500/30 bg-indigo-500/5"
                          : "border-indigo-100 bg-indigo-50/60"
                      }`}>
                        <div className="flex items-center justify-between gap-3">
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

                          <div className={`rounded-xl px-3 py-2 text-center ${surface}`}>
                            <p className="text-sm font-black text-indigo-500">
                              {categoryTechnicians.length}
                            </p>
                            <p className="text-[8px] font-black uppercase text-slate-400">
                              Qualified
                            </p>
                          </div>
                        </div>

                        {complaint.technician && (
                          <div className={`mt-3 rounded-xl border p-3 ${surface}`}>
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10">
                                🛠️
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className={`truncate text-xs font-black ${headingText}`}>
                                  {complaint.technician.name}
                                </p>

                                <p className={`mt-1 text-[10px] ${secondaryText}`}>
                                  {complaint.technician.specialization}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {isResolved ? (
                          <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                            <p className="text-xs font-black text-emerald-500">
                              ✓ Complaint Resolved
                            </p>
                            <p className="mt-1 text-[10px] text-emerald-500">
                              This complaint has been verified and closed.
                            </p>
                          </div>
                        ) : canAssign ? (
                          <div className="mt-4">
                            <label className={`mb-2 block text-xs font-black ${bodyText}`}>
                              Select Technician
                            </label>

                            <select
                              value={selectedValue}
                              onChange={(e) =>
                                setSelectedTechnician((previous) => ({
                                  ...previous,
                                  [complaint._id]: e.target.value,
                                }))
                              }
                              className={`w-full rounded-xl border px-3 py-3 text-xs outline-none ${inputClass}`}
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
                                  {" | "}
                                  Workload: {technician.workloadLevel || "Low"}
                                  {" ("}
                                  {technician.activeComplaints ?? 0}
                                  {")"}
                                </option>
                              ))}
                            </select>

                            {selectedValue && (
                              <div className="mt-2 rounded-xl bg-slate-500/10 p-3">
                                {(() => {
                                  const selected = technicians.find(
                                    (item) => item._id === selectedValue
                                  );

                                  if (!selected) return null;

                                  return (
                                    <>
                                      <p className={`text-xs font-bold ${headingText}`}>
                                        {selected.name}
                                      </p>

                                      <p className={`mt-1 text-[10px] ${secondaryText}`}>
                                        Active complaints: {selected.activeComplaints ?? 0}
                                      </p>

                                      <p className={`mt-1 text-[10px] font-bold ${getWorkloadColor(selected.workloadLevel)}`}>
                                        Workload: {selected.workloadLevel || "Low"}
                                      </p>
                                    </>
                                  );
                                })()}
                              </div>
                            )}

                            <textarea
                              rows="2"
                              value={assignmentReasons[complaint._id] || ""}
                              onChange={(e) =>
                                setAssignmentReasons((previous) => ({
                                  ...previous,
                                  [complaint._id]: e.target.value,
                                }))
                              }
                              placeholder="Reason for assignment/reassignment (required)..."
                              className={`mt-3 w-full rounded-xl border px-3 py-3 text-xs outline-none ${inputClass}`}
                            />

                            <button
                              type="button"
                              onClick={() => handleAssignTechnician(complaint._id)}
                              disabled={
                                !selectedValue ||
                                !assignmentReasons[complaint._id]?.trim() ||
                                assigningId === complaint._id ||
                                categoryTechnicians.length === 0
                              }
                              className="mt-3 w-full rounded-xl bg-indigo-600 px-4 py-3 text-xs font-black text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-500"
                            >
                              {assigningId === complaint._id
                                ? "Assigning..."
                                : complaint.technician
                                  ? "Reassign Technician"
                                  : "Assign Technician"}
                            </button>
                          </div>
                        ) : needsVerification ? (
                          <p className="mt-3 rounded-xl bg-amber-500/10 p-3 text-xs font-semibold text-amber-500">
                            Technician completion is awaiting your verification. Verify it before making another assignment.
                          </p>
                        ) : null}

                        {categoryTechnicians.length === 0 && !isResolved && (
                          <p className="mt-3 rounded-xl bg-amber-500/10 p-3 text-xs font-semibold text-amber-500">
                            No qualified technician is currently available.
                          </p>
                        )}
                      </section>

                      {/* HISTORY */}

                      <section className={`mt-5 rounded-2xl border p-4 ${mutedSurface}`}>
                        <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                          Complaint Timeline
                        </p>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          {[
                            {
                              title: "Complaint Created",
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

                                <p className={`mt-1 text-[9px] ${secondaryText}`}>
                                  {formatDateTime(item.date)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* ASSIGNMENT HISTORY */}

                        {complaint.assignmentHistory?.length > 0 && (
                          <div className="mt-5 border-t border-slate-500/20 pt-4">
                            <p className={`mb-3 text-xs font-black ${bodyText}`}>
                              Assignment History
                            </p>

                            {complaint.assignmentHistory.map((item, index) => (
                              <div
                                key={index}
                                className="mb-3 rounded-xl bg-slate-500/5 p-3"
                              >
                                <p className={`text-xs font-bold ${headingText}`}>
                                  Assignment #{index + 1}
                                </p>

                                <p className={`mt-1 text-[10px] ${secondaryText}`}>
                                  {formatDateTime(item.assignedAt)}
                                </p>

                                {item.reason && (
                                  <p className={`mt-1 text-xs ${bodyText}`}>
                                    Reason: {item.reason}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* DEADLINE HISTORY */}

                        {complaint.deadlineHistory?.length > 0 && (
                          <div className="mt-5 border-t border-slate-500/20 pt-4">
                            <p className={`mb-3 text-xs font-black ${bodyText}`}>
                              Deadline History
                            </p>

                            {complaint.deadlineHistory.map((item, index) => (
                              <div
                                key={index}
                                className="mb-3 rounded-xl bg-slate-500/5 p-3"
                              >
                                <p className={`text-xs font-bold ${headingText}`}>
                                  Deadline Update #{index + 1}
                                </p>

                                <p className={`mt-1 text-[10px] ${secondaryText}`}>
                                  New deadline: {formatDateTime(item.newDeadline)}
                                </p>

                                <p className={`mt-1 text-xs ${bodyText}`}>
                                  Reason: {item.reason}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </section>

                      {selectedComplaintId && (
                        <button
                          type="button"
                          onClick={handleBackToAll}
                          className="mt-5 w-full rounded-xl border border-slate-500/30 px-4 py-3 text-xs font-black"
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

      {/* IMAGE PREVIEW */}

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
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-lg font-bold text-white"
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

      {/* LOGOUT */}

      {showLogout && (
        <LogoutModal
          onClose={() => setShowLogout(false)}
        />
      )}
    </div>
  );
}

export default SupervisorComplaints;

