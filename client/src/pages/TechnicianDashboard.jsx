import { useEffect, useMemo, useState } from "react";
import {
  Wrench,
  RefreshCw,
  ClipboardList,
  Clock,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  Search,
  Building2,
  MapPin,
  Phone,
  Mail,
  GraduationCap,
  Calendar,
  ChevronDown,
  ChevronUp,
  Camera,
  Upload,
  Trash2,
  Play,
  LogOut,
  ArrowRight,
  FileText,
  User,
  ShieldCheck,
  Sparkles,
  Layers
} from "lucide-react";
import api from "../services/api";
import LogoutModal from "../components/LogoutModal";

function TechnicianDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [showLogout, setShowLogout] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const [expandedComplaints, setExpandedComplaints] = useState({});
  const [showAllComplaints, setShowAllComplaints] = useState(false);

  const [uploadingId, setUploadingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const technicianName = user?.name || "Technician";
  const specialization = user?.specialization || "Maintenance Team";

  // =========================================================
  // FETCH COMPLAINTS
  // =========================================================

  const fetchComplaints = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const token = localStorage.getItem("token");

      const response = await api.get("/complaints/assigned", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setComplaints(response.data.complaints || []);
    } catch (error) {
      console.error("Technician fetch complaints error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // =========================================================
  // DATE FORMAT
  // =========================================================

  const formatDateTime = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =========================================================
  // TOGGLE COMPLAINT
  // =========================================================

  const toggleComplaint = (complaintId) => {
    setExpandedComplaints((prev) => ({
      ...prev,
      [complaintId]: !prev[complaintId],
    }));
  };

  // =========================================================
  // STATUS & PRIORITY BADGES
  // =========================================================

  const getStatusBadge = (status) => {
    switch (status) {
      case "Resolved":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          dot: "bg-emerald-500",
          label: "Resolved",
        };
      case "In Progress":
        return {
          bg: "bg-violet-50 text-violet-700 border-violet-200",
          dot: "bg-violet-500",
          label: "In Progress",
        };
      case "Assigned":
        return {
          bg: "bg-blue-50 text-blue-700 border-blue-200",
          dot: "bg-blue-500",
          label: "Assigned",
        };
      default:
        return {
          bg: "bg-slate-100 text-slate-600 border-slate-200",
          dot: "bg-slate-400",
          label: "Pending",
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

  const getProgress = (status) => {
    if (status === "Resolved") return 100;
    if (status === "In Progress") return 66;
    if (status === "Assigned") return 33;
    return 10;
  };

  // =========================================================
  // UPDATE STATUS
  // =========================================================

  const updateStatus = async (complaintId, status) => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.patch(
        `/complaints/${complaintId}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(response.data.message || `Status updated to ${status}`);

      setComplaints((prev) =>
        prev.map((complaint) =>
          complaint._id === complaintId
            ? {
                ...complaint,
                status,
                resolvedAt:
                  status === "Resolved"
                    ? response.data.complaint?.resolvedAt ||
                      new Date().toISOString()
                    : complaint.resolvedAt,
              }
            : complaint
        )
      );
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to update complaint status"
      );
    }
  };

  // =========================================================
  // COMPLETION PHOTO
  // =========================================================

  const handleCompletionPhoto = async (complaintId, file) => {
    if (!file) return;

    try {
      setUploadingId(complaintId);

      const token = localStorage.getItem("token");

      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("upload_preset", "campusfix_upload");

      const cloudinaryResponse = await fetch(
        "https://api.cloudinary.com/v1_1/m7gxszmr/image/upload",
        {
          method: "POST",
          body: uploadData,
        }
      );

      const cloudinaryData = await cloudinaryResponse.json();

      if (!cloudinaryResponse.ok) {
        throw new Error("Image upload failed");
      }

      const imageUrl = cloudinaryData.secure_url;

      const response = await api.patch(
        `/complaints/${complaintId}/completion-photo`,
        {
          completionImage: imageUrl,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(response.data.message || "Completion photo uploaded successfully");

      setComplaints((prev) =>
        prev.map((complaint) =>
          complaint._id === complaintId
            ? {
                ...complaint,
                completionImage: imageUrl,
              }
            : complaint
        )
      );
    } catch (error) {
      alert(
        error.response?.data?.message ||
          error.message ||
          "Failed to upload completion photo"
      );
    } finally {
      setUploadingId(null);
    }
  };

  // =========================================================
  // DELETE
  // =========================================================

  const deleteComplaint = async (complaintId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this resolved complaint record?"
    );

    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");

      const response = await api.delete(`/complaints/${complaintId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert(response.data.message || "Complaint deleted successfully");

      setComplaints((prev) =>
        prev.filter((complaint) => complaint._id !== complaintId)
      );

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

  // =========================================================
  // SEARCH + FILTER
  // =========================================================

  const filteredComplaints = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return complaints.filter((complaint) => {
      const searchableText = [
        complaint.category,
        complaint.block,
        complaint.room,
        complaint.description,
        complaint.status,
        complaint.priority,
        complaint.user?.name,
        complaint.user?.email,
        complaint.user?.classSection,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !search || searchableText.includes(search);
      const matchesStatus =
        statusFilter === "All" || complaint.status === statusFilter;
      const matchesPriority =
        priorityFilter === "All" || complaint.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [complaints, searchTerm, statusFilter, priorityFilter]);

  const sortedComplaints = useMemo(() => {
    return [...filteredComplaints].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
  }, [filteredComplaints]);

  const displayedComplaints = showAllComplaints
    ? sortedComplaints
    : sortedComplaints.slice(0, 4);

  // Statistics
  const totalComplaints = complaints.length;
  const assignedComplaints = complaints.filter(
    (complaint) => complaint.status === "Assigned"
  ).length;
  const inProgressComplaints = complaints.filter(
    (complaint) => complaint.status === "In Progress"
  ).length;
  const resolvedComplaints = complaints.filter(
    (complaint) => complaint.status === "Resolved"
  ).length;
  const highPriorityComplaints = complaints.filter(
    (complaint) => complaint.priority === "High"
  ).length;

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setPriorityFilter("All");
    setShowAllComplaints(false);
  };

  // =========================================================
  // LOADING SCREEN
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <nav className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
            <div className="h-10 w-36 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-9 w-24 animate-pulse rounded-xl bg-slate-100" />
          </div>
        </nav>

        <main className="mx-auto max-w-7xl px-5 py-10 space-y-6">
          <div className="h-52 animate-pulse rounded-3xl bg-slate-200" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-2xl bg-white border border-slate-100"
              />
            ))}
          </div>
          <div className="h-24 animate-pulse rounded-2xl bg-white border border-slate-100" />
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-44 animate-pulse rounded-2xl bg-white border border-slate-100"
              />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* ================= NAVBAR ================= */}
      <nav className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {/* Logo container */}
            <div className="flex h-10 items-center rounded-lg bg-white px-2.5 shadow-sm ring-1 ring-slate-200">
              <img
                src="https://www.medicaps.ac.in/public/frontend/images/medicaps-logo-fin.webp"
                alt="Medi-Caps University"
                className="h-7 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.parentElement.innerHTML =
                    '<span class="font-black text-indigo-600 text-xs">MEDICAPS</span>';
                }}
              />
            </div>

            <div className="hidden h-6 w-px bg-slate-200 sm:block" />

            <div>
              <p className="text-sm font-black tracking-tight text-slate-900 leading-none">
                Campus<span className="text-indigo-600">Fix</span>
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
                Technician Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right md:block">
              <p className="text-xs font-bold text-slate-800 leading-none">
                {technicianName}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {specialization}
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-sm">
              {technicianName.charAt(0).toUpperCase()}
            </div>

            <button
              type="button"
              onClick={() => setShowLogout(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ================= MAIN CONTENT ================= */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 space-y-8">
        {/* ================= HERO BANNER ================= */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 p-7 text-white shadow-xl sm:p-9">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl"></div>
          <div className="pointer-events-none absolute left-1/3 -bottom-28 h-64 w-64 rounded-full bg-white/5 blur-2xl"></div>

          <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <div className="mb-3.5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Technician Field Workspace • Active Duty
              </div>

              <h1 className="text-3xl font-black tracking-tight sm:text-4xl text-white">
                Welcome back, {technicianName}
              </h1>

              <p className="mt-2 text-sm sm:text-base leading-relaxed text-indigo-100/90 max-w-xl">
                Review your assigned campus tasks, start active repairs, document completion with photos, and keep university infrastructure running smoothly.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => fetchComplaints(true)}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-indigo-700 shadow-md transition hover:bg-indigo-50 active:scale-95 disabled:opacity-60"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                  />
                  {refreshing ? "Syncing..." : "Sync Assignments"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("In Progress");
                    setShowAllComplaints(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-md transition hover:bg-white/20 active:scale-95"
                >
                  <Wrench className="h-4 w-4" />
                  View Active Jobs ({inProgressComplaints})
                </button>
              </div>
            </div>

            {/* Specialization Card */}
            <div className="hidden lg:flex flex-col gap-3 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md w-72 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">
                  Trade / Skill
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                  Ready
                </span>
              </div>
              <div className="pt-1">
                <p className="text-xl font-black text-white truncate">
                  {specialization}
                </p>
                <p className="text-xs text-indigo-200 mt-0.5">
                  Assigned maintenance category
                </p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs text-indigo-100">
                <span>Total Work: <strong className="text-white">{totalComplaints}</strong></span>
                <span>Active: <strong className="text-amber-300">{inProgressComplaints}</strong></span>
              </div>
            </div>
          </div>
        </section>

        {/* ================= HIGH PRIORITY ALERT ================= */}
        {highPriorityComplaints > 0 && (
          <div className="flex flex-col gap-4 rounded-2xl border border-rose-200 bg-rose-50/70 p-5 sm:flex-row sm:items-center sm:justify-between shadow-xs">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-rose-900">
                  {highPriorityComplaints} Urgent Maintenance{" "}
                  {highPriorityComplaints === 1 ? "Request" : "Requests"}
                </p>
                <p className="mt-0.5 text-xs text-rose-700">
                  These requests have high campus priority and require immediate on-site inspection.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setPriorityFilter("High");
                setShowAllComplaints(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-rose-700"
            >
              Filter High Priority
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* ================= STATS SECTION ================= */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Assigned
                </p>
                <p className="mt-2 text-3xl font-black text-slate-900">
                  {totalComplaints}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  All requests assigned to you
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Layers className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200/90 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Waiting to Start
                </p>
                <p className="mt-2 text-3xl font-black text-amber-600">
                  {assignedComplaints}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Assigned, ready to initiate
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-violet-200/90 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  In Progress
                </p>
                <p className="mt-2 text-3xl font-black text-violet-600">
                  {inProgressComplaints}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Active repair work
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <Wrench className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200/90 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Resolved Work
                </p>
                <p className="mt-2 text-3xl font-black text-emerald-600">
                  {resolvedComplaints}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Completed & proof verified
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
          </div>
        </section>

        {/* ================= SEARCH & FILTER PANEL ================= */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Search className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Search & Filter Tasks
              </h3>
              <p className="text-[11px] text-slate-400">
                Quickly locate maintenance jobs by room, student, or status
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_180px_180px_auto]">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowAllComplaints(false);
                }}
                placeholder="Search complaint, block, room, student..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-3 focus:ring-indigo-50"
              />
            </div>

            {/* Status Select */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setShowAllComplaints(false);
              }}
              className="rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs font-bold text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-3 focus:ring-indigo-50"
            >
              <option value="All">All Statuses</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>

            {/* Priority Select */}
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setShowAllComplaints(false);
              }}
              className="rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs font-bold text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-3 focus:ring-indigo-50"
            >
              <option value="All">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>

            {/* Reset */}
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
            >
              Reset Filters
            </button>
          </div>
        </section>

        {/* ================= COMPLAINTS SECTION ================= */}
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs">
                <ClipboardList className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight text-slate-900">
                  {showAllComplaints ? "All Assigned Jobs" : "Recent Work Queue"}
                </h3>
                <p className="text-xs text-slate-400">
                  {sortedComplaints.length === 0
                    ? "No matching assignments found"
                    : `Showing ${displayedComplaints.length} of ${sortedComplaints.length} task${
                        sortedComplaints.length !== 1 ? "s" : ""
                      }`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAllComplaints((prev) => !prev)}
              className="inline-flex w-fit items-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-3.5 py-2 text-xs font-bold text-indigo-600 shadow-xs transition hover:bg-indigo-50"
            >
              {showAllComplaints ? "Show Recent (4)" : `View All (${sortedComplaints.length})`}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Cards List */}
          {sortedComplaints.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                <Search className="h-6 w-6" />
              </div>
              <h4 className="mt-4 text-base font-bold text-slate-800">
                No matching assignments
              </h4>
              <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                No maintenance tasks match your active filters or search terms.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
              >
                Clear Search & Filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedComplaints.map((complaint, index) => {
                const isExpanded = expandedComplaints[complaint._id];
                const progress = getProgress(complaint.status);
                const badge = getStatusBadge(complaint.status);

                return (
                  <article
                    key={complaint._id}
                    className={`overflow-hidden rounded-2xl border bg-white transition-all duration-200 ${
                      isExpanded
                        ? "border-indigo-300 shadow-md ring-1 ring-indigo-100"
                        : "border-slate-200/90 shadow-sm hover:border-indigo-200 hover:shadow-md"
                    }`}
                  >
                    {/* Compact Card Header */}
                    <div className="p-5 sm:p-6">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex min-w-0 items-start gap-3.5">
                          {/* Sequential Number Badge */}
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 font-black text-indigo-600 text-sm">
                            {String(index + 1).padStart(2, "0")}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                                {complaint.category || "Maintenance"}
                              </span>

                              <span
                                className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${getPriorityBadge(
                                  complaint.priority
                                )}`}
                              >
                                {complaint.priority || "Normal"} Priority
                              </span>
                            </div>

                            <h4 className="mt-1 text-base font-bold text-slate-900 truncate">
                              {complaint.category} Issue
                            </h4>

                            <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
                              <MapPin className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                              <span>{complaint.block || "Block"}</span>
                              <span>•</span>
                              <span>Room {complaint.room || "—"}</span>
                            </p>
                          </div>
                        </div>

                        {/* Status Badge & Action Preview */}
                        <div className="flex shrink-0 items-center gap-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${badge.bg}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`}></span>
                            {badge.label}
                          </span>
                        </div>
                      </div>

                      {/* Quick Meta Row */}
                      <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
                        <div className="rounded-xl bg-slate-50/70 p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Reported By
                          </p>
                          <p className="mt-0.5 text-xs font-bold text-slate-800 truncate">
                            {complaint.user?.name || "Student"}
                          </p>
                          {complaint.mobileNumber && (
                            <a
                              href={`tel:${complaint.mobileNumber}`}
                              className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:underline"
                            >
                              <Phone className="h-3 w-3" />
                              {complaint.mobileNumber}
                            </a>
                          )}
                        </div>

                        <div className="rounded-xl bg-slate-50/70 p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Logged At
                          </p>
                          <p className="mt-0.5 text-xs font-bold text-slate-800">
                            {formatDateTime(complaint.createdAt)}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50/70 p-3">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Progress
                            </p>
                            <span className="text-xs font-black text-indigo-600">
                              {progress}%
                            </span>
                          </div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                complaint.status === "Resolved"
                                  ? "bg-emerald-500"
                                  : complaint.status === "In Progress"
                                  ? "bg-violet-500"
                                  : "bg-blue-500"
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Toggle Button */}
                    <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3 sm:px-6">
                      <button
                        type="button"
                        onClick={() => toggleComplaint(complaint._id)}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-indigo-600 shadow-xs ring-1 ring-inset ring-slate-200 transition hover:bg-indigo-50 hover:ring-indigo-200"
                      >
                        {isExpanded ? (
                          <>
                            <span>Hide Details & Actions</span>
                            <ChevronUp className="h-4 w-4" />
                          </>
                        ) : (
                          <>
                            <span>Open Task & Actions</span>
                            <ChevronDown className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </div>

                    {/* ================= EXPANDED SECTION ================= */}
                    {isExpanded && (
                      <div className="border-t border-slate-200 divide-y divide-slate-100">
                        {/* Student Details */}
                        <div className="p-5 sm:p-6 bg-slate-50/40">
                          <div className="mb-3 flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-indigo-600" />
                            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                              Student Identification
                            </h5>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-xl border border-slate-200 bg-white p-3">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                Name
                              </p>
                              <p className="mt-1 text-xs font-bold text-slate-800 truncate">
                                {complaint.user?.name || "Student"}
                              </p>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-3">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                Email
                              </p>
                              <p className="mt-1 text-xs font-semibold text-slate-600 truncate">
                                {complaint.user?.email || "—"}
                              </p>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-3">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                Class / Section
                              </p>
                              <p className="mt-1 text-xs font-bold text-indigo-600 truncate">
                                {complaint.user?.classSection || "—"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <div className="p-5 sm:p-6">
                          <div className="mb-2 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-indigo-600" />
                            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                              Issue Description
                            </h5>
                          </div>
                          <p className="rounded-xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-700">
                            {complaint.description || "No description provided."}
                          </p>
                        </div>

                        {/* Timeline */}
                        <div className="p-5 sm:p-6 bg-slate-50/40">
                          <div className="mb-3 flex items-center gap-2">
                            <Clock3 className="h-4 w-4 text-indigo-600" />
                            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                              Maintenance Timeline
                            </h5>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-xl border border-slate-200 bg-white p-3">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                01. Complaint Raised
                              </p>
                              <p className="mt-1 text-xs font-bold text-slate-800">
                                {formatDateTime(complaint.createdAt)}
                              </p>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-3">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                02. Assigned to Technician
                              </p>
                              <p className="mt-1 text-xs font-bold text-amber-600">
                                {formatDateTime(complaint.assignedAt || complaint.createdAt)}
                              </p>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-3">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                03. Resolution Date
                              </p>
                              <p className="mt-1 text-xs font-bold text-emerald-600">
                                {complaint.resolvedAt
                                  ? formatDateTime(complaint.resolvedAt)
                                  : "Pending Resolution"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Dual Photos: Problem vs Completion */}
                        <div className="p-5 sm:p-6">
                          <div className="grid gap-5 md:grid-cols-2">
                            {/* Problem Photo */}
                            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                              <div className="mb-3 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800">
                                  Problem Photo (Student)
                                </span>
                                <span className="rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                  Initial
                                </span>
                              </div>

                              {complaint.image ? (
                                <img
                                  src={complaint.image}
                                  alt="Reported problem"
                                  className="h-56 w-full rounded-lg object-cover shadow-xs"
                                />
                              ) : (
                                <div className="flex h-56 w-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white text-slate-300">
                                  <Camera className="h-8 w-8 text-slate-300" />
                                  <p className="mt-2 text-xs font-bold text-slate-400">
                                    No student photo submitted
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Completion Photo */}
                            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                              <div className="mb-3 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800">
                                  Completion Proof (Technician)
                                </span>
                                {complaint.completionImage && (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Uploaded
                                  </span>
                                )}
                              </div>

                              {!complaint.completionImage ? (
                                <label className="flex h-56 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-white p-4 text-center transition hover:border-indigo-400 hover:bg-indigo-50/50">
                                  <Camera className="h-8 w-8 text-indigo-500" />
                                  <span className="mt-3 text-xs font-bold text-slate-700">
                                    Upload Completion Photo
                                  </span>
                                  <span className="mt-0.5 text-[11px] text-slate-400">
                                    PNG, JPG or WEBP (Max 5MB)
                                  </span>

                                  <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    className="hidden"
                                    disabled={uploadingId === complaint._id}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handleCompletionPhoto(complaint._id, file);
                                      }
                                      e.target.value = "";
                                    }}
                                  />
                                </label>
                              ) : (
                                <img
                                  src={complaint.completionImage}
                                  alt="Completed repair"
                                  className="h-56 w-full rounded-lg object-cover shadow-xs"
                                />
                              )}

                              {uploadingId === complaint._id && (
                                <div className="mt-2 text-center text-xs font-bold text-indigo-600 animate-pulse">
                                  Uploading proof to Cloudinary...
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Toolbar */}
                        <div className="p-5 sm:p-6 bg-slate-50/70 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-xs font-bold text-slate-800">
                              Task Actions
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {complaint.status === "Assigned" && "Click Start Work when arriving on site."}
                              {complaint.status === "In Progress" && "Upload completion photo proof before marking resolved."}
                              {complaint.status === "Resolved" && "Work completed and verified."}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {complaint.status === "Assigned" && (
                              <button
                                type="button"
                                onClick={() => updateStatus(complaint._id, "In Progress")}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-violet-700"
                              >
                                <Play className="h-3.5 w-3.5" />
                                Start Work
                              </button>
                            )}

                            {complaint.status === "In Progress" && (
                              <button
                                type="button"
                                disabled={!complaint.completionImage}
                                onClick={() => updateStatus(complaint._id, "Resolved")}
                                title={
                                  !complaint.completionImage
                                    ? "Please upload a completion photo before resolving"
                                    : "Mark issue as resolved"
                                }
                                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition ${
                                  complaint.completionImage
                                    ? "bg-emerald-600 hover:bg-emerald-700"
                                    : "cursor-not-allowed bg-slate-300"
                                }`}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Mark as Resolved
                              </button>
                            )}

                            {complaint.status === "Resolved" && (
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Work Completed
                                </span>

                                <button
                                  type="button"
                                  onClick={() => deleteComplaint(complaint._id)}
                                  className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-600 transition hover:bg-rose-50"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="mt-12 border-t border-slate-200 bg-white py-6">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <p className="text-xs font-bold text-slate-800">
            Campus<span className="text-indigo-600">Fix</span> • Medi-Caps University
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Campus Maintenance & Field Operations Management System
          </p>
        </div>
      </footer>

      {/* Logout Modal */}
      {showLogout && (
        <LogoutModal
          isOpen={showLogout}
          onClose={() => setShowLogout(false)}
        />
      )}
    </div>
  );
}

export default TechnicianDashboard;
