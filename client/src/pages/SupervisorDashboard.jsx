import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import SupervisorSidebar from "../components/SupervisorSidebar";
import { useTheme } from "../context/ThemeContext";

const SupervisorDashboard = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const assignedBlocks = Array.isArray(user?.assignedBlocks)
    ? user.assignedBlocks
    : [];

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Theme styles
  const pageBg = darkMode ? "bg-slate-950" : "bg-slate-50";
  const headerBg = darkMode
    ? "border-slate-800 bg-slate-900/90"
    : "border-slate-200 bg-white/90";
  const panel = darkMode
    ? "border-slate-800 bg-slate-900"
    : "border-slate-200 bg-white";
  const card = darkMode
    ? "border-slate-700 bg-slate-800"
    : "border-slate-200 bg-white";
  const softBg = darkMode ? "bg-slate-800" : "bg-slate-50";
  const heading = darkMode ? "text-slate-100" : "text-slate-800";
  const bodyText = darkMode ? "text-slate-300" : "text-slate-600";
  const mutedText = darkMode ? "text-slate-400" : "text-slate-500";
  const borderLine = darkMode ? "border-slate-700" : "border-slate-100";

  // Fetch complaints
  const fetchComplaints = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const token = localStorage.getItem("token");

      const response = await api.get("/supervisor/complaints", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setComplaints(response.data.complaints || []);
    } catch (error) {
      console.error(
        "SUPERVISOR DASHBOARD COMPLAINTS ERROR:",
        error.response?.data || error
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const openComplaint = (complaintId) => {
    if (!complaintId) return;

    navigate("/supervisor/complaints", {
      state: { complaintId },
    });
  };

  // Statistics
  const totalComplaints = complaints.length;

  const pendingAssignment = complaints.filter(
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

  const highPriority = complaints.filter(
    (complaint) => complaint.priority === "High"
  ).length;

  // Complaint filters + search
  const filteredComplaints = useMemo(() => {
    let result = [...complaints];

    if (activeFilter === "Pending") {
      result = result.filter(
        (complaint) =>
          complaint.status === "Pending" || !complaint.technician
      );
    } else if (activeFilter === "Active") {
      result = result.filter(
        (complaint) =>
          complaint.status === "Assigned" ||
          complaint.status === "In Progress"
      );
    } else if (activeFilter === "Resolved") {
      result = result.filter(
        (complaint) => complaint.status === "Resolved"
      );
    } else if (activeFilter === "High") {
      result = result.filter(
        (complaint) => complaint.priority === "High"
      );
    }

    const query = searchQuery.trim().toLowerCase();

    if (query) {
      result = result.filter((complaint) => {
        const searchable = [
          complaint._id,
          complaint.category,
          complaint.description,
          complaint.block,
          complaint.floor,
          complaint.room,
          complaint.status,
          complaint.priority,
          complaint.technician?.name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchable.includes(query);
      });
    }

    return result;
  }, [complaints, activeFilter, searchQuery]);

  const getFilterCount = (filter) => {
    if (filter === "All") return complaints.length;

    if (filter === "Pending") return pendingAssignment;
    if (filter === "Active") return activeComplaints;
    if (filter === "Resolved") return resolvedComplaints;
    if (filter === "High") return highPriority;

    return 0;
  };

  const getStatusStyle = (status) => {
    const styles = {
      Pending: darkMode
        ? "bg-amber-950 text-amber-300 border-amber-800"
        : "bg-amber-50 text-amber-700 border-amber-200",
      Assigned: darkMode
        ? "bg-blue-950 text-blue-300 border-blue-800"
        : "bg-blue-50 text-blue-700 border-blue-200",
      "In Progress": darkMode
        ? "bg-violet-950 text-violet-300 border-violet-800"
        : "bg-violet-50 text-violet-700 border-violet-200",
      Resolved: darkMode
        ? "bg-emerald-950 text-emerald-300 border-emerald-800"
        : "bg-emerald-50 text-emerald-700 border-emerald-200",
    };

    return (
      styles[status] ||
      (darkMode
        ? "bg-slate-700 text-slate-300 border-slate-600"
        : "bg-slate-50 text-slate-700 border-slate-200")
    );
  };

  const getPriorityStyle = (priority) => {
    const styles = {
      High: darkMode
        ? "bg-red-950 text-red-300 border-red-800"
        : "bg-red-50 text-red-700 border-red-200",
      Medium: darkMode
        ? "bg-orange-950 text-orange-300 border-orange-800"
        : "bg-orange-50 text-orange-700 border-orange-200",
      Low: darkMode
        ? "bg-green-950 text-green-300 border-green-800"
        : "bg-green-50 text-green-700 border-green-200",
    };

    return (
      styles[priority] ||
      (darkMode
        ? "bg-slate-700 text-slate-300 border-slate-600"
        : "bg-slate-50 text-slate-700 border-slate-200")
    );
  };

  const formatDate = (date) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getLocationText = (complaint) => {
    const parts = [];

    if (complaint.block) parts.push(complaint.block);
    if (complaint.floor) parts.push(`Floor ${complaint.floor}`);
    if (complaint.room) parts.push(`Room ${complaint.room}`);

    return parts.length ? parts.join(" • ") : "Location not available";
  };

  const filters = ["All", "Pending", "Active", "High", "Resolved"];

  const stats = [
    {
      label: "Received from Admin",
      value: totalComplaints,
      note: "Total assigned complaints",
      icon: "📥",
      color: "indigo",
      filter: "All",
    },
    {
      label: "Pending Assignment",
      value: pendingAssignment,
      note: "Need technician assignment",
      icon: "⏳",
      color: "amber",
      filter: "Pending",
    },
    {
      label: "Active Complaints",
      value: activeComplaints,
      note: "Assigned or in progress",
      icon: "🔧",
      color: "violet",
      filter: "Active",
    },
    {
      label: "Resolved",
      value: resolvedComplaints,
      note: "Completed maintenance work",
      icon: "✅",
      color: "emerald",
      filter: "Resolved",
    },
  ];

  const colorStyles = {
    indigo: darkMode
      ? "bg-indigo-950/70 text-indigo-300"
      : "bg-indigo-50 text-indigo-600",
    amber: darkMode
      ? "bg-amber-950/70 text-amber-300"
      : "bg-amber-50 text-amber-600",
    violet: darkMode
      ? "bg-violet-950/70 text-violet-300"
      : "bg-violet-50 text-violet-600",
    emerald: darkMode
      ? "bg-emerald-950/70 text-emerald-300"
      : "bg-emerald-50 text-emerald-600",
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${pageBg}`}>
      <SupervisorSidebar onLogout={handleLogout} />

      <main className="min-h-screen transition-all duration-300 lg:ml-64">

        {/* HEADER */}
        <header
          className={`sticky top-0 z-20 border-b px-5 py-4 shadow-sm backdrop-blur-xl sm:px-8 ${headerBg}`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="pl-14 lg:pl-0">
              <p className={`text-xs font-bold uppercase tracking-[0.2em] ${mutedText}`}>
                CampusFix / Operations
              </p>
              <h1 className={`mt-1 text-lg font-black sm:text-xl ${heading}`}>
                Supervisor Dashboard
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchComplaints(true)}
                disabled={refreshing}
                className={`flex h-11 items-center gap-2 rounded-xl border px-3 text-sm font-bold transition ${darkMode
                    ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                title="Refresh complaints"
              >
                <span className={refreshing ? "animate-spin" : ""}>↻</span>
                <span className="hidden sm:inline">
                  {refreshing ? "Refreshing..." : "Refresh"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/supervisor/notifications")}
                className={`relative flex h-11 w-11 items-center justify-center rounded-xl border text-xl shadow-sm transition ${darkMode
                    ? "border-slate-700 bg-slate-800 hover:bg-slate-700"
                    : "border-slate-200 bg-white hover:bg-indigo-50"
                  }`}
                title="Notifications"
                aria-label="Notifications"
              >
                🔔
                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
              </button>
            </div>
          </div>
        </header>

        <div className="space-y-6 p-5 sm:p-8">

          {/* HERO */}
          <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 p-7 text-white shadow-xl shadow-indigo-950/15 sm:p-9">
            <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full border-[35px] border-white/5" />
            <div className="pointer-events-none absolute -bottom-28 right-44 h-64 w-64 rounded-full bg-white/5 blur-2xl" />

            <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
              <div className="max-w-2xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
                  SUPERVISOR CONTROL CENTER
                </div>

                <p className="text-2xl font-semibold text-indigo-100">
                  Welcome back{user?.name ? `, ${user.name}` : ""}
                </p>

                <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                  {assignedBlocks.length === 1
                    ? `${assignedBlocks[0]} Supervisor Dashboard`
                    : assignedBlocks.length > 1
                      ? "Campus Supervisor Dashboard"
                      : "Supervisor Dashboard"}

                </h2>

                <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100 sm:text-base">
                  Track maintenance requests, coordinate technicians
                  and keep every campus facility running smoothly.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => navigate("/supervisor/complaints")}
                    className="rounded-xl bg-white px-5 py-3 text-sm font-black text-indigo-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-50"
                  >
                    Manage Complaints →
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/supervisor/technicians")}
                    className="rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
                  >
                    View Technicians
                  </button>
                </div>
              </div>

              <div className="hidden min-w-52 rounded-3xl border border-white/15 bg-white/10 p-6 text-center backdrop-blur-md lg:block">
                <div className="text-5xl">🛠️</div>
                <p className="mt-3 text-sm font-black">Operations</p>
                <p className="mt-1 text-xs text-indigo-100">
                  Campus maintenance
                </p>
                <div className="mt-5 border-t border-white/15 pt-4">
                  <p className="text-3xl font-black">{totalComplaints}</p>
                  <p className="mt-1 text-xs text-indigo-100">
                    Assigned complaints
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* STATISTICS */}
          <section>
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className={`text-xs font-bold uppercase tracking-widest ${mutedText}`}>
                  OVERVIEW
                </p>
                <h2 className={`mt-1 text-xl font-black ${heading}`}>
                  Complaint Summary
                </h2>
              </div>
              <p className={`text-xs font-semibold ${mutedText}`}>
                Click a card to filter
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <button
                  key={stat.label}
                  type="button"
                  onClick={() => setActiveFilter(stat.filter)}
                  className={`group rounded-2xl border p-5 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg ${activeFilter === stat.filter
                      ? "border-indigo-500 ring-2 ring-indigo-500/20"
                      : card
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`text-sm font-bold ${mutedText}`}>
                        {stat.label}
                      </p>
                      <p className={`mt-4 text-3xl font-black ${heading}`}>
                        {stat.value}
                      </p>
                    </div>
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${colorStyles[stat.color]}`}>
                      {stat.icon}
                    </div>
                  </div>
                  <p className={`mt-2 text-xs font-medium ${mutedText}`}>
                    {stat.note}
                  </p>
                  <div className="mt-4 h-1 overflow-hidden rounded-full bg-slate-200/50">
                    <div
                      className={`h-full rounded-full ${stat.color === "indigo"
                          ? "bg-indigo-500"
                          : stat.color === "amber"
                            ? "bg-amber-500"
                            : stat.color === "violet"
                              ? "bg-violet-500"
                              : "bg-emerald-500"
                        }`}
                      style={{
                        width: `${totalComplaints
                          ? Math.min((stat.value / totalComplaints) * 100, 100)
                          : 0}%`,
                      }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* COMPLAINTS */}
          <section className={`overflow-hidden rounded-3xl border shadow-sm ${panel}`}>
            <div className={`border-b p-5 sm:p-6 ${borderLine}`}>
              <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
                <div>
                  <p className={`text-xs font-bold uppercase tracking-widest ${mutedText}`}>
                    MAINTENANCE MANAGEMENT
                  </p>
                  <h2 className={`mt-1 text-xl font-black ${heading}`}>
                    Assigned Complaints
                  </h2>
                  <p className={`mt-1 text-sm ${mutedText}`}>
                    Review requests and coordinate suitable technicians.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/supervisor/complaints")}
                  className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white shadow-md shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700"
                >
                  Manage All Complaints →
                </button>
              </div>

              {/* SEARCH */}
              <div className="mt-6">
                <div className="relative">
                  <span className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${mutedText}`}>
                    🔍
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by complaint ID, category, location or technician..."
                    className={`w-full rounded-xl border py-3 pl-11 pr-11 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 ${darkMode
                        ? "border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                        : "border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400"
                      }`}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className={`absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold ${mutedText}`}
                      aria-label="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* FILTERS */}
              <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
                {filters.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={`flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-black transition ${activeFilter === filter
                        ? "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                        : darkMode
                          ? "border-slate-700 bg-slate-800 text-slate-300 hover:border-indigo-500 hover:text-indigo-300"
                          : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                      }`}
                  >
                    {filter}
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] ${activeFilter === filter
                          ? "bg-white/20 text-white"
                          : darkMode
                            ? "bg-slate-700 text-slate-300"
                            : "bg-slate-100 text-slate-500"
                        }`}
                    >
                      {getFilterCount(filter)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* COMPLAINT LIST */}
            <div className="p-5 sm:p-6">
              {loading ? (
                <div className={`rounded-2xl border border-dashed p-12 text-center ${darkMode ? "border-slate-700 bg-slate-800/50" : "border-slate-300 bg-slate-50"}`}>
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-2xl">
                    ⏳
                  </div>
                  <h3 className={`mt-4 font-black ${heading}`}>
                    Loading complaints...
                  </h3>
                  <p className={`mt-1 text-sm ${mutedText}`}>
                    Fetching assigned maintenance complaints.
                  </p>
                </div>
              ) : filteredComplaints.length === 0 ? (
                <div className={`rounded-2xl border border-dashed p-12 text-center ${darkMode ? "border-slate-700 bg-slate-800/50" : "border-slate-300 bg-slate-50"}`}>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-3xl">
                    📋
                  </div>
                  <h3 className={`mt-4 text-lg font-black ${heading}`}>
                    No complaints found
                  </h3>
                  <p className={`mx-auto mt-2 max-w-md text-sm leading-6 ${mutedText}`}>
                    {searchQuery
                      ? "Try another search term or clear your search."
                      : "There are no complaints matching the selected filter."}
                  </p>
                  {(searchQuery || activeFilter !== "All") && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setActiveFilter("All");
                      }}
                      className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
                  {filteredComplaints.map((complaint) => (
                    <article
                      key={complaint._id}
                      className={`group overflow-hidden rounded-2xl border shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl ${darkMode
                          ? "border-slate-700 bg-slate-800 hover:border-indigo-500"
                          : "border-slate-200 bg-white hover:border-indigo-200"
                        }`}
                    >
                      {/* IMAGE */}
                      <div className={`relative h-44 w-full overflow-hidden ${darkMode ? "bg-slate-700" : "bg-slate-100"}`}>
                        {complaint.image ? (
                          <img
                            src={complaint.image}
                            alt="Complaint"
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-5xl">
                            🧰
                          </div>
                        )}

                        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />

                        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                          <span className={`rounded-lg border px-2.5 py-1 text-[10px] font-black shadow-sm ${getPriorityStyle(complaint.priority)}`}>
                            {complaint.priority || "Normal"} Priority
                          </span>
                          <span className={`rounded-lg border px-2.5 py-1 text-[10px] font-black shadow-sm ${getStatusStyle(complaint.status)}`}>
                            {complaint.status || "Unknown"}
                          </span>
                        </div>

                        <span className="absolute bottom-3 left-3 text-xs font-black text-white">
                          #{complaint._id?.slice(-6)}
                        </span>
                      </div>

                      {/* CARD BODY */}
                      <div className="p-5">
                        <div className="flex items-center justify-between gap-3">
                          <span className={`rounded-lg px-3 py-1.5 text-xs font-black ${darkMode
                              ? "bg-indigo-950 text-indigo-300"
                              : "bg-indigo-50 text-indigo-700"
                            }`}>
                            {complaint.category || "General"}
                          </span>
                          <span className={`text-xs font-semibold ${mutedText}`}>
                            Complaint
                          </span>
                        </div>

                        <h3 className={`mt-4 text-lg font-black ${heading}`}>
                          {complaint.category || "General"} Complaint
                        </h3>

                        <p className="mt-2 flex items-start gap-2 text-sm font-bold text-indigo-500">
                          <span>📍</span>
                          <span>{getLocationText(complaint)}</span>
                        </p>

                        <p className={`mt-3 line-clamp-3 min-h-[60px] text-sm leading-6 ${bodyText}`}>
                          {complaint.description || "No description provided."}
                        </p>

                        {/* TECHNICIAN */}
                        <div className={`mt-4 rounded-xl border p-3 ${darkMode
                            ? "border-slate-700 bg-slate-900"
                            : "border-slate-200 bg-slate-50"
                          }`}>
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className={`text-[11px] font-black uppercase tracking-wider ${mutedText}`}>
                                Assigned Technician
                              </p>
                              <p className={`mt-1 text-sm font-black ${heading}`}>
                                {complaint.technician?.name || "Not assigned"}
                              </p>
                              <p className={`mt-1 text-xs ${mutedText}`}>
                                {complaint.technician?.name
                                  ? "Responsible for maintenance"
                                  : "Awaiting technician assignment"}
                              </p>
                            </div>
                            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${darkMode ? "bg-slate-800" : "bg-white"
                              }`}>
                              🛠️
                            </div>
                          </div>
                        </div>

                        {/* TIMELINE */}
                        <div className={`mt-5 space-y-3 border-t pt-4 ${borderLine}`}>
                          {[
                            ["Created", complaint.createdAt],
                            ["Technician Assigned", complaint.technicianAssignedAt],
                            ["Resolved", complaint.resolvedAt],
                          ].map(([label, date]) => (
                            <div
                              key={label}
                              className="flex items-start justify-between gap-3"
                            >
                              <span className={`text-xs font-bold ${mutedText}`}>
                                {label}
                              </span>
                              <span className={`text-right text-xs font-semibold ${bodyText}`}>
                                {formatDate(date)}
                              </span>
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => openComplaint(complaint._id)}
                          className="mt-5 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-black text-white shadow-md shadow-indigo-600/15 transition hover:bg-indigo-700"
                        >
                          Manage Complaint →
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {!loading && filteredComplaints.length > 0 && (
                <div className={`mt-6 flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${darkMode
                    ? "border-indigo-900 bg-indigo-950/40"
                    : "border-indigo-100 bg-indigo-50"
                  }`}>
                  <div>
                    <p className={`text-sm font-black ${darkMode ? "text-indigo-300" : "text-indigo-900"}`}>
                      Showing {filteredComplaints.length} of {totalComplaints} complaints
                    </p>
                    <p className={`mt-1 text-xs ${darkMode ? "text-indigo-200" : "text-indigo-700"}`}>
                      Open the complaint manager for full assignment controls.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/supervisor/complaints")}
                    className="rounded-xl bg-indigo-600 px-4 py-3 text-xs font-black text-white transition hover:bg-indigo-700"
                  >
                    Open Full Complaint Manager →
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* QUICK ACTIONS */}
          <section className={`rounded-3xl border p-6 shadow-sm ${panel}`}>
            <div className="mb-5">
              <p className={`text-xs font-bold uppercase tracking-widest ${mutedText}`}>
                SHORTCUTS
              </p>
              <h2 className={`mt-1 text-xl font-black ${heading}`}>
                Quick Actions
              </h2>
              <p className={`mt-1 text-sm ${mutedText}`}>
                Jump directly to your daily operations.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: "📋",
                  title: "Manage Complaints",
                  description: "Review requests and assign suitable technicians.",
                  route: "/supervisor/complaints",
                  color: "indigo",
                },
                {
                  icon: "🛠️",
                  title: "Manage Technicians",
                  description: "View and manage campus technicians.",
                  route: "/supervisor/technicians",
                  color: "violet",
                },
                {
                  icon: "🔔",
                  title: "Notifications",
                  description: "Open your notification center.",
                  route: "/supervisor/notifications",
                  color: "amber",
                },
              ].map((action) => (
                <button
                  key={action.title}
                  type="button"
                  onClick={() => navigate(action.route)}
                  className={`group rounded-2xl border p-5 text-left transition duration-200 hover:-translate-y-1 hover:shadow-lg ${darkMode
                      ? "border-slate-700 bg-slate-800 hover:border-indigo-500"
                      : "border-slate-200 bg-slate-50 hover:border-indigo-200 hover:bg-indigo-50"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-2xl">
                      {action.icon}
                    </div>
                    <span className={`text-lg transition group-hover:translate-x-1 ${mutedText}`}>
                      →
                    </span>
                  </div>
                  <h3 className={`mt-4 text-sm font-black ${heading}`}>
                    {action.title}
                  </h3>
                  <p className={`mt-1 text-xs leading-5 ${mutedText}`}>
                    {action.description}
                  </p>
                </button>
              ))}
            </div>
          </section>

          {/* WORKFLOW */}
          <section className={`rounded-3xl border p-6 shadow-sm ${panel}`}>
            <div className="mb-6">
              <p className={`text-xs font-bold uppercase tracking-widest ${mutedText}`}>
                HOW IT WORKS
              </p>
              <h2 className={`mt-1 text-xl font-black ${heading}`}>
                CampusFix Workflow
              </h2>
              <p className={`mt-1 text-sm ${mutedText}`}>
                Your role in the campus maintenance process.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  step: "01",
                  icon: "🎓",
                  title: "Student Reports",
                  description: "Student reports a maintenance issue.",
                  active: false,
                },
                {
                  step: "02",
                  icon: "👨‍💼",
                  title: "Admin Assigns",
                  description: "Admin forwards the complaint to the Supervisor.",
                  active: false,
                },
                {
                  step: "03",
                  icon: "🧑‍💼",
                  title: "Supervisor Assigns",
                  description: "Supervisor assigns the suitable technician.",
                  active: true,
                },
                {
                  step: "04",
                  icon: "🔧",
                  title: "Technician Resolves",
                  description: "Technician completes and resolves the complaint.",
                  active: false,
                },
              ].map((step) => (
                <div
                  key={step.step}
                  className={`rounded-2xl border p-5 ${step.active
                      ? darkMode
                        ? "border-indigo-700 bg-indigo-950/50"
                        : "border-indigo-200 bg-indigo-50"
                      : darkMode
                        ? "border-slate-700 bg-slate-800"
                        : "border-slate-200 bg-slate-50"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${step.active
                        ? "bg-indigo-600 text-white"
                        : darkMode
                          ? "bg-slate-700"
                          : "bg-white"
                      }`}>
                      {step.icon}
                    </div>
                    <span className={`text-xs font-black ${step.active ? "text-indigo-400" : mutedText}`}>
                      STEP {step.step}
                    </span>
                  </div>
                  <h3 className={`mt-4 text-sm font-black ${heading}`}>
                    {step.title}
                  </h3>
                  <p className={`mt-2 text-xs leading-5 ${bodyText}`}>
                    {step.description}
                  </p>
                  {step.active && (
                    <span className="mt-4 inline-flex rounded-full bg-indigo-600/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-indigo-400">
                      Your responsibility
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* PRIVACY NOTICE */}
          <section className={`rounded-2xl border p-5 ${darkMode
              ? "border-blue-900 bg-blue-950/30"
              : "border-blue-200 bg-blue-50"
            }`}>
            <div className="flex gap-4">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${darkMode ? "bg-blue-900/60" : "bg-white"
                }`}>
                🔒
              </div>
              <div>
                <h3 className={`text-sm font-black ${darkMode ? "text-blue-300" : "text-blue-900"
                  }`}>
                  Privacy & Access Control
                </h3>
                <p className={`mt-1 text-sm leading-6 ${darkMode ? "text-blue-200" : "text-blue-800"
                  }`}>
                  Supervisor access is limited to maintenance operations.
                  Student personal information is not displayed in the
                  Supervisor Portal.
                </p>
              </div>
            </div>
          </section>

          {/* FOOTER */}
          <footer className={`border-t pt-6 pb-2 ${darkMode ? "border-slate-800" : "border-slate-200"}`}>
            <div className="flex flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
              <div>
                <p className={`text-sm font-black ${heading}`}>
                  CampusFix
                </p>
                <p className={`mt-1 text-xs ${mutedText}`}>
                  Medi-Caps University
                </p>
              </div>
              <div className={`text-xs ${mutedText}`}>
                <p>Smart Campus • Faster Resolution • Better Management</p>
                <p className="mt-1">
                  © 2026 Medi-Caps University
                </p>
              </div>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default SupervisorDashboard;  