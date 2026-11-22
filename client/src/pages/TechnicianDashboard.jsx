
import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import LogoutModal from "../components/LogoutModal";
import TechnicianSidebar from "../components/TechnicianSidebar";
import { useTheme } from "../context/ThemeContext";

function TechnicianDashboard() {
  const { darkMode } = useTheme();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const technicianName = user?.name || "Technician";
  const specialization = user?.specialization || "Maintenance Team";

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
  const [resolutionRemarks, setResolutionRemarks] = useState({});
  const [selectedFiles, setSelectedFiles] = useState({});

  // DEADLINE HELPERS
  const getDeadlineState = (complaint) => {
    if (!complaint?.deadline) return "Not Set";
    if (complaint.status === "Resolved") return "Completed";
    const difference = new Date(complaint.deadline).getTime() - Date.now();
    if (difference <= 0) return "Overdue";
    if (difference <= 2 * 60 * 60 * 1000) return "Urgent";
    return "On Track";
  };

  const getRemainingTime = (deadline, status) => {
    if (!deadline) return "No deadline set";
    if (status === "Resolved") return "Work completed";
    const difference = new Date(deadline).getTime() - Date.now();
    if (difference <= 0) {
      const minutesOver = Math.abs(Math.floor(difference / 60000));
      const hoursOver = Math.floor(minutesOver / 60);
      return hoursOver > 0
        ? `Overdue by ${hoursOver}h ${minutesOver % 60}m`
        : `Overdue by ${minutesOver}m`;
    }
    const hours = Math.floor(difference / 3600000);
    const minutes = Math.floor((difference % 3600000) / 60000);
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h remaining`;
    }
    return hours > 0
      ? `${hours}h ${minutes}m remaining`
      : `${minutes}m remaining`;
  };

  const getDeadlineBadgeStyle = (state) => {
    if (state === "Completed") {
      return darkMode
        ? "border-emerald-800 bg-emerald-950/80 text-emerald-300"
        : "border-emerald-200 bg-emerald-50 text-emerald-700";
    }
    if (state === "Overdue") {
      return darkMode
        ? "border-red-800 bg-red-950/80 text-red-300 animate-pulse"
        : "border-red-200 bg-red-50 text-red-700 animate-pulse";
    }
    if (state === "Urgent") {
      return darkMode
        ? "border-amber-800 bg-amber-950/80 text-amber-300"
        : "border-amber-200 bg-amber-50 text-amber-700";
    }
    if (state === "On Track") {
      return darkMode
        ? "border-blue-800 bg-blue-950/80 text-blue-300"
        : "border-blue-200 bg-blue-50 text-blue-700";
    }
    return darkMode
      ? "border-slate-700 bg-slate-800 text-slate-400"
      : "border-slate-200 bg-slate-100 text-slate-500";
  };

  // THEME STYLES
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

  // FETCH ASSIGNED COMPLAINTS
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
      console.error(
        "TECHNICIAN DASHBOARD ERROR:",
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

  // DATE FORMAT
  const formatDateTime = (date) => {
    if (!date) return "Not available";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Not available";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // STATUS STYLE
  const getStatusStyle = (status) => {
    const styles = {
      Resolved: darkMode
        ? "border-emerald-800 bg-emerald-950 text-emerald-300"
        : "border-emerald-200 bg-emerald-50 text-emerald-700",

      "In Progress": darkMode
        ? "border-violet-800 bg-violet-950 text-violet-300"
        : "border-violet-200 bg-violet-50 text-violet-700",

      Assigned: darkMode
        ? "border-amber-800 bg-amber-950 text-amber-300"
        : "border-amber-200 bg-amber-50 text-amber-700",
    };

    return (
      styles[status] ||
      (darkMode
        ? "border-slate-600 bg-slate-700 text-slate-300"
        : "border-slate-200 bg-slate-50 text-slate-600")
    );
  };

  // PRIORITY STYLE
  const getPriorityStyle = (priority) => {
    const styles = {
      High: darkMode
        ? "border-red-800 bg-red-950 text-red-300"
        : "border-red-200 bg-red-50 text-red-700",

      Medium: darkMode
        ? "border-orange-800 bg-orange-950 text-orange-300"
        : "border-orange-200 bg-orange-50 text-orange-700",

      Low: darkMode
        ? "border-emerald-800 bg-emerald-950 text-emerald-300"
        : "border-emerald-200 bg-emerald-50 text-emerald-700",
    };

    return (
      styles[priority] ||
      (darkMode
        ? "border-slate-600 bg-slate-700 text-slate-300"
        : "border-slate-200 bg-slate-50 text-slate-600")
    );
  };

  // PROGRESS
  const getProgress = (status, verificationStatus) => {
    if (status === "Resolved" || verificationStatus === "Approved") return 100;
    if (verificationStatus === "Pending") return 85;
    if (status === "In Progress") return 66;
    if (status === "Assigned") return 33;
    return 0;
  };

  // TOGGLE DETAILS
  const toggleComplaint = (complaintId) => {
    setExpandedComplaints((prev) => ({
      ...prev,
      [complaintId]: !prev[complaintId],
    }));
  };

  // UPDATE STATUS
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

      alert(response.data.message);

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

  // COMPLETION PHOTO & REMARKS SUBMISSION (FOR SUPERVISOR VERIFICATION)
  const handleCompletionSubmit = async (complaintId, fileOverride) => {
    const file = fileOverride || selectedFiles[complaintId];
    const targetComplaint = complaints.find((c) => c._id === complaintId);
    const remarks = (
      resolutionRemarks[complaintId] ??
      targetComplaint?.resolutionRemarks ??
      ""
    ).trim();

    if (!remarks) {
      alert("Please enter resolution remarks describing the work performed.");
      return;
    }

    if (!file && !targetComplaint?.completionImage) {
      alert("Please select a completion photo before submitting.");
      return;
    }

    if (file && !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      alert("Please upload a JPG, PNG or WEBP image.");
      return;
    }

    try {
      setUploadingId(complaintId);

      let imageUrl = targetComplaint?.completionImage || "";

      if (file) {
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

        imageUrl = cloudinaryData.secure_url;
      }

      const response = await api.patch(
        `/complaints/${complaintId}/completion-photo`,
        {
          completionImage: imageUrl,
          resolutionRemarks: remarks,
        }
      );

      alert(
        response.data.message ||
          "Completion details submitted for supervisor verification."
      );

      setComplaints((prev) =>
        prev.map((complaint) =>
          complaint._id === complaintId
            ? {
                ...complaint,
                completionImage: imageUrl,
                resolutionRemarks: remarks,
                verificationStatus: "Pending",
              }
            : complaint
        )
      );

      setSelectedFiles((prev) => ({ ...prev, [complaintId]: null }));
    } catch (error) {
      alert(
        error.response?.data?.message ||
          error.message ||
          "Failed to submit completion details"
      );
    } finally {
      setUploadingId(null);
    }
  };

  // DELETE RESOLVED COMPLAINT
  const deleteComplaint = async (complaintId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this resolved complaint?"
    );

    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");

      const response = await api.delete(
        `/complaints/${complaintId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(response.data.message);

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
        error.response?.data?.message ||
          "Failed to delete complaint"
      );
    }
  };

  // FILTER + SEARCH
  const filteredComplaints = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return complaints.filter((complaint) => {
      const searchableText = [
        complaint._id,
        complaint.category,
        complaint.block,
        complaint.floor,
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

      const matchesSearch =
        !search || searchableText.includes(search);

      const matchesStatus =
        statusFilter === "All" ||
        complaint.status === statusFilter;

      const matchesPriority =
        priorityFilter === "All" ||
        complaint.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [complaints, searchTerm, statusFilter, priorityFilter]);

  const sortedComplaints = useMemo(
    () =>
      [...filteredComplaints].sort(
        (a, b) =>
          new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      ),
    [filteredComplaints]
  );

  const displayedComplaints = showAllComplaints
    ? sortedComplaints
    : sortedComplaints.slice(0, 4);

  // STATISTICS
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

  const getFilterCount = (filter) => {
    if (filter === "All") return totalComplaints;
    if (filter === "Assigned") return assignedComplaints;
    if (filter === "In Progress") return inProgressComplaints;
    if (filter === "Resolved") return resolvedComplaints;
    return 0;
  };

  // RESET FILTERS
  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setPriorityFilter("All");
    setShowAllComplaints(false);
  };

  // STATS CONFIGURATION
  const stats = [
    {
      label: "Total Assigned",
      value: totalComplaints,
      note: "All assigned maintenance requests",
      icon: "📋",
      color: "indigo",
      filter: "All",
    },
    {
      label: "Pending Work",
      value: assignedComplaints,
      note: "Waiting to be started",
      icon: "⏳",
      color: "amber",
      filter: "Assigned",
    },
    {
      label: "In Progress",
      value: inProgressComplaints,
      note: "Currently being handled",
      icon: "🔧",
      color: "violet",
      filter: "In Progress",
    },
    {
      label: "Resolved",
      value: resolvedComplaints,
      note: "Successfully completed",
      icon: "✓",
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

  const filters = ["All", "Assigned", "In Progress", "Resolved"];

  // LOADING SCREEN
  if (loading) {
    return (
      <div className={`min-h-screen ${pageBg}`}>
        <TechnicianSidebar
          activeFilter={statusFilter}
          onFilterChange={setStatusFilter}
          onLogout={() => setShowLogout(true)}
        />

        <main className="min-h-screen p-5 transition-all duration-300 lg:ml-64 sm:p-8">
          <div className="mb-7 flex items-center justify-between">
            <div className="pl-14 lg:pl-0">
              <div className={`h-3 w-36 animate-pulse rounded ${softBg}`} />
              <div className={`mt-3 h-7 w-60 animate-pulse rounded ${softBg}`} />
            </div>
            <div className={`h-10 w-24 animate-pulse rounded-xl ${softBg}`} />
          </div>

          <div className="space-y-6">
            <div className={`h-64 animate-pulse rounded-3xl ${softBg}`} />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className={`h-36 animate-pulse rounded-2xl ${softBg}`}
                />
              ))}
            </div>

            <div className={`h-48 animate-pulse rounded-3xl ${softBg}`} />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${pageBg}`}
    >
      <TechnicianSidebar
        activeFilter={statusFilter}
        onFilterChange={(filter) => {
          setStatusFilter(filter);
          setShowAllComplaints(false);
        }}
        onLogout={() => setShowLogout(true)}
      />

      <main className="min-h-screen transition-all duration-300 lg:ml-64">
        {/* HEADER */}
        <header
          className={`sticky top-0 z-20 border-b px-5 py-4 shadow-sm backdrop-blur-xl sm:px-8 ${headerBg}`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="pl-14 lg:pl-0">
              <p
                className={`text-xs font-bold uppercase tracking-[0.2em] ${mutedText}`}
              >
                CampusFix / Maintenance Operations
              </p>

              <h1 className={`mt-1 text-lg font-black sm:text-xl ${heading}`}>
                Technician Dashboard
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fetchComplaints(true)}
                disabled={refreshing}
                className={`flex h-11 items-center gap-2 rounded-xl border px-3 text-sm font-bold transition ${
                  darkMode
                    ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className={refreshing ? "animate-spin" : ""}>↻</span>
                <span className="hidden sm:inline">
                  {refreshing ? "Refreshing..." : "Refresh"}
                </span>
              </button>

              <div
                className={`hidden items-center gap-3 rounded-xl border px-3 py-2 sm:flex ${
                  darkMode
                    ? "border-slate-700 bg-slate-800"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-black text-white">
                  {technicianName.charAt(0).toUpperCase()}
                </div>

                <div>
                  <p className={`text-xs font-extrabold ${heading}`}>
                    {technicianName}
                  </p>
                  <p className={`text-[10px] ${mutedText}`}>
                    Technician
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="space-y-7 p-5 sm:p-8">
          {/* HERO */}
          <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 p-7 text-white shadow-xl shadow-indigo-950/15 sm:p-9">
            <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full border-[35px] border-white/5" />
            <div className="pointer-events-none absolute -bottom-28 right-44 h-64 w-64 rounded-full bg-white/5 blur-2xl" />

            <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
              <div className="max-w-2xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
                  TECHNICIAN WORKSPACE
                </div>

                <p className="text-xl font-semibold text-indigo-100 sm:text-2xl">
                  Welcome back, {technicianName}
                </p>

                <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                  Keep Your Campus Running Smoothly.
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100 sm:text-base">
                  Manage your assigned maintenance requests, track work
                  progress, and document completed tasks with photo proof.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      resetFilters();
                      document
                        .getElementById("assigned-work")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="rounded-xl bg-white px-5 py-3 text-sm font-black text-indigo-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-50"
                  >
                    View My Tasks →
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter("In Progress");
                      document
                        .getElementById("assigned-work")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
                  >
                    Continue Active Work
                  </button>
                </div>
              </div>

              <div className="hidden min-w-56 rounded-3xl border border-white/15 bg-white/10 p-6 text-center backdrop-blur-md lg:block">
                <div className="text-5xl">🛠️</div>
                <p className="mt-3 text-sm font-black">Maintenance Team</p>
                <p className="mt-1 text-xs text-indigo-100">
                  {specialization}
                </p>

                <div className="mt-5 border-t border-white/15 pt-4">
                  <p className="text-3xl font-black">{totalComplaints}</p>
                  <p className="mt-1 text-xs text-indigo-100">
                    Assigned Tasks
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* STATISTICS */}
          <section>
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p
                  className={`text-xs font-bold uppercase tracking-widest ${mutedText}`}
                >
                  OVERVIEW
                </p>
                <h2 className={`mt-1 text-xl font-black ${heading}`}>
                  Work Summary
                </h2>
              </div>

              <p className={`hidden text-xs font-semibold sm:block ${mutedText}`}>
                Select a card to filter tasks
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <button
                  key={stat.label}
                  type="button"
                  onClick={() => {
                    setStatusFilter(stat.filter);
                    setShowAllComplaints(false);
                  }}
                  className={`group rounded-2xl border p-5 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg ${
                    statusFilter === stat.filter
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

                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${colorStyles[stat.color]}`}
                    >
                      {stat.icon}
                    </div>
                  </div>

                  <p className={`mt-2 text-xs font-medium ${mutedText}`}>
                    {stat.note}
                  </p>

                  <div
                    className={`mt-4 h-1 overflow-hidden rounded-full ${
                      darkMode ? "bg-slate-700" : "bg-slate-100"
                    }`}
                  >
                    <div
                      className={`h-full rounded-full ${
                        stat.color === "indigo"
                          ? "bg-indigo-500"
                          : stat.color === "amber"
                            ? "bg-amber-500"
                            : stat.color === "violet"
                              ? "bg-violet-500"
                              : "bg-emerald-500"
                      }`}
                      style={{
                        width: `${
                          totalComplaints
                            ? Math.min(
                                (stat.value / totalComplaints) * 100,
                                100
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* PRIORITY ALERT */}
          {highPriorityComplaints > 0 && (
            <section
              className={`flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between ${
                darkMode
                  ? "border-red-900 bg-red-950/40"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ${
                    darkMode ? "bg-red-900/50" : "bg-red-100"
                  }`}
                >
                  🚨
                </div>

                <div>
                  <h3
                    className={`font-extrabold ${
                      darkMode ? "text-red-300" : "text-red-800"
                    }`}
                  >
                    {highPriorityComplaints} High-Priority{" "}
                    {highPriorityComplaints === 1
                      ? "Complaint"
                      : "Complaints"}
                  </h3>

                  <p
                    className={`mt-1 text-sm ${
                      darkMode ? "text-red-200" : "text-red-600"
                    }`}
                  >
                    Review these maintenance requests carefully.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPriorityFilter("High");
                  setStatusFilter("All");
                  setShowAllComplaints(true);
                }}
                className="w-fit rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-700"
              >
                View High Priority →
              </button>
            </section>
          )}

          {/* TASK MANAGEMENT */}
          <section
            id="assigned-work"
            className={`overflow-hidden rounded-3xl border shadow-sm ${panel}`}
          >
            <div className={`border-b p-5 sm:p-6 ${borderLine}`}>
              <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
                <div>
                  <p
                    className={`text-xs font-bold uppercase tracking-widest ${mutedText}`}
                  >
                    MAINTENANCE MANAGEMENT
                  </p>

                  <h2 className={`mt-1 text-xl font-black ${heading}`}>
                    My Assigned Complaints
                  </h2>

                  <p className={`mt-1 text-sm ${mutedText}`}>
                    Review, search and update your maintenance tasks.
                  </p>
                </div>

                <div
                  className={`rounded-xl border px-4 py-2.5 text-xs font-bold ${
                    darkMode
                      ? "border-slate-700 bg-slate-800 text-slate-300"
                      : "border-slate-200 bg-slate-50 text-slate-600"
                  }`}
                >
                  {sortedComplaints.length} Matching Tasks
                </div>
              </div>

              {/* SEARCH */}
              <div className="relative mt-6">
                <span
                  className={`absolute left-4 top-1/2 -translate-y-1/2 ${mutedText}`}
                >
                  🔍
                </span>

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowAllComplaints(false);
                  }}
                  placeholder="Search by complaint, category, room or student..."
                  className={`w-full rounded-xl border py-3.5 pl-11 pr-12 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 ${
                    darkMode
                      ? "border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                      : "border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400"
                  }`}
                />

                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 ${mutedText}`}
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* FILTERS */}
              <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {filters.map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => {
                        setStatusFilter(filter);
                        setShowAllComplaints(false);
                      }}
                      className={`flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-black transition ${
                        statusFilter === filter
                          ? "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                          : darkMode
                            ? "border-slate-700 bg-slate-800 text-slate-300 hover:border-indigo-500"
                            : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200"
                      }`}
                    >
                      {filter}
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                          statusFilter === filter
                            ? "bg-white/20"
                            : darkMode
                              ? "bg-slate-700"
                              : "bg-slate-100"
                        }`}
                      >
                        {getFilterCount(filter)}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={priorityFilter}
                    onChange={(e) => {
                      setPriorityFilter(e.target.value);
                      setShowAllComplaints(false);
                    }}
                    className={`min-w-36 rounded-xl border px-3.5 py-2.5 text-xs font-bold outline-none focus:border-indigo-500 ${
                      darkMode
                        ? "border-slate-700 bg-slate-800 text-slate-200"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    <option value="All">All Priorities</option>
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>

                  <button
                    type="button"
                    onClick={resetFilters}
                    className={`rounded-xl border px-4 py-2.5 text-xs font-bold transition ${
                      darkMode
                        ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>

            {/* COMPLAINT LIST HEADER */}
            <div className="flex flex-col justify-between gap-3 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
              <div>
                <h3 className={`text-lg font-black ${heading}`}>
                  {statusFilter === "All"
                    ? "All Assigned Tasks"
                    : `${statusFilter} Tasks`}
                </h3>

                <p className={`mt-1 text-xs ${mutedText}`}>
                  Showing {displayedComplaints.length} of{" "}
                  {sortedComplaints.length} matching complaints
                </p>
              </div>

              {sortedComplaints.length > 4 && (
                <button
                  type="button"
                  onClick={() => setShowAllComplaints((prev) => !prev)}
                  className="w-fit rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-indigo-700"
                >
                  {showAllComplaints ? "Show Recent ↑" : "View All Tasks →"}
                </button>
              )}
            </div>

            {/* EMPTY STATE */}
            {sortedComplaints.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div
                  className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-4xl ${
                    darkMode ? "bg-slate-800" : "bg-slate-100"
                  }`}
                >
                  🔍
                </div>

                <h3 className={`mt-5 text-xl font-black ${heading}`}>
                  No Complaints Found
                </h3>

                <p className={`mx-auto mt-2 max-w-md text-sm ${mutedText}`}>
                  No assigned maintenance requests match your current
                  search or filters.
                </p>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="space-y-4 px-5 pb-6 sm:px-6">
                {displayedComplaints.map((complaint, index) => {
                  const isExpanded = expandedComplaints[complaint._id];
                  const progress = getProgress(complaint.status, complaint.verificationStatus);
                  const deadlineState = getDeadlineState(complaint);

                  return (
                    <article
                      key={complaint._id}
                      className={`overflow-hidden rounded-2xl border transition duration-200 ${
                        isExpanded
                          ? darkMode
                            ? "border-indigo-700 shadow-lg shadow-black/20"
                            : "border-indigo-200 shadow-lg shadow-indigo-950/5"
                          : card
                      }`}
                    >
                      {/* COMPLAINT SUMMARY */}
                      <div className="p-5 sm:p-6">
                        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                          <div className="flex min-w-0 items-start gap-4">
                            <div
                              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-black ${
                                darkMode
                                  ? "bg-indigo-950 text-indigo-300"
                                  : "bg-indigo-50 text-indigo-600"
                              }`}
                            >
                              {String(index + 1).padStart(2, "0")}
                            </div>

                            <div className="min-w-0">
                              <div className="mb-2 flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-500">
                                  Maintenance Request
                                </span>

                                <span
                                  className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${getPriorityStyle(
                                    complaint.priority
                                  )}`}
                                >
                                  {complaint.priority || "Normal"} Priority
                                </span>
                              </div>

                              <h4 className={`text-lg font-black sm:text-xl ${heading}`}>
                                {complaint.category || "Maintenance Issue"}
                              </h4>

                              <p className={`mt-1 text-sm ${mutedText}`}>
                                📍 {complaint.block || "Unknown Block"}
                                {complaint.floor
                                  ? ` • Floor ${complaint.floor}`
                                  : ""}
                                {" • "}Room {complaint.room || "N/A"}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`w-fit shrink-0 rounded-full border px-4 py-2 text-xs font-extrabold ${getStatusStyle(
                              complaint.status
                            )}`}
                          >
                            {complaint.status || "Pending"}
                          </span>
                        </div>

                        {/* QUICK DETAILS */}
                        <div
                          className={`mt-5 grid gap-3 border-t pt-5 sm:grid-cols-2 lg:grid-cols-4 ${borderLine}`}
                        >
                          <div className={`rounded-xl p-4 ${softBg}`}>
                            <p className={`text-[10px] font-extrabold uppercase tracking-widest ${mutedText}`}>
                              Reported By
                            </p>
                            <p className={`mt-2 truncate text-sm font-bold ${heading}`}>
                              {complaint.user?.name || "Unknown Student"}
                            </p>
                            {complaint.mobileNumber && (
                              <p className="mt-1 text-xs font-semibold text-emerald-500">
                                📞 {complaint.mobileNumber}
                              </p>
                            )}
                          </div>

                          <div className={`rounded-xl p-4 ${softBg}`}>
                            <p className={`text-[10px] font-extrabold uppercase tracking-widest ${mutedText}`}>
                              Complaint Raised
                            </p>
                            <p className={`mt-2 text-sm font-bold ${heading}`}>
                              {formatDateTime(complaint.createdAt)}
                            </p>
                          </div>

                          {/* RESOLUTION DEADLINE (READ-ONLY) */}
                          <div className={`rounded-xl p-4 ${softBg}`}>
                            <div className="flex items-center justify-between gap-1">
                              <p className={`text-[10px] font-extrabold uppercase tracking-widest ${mutedText}`}>
                                Deadline
                              </p>
                              <span
                                className={`rounded-full border px-2 py-0.5 text-[9px] font-extrabold ${getDeadlineBadgeStyle(
                                  deadlineState
                                )}`}
                              >
                                {deadlineState}
                              </span>
                            </div>
                            <p className={`mt-2 text-xs font-bold ${heading}`}>
                              {complaint.deadline ? formatDateTime(complaint.deadline) : "Not Set"}
                            </p>
                            <p className={`mt-1 text-[11px] ${mutedText}`}>
                              {getRemainingTime(complaint.deadline, complaint.status)}
                            </p>
                          </div>

                          <div className={`rounded-xl p-4 ${softBg}`}>
                            <div className="flex items-center justify-between">
                              <p className={`text-[10px] font-extrabold uppercase tracking-widest ${mutedText}`}>
                                Work Progress
                              </p>
                              <span className="text-xs font-black text-indigo-500">
                                {progress}%
                              </span>
                            </div>

                            <div
                              className={`mt-3 h-2 overflow-hidden rounded-full ${
                                darkMode ? "bg-slate-700" : "bg-slate-200"
                              }`}
                            >
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  complaint.status === "Resolved"
                                    ? "bg-emerald-500"
                                    : complaint.status === "In Progress"
                                      ? "bg-violet-500"
                                      : "bg-amber-500"
                                }`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex justify-end">
                          <button
                            type="button"
                            onClick={() => toggleComplaint(complaint._id)}
                            className={`rounded-xl px-4 py-2.5 text-xs font-extrabold transition ${
                              darkMode
                                ? "bg-slate-700 text-indigo-300 hover:bg-slate-600"
                                : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                            }`}
                          >
                            {isExpanded ? "Hide Details ↑" : "View Details →"}
                          </button>
                        </div>
                      </div>

                      {/* EXPANDED DETAILS */}
                      {isExpanded && (
                        <div className={`border-t ${borderLine}`}>
                          {/* STUDENT INFORMATION */}
                          <section className="p-5 sm:p-6">
                            <div
                              className={`rounded-2xl border p-5 ${
                                darkMode
                                  ? "border-indigo-900 bg-indigo-950/30"
                                  : "border-indigo-100 bg-indigo-50/60"
                              }`}
                            >
                              <div className="mb-5 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg text-white">
                                  👨‍🎓
                                </div>
                                <div>
                                  <h5 className={`font-extrabold ${heading}`}>
                                    Student Information
                                  </h5>
                                  <p className={`text-xs ${mutedText}`}>
                                    Details provided with the complaint
                                  </p>
                                </div>
                              </div>

                              <div className="grid gap-3 sm:grid-cols-3">
                                {[
                                  {
                                    label: "Student Name",
                                    value: complaint.user?.name || "Unknown",
                                  },
                                  {
                                    label: "Email Address",
                                    value: complaint.user?.email || "Not available",
                                  },
                                  {
                                    label: "Class / Section",
                                    value: complaint.user?.classSection || "Not available",
                                  },
                                ].map((item) => (
                                  <div
                                    key={item.label}
                                    className={`rounded-xl border p-4 ${
                                      darkMode
                                        ? "border-slate-700 bg-slate-900"
                                        : "border-slate-200 bg-white"
                                    }`}
                                  >
                                    <p className={`text-[10px] font-extrabold uppercase tracking-widest ${mutedText}`}>
                                      {item.label}
                                    </p>
                                    <p className={`mt-2 break-words text-sm font-bold ${heading}`}>
                                      {item.value}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </section>

                          {/* DESCRIPTION */}
                          <section className="px-5 pb-5 sm:px-6">
                            <div className={`rounded-2xl border p-5 ${card}`}>
                              <p className={`text-xs font-extrabold uppercase tracking-widest ${mutedText}`}>
                                Problem Description
                              </p>
                              <p
                                className={`mt-3 rounded-xl p-4 text-sm leading-7 ${
                                  darkMode
                                    ? "bg-slate-900 text-slate-300"
                                    : "bg-slate-50 text-slate-700"
                                }`}
                              >
                                {complaint.description ||
                                  "No description provided."}
                              </p>
                            </div>
                          </section>

                          {/* TIMELINE */}
                          <section className="px-5 pb-5 sm:px-6">
                            <div className={`rounded-2xl border p-5 ${card}`}>
                              <div className="mb-5">
                                <h5 className={`font-extrabold ${heading}`}>
                                  Complaint Timeline
                                </h5>
                                <p className={`mt-1 text-xs ${mutedText}`}>
                                  Track the maintenance request journey.
                                </p>
                              </div>

                              <div className="grid gap-3 md:grid-cols-3">
                                {[
                                  {
                                    title: "Complaint Raised",
                                    date: complaint.createdAt,
                                    description: "Student submitted the request.",
                                    icon: "✓",
                                    color: "blue",
                                    complete: true,
                                  },
                                  {
                                    title: "Technician Assigned",
                                    date: complaint.assignedAt,
                                    description: "Request assigned to your account.",
                                    icon: "2",
                                    color: "amber",
                                    complete: Boolean(complaint.assignedAt),
                                  },
                                  {
                                    title: "Resolution",
                                    date: complaint.resolvedAt,
                                    description: "Maintenance issue resolved.",
                                    icon: "3",
                                    color: "emerald",
                                    complete: Boolean(complaint.resolvedAt),
                                  },
                                ].map((step) => (
                                  <div
                                    key={step.title}
                                    className={`rounded-xl border p-4 ${
                                      darkMode
                                        ? "border-slate-700 bg-slate-900"
                                        : "border-slate-200 bg-slate-50"
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div
                                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-black ${
                                          step.complete
                                            ? step.color === "blue"
                                              ? "bg-blue-100 text-blue-600"
                                              : step.color === "amber"
                                                ? "bg-amber-100 text-amber-600"
                                                : "bg-emerald-100 text-emerald-600"
                                            : darkMode
                                              ? "bg-slate-700 text-slate-400"
                                              : "bg-slate-200 text-slate-500"
                                        }`}
                                      >
                                        {step.complete ? "✓" : step.icon}
                                      </div>
                                      <p className={`text-sm font-bold ${heading}`}>
                                        {step.title}
                                      </p>
                                    </div>

                                    <p className={`mt-3 text-xs leading-5 ${mutedText}`}>
                                      {step.description}
                                    </p>

                                    <p className="mt-2 text-xs font-bold text-indigo-500">
                                      {step.date
                                        ? formatDateTime(step.date)
                                        : "Waiting for update"}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </section>

                          {/* PHOTOS & COMPLETION VERIFICATION */}
                          <section className="grid gap-4 px-5 pb-5 sm:px-6 lg:grid-cols-2">
                            {complaint.image && (
                              <div className={`rounded-2xl border p-5 ${card}`}>
                                <p className={`text-xs font-extrabold uppercase tracking-widest ${mutedText}`}>
                                  Problem Photo
                                </p>
                                <p className={`mt-1 text-xs ${mutedText}`}>
                                  Image uploaded by the student
                                </p>

                                <img
                                  src={complaint.image}
                                  alt="Reported maintenance problem"
                                  className="mt-4 h-64 w-full rounded-xl object-cover"
                                />
                              </div>
                            )}

                            {/* COMPLETION SUBMISSION & VERIFICATION STATUS */}
                            <div className={`rounded-2xl border p-5 ${card}`}>
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <p className={`text-xs font-extrabold uppercase tracking-widest ${mutedText}`}>
                                    Completion Details
                                  </p>
                                  <p className={`mt-1 text-xs ${mutedText}`}>
                                    Proof of work & supervisor verification
                                  </p>
                                </div>

                                <span
                                  className={`rounded-full border px-3 py-1 text-[10px] font-extrabold ${
                                    complaint.verificationStatus === "Approved" || complaint.status === "Resolved"
                                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                                      : complaint.verificationStatus === "Rejected"
                                        ? "border-red-500/30 bg-red-500/10 text-red-500"
                                        : complaint.verificationStatus === "Pending"
                                          ? "border-amber-500/30 bg-amber-500/10 text-amber-500"
                                          : "border-slate-500/30 bg-slate-500/10 text-slate-500"
                                  }`}
                                >
                                  {complaint.verificationStatus === "Approved" || complaint.status === "Resolved"
                                    ? "✓ Approved"
                                    : complaint.verificationStatus === "Rejected"
                                      ? "⚠️ Rejected"
                                      : complaint.verificationStatus === "Pending"
                                        ? "⏳ Awaiting Approval"
                                        : "Not Submitted"}
                                </span>
                              </div>

                              {/* REJECTION ALERT BANNER */}
                              {complaint.verificationStatus === "Rejected" && complaint.verificationRemarks && (
                                <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5">
                                  <p className="text-xs font-bold text-red-500">
                                    ⚠️ Supervisor Requested Corrections:
                                  </p>
                                  <p className="mt-1 text-xs text-red-400">
                                    {complaint.verificationRemarks}
                                  </p>
                                  <p className="mt-2 text-[11px] text-slate-400">
                                    Please fix the issue, update your remarks below, and upload a new completion photo.
                                  </p>
                                </div>
                              )}

                              {/* PENDING VERIFICATION BANNER */}
                              {complaint.verificationStatus === "Pending" && (
                                <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5">
                                  <p className="text-xs font-bold text-amber-500">
                                    ⏳ Submitted for Supervisor Verification
                                  </p>
                                  <p className="mt-1 text-xs text-amber-400">
                                    Your completion photo and remarks have been sent to the supervisor. The complaint will be marked as Resolved upon supervisor approval.
                                  </p>
                                </div>
                              )}

                              {/* RESOLVED BANNER */}
                              {complaint.status === "Resolved" && (
                                <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5">
                                  <p className="text-xs font-bold text-emerald-500">
                                    ✓ Work Verified and Closed
                                  </p>
                                  <p className="mt-1 text-xs text-emerald-400">
                                    Supervisor has approved your completion. This complaint is resolved.
                                  </p>
                                </div>
                              )}

                              {/* CURRENT OR PREVIOUS COMPLETION PHOTO */}
                              {complaint.completionImage && (
                                <div className="mt-4">
                                  <p className={`text-[10px] font-bold uppercase tracking-wider ${mutedText}`}>
                                    Submitted Completion Photo:
                                  </p>
                                  <img
                                    src={complaint.completionImage}
                                    alt="Completed maintenance work"
                                    className="mt-2 h-56 w-full rounded-xl object-cover"
                                  />
                                </div>
                              )}

                              {/* CURRENT RESOLUTION REMARKS DISPLAY */}
                              {complaint.resolutionRemarks && complaint.verificationStatus !== "Rejected" && (
                                <div className="mt-3">
                                  <p className={`text-[10px] font-bold uppercase tracking-wider ${mutedText}`}>
                                    Resolution Remarks:
                                  </p>
                                  <p className={`mt-1 text-xs leading-5 ${heading}`}>
                                    {complaint.resolutionRemarks}
                                  </p>
                                </div>
                              )}

                              {/* SUBMISSION FORM (ALLOWED IF IN PROGRESS OR REJECTED) */}
                              {complaint.status !== "Resolved" && complaint.verificationStatus !== "Pending" && (
                                <div className="mt-4 border-t border-slate-700/40 pt-4">
                                  <label className={`block text-xs font-bold ${heading}`}>
                                    Resolution Remarks <span className="text-red-500">*</span>
                                  </label>
                                  <textarea
                                    rows="2"
                                    value={
                                      resolutionRemarks[complaint._id] ??
                                      complaint.resolutionRemarks ??
                                      ""
                                    }
                                    onChange={(e) =>
                                      setResolutionRemarks((prev) => ({
                                        ...prev,
                                        [complaint._id]: e.target.value,
                                      }))
                                    }
                                    placeholder="Describe the maintenance / replacement work done..."
                                    className={`mt-1.5 w-full rounded-xl border p-3 text-xs outline-none transition ${
                                      darkMode
                                        ? "border-slate-700 bg-slate-900 text-white placeholder:text-slate-500 focus:border-indigo-500"
                                        : "border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:border-indigo-500"
                                    }`}
                                  />

                                  <div className="mt-3">
                                    <label className={`block text-xs font-bold ${heading}`}>
                                      Completion Photo <span className="text-red-500">*</span>
                                    </label>

                                    {selectedFiles[complaint._id] ? (
                                      <div className="mt-2 flex items-center justify-between rounded-xl border border-indigo-500/40 bg-indigo-500/10 p-3">
                                        <div className="flex items-center gap-2 truncate">
                                          <span className="text-lg">📷</span>
                                          <span className="truncate text-xs font-semibold text-indigo-400">
                                            {selectedFiles[complaint._id].name}
                                          </span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setSelectedFiles((prev) => ({
                                              ...prev,
                                              [complaint._id]: null,
                                            }))
                                          }
                                          className="text-xs font-bold text-red-400 hover:text-red-300"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    ) : (
                                      <label
                                        className={`mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center transition ${
                                          darkMode
                                            ? "border-slate-600 bg-slate-900/60 hover:border-indigo-500 hover:bg-indigo-950/20"
                                            : "border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50"
                                        }`}
                                      >
                                        <span className="text-2xl">📸</span>
                                        <span className={`mt-2 text-xs font-bold ${heading}`}>
                                          {complaint.completionImage ? "Upload New Photo" : "Select Completion Photo"}
                                        </span>
                                        <span className={`mt-0.5 text-[10px] ${mutedText}`}>
                                          JPG, PNG or WEBP
                                        </span>
                                        <input
                                          type="file"
                                          accept="image/png,image/jpeg,image/webp"
                                          className="hidden"
                                          disabled={uploadingId === complaint._id}
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              setSelectedFiles((prev) => ({
                                                ...prev,
                                                [complaint._id]: file,
                                              }));
                                            }
                                            e.target.value = "";
                                          }}
                                        />
                                      </label>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    disabled={
                                      uploadingId === complaint._id ||
                                      !(
                                        resolutionRemarks[complaint._id]?.trim() ||
                                        complaint.resolutionRemarks?.trim()
                                      ) ||
                                      (!selectedFiles[complaint._id] && !complaint.completionImage)
                                    }
                                    onClick={() => handleCompletionSubmit(complaint._id)}
                                    className="mt-4 w-full rounded-xl bg-indigo-600 px-4 py-3 text-xs font-black text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-500"
                                  >
                                    {uploadingId === complaint._id
                                      ? "Submitting Completion..."
                                      : "Submit for Supervisor Verification"}
                                  </button>
                                </div>
                              )}
                            </div>
                          </section>

                          {/* WORK ACTIONS */}
                          <section
                            className={`border-t p-5 sm:p-6 ${borderLine} ${
                              darkMode ? "bg-slate-800/60" : "bg-slate-50"
                            }`}
                          >
                            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                              <div>
                                <h5 className={`font-extrabold ${heading}`}>
                                  Work Status & Actions
                                </h5>
                                <p className={`mt-1 text-xs ${mutedText}`}>
                                  Supervisor approval is required to mark complaints as Resolved.
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                {complaint.status === "Assigned" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateStatus(
                                        complaint._id,
                                        "In Progress"
                                      )
                                    }
                                    className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-violet-700"
                                  >
                                    ⚙ Start Work
                                  </button>
                                )}

                                {complaint.status === "In Progress" && (
                                  <span
                                    className={`rounded-xl border px-4 py-2.5 text-xs font-extrabold ${
                                      complaint.verificationStatus === "Pending"
                                        ? "border-amber-500/30 bg-amber-500/10 text-amber-500"
                                        : "border-violet-500/30 bg-violet-500/10 text-violet-400"
                                    }`}
                                  >
                                    {complaint.verificationStatus === "Pending"
                                      ? "⏳ Awaiting Supervisor Verification"
                                      : "⚙ In Progress"}
                                  </span>
                                )}

                                {complaint.status === "Resolved" && (
                                  <>
                                    <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-extrabold text-emerald-700">
                                      ✓ Resolved by Supervisor
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        deleteComplaint(complaint._id)
                                      }
                                      className="rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-extrabold text-red-600 transition hover:bg-red-50"
                                    >
                                      🗑 Delete
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {complaint.status === "In Progress" &&
                              complaint.verificationStatus !== "Pending" && (
                                <p
                                  className={`mt-4 rounded-xl px-4 py-3 text-xs font-semibold ${
                                    darkMode
                                      ? "bg-indigo-950/50 text-indigo-300"
                                      : "bg-indigo-50 text-indigo-700"
                                  }`}
                                >
                                  Note: When your maintenance work is finished, enter resolution remarks and upload a completion photo above to submit for supervisor approval.
                                </p>
                              )}
                          </section>

                          <div className={`border-t p-4 ${borderLine}`}>
                            <button
                              type="button"
                              onClick={() => toggleComplaint(complaint._id)}
                              className={`w-full rounded-xl px-4 py-3 text-sm font-extrabold transition ${
                                darkMode
                                  ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              Show Less ↑
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

          {/* QUICK ACTIONS */}
          <section className={`rounded-3xl border p-6 shadow-sm ${panel}`}>
            <div className="mb-5">
              <p
                className={`text-xs font-bold uppercase tracking-widest ${mutedText}`}
              >
                WORK SHORTCUTS
              </p>
              <h2 className={`mt-1 text-xl font-black ${heading}`}>
                Quick Actions
              </h2>
              <p className={`mt-1 text-sm ${mutedText}`}>
                Quickly access the most important parts of your workspace.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[
                {
                  icon: "📋",
                  title: "All Assigned Tasks",
                  description: "Review all maintenance requests assigned to you.",
                  filter: "All",
                },
                {
                  icon: "🔧",
                  title: "Continue Active Work",
                  description: "Focus on maintenance tasks currently in progress.",
                  filter: "In Progress",
                },
                {
                  icon: "✅",
                  title: "Completed Tasks",
                  description: "Review your successfully resolved requests.",
                  filter: "Resolved",
                },
              ].map((action) => (
                <button
                  key={action.title}
                  type="button"
                  onClick={() => {
                    setStatusFilter(action.filter);
                    setPriorityFilter("All");
                    setSearchTerm("");
                    setShowAllComplaints(true);

                    document
                      .getElementById("assigned-work")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`group rounded-2xl border p-5 text-left transition duration-200 hover:-translate-y-1 hover:shadow-lg ${
                    darkMode
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
              <p
                className={`text-xs font-bold uppercase tracking-widest ${mutedText}`}
              >
                MAINTENANCE PROCESS
              </p>
              <h2 className={`mt-1 text-xl font-black ${heading}`}>
                Your Work Journey
              </h2>
              <p className={`mt-1 text-sm ${mutedText}`}>
                Follow these steps to complete a maintenance request.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  step: "01",
                  icon: "📥",
                  title: "Receive Assignment",
                  description:
                    "Review the complaint details and understand the reported issue.",
                },
                {
                  step: "02",
                  icon: "🔧",
                  title: "Perform Maintenance",
                  description:
                    "Start the work, address the issue and upload completion proof.",
                },
                {
                  step: "03",
                  icon: "✅",
                  title: "Complete the Task",
                  description:
                    "Update the complaint status after successful maintenance.",
                },
              ].map((step) => (
                <div
                  key={step.step}
                  className={`rounded-2xl border p-5 ${
                    darkMode
                      ? "border-slate-700 bg-slate-800"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${
                        darkMode ? "bg-slate-700" : "bg-white"
                      }`}
                    >
                      {step.icon}
                    </div>
                    <span className={`text-xs font-black ${mutedText}`}>
                      STEP {step.step}
                    </span>
                  </div>

                  <h3 className={`mt-4 text-sm font-black ${heading}`}>
                    {step.title}
                  </h3>

                  <p className={`mt-2 text-xs leading-6 ${bodyText}`}>
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* RESPONSIBILITY NOTICE */}
          <section
            className={`rounded-2xl border p-5 ${
              darkMode
                ? "border-blue-900 bg-blue-950/30"
                : "border-blue-200 bg-blue-50"
            }`}
          >
            <div className="flex gap-4">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${
                  darkMode ? "bg-blue-900/60" : "bg-white"
                }`}
              >
                🔒
              </div>

              <div>
                <h3
                  className={`text-sm font-black ${
                    darkMode ? "text-blue-300" : "text-blue-900"
                  }`}
                >
                  Technician Workspace & Responsibilities
                </h3>

                <p
                  className={`mt-1 text-sm leading-6 ${
                    darkMode ? "text-blue-200" : "text-blue-800"
                  }`}
                >
                  This workspace displays complaints assigned to your
                  technician account. Keep task statuses updated and provide
                  completion photo evidence before resolving maintenance
                  requests.
                </p>
              </div>
            </div>
          </section>

          {/* FOOTER */}
          <footer
            className={`border-t pt-6 pb-2 ${
              darkMode ? "border-slate-800" : "border-slate-200"
            }`}
          >
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
                <p className="mt-1">© 2026 Medi-Caps University</p>
              </div>
            </div>
          </footer>
        </div>
      </main>

      {/* LOGOUT MODAL */}
      <LogoutModal
        isOpen={showLogout}
        onClose={() => setShowLogout(false)}
      />
    </div>
  );
}

export default TechnicianDashboard;
