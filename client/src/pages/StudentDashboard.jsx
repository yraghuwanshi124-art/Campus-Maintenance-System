import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  X,
  CheckCircle2,
  Clock,
  Wrench,
  UserCheck,
  BarChart3,
  ChevronDown,
  ChevronUp,
  MapPin,
  GraduationCap,
  Phone,
  Mail,
  AlertTriangle,
  Calendar,
  Sparkles,
  Camera,
  Trash2,
  Lightbulb,
  ArrowRight,
  PlusCircle,
  ClipboardList,
  Layers,
  HeartHandshake,
  KeyRound,
  ExternalLink,
} from "lucide-react";
import api from "../services/api";
import LogoutModal from "../components/LogoutModal";
import StudentSidebar from "../components/StudentSidebar";
import ComplaintForm from "./ComplaintForm";
import MyComplaints from "./MyComplaints";
import CampusFixChatbot from "../components/CampusFixChatbot";

function StudentDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogout, setShowLogout] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Search, filter, recent toggle, and card expansion (matching AdminDashboard)
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showAllComplaints, setShowAllComplaints] = useState(false);
  const [expandedComplaints, setExpandedComplaints] = useState({});

  const [profileImage, setProfileImage] = useState(
    localStorage.getItem("campusfix_student_profile_image") || ""
  );

  const currentSection =
    location.pathname === "/student/report"
      ? "report"
      : location.pathname === "/student/complaints"
      ? "complaints"
      : new URLSearchParams(location.search).get("section") || "dashboard";

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);

      const response = await api.get("/complaints/my", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const responseData = response.data;
      let complaintsData = [];

      if (Array.isArray(responseData)) {
        complaintsData = responseData;
      } else if (Array.isArray(responseData?.complaints)) {
        complaintsData = responseData.complaints;
      } else if (Array.isArray(responseData?.data)) {
        complaintsData = responseData.data;
      } else if (Array.isArray(responseData?.result)) {
        complaintsData = responseData.result;
      }

      setComplaints(complaintsData);
    } catch (error) {
      console.error("Failed to fetch complaints:", error);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleComplaint = (complaintId) => {
    setExpandedComplaints((prev) => ({
      ...prev,
      [complaintId]: !prev[complaintId],
    }));
  };

  // Metrics (matching AdminDashboard)
  const total = complaints.length;
  const pending = complaints.filter((item) => item.status === "Pending").length;
  const assigned = complaints.filter((item) => item.status === "Assigned").length;
  const inProgress = complaints.filter((item) => item.status === "In Progress").length;
  const resolved = complaints.filter((item) => item.status === "Resolved").length;

  // Filter logic (matching AdminDashboard)
  const filteredComplaints = complaints.filter((item) => {
    const search = searchTerm.toLowerCase().trim();

    const matchesSearch =
      !search ||
      item.title?.toLowerCase().includes(search) ||
      item.description?.toLowerCase().includes(search) ||
      item.category?.toLowerCase().includes(search) ||
      item.block?.toLowerCase().includes(search) ||
      item.room?.toLowerCase().includes(search) ||
      item._id?.toLowerCase().includes(search);

    const matchesStatus =
      statusFilter === "All" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const displayedComplaints =
    showAllComplaints || searchTerm.trim() || statusFilter !== "All"
      ? filteredComplaints
      : filteredComplaints.slice(0, 3);

  // Status Styling (matching AdminDashboard)
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

  // Priority Styling (matching AdminDashboard)
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

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const goToProfile = () => navigate("/student?section=profile");
  const goToActivity = () => navigate("/student?section=activity");
  const goToChatbot = () => navigate("/student?section=chatbot");
  const goToDashboard = () => navigate("/student");
  const goToReport = () => navigate("/student/report");
  const goToComplaints = () => navigate("/student/complaints");

  const handleProfileImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Profile image should be less than 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const image = reader.result;
      setProfileImage(image);
      localStorage.setItem("campusfix_student_profile_image", image);
    };
    reader.readAsDataURL(file);
  };

  const removeProfileImage = () => {
    setProfileImage("");
    localStorage.removeItem("campusfix_student_profile_image");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /* ------------------------------------------------------------------ */
  /* PROFILE VIEW                                                        */
  /* ------------------------------------------------------------------ */
  const renderProfile = () => {
    return (
      <div className="space-y-6">
        {/* Profile Card Header */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
          <div className="h-32 bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>
          </div>

          <div className="px-6 pb-6 sm:px-8">
            <div className="-mt-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="relative">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-indigo-50 shadow-md">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt="Student profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-black text-indigo-600">
                        {(user.name || "S").charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1.5 -right-1.5 flex h-8 w-8 items-center justify-center rounded-lg border-2 border-white bg-indigo-600 text-white shadow-sm transition hover:bg-indigo-700"
                    title="Change profile photo"
                  >
                    <Camera className="h-4 w-4" />
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImage}
                    className="hidden"
                  />
                </div>

                <div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-900">
                    {user.name || "Student"}
                  </h2>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                      <GraduationCap className="h-3.5 w-3.5" />
                      Student
                    </span>

                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Verified Student Account
                    </span>
                  </div>
                </div>
              </div>

              {profileImage && (
                <button
                  type="button"
                  onClick={removeProfileImage}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove Photo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Academic Info */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                  Academic Record
                </p>
                <h3 className="text-lg font-black text-slate-900">
                  Student Details
                </h3>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Full Name", user.name || "—"],
                ["Enrollment No.", user.enrollmentNumber || "—"],
                ["University", "Medi-Caps University"],
                ["Course", "B.Tech"],
                ["Branch", user.branch || "—"],
                ["Semester", user.semester ? `Semester ${user.semester}` : "—"],
                ["Class / Section", user.classSection || "—"],
                ["Department", user.department || "Engineering"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5"
                >
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    {label}
                  </p>
                  <p className="mt-1 text-sm font-bold truncate text-slate-800">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Account & Contact */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                  Account Credentials
                </p>
                <h3 className="text-lg font-black text-slate-900">
                  Contact & Security
                </h3>
              </div>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <Mail className="h-4 w-4 text-slate-400 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    College Email
                  </p>
                  <p className="mt-0.5 break-all text-sm font-bold text-slate-800">
                    {user.email || "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <Phone className="h-4 w-4 text-slate-400 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Registered Mobile
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-slate-800">
                    {user.phoneNumber || "Not registered"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="group flex w-full items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50/70 p-4 text-left transition hover:bg-indigo-100/70"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-indigo-950">
                      Update Password
                    </p>
                    <p className="text-xs text-indigo-600">
                      Request security code & change credentials
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-indigo-500 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ------------------------------------------------------------------ */
  /* ACTIVITY VIEW                                                      */
  /* ------------------------------------------------------------------ */
  const renderActivity = () => {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Student Complaint History
          </h2>
          <p className="text-xs text-slate-500">
            Chronological log of maintenance reports submitted to Medi-Caps University facilities
          </p>
        </div>

        {/* Metric Overview */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total Reports", value: total, icon: Layers, bg: "bg-indigo-50 text-indigo-600" },
            { label: "Pending", value: pending, icon: Clock, bg: "bg-amber-50 text-amber-600" },
            { label: "In Progress", value: inProgress, icon: Wrench, bg: "bg-purple-50 text-purple-600" },
            { label: "Resolved", value: resolved, icon: CheckCircle2, bg: "bg-emerald-50 text-emerald-600" },
          ].map((item) => {
            const IconComponent = item.icon;
            return (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {item.label}
                  </span>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.bg}`}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-black text-slate-900">
                  {item.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* Activity Feed */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
          <div className="mb-6">
            <h3 className="text-base font-bold text-slate-900">
              Complaint History Trail
            </h3>
            <p className="text-xs text-slate-400">
              Select any request to inspect status and supervisor updates
            </p>
          </div>

          {complaints.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <PlusCircle className="h-6 w-6" />
              </div>
              <p className="mt-4 font-bold text-slate-700">
                No activity logged
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Your submitted maintenance complaints will be tracked here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {complaints.map((complaint) => {
                const badge = getStatusBadge(complaint.status);
                const BadgeIcon = badge.icon;
                return (
                  <button
                    type="button"
                    key={complaint._id}
                    onClick={() => navigate(`/student/complaints?id=${complaint._id}`)}
                    className="group flex w-full items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4 text-left transition hover:border-indigo-200 hover:bg-white hover:shadow-2xs"
                  >
                    <div className="flex min-w-0 items-center gap-3.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white font-bold text-sm shadow-sm">
                        {complaint.category?.charAt(0) || "M"}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {complaint.category || "Maintenance Request"}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-400">
                          {complaint.block || "Block"} • Room {complaint.room || "—"} • {formatDate(complaint.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${badge.pill}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`}></span>
                        {complaint.status || "Pending"}
                      </span>
                      <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ------------------------------------------------------------------ */
  /* DASHBOARD MAIN VIEW (EXACTLY MATCHING ADMIN DASHBOARD UI)          */
  /* ------------------------------------------------------------------ */
  const renderDashboard = () => {
    return (
      <div className="space-y-8">
        {/* ================= HERO BANNER ================= */}
        <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 p-8 text-white shadow-xl sm:p-10">
          {/* Ambient background orbs */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 right-32 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl" />

          <div className="relative z-10 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-200 backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Student Portal
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
              Welcome back, {user?.name?.split(" ")[0] || "Student"} 👋
            </h1>

            <p className="mt-3 text-base text-slate-300 leading-relaxed max-w-2xl">
              Report campus problems, track your complaints, and help keep Medi-Caps University facilities running smoothly.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={goToReport}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-indigo-700 shadow-md transition hover:bg-indigo-50 active:scale-95"
              >
                <PlusCircle className="h-4 w-4 text-indigo-600" />
                Report a Problem
              </button>

              <button
                type="button"
                onClick={goToComplaints}
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-md transition hover:bg-white/20 active:scale-95"
              >
                <ClipboardList className="h-4 w-4" />
                Track Complaints
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
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
                Real-time status breakdown of your maintenance requests
              </p>
            </div>
            <button
              type="button"
              onClick={goToComplaints}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View detailed list →
            </button>
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
                {total}
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
                {pending}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-400">
                Awaiting review
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
                {assigned}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-400">
                Supervisor assigned
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
                {inProgress}
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
                {resolved}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-400">
                Work completed
              </p>
            </div>
          </div>
        </section>

        {/* ================= SEARCH & FILTER BAR ================= */}
        <section className="mb-8">
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by complaint, category, block, room..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-10 text-xs font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-3 focus:ring-indigo-50"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {["All", "Pending", "Assigned", "In Progress", "Resolved"].map(
                (status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                      statusFilter === status
                        ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                        : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-slate-50 hover:text-indigo-600"
                    }`}
                  >
                    <span>{status}</span>
                    <span
                      className={`rounded-md px-1.5 py-0.2 text-[10px] font-bold ${
                        statusFilter === status
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {status === "All"
                        ? total
                        : complaints.filter((c) => c.status === status).length}
                    </span>
                  </button>
                )
              )}

              {/* Show Recent 3 / View All Toggle */}
              <button
                type="button"
                onClick={() => setShowAllComplaints(!showAllComplaints)}
                className="ml-auto inline-flex items-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50/60 px-3 py-1.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100/70"
              >
                {showAllComplaints
                  ? "Show Recent (3)"
                  : `View All (${filteredComplaints.length})`}
              </button>
            </div>
          </div>
        </section>

        {/* ================= COMPLAINTS LIST ================= */}
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {showAllComplaints || searchTerm || statusFilter !== "All"
                  ? "Filtered Complaints"
                  : "Recent Complaints"}
              </h2>
              <p className="text-xs text-slate-500">
                {filteredComplaints.length === 0
                  ? "No matching requests found"
                  : `Showing ${displayedComplaints.length} of ${filteredComplaints.length} complaints`}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-2xs">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600"></div>
              <p className="mt-3 text-xs font-semibold text-slate-500">
                Loading your complaints...
              </p>
            </div>
          ) : displayedComplaints.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-2xs">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <ClipboardList className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-800">
                No complaints found
              </h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                {searchTerm || statusFilter !== "All"
                  ? "No complaints match your current search or status filter."
                  : "You haven't reported any maintenance problems yet."}
              </p>
              <button
                type="button"
                onClick={goToReport}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
              >
                <PlusCircle className="h-4 w-4" />
                Report a Problem
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedComplaints.map((complaint) => {
                const badge = getStatusBadge(complaint.status);
                const BadgeIcon = badge.icon;
                const isExpanded = expandedComplaints[complaint._id];

                return (
                  <article
                    key={complaint._id}
                    className={`group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs transition-all duration-200 hover:border-indigo-300 hover:shadow-md ${
                      complaint.status === "Pending"
                        ? "border-t-4 border-t-amber-400"
                        : complaint.status === "Assigned"
                        ? "border-t-4 border-t-blue-400"
                        : complaint.status === "In Progress"
                        ? "border-t-4 border-t-purple-400"
                        : "border-t-4 border-t-emerald-400"
                    }`}
                  >
                    {/* Header bar */}
                    <div className="p-5 sm:p-6">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 border border-indigo-100/60">
                            {complaint.category || "Maintenance"}
                          </span>
                          <span className="text-xs font-semibold text-slate-400">
                            #{complaint._id?.slice(-6)}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                            <MapPin className="h-3.5 w-3.5 text-indigo-600" />
                            {complaint.block || "Main"} • Room {complaint.room || "—"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getPriorityBadge(
                              complaint.priority
                            )}`}
                          >
                            {complaint.priority || "Normal"} Priority
                          </span>

                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${badge.pill}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`}></span>
                            <BadgeIcon className="h-3.5 w-3.5" />
                            {complaint.status || "Pending"}
                          </span>
                        </div>
                      </div>

                      {/* 4-column Meta Grid (matching Admin Dashboard) */}
                      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                        {/* Location */}
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Location
                          </p>
                          <p className="mt-1 text-xs font-bold text-slate-800 flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                            <span>
                              {complaint.block || "Main Block"}, Room {complaint.room || "—"}
                            </span>
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {complaint.floor ? `Floor ${complaint.floor}` : "Medi-Caps Campus"}
                          </p>
                        </div>

                        {/* Student (You) */}
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Reported By
                          </p>
                          <p className="mt-1 text-xs font-bold text-slate-800 flex items-center gap-1 truncate">
                            <GraduationCap className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                            <span>{user?.name || "You"}</span>
                          </p>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {user?.enrollmentNumber || user?.email || "Student Account"}
                          </p>
                        </div>

                        {/* Supervisor Status */}
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Assigned Staff
                          </p>
                          <p className="mt-1 text-xs font-bold text-slate-800 flex items-center gap-1">
                            <UserCheck className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                            <span>
                              {complaint.supervisor?.name ||
                                (typeof complaint.supervisor === "string"
                                  ? "Assigned"
                                  : "Awaiting supervisor")}
                            </span>
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {complaint.technician?.name
                              ? `Tech: ${complaint.technician.name}`
                              : "Central Operations"}
                          </p>
                        </div>

                        {/* Urgency */}
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Urgency / Raised
                          </p>
                          <p className="mt-1 text-xs font-bold text-slate-800 flex items-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            <span>{complaint.priority || "Normal"} Level</span>
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {formatDate(complaint.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* Problem Description */}
                      <div className="mt-4">
                        <p className="text-xs font-medium text-slate-600 line-clamp-2">
                          {complaint.description || "No description provided."}
                        </p>
                      </div>

                      {/* Expand / Collapse Button */}
                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                        <span className="text-[11px] font-semibold text-slate-400">
                          Filed on {formatDateTime(complaint.createdAt)}
                        </span>

                        <button
                          type="button"
                          onClick={() => toggleComplaint(complaint._id)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                        >
                          {isExpanded ? (
                            <>
                              <span>Show Less</span>
                              <ChevronUp className="h-3.5 w-3.5" />
                            </>
                          ) : (
                            <>
                              <span>Read More</span>
                              <ChevronDown className="h-3.5 w-3.5" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* ================= EXPANDED DETAILS (MATCHING ADMIN DASHBOARD) ================= */}
                    {isExpanded && (
                      <div className="border-t border-slate-200/80 bg-slate-50/50 p-5 sm:p-6 space-y-5">
                        {/* Full Description */}
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Full Problem Description
                          </h4>
                          <p className="mt-1 text-xs leading-relaxed text-slate-700 rounded-xl bg-white p-3.5 border border-slate-200/80">
                            {complaint.description || "No description provided."}
                          </p>
                        </div>

                        {/* Audit Trail Timeline */}
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Resolution Timeline Trail
                          </h4>
                          <div className="mt-2 grid gap-3 sm:grid-cols-3">
                            <div className="rounded-xl border border-slate-200/80 bg-white p-3">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                01. Complaint Raised
                              </p>
                              <p className="mt-1 text-xs font-bold text-slate-800">
                                {formatDateTime(complaint.createdAt)}
                              </p>
                              <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
                                ✓ Verified by Student
                              </p>
                            </div>

                            <div className="rounded-xl border border-slate-200/80 bg-white p-3">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                02. Supervisor Review
                              </p>
                              <p className="mt-1 text-xs font-bold text-slate-800">
                                {complaint.assignedAt
                                  ? formatDateTime(complaint.assignedAt)
                                  : "Awaiting Allocation"}
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                {complaint.supervisor?.name
                                  ? `Assigned to ${complaint.supervisor.name}`
                                  : "Pending supervisor assignment"}
                              </p>
                            </div>

                            <div className="rounded-xl border border-slate-200/80 bg-white p-3">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                03. Resolution Complete
                              </p>
                              <p className="mt-1 text-xs font-bold text-slate-800">
                                {complaint.resolvedAt
                                  ? formatDateTime(complaint.resolvedAt)
                                  : "In Progress"}
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                {complaint.status === "Resolved"
                                  ? "✓ Work completed on site"
                                  : "Repair underway"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Photos Section */}
                        <div className="grid gap-4 sm:grid-cols-2">
                          {/* Student Problem Photo */}
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                              Reported Problem Photo
                            </p>
                            {complaint.image ? (
                              <img
                                src={complaint.image}
                                alt="Problem proof"
                                className="h-48 w-full rounded-xl object-cover border border-slate-200 shadow-2xs"
                              />
                            ) : (
                              <div className="flex h-48 w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white text-slate-400">
                                <Camera className="h-6 w-6 text-slate-300" />
                                <span className="mt-1 text-xs">No photo attached</span>
                              </div>
                            )}
                          </div>

                          {/* Completion Proof Photo */}
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                              Technician Completion Proof
                            </p>
                            {complaint.completionImage ? (
                              <img
                                src={complaint.completionImage}
                                alt="Completion proof"
                                className="h-48 w-full rounded-xl object-cover border border-slate-200 shadow-2xs"
                              />
                            ) : (
                              <div className="flex h-48 w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white text-slate-400">
                                <Wrench className="h-6 w-6 text-slate-300" />
                                <span className="mt-1 text-xs">Proof not uploaded yet</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Quick Action Footer */}
                        <div className="flex items-center justify-end pt-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/student/complaints?id=${complaint._id}`)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
                          >
                            <span>Open Detailed View</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* ================= BEST PRACTICE TIPS (MATCHING ADMIN DASHBOARD) ================= */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-2xs border border-indigo-100">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-indigo-950">
                  Campus Facilities Impact
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-indigo-900/80">
                  Every accurate maintenance report enables rapid dispatch of technicians, preserving laboratories, lecture theatres, and campus amenities.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600 shadow-2xs border border-amber-100">
                <Lightbulb className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-950">
                  Quick Resolution Tip
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-amber-900/80">
                  Always provide the exact block, room number, and attach a clear photo. This ensures technicians arrive with the correct tools on the first trip.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  };

  /* ------------------------------------------------------------------ */
  /* CONTENT DISPATCHER                                                 */
  /* ------------------------------------------------------------------ */
  const renderContent = () => {
    if (location.pathname === "/student/report") {
      return <ComplaintForm isEmbedded={true} />;
    }

    if (location.pathname === "/student/complaints") {
      return <MyComplaints isEmbedded={true} />;
    }

    if (currentSection === "profile") {
      return renderProfile();
    }

    if (currentSection === "activity") {
      return renderActivity();
    }

    if (currentSection === "chatbot") {
      return <CampusFixChatbot />;
    }

    return renderDashboard();
  };

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-800">
      {/* ================= STUDENT SIDEBAR ================= */}
      <StudentSidebar
        onLogout={() => setShowLogout(true)}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? "lg:ml-64" : "lg:ml-20"
        }`}
      >
        {/* ================= TOP NAVBAR (MATCHING ADMIN DASHBOARD) ================= */}
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
            <div className="flex items-center gap-4">
              <img
                src="https://www.medicaps.ac.in/public/frontend/images/medicaps-logo-fin.webp"
                alt="Medi-Caps University Logo"
                className="h-10 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.parentElement.innerHTML =
                    '<span class="font-black text-indigo-600 text-sm">MEDICAPS</span>';
                }}
              />

              <div className="hidden h-6 w-px bg-slate-200 sm:block" />

              <div className="hidden sm:block">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                  <Sparkles className="h-3 w-3 text-indigo-600" />
                  Student Maintenance Portal • Medi-Caps University
                </span>
              </div>
            </div>

            {/* Student Profile & Actions */}
            <div className="flex items-center gap-3.5">
              <div className="hidden text-right md:block">
                <p className="text-sm font-bold text-slate-800 leading-tight">
                  {user?.name || "Student"}
                </p>
                <p className="text-xs text-slate-500">
                  {user?.enrollmentNumber || user?.email || "Student Account"}
                </p>
              </div>

              <button
                type="button"
                onClick={goToProfile}
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-700 font-bold text-white shadow-sm shadow-indigo-500/20 transition hover:opacity-90"
                title="View Profile"
              >
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  (user?.name || "S").charAt(0).toUpperCase()
                )}
              </button>

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
          {renderContent()}
        </main>

        {/* ================= FOOTER ================= */}
        <footer className="border-t border-slate-200/80 bg-white py-6">
          <div className="mx-auto max-w-7xl px-6 flex flex-col gap-2 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <p className="text-xs font-medium text-slate-500">
              © {new Date().getFullYear()} CampusFix • Medi-Caps University
            </p>
            <p className="text-xs font-medium text-slate-400">
              Institutional Maintenance Management System
            </p>
          </div>
        </footer>
      </div>

      {/* ================= LOGOUT MODAL ================= */}
      {showLogout && (
        <LogoutModal
          isOpen={showLogout}
          onClose={() => setShowLogout(false)}
        />
      )}
    </div>
  );
}

export default StudentDashboard;
