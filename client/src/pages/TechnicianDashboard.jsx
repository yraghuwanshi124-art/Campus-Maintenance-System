
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
  const [startingId, setStartingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [resolutionRemarks, setResolutionRemarks] = useState({});
  const [selectedFiles, setSelectedFiles] = useState({});
  const [currentTime, setCurrentTime] = useState(Date.now());

  // THEME
  const pageBg = darkMode ? "bg-slate-950" : "bg-slate-50";
  const panel = darkMode
    ? "border-slate-800 bg-slate-900"
    : "border-slate-200 bg-white";
  const card = darkMode
    ? "border-slate-700 bg-slate-800"
    : "border-slate-200 bg-white";
  const softBg = darkMode ? "bg-slate-800" : "bg-slate-50";
  const heading = darkMode ? "text-slate-100" : "text-slate-900";
  const bodyText = darkMode ? "text-slate-300" : "text-slate-600";
  const mutedText = darkMode ? "text-slate-400" : "text-slate-500";
  const borderLine = darkMode ? "border-slate-700" : "border-slate-200";
  const inputStyle = darkMode
    ? "border-slate-700 bg-slate-950 text-white placeholder:text-slate-500"
    : "border-slate-200 bg-white text-slate-800 placeholder:text-slate-400";

  // FETCH COMPLAINTS
  const fetchComplaints = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setErrorMessage("");

      const token = localStorage.getItem("token");

      const response = await api.get("/complaints/assigned", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setComplaints(response.data.complaints || []);
    } catch (error) {
      console.error("TECHNICIAN DASHBOARD ERROR:", error);
      setErrorMessage(
        error.response?.data?.message ||
        "Unable to load assigned complaints. Please refresh."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // Refresh deadline countdown every minute.
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // DATE FORMAT
  const formatDateTime = (date) => {
    if (!date) return "Not available";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "Not available";
    }

    return parsed.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // DEADLINE HELPERS
  const getDeadlineState = (complaint) => {
    if (!complaint.deadline) return "Not Set";
    if (complaint.status === "Resolved") return "Completed";

    const difference =
      new Date(complaint.deadline).getTime() - currentTime;

    if (Number.isNaN(difference)) return "Not Set";
    if (difference <= 0) return "Overdue";
    if (difference <= 2 * 60 * 60 * 1000) return "Urgent";

    return "On Track";
  };

  const getRemainingTime = (complaint) => {
    if (!complaint.deadline) return "No deadline assigned";
    if (complaint.status === "Resolved") return "Work completed";

    const difference =
      new Date(complaint.deadline).getTime() - currentTime;

    if (Number.isNaN(difference)) return "Deadline unavailable";

    if (difference <= 0) {
      const totalMinutes = Math.abs(Math.floor(difference / 60000));
      const days = Math.floor(totalMinutes / 1440);
      const hours = Math.floor((totalMinutes % 1440) / 60);
      const minutes = totalMinutes % 60;

      if (days > 0) return `Overdue by ${days}d ${hours}h`;
      if (hours > 0) return `Overdue by ${hours}h ${minutes}m`;

      return `Overdue by ${minutes}m`;
    }

    const totalMinutes = Math.floor(difference / 60000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;

    return `${minutes}m remaining`;
  };

  const deadlineStyle = (state) => {
    const styles = {
      Completed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
      Overdue: "border-red-500/30 bg-red-500/10 text-red-500",
      Urgent: "border-amber-500/30 bg-amber-500/10 text-amber-500",
      "On Track": "border-blue-500/30 bg-blue-500/10 text-blue-500",
      "Not Set": "border-slate-500/30 bg-slate-500/10 text-slate-500",
    };

    return styles[state] || styles["Not Set"];
  };

  // STATUS
  const getStatusStyle = (status) => {
    const styles = {
      Assigned: "border-amber-500/30 bg-amber-500/10 text-amber-500",
      "In Progress": "border-violet-500/30 bg-violet-500/10 text-violet-500",
      Resolved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
    };

    return styles[status] || "border-slate-500/30 bg-slate-500/10 text-slate-500";
  };

  const getPriorityStyle = (priority) => {
    const styles = {
      High: "border-red-500/30 bg-red-500/10 text-red-500",
      Medium: "border-orange-500/30 bg-orange-500/10 text-orange-500",
      Low: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
    };

    return styles[priority] || "border-slate-500/30 bg-slate-500/10 text-slate-500";
  };

  // VERIFICATION LABEL
  const getVerificationLabel = (complaint) => {
    if (complaint.status === "Resolved" ||
        complaint.verificationStatus === "Approved") {
      return "Approved";
    }

    if (complaint.verificationStatus === "Pending") {
      return "Pending";
    }

    if (complaint.verificationStatus === "Rejected") {
      return "Rejected";
    }

    return "Not Submitted";
  };

  const getVerificationStyle = (complaint) => {
    const status = getVerificationLabel(complaint);

    if (status === "Approved") {
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-500";
    }
    if (status === "Pending") {
      return "border-amber-500/30 bg-amber-500/10 text-amber-500";
    }
    if (status === "Rejected") {
      return "border-red-500/30 bg-red-500/10 text-red-500";
    }

    return "border-slate-500/30 bg-slate-500/10 text-slate-500";
  };

  // PROGRESS
  const getProgress = (complaint) => {
    if (complaint.status === "Resolved" ||
        complaint.verificationStatus === "Approved") return 100;

    if (complaint.verificationStatus === "Pending") return 90;
    if (complaint.verificationStatus === "Rejected") return 70;
    if (complaint.status === "In Progress") return 55;
    if (complaint.status === "Assigned") return 20;

    return 0;
  };

  // START WORK
  const updateStatus = async (complaintId, status) => {
    const target = complaints.find((item) => item._id === complaintId);

    if (!target) return;

    if (target.verificationStatus === "Pending") {
      alert("This complaint is already awaiting supervisor verification.");
      return;
    }

    if (target.status !== "Assigned" || status !== "In Progress") {
      alert("This action is not available for the current complaint.");
      return;
    }

    try {
      setStartingId(complaintId);

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

      setComplaints((prev) =>
        prev.map((item) =>
          item._id === complaintId
            ? { ...item, ...response.data.complaint, status }
            : item
        )
      );

      setExpandedComplaints((prev) => ({
        ...prev,
        [complaintId]: true,
      }));

      alert("Work started successfully. You can now upload completion details.");
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Failed to start work."
      );
    } finally {
      setStartingId(null);
    }
  };

  // COMPLETION SUBMISSION
  const handleCompletionSubmit = async (complaintId) => {
    const complaint = complaints.find((item) => item._id === complaintId);

    if (!complaint) return;

    if (complaint.status !== "In Progress") {
      alert("Please start the work before submitting completion details.");
      return;
    }

    if (complaint.verificationStatus === "Pending") {
      alert("Your submission is already awaiting supervisor verification.");
      return;
    }

    if (complaint.verificationStatus === "Approved") {
      alert("This complaint has already been approved.");
      return;
    }

    const file = selectedFiles[complaintId];

    const remarks = (
      resolutionRemarks[complaintId] ??
      (complaint.verificationStatus === "Rejected"
        ? ""
        : complaint.resolutionRemarks || "")
    ).trim();

    if (!remarks) {
      alert("Please enter resolution remarks.");
      return;
    }

    if (!file && !complaint.completionImage) {
      alert("Please upload a completion photo.");
      return;
    }

    if (
      file &&
      !["image/jpeg", "image/png", "image/webp"].includes(file.type)
    ) {
      alert("Only JPG, PNG or WEBP images are allowed.");
      return;
    }

    if (file && file.size > 5 * 1024 * 1024) {
      alert("Please upload an image smaller than 5 MB.");
      return;
    }

    try {
      setUploadingId(complaintId);

      let imageUrl = complaint.completionImage || "";

      // Upload image to Cloudinary.
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

        if (!cloudinaryResponse.ok || !cloudinaryData.secure_url) {
          throw new Error(
            cloudinaryData.error?.message || "Image upload failed."
          );
        }

        imageUrl = cloudinaryData.secure_url;
      }

      const token = localStorage.getItem("token");

      const response = await api.patch(
        `/complaints/${complaintId}/completion-photo`,
        {
          completionImage: imageUrl,
          resolutionRemarks: remarks,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setComplaints((prev) =>
        prev.map((item) =>
          item._id === complaintId
            ? {
                ...item,
                ...response.data.complaint,
                completionImage: imageUrl,
                resolutionRemarks: remarks,
                verificationStatus: "Pending",
              }
            : item
        )
      );

      setSelectedFiles((prev) => ({
        ...prev,
        [complaintId]: null,
      }));

      setResolutionRemarks((prev) => ({
        ...prev,
        [complaintId]: remarks,
      }));

      alert(
        "Completion submitted successfully! Your supervisor can now verify the work."
      );

      await fetchComplaints(true);
    } catch (error) {
      console.error("COMPLETION SUBMISSION ERROR:", error);

      alert(
        error.response?.data?.message ||
        error.message ||
        "Failed to submit completion details."
      );
    } finally {
      setUploadingId(null);
    }
  };

  // DELETE RESOLVED COMPLAINT
  const deleteComplaint = async (complaintId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this resolved complaint?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(complaintId);

      const token = localStorage.getItem("token");

      const response = await api.delete(
        `/complaints/${complaintId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setComplaints((prev) =>
        prev.filter((item) => item._id !== complaintId)
      );

      alert(response.data.message || "Complaint deleted successfully.");
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Failed to delete complaint."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // FILTERS
  const filteredComplaints = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return complaints.filter((complaint) => {
      const searchable = [
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
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !search || searchable.includes(search);

      const matchesStatus =
        statusFilter === "All" || complaint.status === statusFilter;

      const matchesPriority =
        priorityFilter === "All" ||
        complaint.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [complaints, searchTerm, statusFilter, priorityFilter]);

  const sortedComplaints = useMemo(() => {
    return [...filteredComplaints].sort((a, b) => {
      const priorityOrder = { High: 0, Medium: 1, Low: 2 };

      const priorityDifference =
        (priorityOrder[a.priority] ?? 3) -
        (priorityOrder[b.priority] ?? 3);

      if (priorityDifference !== 0) return priorityDifference;

      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [filteredComplaints]);

  const displayedComplaints = showAllComplaints
    ? sortedComplaints
    : sortedComplaints.slice(0, 5);

  // STATISTICS
  const totalComplaints = complaints.length;

  const assignedCount = complaints.filter(
    (item) => item.status === "Assigned"
  ).length;

  const inProgressCount = complaints.filter(
    (item) => item.status === "In Progress"
  ).length;

  const pendingVerificationCount = complaints.filter(
    (item) => item.verificationStatus === "Pending"
  ).length;

  const resolvedCount = complaints.filter(
    (item) => item.status === "Resolved"
  ).length;

  const highPriorityCount = complaints.filter(
    (item) => item.priority === "High" &&
      item.status !== "Resolved"
  ).length;

  const overdueCount = complaints.filter(
    (item) => getDeadlineState(item) === "Overdue"
  ).length;

  const stats = [
    {
      title: "Total Assigned",
      value: totalComplaints,
      detail: "All maintenance requests",
      icon: "▤",
      color: "indigo",
      filter: "All",
    },
    {
      title: "Awaiting Start",
      value: assignedCount,
      detail: "Work not started",
      icon: "◷",
      color: "amber",
      filter: "Assigned",
    },
    {
      title: "In Progress",
      value: inProgressCount,
      detail: "Active maintenance work",
      icon: "⚙",
      color: "violet",
      filter: "In Progress",
    },
    {
      title: "Resolved",
      value: resolvedCount,
      detail: "Supervisor approved",
      icon: "✓",
      color: "emerald",
      filter: "Resolved",
    },
  ];

  const statColors = {
    indigo: darkMode
      ? "bg-indigo-500/10 text-indigo-300"
      : "bg-indigo-50 text-indigo-600",
    amber: darkMode
      ? "bg-amber-500/10 text-amber-300"
      : "bg-amber-50 text-amber-600",
    violet: darkMode
      ? "bg-violet-500/10 text-violet-300"
      : "bg-violet-50 text-violet-600",
    emerald: darkMode
      ? "bg-emerald-500/10 text-emerald-300"
      : "bg-emerald-50 text-emerald-600",
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setPriorityFilter("All");
    setShowAllComplaints(false);
  };

  const toggleComplaint = (id) => {
    setExpandedComplaints((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // LOADING
  if (loading) {
    return (
      <div className={`min-h-screen ${pageBg}`}>
        <TechnicianSidebar
          activeFilter={statusFilter}
          onFilterChange={setStatusFilter}
          onLogout={() => setShowLogout(true)}
        />

        <main className="min-h-screen p-6 lg:ml-64">
          <div className="mb-8 pl-14 lg:pl-0">
            <div className={`h-4 w-40 animate-pulse rounded ${softBg}`} />
            <div className={`mt-3 h-8 w-64 animate-pulse rounded ${softBg}`} />
          </div>

          <div className={`h-56 animate-pulse rounded-3xl ${softBg}`} />

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className={`h-36 animate-pulse rounded-2xl ${softBg}`}
              />
            ))}
          </div>

          <div className={`mt-6 h-96 animate-pulse rounded-3xl ${softBg}`} />
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${pageBg} transition-colors duration-300`}>
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
          className={`sticky top-0 z-30 border-b px-5 py-4 backdrop-blur-xl sm:px-8 ${
            darkMode
              ? "border-slate-800 bg-slate-950/90"
              : "border-slate-200 bg-white/90"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="pl-12 lg:pl-0">
              <p className={`text-[10px] font-bold uppercase tracking-[0.22em] ${mutedText}`}>
                CampusFix / Maintenance Operations
              </p>
              <h1 className={`mt-1 text-xl font-black ${heading}`}>
                Technician Workspace
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fetchComplaints(true)}
                disabled={refreshing}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition ${
                  darkMode
                    ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className={refreshing ? "animate-spin" : ""}>↻</span>
                <span className="hidden sm:inline">
                  {refreshing ? "Refreshing" : "Refresh"}
                </span>
              </button>

              <div className={`hidden items-center gap-3 rounded-xl border px-3 py-2 sm:flex ${card}`}>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 font-black text-white">
                  {technicianName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className={`text-xs font-black ${heading}`}>
                    {technicianName}
                  </p>
                  <p className={`text-[10px] ${mutedText}`}>
                    {specialization}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="space-y-7 p-5 sm:p-7 xl:p-8">

          {/* HERO */}
          <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 p-7 text-white shadow-xl sm:p-9">
            <div className="pointer-events-none absolute -right-16 -top-24 h-80 w-80 rounded-full border-[45px] border-white/5" />
            <div className="pointer-events-none absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-indigo-400/10 blur-3xl" />

            <div className="relative grid gap-8 lg:grid-cols-[1fr_270px] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-indigo-100">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Technician Operations Portal
                </div>

                <p className="mt-5 text-lg font-semibold text-indigo-200">
                  Welcome back, {technicianName}
                </p>

                <h2 className="mt-2 max-w-2xl text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                  Deliver reliable maintenance.
                  <span className="block text-indigo-300">
                    Keep your campus running.
                  </span>
                </h2>

                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
                  Manage assigned complaints, monitor deadlines, document
                  completed work and submit every maintenance task for
                  supervisor verification.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      resetFilters();
                      document.getElementById("my-work")?.scrollIntoView({
                        behavior: "smooth",
                      });
                    }}
                    className="rounded-xl bg-white px-5 py-3 text-xs font-black text-indigo-950 transition hover:-translate-y-0.5 hover:bg-indigo-50"
                  >
                    View Assigned Work →
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter("In Progress");
                      document.getElementById("my-work")?.scrollIntoView({
                        behavior: "smooth",
                      });
                    }}
                    className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-xs font-bold text-white transition hover:bg-white/20"
                  >
                    Continue Active Work
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-md">
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">
                  Your Workload
                </p>
                <p className="mt-3 text-5xl font-black">
                  {totalComplaints.toString().padStart(2, "0")}
                </p>
                <p className="mt-1 text-xs text-indigo-200">
                  Assigned maintenance requests
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/15 pt-5">
                  <div>
                    <p className="text-2xl font-black text-amber-300">
                      {pendingVerificationCount}
                    </p>
                    <p className="mt-1 text-[10px] text-indigo-100">
                      Awaiting Approval
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-red-300">
                      {overdueCount}
                    </p>
                    <p className="mt-1 text-[10px] text-indigo-100">
                      Overdue Tasks
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ERROR */}
          {errorMessage && (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
              <p className="text-sm font-semibold text-red-500">
                {errorMessage}
              </p>
              <button
                type="button"
                onClick={() => fetchComplaints(true)}
                className="shrink-0 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white"
              >
                Retry
              </button>
            </div>
          )}

          {/* STATS */}
          <section>
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${mutedText}`}>
                  Performance Overview
                </p>
                <h2 className={`mt-1 text-xl font-black ${heading}`}>
                  Work Summary
                </h2>
              </div>
              <span className={`hidden text-xs sm:block ${mutedText}`}>
                Select a card to filter complaints
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <button
                  key={stat.title}
                  type="button"
                  onClick={() => {
                    setStatusFilter(stat.filter);
                    setShowAllComplaints(false);
                  }}
                  className={`rounded-2xl border p-5 text-left transition duration-200 hover:-translate-y-1 hover:shadow-lg ${
                    statusFilter === stat.filter
                      ? "border-indigo-500 ring-2 ring-indigo-500/20"
                      : card
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`text-xs font-bold ${mutedText}`}>
                        {stat.title}
                      </p>
                      <p className={`mt-4 text-3xl font-black ${heading}`}>
                        {stat.value}
                      </p>
                    </div>
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl font-black ${statColors[stat.color]}`}>
                      {stat.icon}
                    </div>
                  </div>
                  <p className={`mt-2 text-[11px] ${mutedText}`}>
                    {stat.detail}
                  </p>
                </button>
              ))}
            </div>
          </section>

          {/* OPERATIONAL ALERTS */}
          {(highPriorityCount > 0 || overdueCount > 0 || pendingVerificationCount > 0) && (
            <section className="grid gap-3 md:grid-cols-3">
              {highPriorityCount > 0 && (
                <div className="rounded-2xl border border-red-500/25 bg-red-500/5 p-4">
                  <p className="text-xs font-bold text-red-500">
                    HIGH PRIORITY
                  </p>
                  <p className={`mt-2 text-2xl font-black ${heading}`}>
                    {highPriorityCount}
                  </p>
                  <p className={`mt-1 text-xs ${mutedText}`}>
                    High-priority active complaints
                  </p>
                </div>
              )}

              {overdueCount > 0 && (
                <div className="rounded-2xl border border-orange-500/25 bg-orange-500/5 p-4">
                  <p className="text-xs font-bold text-orange-500">
                    DEADLINE ALERT
                  </p>
                  <p className={`mt-2 text-2xl font-black ${heading}`}>
                    {overdueCount}
                  </p>
                  <p className={`mt-1 text-xs ${mutedText}`}>
                    Tasks past their deadline
                  </p>
                </div>
              )}

              {pendingVerificationCount > 0 && (
                <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4">
                  <p className="text-xs font-bold text-amber-500">
                    SUPERVISOR REVIEW
                  </p>
                  <p className={`mt-2 text-2xl font-black ${heading}`}>
                    {pendingVerificationCount}
                  </p>
                  <p className={`mt-1 text-xs ${mutedText}`}>
                    Submissions awaiting approval
                  </p>
                </div>
              )}
            </section>
          )}

          {/* COMPLAINT MANAGEMENT */}
          <section
            id="my-work"
            className={`overflow-hidden rounded-3xl border shadow-sm ${panel}`}
          >
            <div className={`border-b p-5 sm:p-6 ${borderLine}`}>
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${mutedText}`}>
                    Maintenance Management
                  </p>
                  <h2 className={`mt-1 text-xl font-black ${heading}`}>
                    My Assigned Complaints
                  </h2>
                  <p className={`mt-1 text-xs ${mutedText}`}>
                    Review task details, deadlines and completion requirements.
                  </p>
                </div>

                <div className={`rounded-xl border px-4 py-2 text-xs font-bold ${card}`}>
                  {sortedComplaints.length} Matching Requests
                </div>
              </div>

              {/* SEARCH */}
              <div className="relative mt-5">
                <span className={`absolute left-4 top-1/2 -translate-y-1/2 ${mutedText}`}>
                  ⌕
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowAllComplaints(false);
                  }}
                  placeholder="Search complaint, room, block, category or student..."
                  className={`w-full rounded-xl border py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 ${inputStyle}`}
                />
              </div>

              {/* FILTERS */}
              <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {["All", "Assigned", "In Progress", "Resolved"].map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => {
                        setStatusFilter(filter);
                        setShowAllComplaints(false);
                      }}
                      className={`shrink-0 rounded-xl border px-4 py-2.5 text-xs font-bold transition ${
                        statusFilter === filter
                          ? "border-indigo-600 bg-indigo-600 text-white"
                          : darkMode
                            ? "border-slate-700 bg-slate-800 text-slate-300 hover:border-indigo-500"
                            : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <select
                    value={priorityFilter}
                    onChange={(e) => {
                      setPriorityFilter(e.target.value);
                      setShowAllComplaints(false);
                    }}
                    className={`rounded-xl border px-3 py-2.5 text-xs font-bold outline-none focus:border-indigo-500 ${inputStyle}`}
                  >
                    <option value="All">All Priorities</option>
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>

                  <button
                    type="button"
                    onClick={resetFilters}
                    className={`rounded-xl border px-4 py-2.5 text-xs font-bold ${card} ${bodyText}`}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* LIST HEADING */}
            <div className="flex items-center justify-between gap-3 px-5 py-5 sm:px-6">
              <div>
                <h3 className={`font-black ${heading}`}>
                  {statusFilter === "All" ? "All Maintenance Requests" : `${statusFilter} Requests`}
                </h3>
                <p className={`mt-1 text-[11px] ${mutedText}`}>
                  {sortedComplaints.length} complaints found
                </p>
              </div>

              {sortedComplaints.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllComplaints((prev) => !prev)}
                  className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700"
                >
                  {showAllComplaints ? "Show Less" : "View All"}
                </button>
              )}
            </div>

            {/* EMPTY STATE */}
            {sortedComplaints.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-3xl ${softBg}`}>
                  ▤
                </div>
                <h3 className={`mt-4 text-lg font-black ${heading}`}>
                  No Complaints Found
                </h3>
                <p className={`mt-2 text-sm ${mutedText}`}>
                  Try changing your search or filters.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-bold text-white"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="space-y-4 px-5 pb-6 sm:px-6">
                {displayedComplaints.map((complaint, index) => {
                  const id = complaint._id;
                  const expanded = Boolean(expandedComplaints[id]);
                  const deadlineState = getDeadlineState(complaint);
                  const progress = getProgress(complaint);
                  const verification = getVerificationLabel(complaint);
                  const isPending = verification === "Pending";
                  const isRejected = verification === "Rejected";
                  const isResolved = complaint.status === "Resolved";
                  const isAssigned = complaint.status === "Assigned";
                  const isInProgress = complaint.status === "In Progress";

                  return (
                    <article
                      key={id}
                      className={`overflow-hidden rounded-2xl border transition duration-200 ${
                        expanded
                          ? "border-indigo-500/50 shadow-lg"
                          : card
                      }`}
                    >
                      {/* COMPLAINT CARD */}
                      <div className="p-5 sm:p-6">
                        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                          <div className="flex min-w-0 gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-xs font-black text-white">
                              {String(index + 1).padStart(2, "0")}
                            </div>

                            <div className="min-w-0">
                              <div className="mb-2 flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">
                                  Maintenance Request
                                </span>
                                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${getPriorityStyle(complaint.priority)}`}>
                                  {complaint.priority || "Normal"} Priority
                                </span>
                              </div>

                              <h3 className={`text-lg font-black ${heading}`}>
                                {complaint.category || "Maintenance Issue"}
                              </h3>

                              <p className={`mt-1 text-xs ${mutedText}`}>
                                {complaint.block || "Block not specified"}
                                {" · "}
                                Room {complaint.room || "N/A"}
                                {complaint.floor ? ` · Floor ${complaint.floor}` : ""}
                              </p>

                              <p className={`mt-2 text-[10px] ${mutedText}`}>
                                Complaint ID: {String(id).slice(-10).toUpperCase()}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <span className={`rounded-full border px-3 py-1.5 text-[10px] font-bold ${getStatusStyle(complaint.status)}`}>
                              {complaint.status || "Unknown"}
                            </span>
                            <span className={`rounded-full border px-3 py-1.5 text-[10px] font-bold ${getVerificationStyle(complaint)}`}>
                              {verification === "Not Submitted"
                                ? "Verification: Not Submitted"
                                : `Verification: ${verification}`}
                            </span>
                          </div>
                        </div>

                        {/* SUMMARY GRID */}
                        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <div className={`rounded-xl p-4 ${softBg}`}>
                            <p className={`text-[10px] font-bold uppercase tracking-wider ${mutedText}`}>
                              Reported By
                            </p>
                            <p className={`mt-2 truncate text-sm font-bold ${heading}`}>
                              {complaint.user?.name || "Unknown Student"}
                            </p>
                            <p className={`mt-1 truncate text-[10px] ${mutedText}`}>
                              {complaint.user?.email || "Email unavailable"}
                            </p>
                          </div>

                          <div className={`rounded-xl p-4 ${softBg}`}>
                            <p className={`text-[10px] font-bold uppercase tracking-wider ${mutedText}`}>
                              Reported On
                            </p>
                            <p className={`mt-2 text-xs font-bold ${heading}`}>
                              {formatDateTime(complaint.createdAt)}
                            </p>
                          </div>

                          <div className={`rounded-xl border p-4 ${deadlineStyle(deadlineState)}`}>
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[10px] font-bold uppercase tracking-wider">
                                Resolution Deadline
                              </p>
                              <span className="text-[9px] font-black">
                                {deadlineState}
                              </span>
                            </div>
                            <p className="mt-2 text-xs font-black">
                              {complaint.deadline
                                ? formatDateTime(complaint.deadline)
                                : "Not Assigned"}
                            </p>
                            <p className="mt-1 text-[10px] font-semibold">
                              {getRemainingTime(complaint)}
                            </p>
                          </div>

                          <div className={`rounded-xl p-4 ${softBg}`}>
                            <div className="flex items-center justify-between">
                              <p className={`text-[10px] font-bold uppercase tracking-wider ${mutedText}`}>
                                Work Progress
                              </p>
                              <span className="text-xs font-black text-indigo-500">
                                {progress}%
                              </span>
                            </div>
                            <div className={`mt-3 h-2 overflow-hidden rounded-full ${darkMode ? "bg-slate-700" : "bg-slate-200"}`}>
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isResolved
                                    ? "bg-emerald-500"
                                    : isPending
                                      ? "bg-amber-500"
                                      : "bg-indigo-500"
                                }`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <p className={`mt-2 text-[10px] ${mutedText}`}>
                              {isResolved ? "Completed" : isPending ? "Under review" : "Task progress"}
                            </p>
                          </div>
                        </div>

                        {/* PRIMARY ACTION */}
                        <div className={`mt-5 flex flex-col justify-between gap-3 border-t pt-4 sm:flex-row sm:items-center ${borderLine}`}>
                          <div className="flex flex-wrap items-center gap-2">
                           {isAssigned && !isPending && (
                              <button
                                type="button"
                                disabled={startingId === id}
                                onClick={() => updateStatus(id, "In Progress")}
                                className="rounded-xl bg-violet-600 px-5 py-3 text-xs font-black text-white shadow-md transition hover:bg-violet-700 disabled:opacity-50"
                              >
                                {startingId === id ? "Starting..." : "⚙ Start Work"}
                              </button>
                            )}

                            {isInProgress && !isPending && !isResolved && (
                              <span className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-xs font-bold text-violet-500">
                                ⚙ Work In Progress
                              </span>
                            )}

                            {isPending && (
                              <span className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs font-bold text-amber-500">
                                ◷ Awaiting Supervisor Verification
                              </span>
                            )}

                            {isResolved && (
                              <span className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-bold text-emerald-500">
                                ✓ Verified & Resolved
                              </span>
                            )}

                            {isRejected && (
                              <span className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-500">
                                ! Correction Required
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleComplaint(id)}
                            className={`rounded-xl border px-4 py-2.5 text-xs font-bold ${card} ${bodyText}`}
                          >
                            {expanded ? "Hide Details ↑" : "View Full Details →"}
                          </button>
                        </div>
                      </div>

                      {/* EXPANDED DETAILS */}
                      {expanded && (
                        <div className={`border-t ${borderLine}`}>
                          {/* COMPLAINT DETAILS */}
                          <section className="p-5 sm:p-6">
                            <div className={`rounded-2xl border p-5 ${card}`}>
                              <h4 className={`text-sm font-black ${heading}`}>
                                Complaint Information
                              </h4>

                              <p className={`mt-3 text-sm leading-7 ${bodyText}`}>
                                {complaint.description || "No description provided."}
                              </p>

                              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                <div className={`rounded-xl p-3 ${softBg}`}>
                                  <p className={`text-[10px] font-bold ${mutedText}`}>STUDENT</p>
                                  <p className={`mt-1 text-xs font-bold ${heading}`}>
                                    {complaint.user?.name || "Unknown"}
                                  </p>
                                </div>
                                <div className={`rounded-xl p-3 ${softBg}`}>
                                  <p className={`text-[10px] font-bold ${mutedText}`}>EMAIL</p>
                                  <p className={`mt-1 break-all text-xs font-bold ${heading}`}>
                                    {complaint.user?.email || "Not available"}
                                  </p>
                                </div>
                                <div className={`rounded-xl p-3 ${softBg}`}>
                                  <p className={`text-[10px] font-bold ${mutedText}`}>LOCATION</p>
                                  <p className={`mt-1 text-xs font-bold ${heading}`}>
                                    {complaint.block || "N/A"} / Room {complaint.room || "N/A"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </section>

                          {/* ORIGINAL PHOTO */}
                          {complaint.image && (
                            <section className="px-5 pb-5 sm:px-6">
                              <div className={`rounded-2xl border p-5 ${card}`}>
                                <h4 className={`text-xs font-black ${heading}`}>
                                  Student's Problem Photo
                                </h4>
                                <img
                                  src={complaint.image}
                                  alt="Original complaint"
                                  className="mt-4 max-h-80 w-full rounded-xl object-contain"
                                />
                              </div>
                            </section>
                          )}

                          {/* WORK TIMELINE */}
                          <section className="px-5 pb-5 sm:px-6">
                            <div className={`rounded-2xl border p-5 ${card}`}>
                              <h4 className={`text-sm font-black ${heading}`}>
                                Maintenance Workflow
                              </h4>
                              <div className="mt-5 grid gap-3 md:grid-cols-4">
                                {[
                                  {
                                    title: "Complaint Raised",
                                    description: "Student reported the issue.",
                                    complete: true,
                                  },
                                  {
                                    title: "Work Started",
                                    description: "Technician began maintenance.",
                                    complete: isInProgress || isPending || isResolved,
                                  },
                                  {
                                    title: "Submitted",
                                    description: "Photo and remarks submitted.",
                                    complete: isPending || isRejected || isResolved,
                                  },
                                  {
                                    title: "Supervisor Approval",
                                    description: "Work verified and closed.",
                                    complete: isResolved,
                                  },
                                ].map((step, i) => (
                                  <div
                                    key={step.title}
                                    className={`rounded-xl border p-4 ${
                                      step.complete
                                        ? darkMode
                                          ? "border-emerald-700/50 bg-emerald-950/20"
                                          : "border-emerald-200 bg-emerald-50"
                                        : card
                                    }`}
                                  >
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${
                                      step.complete
                                        ? "bg-emerald-500 text-white"
                                        : darkMode
                                          ? "bg-slate-700 text-slate-300"
                                          : "bg-slate-100 text-slate-500"
                                    }`}>
                                      {step.complete ? "✓" : `0${i + 1}`}
                                    </div>
                                    <p className={`mt-3 text-xs font-black ${heading}`}>
                                      {step.title}
                                    </p>
                                    <p className={`mt-1 text-[10px] leading-5 ${mutedText}`}>
                                      {step.description}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </section>

                          {/* COMPLETION PANEL */}
                          <section className="px-5 pb-5 sm:px-6">
                            <div className={`overflow-hidden rounded-2xl border ${card}`}>
                              <div className="bg-gradient-to-r from-indigo-700 to-violet-700 p-5 text-white">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-100">
                                  Work Completion & Verification
                                </p>
                                <h4 className="mt-1 text-lg font-black">
                                  Maintenance Evidence
                                </h4>
                                <p className="mt-1 text-xs text-indigo-100">
                                  Submit work remarks and a completion photo for supervisor review.
                                </p>
                              </div>

                              <div className="p-5">
                                {/* PENDING */}
                                {isPending && (
                                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                                    <p className="text-sm font-black text-amber-500">
                                      ◷ Submission Sent for Verification
                                    </p>
                                    <p className={`mt-2 text-xs leading-6 ${bodyText}`}>
                                      Your completion details have been submitted successfully. The supervisor must review and approve the work before this complaint becomes Resolved.
                                    </p>
                                  </div>
                                )}

                                {/* REJECTED */}
                                {isRejected && (
                                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                                    <p className="text-sm font-black text-red-500">
                                      Correction Required by Supervisor
                                    </p>
                                    <p className="mt-2 text-xs leading-6 text-red-400">
                                      {complaint.verificationRemarks || "Please correct the submitted work."}
                                    </p>
                                    <p className="mt-2 text-[10px] font-semibold text-red-400">
                                      Update your remarks and upload a new completion photo below.
                                    </p>
                                  </div>
                                )}

                                {/* APPROVED */}
                                {isResolved && (
                                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                                    <p className="text-sm font-black text-emerald-500">
                                      ✓ Work Approved by Supervisor
                                    </p>
                                    <p className={`mt-2 text-xs ${bodyText}`}>
                                      This maintenance request has been verified and marked as Resolved.
                                    </p>
                                    {complaint.verificationRemarks && (
                                      <p className={`mt-3 text-xs ${bodyText}`}>
                                        Supervisor remarks: {complaint.verificationRemarks}
                                      </p>
                                    )}
                                    <p className={`mt-2 text-[10px] ${mutedText}`}>
                                      Verified on: {formatDateTime(complaint.verifiedAt)}
                                    </p>
                                  </div>
                                )}

                                {/* PREVIOUS COMPLETION PHOTO */}
                                {complaint.completionImage && (
                                  <div className="mt-5">
                                    <p className={`text-xs font-bold ${heading}`}>
                                      {isRejected ? "Previously Submitted Photo" : "Completion Photo"}
                                    </p>
                                    <img
                                      src={complaint.completionImage}
                                      alt="Maintenance completion"
                                      className="mt-3 max-h-80 w-full rounded-xl object-contain"
                                    />
                                  </div>
                                )}

                                {/* PREVIOUS REMARKS */}
                                {complaint.resolutionRemarks && (
                                  <div className={`mt-4 rounded-xl p-4 ${softBg}`}>
                                    <p className={`text-[10px] font-bold uppercase tracking-wider ${mutedText}`}>
                                      {isRejected ? "Previous Work Remarks" : "Resolution Remarks"}
                                    </p>
                                    <p className={`mt-2 text-xs leading-6 ${bodyText}`}>
                                      {complaint.resolutionRemarks}
                                    </p>
                                  </div>
                                )}

                                {/* SUBMISSION FORM: ONLY AFTER START WORK */}
                                {isInProgress && !isPending && !isResolved && (
                                  <div className="mt-5 border-t pt-5">
                                    <div className="mb-4">
                                      <h5 className={`text-sm font-black ${heading}`}>
                                        {isRejected ? "Resubmit Corrected Work" : "Submit Completed Work"}
                                      </h5>
                                      <p className={`mt-1 text-xs ${mutedText}`}>
                                        Fill in the details below and send them for supervisor verification.
                                      </p>
                                    </div>

                                    <label className={`block text-xs font-bold ${heading}`}>
                                      Resolution Remarks <span className="text-red-500">*</span>
                                    </label>

                                    <textarea
                                      rows={4}
                                      value={
                                        resolutionRemarks[id] ??
                                        (isRejected ? "" : complaint.resolutionRemarks || "")
                                      }
                                      onChange={(e) =>
                                        setResolutionRemarks((prev) => ({
                                          ...prev,
                                          [id]: e.target.value,
                                        }))
                                      }
                                      placeholder="Describe the repair, replacement or maintenance work completed..."
                                      className={`mt-2 w-full resize-y rounded-xl border p-4 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 ${inputStyle}`}
                                    />

                                    <div className="mt-5">
                                      <p className={`text-xs font-bold ${heading}`}>
                                        Completion Photo <span className="text-red-500">*</span>
                                      </p>
                                      <p className={`mt-1 text-[10px] ${mutedText}`}>
                                        Upload clear evidence of the completed maintenance work. Maximum 5 MB.
                                      </p>

                                      <label className={`mt-3 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-7 text-center transition ${
                                        darkMode
                                          ? "border-slate-600 bg-slate-950 hover:border-indigo-500"
                                          : "border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/50"
                                      }`}>
                                        <span className="text-3xl">📷</span>
                                        <span className={`mt-3 text-sm font-bold ${heading}`}>
                                          {selectedFiles[id]
                                            ? "Photo selected"
                                            : "Choose completion photo"}
                                        </span>
                                        <span className={`mt-1 text-[10px] ${mutedText}`}>
                                          JPG · PNG · WEBP
                                        </span>

                                        <input
                                          type="file"
                                          accept="image/jpeg,image/png,image/webp"
                                          className="hidden"
                                          disabled={uploadingId === id}
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];

                                            if (file) {
                                              if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
                                                alert("Only JPG, PNG and WEBP images are allowed.");
                                              } else if (file.size > 5 * 1024 * 1024) {
                                                alert("Image must be smaller than 5 MB.");
                                              } else {
                                                setSelectedFiles((prev) => ({
                                                  ...prev,
                                                  [id]: file,
                                                }));
                                              }
                                            }

                                            e.target.value = "";
                                          }}
                                        />
                                      </label>

                                      {selectedFiles[id] && (
                                        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3">
                                          <p className="truncate text-xs font-bold text-indigo-500">
                                            📎 {selectedFiles[id].name}
                                          </p>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setSelectedFiles((prev) => ({
                                                ...prev,
                                                [id]: null,
                                              }))
                                            }
                                            className="shrink-0 text-xs font-bold text-red-500"
                                          >
                                            Remove
                                          </button>
                                        </div>
                                      )}
                                    </div>

                                    <button
                                      type="button"
                                      disabled={
                                        uploadingId === id ||
                                        !(resolutionRemarks[id] ??
                                          (isRejected ? "" : complaint.resolutionRemarks || "")
                                        ).trim() ||
                                        (!selectedFiles[id] && !complaint.completionImage)
                                      }
                                      onClick={() => handleCompletionSubmit(id)}
                                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-indigo-600/15 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-500 disabled:shadow-none"
                                    >
                                      {uploadingId === id
                                        ? "Uploading & Submitting..."
                                        : isRejected
                                          ? "↻ Resubmit for Verification"
                                          : "✓ Done — Submit for Supervisor Verification"}
                                    </button>
                                  </div>
                                )}

                                {/* ASSIGNED: START FIRST */}
                                {isAssigned && (
                                  <div className={`mt-4 rounded-xl border p-4 ${
                                    darkMode
                                      ? "border-violet-500/20 bg-violet-500/5"
                                      : "border-violet-200 bg-violet-50"
                                  }`}>
                                    <p className={`text-xs font-bold ${heading}`}>
                                      Work has not started yet.
                                    </p>
                                    <p className={`mt-1 text-xs ${mutedText}`}>
                                      Click Start Work first. The completion photo and remarks form will become available after that.
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </section>

                          {/* DELETE RESOLVED */}
                          {isResolved && (
                            <div className={`flex justify-end border-t p-5 ${borderLine}`}>
                              <button
                                type="button"
                                disabled={deletingId === id}
                                onClick={() => deleteComplaint(id)}
                                className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-500/20 disabled:opacity-50"
                              >
                                {deletingId === id ? "Deleting..." : "Delete Resolved Complaint"}
                              </button>
                            </div>
                          )}

                          <div className={`border-t p-3 ${borderLine}`}>
                            <button
                              type="button"
                              onClick={() => toggleComplaint(id)}
                              className={`w-full rounded-xl py-2.5 text-xs font-bold ${softBg} ${bodyText}`}
                            >
                              Close Details ↑
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

          {/* WORK GUIDELINES */}
          <section className={`rounded-3xl border p-6 ${panel}`}>
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${mutedText}`}>
                Standard Operating Process
              </p>
              <h2 className={`mt-1 text-xl font-black ${heading}`}>
                How to Complete a Task
              </h2>
              <p className={`mt-1 text-xs ${mutedText}`}>
                Follow the official maintenance and verification workflow.
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              {[
                {
                  number: "01",
                  title: "Review Assignment",
                  text: "Check the complaint, location, priority and deadline.",
                  icon: "▤",
                },
                {
                  number: "02",
                  title: "Start Work",
                  text: "Click Start Work and begin maintenance.",
                  icon: "⚙",
                },
                {
                  number: "03",
                  title: "Submit Evidence",
                  text: "Add resolution remarks and upload the completion photo.",
                  icon: "▧",
                },
                {
                  number: "04",
                  title: "Supervisor Review",
                  text: "Wait for verification. Approval marks the task Resolved.",
                  icon: "✓",
                },
              ].map((step) => (
                <div key={step.number} className={`rounded-2xl border p-5 ${card}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-indigo-500">
                      {step.number}
                    </span>
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${softBg}`}>
                      {step.icon}
                    </span>
                  </div>
                  <h3 className={`mt-4 text-sm font-black ${heading}`}>
                    {step.title}
                  </h3>
                  <p className={`mt-2 text-xs leading-6 ${mutedText}`}>
                    {step.text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* FOOTER */}
          <footer className={`border-t pt-6 ${borderLine}`}>
            <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
              <div>
                <p className={`text-sm font-black ${heading}`}>
                  CampusFix
                </p>
                <p className={`mt-1 text-[10px] ${mutedText}`}>
                  Medi-Caps University · Maintenance Operations
                </p>
              </div>
              <p className={`text-[10px] ${mutedText}`}>
                Smart Campus · Efficient Maintenance · Verified Resolution
              </p>
            </div>
          </footer>
        </div>
      </main>

      <LogoutModal
        isOpen={showLogout}
        onClose={() => setShowLogout(false)}
      />
    </div>
  );
}

export default TechnicianDashboard;
