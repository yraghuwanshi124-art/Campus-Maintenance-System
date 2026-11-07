import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Inbox,
  Clock,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Building2,
  MapPin,
  Calendar,
  ChevronRight,
  UserCheck,
  Users,
  ArrowRight,
  ArrowUpRight,
  Lock,
  FileText,
  Sparkles,
  Filter,
  GraduationCap,
  ShieldCheck,
  Search,
  Layers
} from "lucide-react";
import api from "../services/api";
import SupervisorSidebar from "../components/SupervisorSidebar";

const SupervisorDashboard = () => {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");

  const assignedBlocks = user?.assignedBlocks || [];

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
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
      }
    };

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
      state: {
        complaintId,
      },
    });
  };

  // Statistics
  const totalComplaints = complaints.length;

  const pendingAssignment = complaints.filter(
    (complaint) => complaint.status === "Pending" || !complaint.technician
  ).length;

  const activeComplaints = complaints.filter(
    (complaint) =>
      complaint.status === "Assigned" || complaint.status === "In Progress"
  ).length;

  const resolvedComplaints = complaints.filter(
    (complaint) => complaint.status === "Resolved"
  ).length;

  const highPriority = complaints.filter(
    (complaint) => complaint.priority === "High"
  ).length;

  // Filtered complaints
  const filteredComplaints = useMemo(() => {
    if (activeFilter === "All") return complaints;

    if (activeFilter === "Pending") {
      return complaints.filter(
        (complaint) => complaint.status === "Pending" || !complaint.technician
      );
    }

    if (activeFilter === "Active") {
      return complaints.filter(
        (complaint) =>
          complaint.status === "Assigned" || complaint.status === "In Progress"
      );
    }

    if (activeFilter === "Resolved") {
      return complaints.filter((complaint) => complaint.status === "Resolved");
    }

    if (activeFilter === "High") {
      return complaints.filter((complaint) => complaint.priority === "High");
    }

    return complaints;
  }, [complaints, activeFilter]);

  // Helpers
  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending":
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-200",
          dot: "bg-amber-500",
          label: "Pending Assignment",
        };
      case "Assigned":
        return {
          bg: "bg-blue-50 text-blue-700 border-blue-200",
          dot: "bg-blue-500",
          label: "Assigned",
        };
      case "In Progress":
        return {
          bg: "bg-violet-50 text-violet-700 border-violet-200",
          dot: "bg-violet-500",
          label: "In Progress",
        };
      case "Resolved":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          dot: "bg-emerald-500",
          label: "Resolved",
        };
      default:
        return {
          bg: "bg-slate-50 text-slate-700 border-slate-200",
          dot: "bg-slate-400",
          label: status || "Open",
        };
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "High":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "Medium":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Low":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const formatDate = (date) => {
    if (!date) return "—";
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
    return parts.join(" • ") || "Campus Grounds";
  };

  const getFilterCount = (filter) => {
    if (filter === "All") return complaints.length;
    if (filter === "Pending") return pendingAssignment;
    if (filter === "Active") return activeComplaints;
    if (filter === "Resolved") return resolvedComplaints;
    if (filter === "High") return highPriority;
    return 0;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SupervisorSidebar onLogout={handleLogout} />

      <main className="min-h-screen transition-all duration-300 lg:ml-64">
        {/* ================= HEADER ================= */}
        <header className="sticky top-0 z-20 border-b border-slate-200/90 bg-white/90 px-5 py-3.5 shadow-sm backdrop-blur-md sm:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="pl-14 lg:pl-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  CampusFix
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-semibold text-slate-500">
                  Operations Console
                </span>
              </div>
              <p className="text-base font-black tracking-tight text-slate-900">
                Supervisor Dashboard
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/supervisor/notifications")}
                className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
              </button>

              <div className="hidden sm:flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs">
                  {(user?.name || "S").charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-800 leading-none">
                    {user?.name || "Supervisor"}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {user?.email || "Supervisor Portal"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-5 sm:p-8 space-y-8">
          {/* ================= HERO ================= */}
          <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 p-7 text-white shadow-xl sm:p-9">
            <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl"></div>
            <div className="pointer-events-none absolute left-1/3 -bottom-28 h-64 w-64 rounded-full bg-white/5 blur-2xl"></div>

            <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
              <div className="max-w-2xl">
                <div className="mb-3.5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Supervisor Control Center • Active Operations
                </div>

                <h1 className="text-3xl font-black tracking-tight sm:text-4xl text-white">
                  Maintenance Operations
                </h1>

                <p className="mt-2 text-sm sm:text-base leading-relaxed text-indigo-100/90 max-w-xl">
                  Manage assigned maintenance complaints from administration, allocate qualified technicians, and monitor resolution workflows across campus blocks.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigate("/supervisor/complaints")}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-indigo-700 shadow-md transition hover:bg-indigo-50"
                  >
                    <FileText className="h-4 w-4" />
                    Manage All Complaints
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/supervisor/technicians")}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-md transition hover:bg-white/20"
                  >
                    <Users className="h-4 w-4" />
                    Manage Technicians
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Status Badge Tile */}
              <div className="hidden lg:flex flex-col gap-3 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md w-72 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">
                    Assigned Blocks
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                    Operational
                  </span>
                </div>
                <div className="pt-1">
                  <p className="text-xl font-black text-white">
                    {assignedBlocks.length > 0 ? assignedBlocks.join(", ") : "All Campus Blocks"}
                  </p>
                  <p className="text-xs text-indigo-200 mt-0.5">Assigned coverage zones</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs text-indigo-100">
                  <span>Pending: <strong className="text-amber-300">{pendingAssignment}</strong></span>
                  <span>Active: <strong className="text-white">{activeComplaints}</strong></span>
                </div>
              </div>
            </div>
          </section>

          {/* ================= STATS ================= */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <button
              type="button"
              onClick={() => setActiveFilter("All")}
              className={`rounded-2xl border p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${
                activeFilter === "All"
                  ? "border-indigo-500 bg-white shadow-md ring-2 ring-indigo-50"
                  : "border-slate-200/90 bg-white shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Received from Admin
                  </p>
                  <p className="mt-2 text-3xl font-black text-slate-900">
                    {totalComplaints}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Total assigned complaints
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Inbox className="h-5 w-5" />
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("Pending")}
              className={`rounded-2xl border p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${
                activeFilter === "Pending"
                  ? "border-amber-500 bg-white shadow-md ring-2 ring-amber-50"
                  : "border-slate-200/90 bg-white shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Pending Assignment
                  </p>
                  <p className="mt-2 text-3xl font-black text-amber-600">
                    {pendingAssignment}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Need technician allocation
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("Active")}
              className={`rounded-2xl border p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${
                activeFilter === "Active"
                  ? "border-violet-500 bg-white shadow-md ring-2 ring-violet-50"
                  : "border-slate-200/90 bg-white shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Active Complaints
                  </p>
                  <p className="mt-2 text-3xl font-black text-violet-600">
                    {activeComplaints}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Assigned or in progress
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <Wrench className="h-5 w-5" />
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("Resolved")}
              className={`rounded-2xl border p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${
                activeFilter === "Resolved"
                  ? "border-emerald-500 bg-white shadow-md ring-2 ring-emerald-50"
                  : "border-slate-200/90 bg-white shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Resolved Work
                  </p>
                  <p className="mt-2 text-3xl font-black text-emerald-600">
                    {resolvedComplaints}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Completed maintenance work
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>
            </button>
          </section>

          {/* ================= COMPLAINT SECTION ================= */}
          <section className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight text-slate-900">
                      Assigned Complaints
                    </h2>
                    <p className="text-xs text-slate-500">
                      Forwarded to you by central administration for execution.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/supervisor/complaints")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700"
                >
                  Full Complaint Manager
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
                {["All", "Pending", "Active", "High", "Resolved"].map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl border px-3.5 py-1.5 text-xs font-bold transition ${
                      activeFilter === filter
                        ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-slate-50 hover:text-indigo-600"
                    }`}
                  >
                    {filter}
                    <span
                      className={`rounded-md px-1.5 py-0.2 text-[10px] font-bold ${
                        activeFilter === filter
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {getFilterCount(filter)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5 sm:p-6">
              {loading ? (
                <div className="py-16 text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600"></div>
                  <p className="mt-3 text-xs font-bold text-slate-400">
                    Fetching complaints from server...
                  </p>
                </div>
              ) : filteredComplaints.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 py-14 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <FileText className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-slate-800">
                    No complaints match current filter
                  </h3>
                  <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                    Try switching filters or select 'All' to review all complaints.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveFilter("All")}
                    className="mt-4 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Reset Filter
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  {filteredComplaints.map((complaint) => {
                    const badge = getStatusBadge(complaint.status);
                    return (
                      <article
                        key={complaint._id}
                        className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
                      >
                        {/* Image Preview */}
                        <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                          {complaint.image ? (
                            <img
                              src={complaint.image}
                              alt="Complaint proof"
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full flex-col items-center justify-center bg-slate-50 text-slate-300">
                              <Wrench className="h-10 w-10 text-slate-300" />
                              <span className="mt-1 text-[11px] font-bold text-slate-400">
                                No image submitted
                              </span>
                            </div>
                          )}

                          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                            <span
                              className={`rounded-lg border bg-white/95 px-2 py-0.5 text-[10px] font-black shadow-sm ${getPriorityBadge(
                                complaint.priority
                              )}`}
                            >
                              {complaint.priority || "Normal"}
                            </span>

                            <span
                              className={`inline-flex items-center gap-1 rounded-lg border bg-white/95 px-2 py-0.5 text-[10px] font-bold shadow-sm ${badge.bg}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`}></span>
                              {badge.label}
                            </span>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="flex flex-1 flex-col justify-between p-4">
                          <div>
                            <div className="flex items-center justify-between gap-3">
                              <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                                {complaint.category || "Maintenance"}
                              </span>
                              <span className="text-[11px] font-semibold text-slate-400">
                                #{complaint._id?.slice(-6)}
                              </span>
                            </div>

                            <h3 className="mt-2.5 text-base font-bold text-slate-900">
                              {complaint.category} Issue
                            </h3>

                            <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-indigo-700">
                              <MapPin className="h-3 w-3 shrink-0" />
                              {getLocationText(complaint)}
                            </p>

                            <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
                              {complaint.description || "No description provided."}
                            </p>
                          </div>

                          <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                            {/* Assigned Technician */}
                            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5">
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  Technician
                                </p>
                                <p className="text-xs font-bold text-slate-800 mt-0.5">
                                  {complaint.technician?.name || "Not assigned"}
                                </p>
                              </div>
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-slate-500 shadow-xs border border-slate-200">
                                <UserCheck className="h-3.5 w-3.5" />
                              </div>
                            </div>

                            {/* Timestamps */}
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span>Reported: {formatDate(complaint.createdAt)}</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => openComplaint(complaint._id)}
                              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-indigo-600"
                            >
                              Manage Complaint
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* ================= QUICK ACTIONS ================= */}
          <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600">
                Shortcuts
              </p>
              <h2 className="mt-0.5 text-lg font-black tracking-tight text-slate-900">
                Supervisor Quick Actions
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <button
                type="button"
                onClick={() => navigate("/supervisor/complaints")}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-5 text-left transition hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-white hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100">
                    <FileText className="h-5 w-5" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-bold text-slate-800">
                    Complaint Management
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Review incoming campus requests & allocate staff.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigate("/supervisor/technicians")}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-5 text-left transition hover:-translate-y-0.5 hover:border-violet-300 hover:bg-white hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 group-hover:bg-violet-100">
                    <Users className="h-5 w-5" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-violet-600" />
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-bold text-slate-800">
                    Technician Roster
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Check technician availability & workload balance.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigate("/supervisor/notifications")}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-5 text-left transition hover:-translate-y-0.5 hover:border-amber-300 hover:bg-white hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-100">
                    <Bell className="h-5 w-5" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-amber-600" />
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-bold text-slate-800">
                    Notification Inbox
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Review administrative alerts & priority escalations.
                  </p>
                </div>
              </button>
            </div>
          </section>

          {/* ================= WORKFLOW ================= */}
          <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600">
                Operating Model
              </p>
              <h2 className="mt-0.5 text-lg font-black tracking-tight text-slate-900">
                CampusFix Maintenance Lifecycle
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-bold">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Phase 01
                </p>
                <h3 className="text-sm font-bold text-slate-800">
                  Student Reports
                </h3>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  Student flags issue with location details and photos.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 font-bold">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Phase 02
                </p>
                <h3 className="text-sm font-bold text-slate-800">
                  Admin Verification
                </h3>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  Central administration evaluates and delegates to supervisor.
                </p>
              </div>

              <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 ring-1 ring-indigo-200">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold">
                  <UserCheck className="h-4 w-4" />
                </div>
                <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                  Your Role
                </p>
                <h3 className="text-sm font-bold text-indigo-950">
                  Supervisor Assignment
                </h3>
                <p className="mt-1 text-xs text-indigo-700/80 leading-relaxed">
                  You inspect severity and dispatch the right technician.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 font-bold">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Phase 04
                </p>
                <h3 className="text-sm font-bold text-slate-800">
                  Resolution & Proof
                </h3>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  Technician completes the job and uploads completion photos.
                </p>
              </div>
            </div>
          </section>

          {/* ================= PRIVACY & ACCESS NOTICE ================= */}
          <section className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">
            <div className="flex items-start gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-xs border border-indigo-100">
                <Lock className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wide">
                  Access Control & Privacy Policy
                </h3>
                <p className="mt-0.5 text-xs text-indigo-800/80 leading-relaxed">
                  Supervisor capabilities are strictly tailored for campus maintenance operations. Personal student identifiers are masked in compliance with university data governance policies.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default SupervisorDashboard;
