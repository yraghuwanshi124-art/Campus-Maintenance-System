import { useEffect, useState } from "react";
import api from "../services/api";
import LogoutModal from "../components/LogoutModal";
import AdminSidebar from "../components/AdminSidebar";
import {
  Search,
  X,
  CheckCircle2,
  Clock,
  Wrench,
  UserCheck,
  BarChart3,
  Trash2,
  ChevronDown,
  ChevronUp,
  MapPin,
  GraduationCap,
  Phone,
  Mail,
  Building,
  AlertTriangle,
  Calendar,
  Sparkles,
  Star,
  FileText,
  Camera,
  Check,
  ShieldAlert,
  Lightbulb,
  ArrowRight,
  Filter,
  Users,
} from "lucide-react";

function AdminDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [selectedSupervisors, setSelectedSupervisors] = useState({});
  const [showLogout, setShowLogout] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Recent 3 / All complaints
  const [showAllComplaints, setShowAllComplaints] = useState(false);

  // Read More / Show Less
  const [expandedComplaints, setExpandedComplaints] = useState({});

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Toggle Complaint
  const toggleComplaint = (complaintId) => {
    setExpandedComplaints((prev) => ({
      ...prev,
      [complaintId]: !prev[complaintId],
    }));
  };

  // Fetch Complaints
  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get("/complaints/all", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setComplaints(response.data.complaints || []);
    } catch (error) {
      console.log("Failed to fetch complaints:", error);
    }
  };

  // Fetch Supervisors
  const fetchSupervisors = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get("/supervisor/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSupervisors(response.data.supervisors || []);
    } catch (error) {
      console.log(
        "Failed to fetch supervisors:",
        error.response?.data || error.message
      );
    }
  };

  // Initial Load
  useEffect(() => {
    fetchComplaints();
    fetchSupervisors();
  }, []);

  // Assign Complaint to Supervisor
  const assignComplaint = async (complaintId, supervisorId) => {
    if (!supervisorId) {
      alert("Please select a supervisor first.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await api.patch(
        `/complaints/${complaintId}/assign`,
        { supervisorId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(response.data.message);

      const selectedSupervisor = supervisors.find(
        (supervisor) => supervisor._id === supervisorId
      );

      setComplaints((prevComplaints) =>
        prevComplaints.map((complaint) =>
          complaint._id === complaintId
            ? {
                ...complaint,
                supervisor:
                  selectedSupervisor ||
                  response.data.complaint?.supervisor ||
                  supervisorId,
                technician: null,
                status: "Assigned",
                assignedAt:
                  response.data.complaint?.assignedAt ||
                  new Date().toISOString(),
              }
            : complaint
        )
      );

      setSelectedSupervisors((prev) => {
        const updated = { ...prev };
        delete updated[complaintId];
        return updated;
      });
    } catch (error) {
      alert(
        error.response?.data?.message || "Failed to assign complaint"
      );
    }
  };

  // Delete Complaint
  const deleteComplaint = async (complaintId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this complaint?"
    );

    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");
      const response = await api.delete(`/complaints/${complaintId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert(response.data.message);

      setComplaints((prevComplaints) =>
        prevComplaints.filter(
          (complaint) => complaint._id !== complaintId
        )
      );

      setSelectedSupervisors((prev) => {
        const updated = { ...prev };
        delete updated[complaintId];
        return updated;
      });

      setExpandedComplaints((prev) => {
        const updated = { ...prev };
        delete updated[complaintId];
        return updated;
      });
    } catch (error) {
      alert(
        error.response?.data?.message || "Failed to delete complaint"
      );
    }
  };

  // Status Styling
  const getStatusBadge = (status) => {
    switch (status) {
      case "Resolved":
        return {
          pill: "border-emerald-200 bg-emerald-50 text-emerald-700",
          icon: CheckCircle2,
          dot: "bg-emerald-500",
        };
      case "In Progress":
        return {
          pill: "border-purple-200 bg-purple-50 text-purple-700",
          icon: Wrench,
          dot: "bg-purple-500",
        };
      case "Assigned":
        return {
          pill: "border-blue-200 bg-blue-50 text-blue-700",
          icon: UserCheck,
          dot: "bg-blue-500",
        };
      default:
        return {
          pill: "border-amber-200 bg-amber-50 text-amber-700",
          icon: Clock,
          dot: "bg-amber-500",
        };
    }
  };

  // Priority Styling
  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "High":
        return "border-red-200 bg-red-50 text-red-700";
      case "Medium":
        return "border-amber-200 bg-amber-50 text-amber-700";
      default:
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }
  };

  // Format Date
  const formatDateTime = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSupervisorName = (complaint) => {
    if (complaint.supervisor?.name) {
      return complaint.supervisor.name;
    }
    if (typeof complaint.supervisor === "string") {
      const match = supervisors.find(
        (s) => s._id === complaint.supervisor
      );
      if (match?.name) return match.name;
    }
    return "Not Assigned";
  };

  // Filter Logic
  const filteredComplaints = complaints.filter((item) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      item.title?.toLowerCase().includes(search) ||
      item.description?.toLowerCase().includes(search) ||
      item.category?.toLowerCase().includes(search) ||
      item.block?.toLowerCase().includes(search) ||
      item.room?.toLowerCase().includes(search) ||
      item.user?.name?.toLowerCase().includes(search) ||
      item.user?.email?.toLowerCase().includes(search) ||
      item.user?.enrollmentNumber?.toLowerCase().includes(search) ||
      item._id?.toLowerCase().includes(search);

    const matchesStatus =
      statusFilter === "All" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const displayedComplaints =
    showAllComplaints || searchTerm.trim() || statusFilter !== "All"
      ? filteredComplaints
      : filteredComplaints.slice(0, 3);

  // Statistics
  const totalComplaints = complaints.length;
  const pendingComplaints = complaints.filter(
    (c) => c.status === "Pending"
  ).length;
  const assignedComplaints = complaints.filter(
    (c) => c.status === "Assigned"
  ).length;
  const inProgressComplaints = complaints.filter(
    (c) => c.status === "In Progress"
  ).length;
  const resolvedComplaints = complaints.filter(
    (c) => c.status === "Resolved"
  ).length;

  const pendingComplaintList = displayedComplaints.filter(
    (c) => c.status === "Pending"
  );
  const activeComplaints = displayedComplaints.filter(
    (c) => c.status === "Assigned" || c.status === "In Progress"
  );
  const resolvedComplaintList = displayedComplaints.filter(
    (c) => c.status === "Resolved"
  );

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-800">
      <AdminSidebar onLogout={() => setShowLogout(true)} />

      <div className="transition-all duration-300 lg:ml-64">
        {/* ================= TOP NAVBAR ================= */}
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
            <div className="flex items-center gap-4">
              <img
                src="https://www.medicaps.ac.in/public/frontend/images/medicaps-logo-fin.webp"
                alt="Medi-Caps University Logo"
                className="h-10 w-auto object-contain"
              />

              <div className="hidden h-6 w-px bg-slate-200 sm:block" />

              <div className="hidden sm:block">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                  <Sparkles className="h-3 w-3 text-indigo-600" />
                  Institutional Maintenance Console
                </span>
              </div>
            </div>

            {/* Admin Profile & Actions */}
            <div className="flex items-center gap-3.5">
              <div className="hidden text-right md:block">
                <p className="text-sm font-bold text-slate-800 leading-tight">
                  {user?.name || "Administrator"}
                </p>
                <p className="text-xs text-slate-500">
                  {user?.email || "admin@medicaps.ac.in"}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-700 font-bold text-white shadow-sm shadow-indigo-500/20">
                A
              </div>

              <button
                type="button"
                onClick={() => setShowLogout(true)}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* ================= MAIN CONTENT ================= */}
        <main className="mx-auto max-w-7xl px-6 py-8">
          {/* ================= HERO BANNER ================= */}
          <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 p-8 text-white shadow-xl sm:p-10">
            {/* Ambient background orbs */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 right-32 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl" />

            <div className="relative z-10 max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-200 backdrop-blur-md">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live Control Center
                </span>
                <span className="text-xs text-slate-300">
                  {new Date().toLocaleDateString("en-IN", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
                {user?.assignedBlocks?.length
                  ? `${user.assignedBlocks.join(", ")} Admin Dashboard`
                  : "Campus Operations & Maintenance"}
              </h1>

              <p className="mt-3 text-base text-slate-300 leading-relaxed max-w-2xl">
                Monitor live complaints, triage issues, assign supervisors, and
                streamline facility upkeep across all Medi-Caps University campus blocks.
              </p>
            </div>
          </div>

          {/* ================= STATS / KPI CARDS ================= */}
          <section className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Performance Metrics
                </h2>
                <p className="text-xs text-slate-500">
                  Real-time status breakdown across campus
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {/* TOTAL */}
              <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Total
                  </p>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-black text-slate-900">
                  {totalComplaints}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-400">
                  All logged requests
                </p>
              </div>

              {/* PENDING */}
              <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition duration-200 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
                    Pending
                  </p>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <Clock className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-black text-amber-600">
                  {pendingComplaints}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-400">
                  Awaiting supervisor
                </p>
              </div>

              {/* ASSIGNED */}
              <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
                    Assigned
                  </p>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <UserCheck className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-black text-blue-600">
                  {assignedComplaints}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-400">
                  Under supervisor review
                </p>
              </div>

              {/* IN PROGRESS */}
              <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition duration-200 hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-purple-700">
                    In Progress
                  </p>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                    <Wrench className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-black text-purple-600">
                  {inProgressComplaints}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-400">
                  Technician fixing
                </p>
              </div>

              {/* RESOLVED */}
              <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                    Resolved
                  </p>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-black text-emerald-600">
                  {resolvedComplaints}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-400">
                  Successfully completed
                </p>
              </div>
            </div>
          </section>

          {/* ================= COMPLAINTS CONTROL BAR ================= */}
          <div className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Search input */}
              <div className="relative w-full lg:max-w-md">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Search className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by student, block, room, category, ID..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-9 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Status Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { name: "All", count: totalComplaints },
                  { name: "Pending", count: pendingComplaints },
                  { name: "Assigned", count: assignedComplaints },
                  { name: "In Progress", count: inProgressComplaints },
                  { name: "Resolved", count: resolvedComplaints },
                ].map((tab) => (
                  <button
                    key={tab.name}
                    type="button"
                    onClick={() => setStatusFilter(tab.name)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                      statusFilter === tab.name
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span>{tab.name}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                        statusFilter === tab.name
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}

                {/* Show 3 vs View All toggle */}
                {!searchTerm.trim() && statusFilter === "All" && (
                  <button
                    type="button"
                    onClick={() => setShowAllComplaints(!showAllComplaints)}
                    className="ml-auto inline-flex items-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-2 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100"
                  >
                    {showAllComplaints ? "Show Recent 3" : `View All (${totalComplaints})`}
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ================= EMPTY STATE ================= */}
          {displayedComplaints.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-2xs">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Search className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-800">
                No matching complaints
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                Try adjusting your search query or status filter to see other complaints.
              </p>
              {(searchTerm || statusFilter !== "All") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("All");
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700"
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {displayedComplaints.map((complaint) => {
                const isExpanded = expandedComplaints[complaint._id];
                const badge = getStatusBadge(complaint.status);
                const BadgeIcon = badge.icon;

                return (
                  <div
                    key={complaint._id}
                    className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs transition-all duration-200 hover:border-slate-300 hover:shadow-md"
                  >
                    {/* Top status indicator bar */}
                    <div
                      className={`h-1 ${
                        complaint.status === "Resolved"
                          ? "bg-emerald-500"
                          : complaint.status === "In Progress"
                          ? "bg-purple-500"
                          : complaint.status === "Assigned"
                          ? "bg-blue-500"
                          : "bg-amber-500"
                      }`}
                    />

                    {/* Summary Row */}
                    <div className="p-5 sm:p-6">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        {/* Title & Metadata */}
                        <div className="flex items-start gap-3.5">
                          <div
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${badge.pill}`}
                          >
                            <BadgeIcon className="h-6 w-6" />
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-bold text-slate-400">
                                #{complaint._id?.slice(-6).toUpperCase()}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                {formatDateTime(complaint.createdAt)}
                              </span>
                            </div>

                            <h3 className="mt-1 text-lg font-bold text-slate-900">
                              {complaint.category}
                            </h3>

                            <p className="mt-0.5 text-sm text-slate-500">
                              Reported by{" "}
                              <span className="font-semibold text-slate-700">
                                {complaint.user?.name || "Student"}
                              </span>{" "}
                              in{" "}
                              <span className="font-semibold text-slate-700">
                                {complaint.block} (Room {complaint.room})
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Status + Priority Pills + Action */}
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${badge.pill}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`}></span>
                            {complaint.status}
                          </span>

                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${getPriorityBadge(
                              complaint.priority
                            )}`}
                          >
                            <AlertTriangle className="h-3 w-3" />
                            {complaint.priority} Priority
                          </span>

                          <button
                            type="button"
                            onClick={() => toggleComplaint(complaint._id)}
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                          >
                            <span>{isExpanded ? "Hide" : "Details"}</span>
                            {isExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* ================= EXPANDED DETAILS ================= */}
                      {isExpanded && (
                        <div className="mt-6 border-t border-slate-100 pt-6">
                          {/* 4-Item Information Grid */}
                          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                            {/* LOCATION */}
                            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                                <MapPin className="h-3.5 w-3.5 text-indigo-600" />
                                Location
                              </div>
                              <p className="mt-2 text-base font-bold text-slate-800">
                                {complaint.block}
                              </p>
                              <p className="text-xs text-slate-500">
                                Room {complaint.room} {complaint.floor ? `• Floor ${complaint.floor}` : ""}
                              </p>
                            </div>

                            {/* STUDENT */}
                            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                                <GraduationCap className="h-3.5 w-3.5 text-indigo-600" />
                                Student
                              </div>
                              <p className="mt-2 text-base font-bold text-slate-800 truncate">
                                {complaint.user?.name || "Unknown"}
                              </p>
                              <p className="text-xs font-mono text-indigo-600">
                                {complaint.user?.enrollmentNumber || "—"}
                              </p>
                              <p className="mt-1 text-xs text-slate-500 truncate">
                                {complaint.user?.email || "—"}
                              </p>
                              {complaint.mobileNumber && (
                                <p className="text-xs font-medium text-emerald-600">
                                  📞 {complaint.mobileNumber}
                                </p>
                              )}
                            </div>

                            {/* SUPERVISOR */}
                            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                                <UserCheck className="h-3.5 w-3.5 text-indigo-600" />
                                Supervisor
                              </div>
                              <p className="mt-2 text-base font-bold text-slate-800 truncate">
                                {getSupervisorName(complaint)}
                              </p>
                              <p className="text-xs text-slate-500">
                                {complaint.status === "Resolved"
                                  ? "Task finished"
                                  : complaint.supervisor
                                  ? "Assigned & Active"
                                  : "Pending Assignment"}
                              </p>
                            </div>

                            {/* PRIORITY & STATUS */}
                            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                                <ShieldAlert className="h-3.5 w-3.5 text-indigo-600" />
                                Urgency
                              </div>
                              <p className="mt-2 text-base font-bold text-slate-800">
                                {complaint.priority} Priority
                              </p>
                              <p className="text-xs text-slate-500">
                                {complaint.status} State
                              </p>
                            </div>
                          </div>

                          {/* PROBLEM DESCRIPTION */}
                          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                              <FileText className="h-3.5 w-3.5 text-slate-500" />
                              Issue Description
                            </div>
                            <p className="mt-2 text-sm leading-relaxed text-slate-700">
                              {complaint.description}
                            </p>
                          </div>

                          {/* TIMELINE */}
                          <div className="mt-4 rounded-xl border border-slate-100 bg-white p-4">
                            <div className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                              <Clock className="h-3.5 w-3.5 text-slate-500" />
                              Audit Trail
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3">
                              {/* 1. Raised */}
                              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                                <div className="flex items-center gap-2">
                                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                                    1
                                  </span>
                                  <p className="text-xs font-bold text-slate-800">
                                    Complaint Raised
                                  </p>
                                </div>
                                <p className="mt-1.5 text-xs text-slate-500">
                                  {formatDateTime(complaint.createdAt)}
                                </p>
                              </div>

                              {/* 2. Assigned */}
                              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                                      complaint.assignedAt
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-slate-200 text-slate-500"
                                    }`}
                                  >
                                    2
                                  </span>
                                  <p className="text-xs font-bold text-slate-800">
                                    Supervisor Assigned
                                  </p>
                                </div>
                                <p className="mt-1.5 text-xs text-slate-500">
                                  {complaint.assignedAt
                                    ? formatDateTime(complaint.assignedAt)
                                    : "Awaiting Assignment"}
                                </p>
                              </div>

                              {/* 3. Resolved */}
                              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                                      complaint.resolvedAt
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-slate-200 text-slate-500"
                                    }`}
                                  >
                                    3
                                  </span>
                                  <p className="text-xs font-bold text-slate-800">
                                    Issue Resolved
                                  </p>
                                </div>
                                <p className="mt-1.5 text-xs text-slate-500">
                                  {complaint.resolvedAt
                                    ? formatDateTime(complaint.resolvedAt)
                                    : "In Progress"}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* PHOTO PROOFS */}
                          {(complaint.image || complaint.completionImage) && (
                            <div className="mt-4 grid gap-4 md:grid-cols-2">
                              {complaint.image && (
                                <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                                  <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                                    <Camera className="h-3.5 w-3.5" />
                                    Initial Problem Photo
                                  </div>
                                  <img
                                    src={complaint.image}
                                    alt="Reported problem"
                                    className="h-48 w-full rounded-lg object-cover"
                                  />
                                </div>
                              )}

                              {complaint.completionImage && (
                                <div className="overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5">
                                  <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                    Completion Proof
                                  </div>
                                  <img
                                    src={complaint.completionImage}
                                    alt="Completed work"
                                    className="h-48 w-full rounded-lg object-cover"
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {/* STUDENT FEEDBACK */}
                          {complaint.status === "Resolved" && (
                            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/40 p-4">
                              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800">
                                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                                Student Rating & Feedback
                              </div>

                              {complaint.feedbackRating ? (
                                <div className="mt-2 flex items-center gap-3">
                                  <span className="font-bold text-amber-900">
                                    {complaint.feedbackRating} / 5 Stars
                                  </span>
                                  {complaint.feedbackComment && (
                                    <span className="text-sm text-slate-600 italic">
                                      "{complaint.feedbackComment}"
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <p className="mt-1 text-xs text-slate-500">
                                  No rating submitted by student yet.
                                </p>
                              )}
                            </div>
                          )}

                          {/* ACTION TOOLBAR: ASSIGN SUPERVISOR / DELETE */}
                          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 pt-4">
                            {/* Supervisor Assignment Dropdown */}
                            {complaint.status !== "Resolved" ? (
                              <div className="flex flex-1 flex-wrap items-center gap-2.5">
                                <select
                                  value={
                                    selectedSupervisors[complaint._id] ||
                                    complaint.supervisor?._id ||
                                    complaint.supervisor ||
                                    ""
                                  }
                                  onChange={(e) =>
                                    setSelectedSupervisors((prev) => ({
                                      ...prev,
                                      [complaint._id]: e.target.value,
                                    }))
                                  }
                                  className="w-full sm:w-64 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs outline-none focus:border-indigo-500"
                                >
                                  <option value="">Choose Supervisor...</option>
                                  {supervisors.map((s) => (
                                    <option key={s._id} value={s._id}>
                                      {s.name} ({s.assignedBlocks?.join(", ") || "All Blocks"})
                                    </option>
                                  ))}
                                </select>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const supervisorId =
                                      selectedSupervisors[complaint._id] ||
                                      complaint.supervisor?._id ||
                                      complaint.supervisor;
                                    assignComplaint(complaint._id, supervisorId);
                                  }}
                                  disabled={
                                    !selectedSupervisors[complaint._id] &&
                                    !complaint.supervisor
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
                                >
                                  <UserCheck className="h-3.5 w-3.5" />
                                  Assign Supervisor
                                </button>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                                <CheckCircle2 className="h-4 w-4" />
                                Work Completed & Closed
                              </span>
                            )}

                            {/* Delete Action */}
                            <button
                              type="button"
                              onClick={() => deleteComplaint(complaint._id)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-xs font-bold text-red-600 shadow-2xs transition hover:bg-red-50 hover:border-red-300"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ================= ADMIN TIP SECTION ================= */}
          <section className="mt-10">
            <div className="flex items-start gap-3.5 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-indigo-50/50 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-500/20">
                <Lightbulb className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-indigo-950">
                  CampusFix Best Practice
                </h4>
                <p className="mt-1 text-xs leading-relaxed text-indigo-800/80">
                  Assign newly reported complaints to the designated block supervisor promptly.
                  Supervisors will review and coordinate suitable technicians to resolve issues quickly.
                </p>
              </div>
            </div>
          </section>
        </main>

        {/* ================= FOOTER ================= */}
        <footer className="mt-8 border-t border-slate-200 bg-white py-6">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 text-xs text-slate-500 sm:flex-row">
            <p className="font-semibold text-slate-700">
              Medi-Caps University • Campus Maintenance System
            </p>
            <p>© {new Date().getFullYear()} CampusFix • All Rights Reserved</p>
          </div>
        </footer>

        {/* Logout Modal */}
        <LogoutModal
          isOpen={showLogout}
          onClose={() => setShowLogout(false)}
        />
      </div>
    </div>
  );
}

export default AdminDashboard;
