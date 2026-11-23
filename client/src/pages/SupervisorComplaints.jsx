
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../services/api";
import SupervisorSidebar from "../components/SupervisorSidebar";
import LogoutModal from "../components/LogoutModal";
import { useTheme } from "../context/ThemeContext";

const formatDateTime = (date) => {
  if (!date) return "Not available";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Not available";

  return parsed.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getDeadlineState = (complaint) => {
  if (!complaint.deadline) return "Not Set";
  if (complaint.status === "Resolved") return "Completed";

  return new Date(complaint.deadline) < new Date()
    ? "Overdue"
    : "On Track";
};

const getRemainingTime = (deadline) => {
  if (!deadline) return "No deadline set";

  const difference = new Date(deadline).getTime() - Date.now();

  if (Number.isNaN(difference)) return "Not available";
  if (difference <= 0) return "Deadline passed";

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((difference / (1000 * 60)) % 60);

  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${minutes}m remaining`;

  return `${minutes}m remaining`;
};

const getTechnician = (complaint) =>
  complaint.technician ||
  complaint.assignedTechnician ||
  complaint.assignedTo ||
  null;

const getTechnicianName = (complaint) => {
  const technician = getTechnician(complaint);

  if (!technician) return "Not assigned";
  if (typeof technician === "string") return technician;

  return (
    technician.name ||
    technician.fullName ||
    technician.user?.name ||
    "Not assigned"
  );
};

const getTechnicianId = (complaint) => {
  const technician = getTechnician(complaint);

  if (!technician) return "";
  if (typeof technician === "string") return technician;

  return technician._id || technician.id || "";
};

const SectionHeading = ({ title, subtitle, darkMode }) => (
  <div className="mb-3">
    <h3
      className={`text-base font-bold ${darkMode ? "text-white" : "text-slate-900"
        }`}
    >
      {title}
    </h3>
    {subtitle && (
      <p
        className={`mt-1 text-xs ${darkMode ? "text-slate-400" : "text-slate-500"
          }`}
      >
        {subtitle}
      </p>
    )}
  </div>
);

const StatCard = ({ label, value, darkMode }) => (
  <div
    className={`rounded-xl border p-4 ${darkMode
      ? "border-slate-700 bg-slate-800"
      : "border-slate-200 bg-white"
      }`}
  >
    <p
      className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? "text-slate-400" : "text-slate-500"
        }`}
    >
      {label}
    </p>
    <p
      className={`mt-2 text-2xl font-bold ${darkMode ? "text-white" : "text-slate-900"
        }`}
    >
      {value}
    </p>
  </div>
);

const InfoItem = ({ label, value, darkMode }) => (
  <div className="min-w-0">
    <p
      className={`text-xs font-medium ${darkMode ? "text-slate-400" : "text-slate-500"
        }`}
    >
      {label}
    </p>
    <p
      className={`mt-1 break-words text-sm font-semibold ${darkMode ? "text-slate-100" : "text-slate-800"
        }`}
    >
      {value || "Not provided"}
    </p>
  </div>
);

export default function SupervisorComplaints() {
  const location = useLocation();
  const { darkMode } = useTheme();

  const [complaints, setComplaints] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [assigningId, setAssigningId] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [selectedTechnician, setSelectedTechnician] = useState({});
  const [assignmentReasons, setAssignmentReasons] = useState({});
  const [verificationRemarks, setVerificationRemarks] = useState({});
  const [expandedComplaints, setExpandedComplaints] = useState({});

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [showLogout, setShowLogout] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const selectedComplaintId = location.state?.complaintId || null;

  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  });

  const assignedBlocks = user?.assignedBlocks || [];

  const surface = darkMode
    ? "border-slate-700 bg-slate-800"
    : "border-slate-200 bg-white";

  const mutedSurface = darkMode
    ? "border-slate-700 bg-slate-900"
    : "border-slate-200 bg-slate-50";

  const headingText = darkMode ? "text-slate-100" : "text-slate-900";
  const bodyText = darkMode ? "text-slate-300" : "text-slate-700";
  const secondaryText = darkMode ? "text-slate-400" : "text-slate-500";

  const inputClass = `w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 ${darkMode
    ? "border-slate-600 bg-slate-900 text-slate-100 placeholder:text-slate-500"
    : "border-slate-200 bg-white text-slate-700 placeholder:text-slate-400"
    }`;

  const buttonClass =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

  // Fetch complaints
  const fetchComplaints = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await api.get("/supervisor/complaints");
      setComplaints(response.data.complaints || []);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Failed to load complaints."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch technicians
  const fetchTechnicians = async () => {
    try {
      const response = await api.get("/supervisor/technicians");

      setTechnicians(
        Array.isArray(response.data)
          ? response.data
          : response.data.technicians || []
      );
    } catch (error) {
      console.error("Failed to load technicians:", error);
    }
  };

  useEffect(() => {
    fetchComplaints();
    fetchTechnicians();
  }, []);

  const toggleComplaint = (id) => {
    setExpandedComplaints((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Technician specialization
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

    return technicians.filter(
      (technician) =>
        !required ||
        technician.specialization === required ||
        technician.specialization === "General"
    );
  };

  // Assign technician
  const handleAssignTechnician = async (complaintId) => {
    const complaint = complaints.find(
      (item) => (item._id || item.id) === complaintId
    );

    if (complaint?.status === "Resolved") {
      setErrorMessage("Resolved complaints cannot be reassigned.");
      return;
    }

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

    setAssigningId(complaintId);
    setMessage("");
    setErrorMessage("");

    try {
      await api.patch(
        `/supervisor/complaints/${complaintId}/assign-technician`,
        { technicianId, reason }
      );

      setMessage("Technician assigned successfully.");

      setAssignmentReasons((prev) => ({
        ...prev,
        [complaintId]: "",
      }));

      setSelectedTechnician((prev) => ({
        ...prev,
        [complaintId]: technicianId,
      }));

      await Promise.all([
        fetchComplaints(true),
        fetchTechnicians(),
      ]);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Failed to assign technician."
      );
    } finally {
      setAssigningId(null);
    }

  };

  // Verify complaint
  const handleVerification = async (complaintId, decision) => {
    const remarks = verificationRemarks[complaintId]?.trim() || "";

    if (decision === "Rejected" && !remarks) {
      setErrorMessage("Please enter remarks before rejecting.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to ${decision.toLowerCase()} this complaint?`
    );

    if (!confirmed) return;

    setVerifyingId(complaintId);
    setMessage("");
    setErrorMessage("");

    try {
      await api.patch(
        `/supervisor/complaints/${complaintId}/verify`,
        { decision, remarks }
      );

      setMessage(`Complaint ${decision.toLowerCase()} successfully.`);

      setVerificationRemarks((prev) => ({
        ...prev,
        [complaintId]: "",
      }));

      await fetchComplaints(true);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Verification failed."
      );
    } finally {
      setVerifyingId(null);
    }
  };


  // Delete resolved complaint
  const handleDeleteComplaint = async (complaintId) => {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this resolved complaint? This action cannot be undone."
    );

    if (!confirmed) return;

    setDeletingId(complaintId);
    setMessage("");
    setErrorMessage("");

    try {
      const response = await api.delete(
        `/supervisor/complaints/${complaintId}`
      );

      // Remove deleted complaint from the current list
      setComplaints((prev) =>
        prev.filter(
          (complaint) =>
            String(complaint._id) !== String(complaintId)
        )
      );

      // Remove its expanded state
      setExpandedComplaints((prev) => {
        const updated = { ...prev };
        delete updated[complaintId];
        return updated;
      });

      setMessage(
        response.data?.message ||
        "Resolved complaint deleted successfully."
      );
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
        "Failed to delete complaint. Please try again."
      );
    } finally {
      setDeletingId(null);
    }
  };



  // Filters
  const filteredComplaints = useMemo(() => {
    return complaints.filter((complaint) => {
      if (
        selectedComplaintId &&
        String(complaint._id) !== String(selectedComplaintId)
      ) {
        return false;
      }

      const student = complaint.user || complaint.student || {};
      const technicianName = getTechnicianName(complaint);

      const searchContent = [
        complaint._id,
        complaint.category,
        complaint.title,
        complaint.description,
        complaint.block,
        complaint.floor,
        complaint.room,
        complaint.status,
        complaint.priority,
        technicianName,
        student.name,
        student.fullName,
        student.email,
        student.enrollmentNumber,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchContent.includes(
        searchTerm.toLowerCase().trim()
      );

      const matchesStatus =
        statusFilter === "All" || complaint.status === statusFilter;

      const matchesPriority =
        priorityFilter === "All" || complaint.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [
    complaints,
    selectedComplaintId,
    searchTerm,
    statusFilter,
    priorityFilter,
  ]);

  // Dashboard stats
  const stats = useMemo(() => ({
    total: complaints.length,
    pending: complaints.filter((item) => item.status === "Pending").length,
    active: complaints.filter((item) =>
      ["Assigned", "In Progress"].includes(item.status)
    ).length,
    resolved: complaints.filter((item) => item.status === "Resolved").length,
    overdue: complaints.filter(
      (item) => getDeadlineState(item) === "Overdue"
    ).length,
awaitingVerification: complaints.filter(
  (item) => item.verificationStatus === "Pending"
).length,
  }), [complaints]);

  const getStatusStyle = (status) => {
    const styles = {
      Pending: "bg-amber-100 text-amber-800",
      Assigned: "bg-blue-100 text-blue-800",
      "In Progress": "bg-indigo-100 text-indigo-800",
      Resolved: "bg-emerald-100 text-emerald-800",
    };

    return styles[status] || "bg-slate-100 text-slate-700";
  };

  const getPriorityStyle = (priority) => {
    const styles = {
      High: "bg-red-100 text-red-800",
      Medium: "bg-orange-100 text-orange-800",
      Low: "bg-green-100 text-green-800",
    };

    return styles[priority] || "bg-slate-100 text-slate-700";
  };

  const getDeadlineStyle = (state) => {
    if (state === "Overdue") return "text-red-500";
    if (state === "On Track") return "text-emerald-500";
    if (state === "Completed") return "text-blue-500";
    return secondaryText;
  };

  const getFilterCount = (filter) => {
    if (filter === "All") return complaints.length;

    return complaints.filter((item) => item.status === filter).length;
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setPriorityFilter("All");
  };

  const handleBackToAll = () => {
    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );
    window.location.reload();
  };

  return (
    <div
      className={`min-h-screen ${darkMode ? "bg-slate-950" : "bg-slate-100"
        }`}
    >
      <SupervisorSidebar onLogout={() => setShowLogout(true)} />

      <main className="min-h-screen px-4 py-6 md:ml-72 md:px-7 lg:px-9">
        <div className="mx-auto max-w-[1500px]">

          {/* Header */}
          <div className={`mb-6 rounded-2xl border p-6 ${surface}`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-500">
                  Supervisor Operations
                </p>

                <h1 className={`text-2xl font-bold md:text-3xl ${headingText}`}>
                  Complaint Management
                </h1>

                <p className={`mt-2 text-sm ${secondaryText}`}>
                  Review complaints, coordinate technicians and monitor resolution progress.
                </p>

                {assignedBlocks.length > 0 && (
                  <p className={`mt-3 text-xs ${bodyText}`}>
                    Assigned Blocks:{" "}
                    <span className="font-semibold">
                      {assignedBlocks.join(", ")}
                    </span>
                  </p>
                )}
              </div>

              <button
                onClick={() => fetchComplaints(true)}
                disabled={refreshing}
                className={`${buttonClass} bg-indigo-600 text-white hover:bg-indigo-700`}
              >
                {refreshing ? "Refreshing..." : "Refresh Data"}
              </button>
            </div>
          </div>

          {/* Selected Complaint */}
          {selectedComplaintId && (
            <div className={`mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${surface}`}>
              <div>
                <p className={`font-semibold ${headingText}`}>
                  Viewing Selected Complaint
                </p>
                <p className={`mt-1 text-xs ${secondaryText}`}>
                  You are viewing one complaint from the dashboard.
                </p>
              </div>

              <button
                onClick={handleBackToAll}
                className={`${buttonClass} ${darkMode
                  ? "bg-slate-700 text-white hover:bg-slate-600"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
              >
                Back to All Complaints
              </button>
            </div>
          )}

          {/* Messages */}
          {message && (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
              {message}
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              <span>{errorMessage}</span>
              <button
                onClick={() => setErrorMessage("")}
                className="font-bold"
              >
                ×
              </button>
            </div>
          )}

          {/* Stats */}
          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Total Complaints" value={stats.total} darkMode={darkMode} />
            <StatCard label="Pending" value={stats.pending} darkMode={darkMode} />
            <StatCard label="Active" value={stats.active} darkMode={darkMode} />
            <StatCard label="Resolved" value={stats.resolved} darkMode={darkMode} />
            <StatCard label="Overdue" value={stats.overdue} darkMode={darkMode} />
            <StatCard label="Awaiting Review" value={stats.awaitingVerification} darkMode={darkMode} />
          </div>

          {/* Filters */}
          <section className={`mb-6 rounded-xl border p-5 ${surface}`}>
            <SectionHeading
              title="Find Complaints"
              subtitle="Search and filter complaints."
              darkMode={darkMode}
            />

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_auto]">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by ID, category, block, room..."
                className={inputClass}
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={inputClass}
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending ({getFilterCount("Pending")})</option>
                <option value="Assigned">Assigned ({getFilterCount("Assigned")})</option>
                <option value="In Progress">In Progress ({getFilterCount("In Progress")})</option>
                <option value="Resolved">Resolved ({getFilterCount("Resolved")})</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className={inputClass}
              >
                <option value="All">All Priorities</option>
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>

              <button
                onClick={resetFilters}
                className={`${buttonClass} ${darkMode
                  ? "bg-slate-700 text-slate-200 hover:bg-slate-600"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
              >
                Reset Filters
              </button>
            </div>
          </section>

          {/* Complaints Heading */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className={`text-xl font-bold ${headingText}`}>
                Complaints
              </h2>
              <p className={`mt-1 text-sm ${secondaryText}`}>
                Showing {filteredComplaints.length} of {complaints.length} complaints
              </p>
            </div>
          </div>

          {/* Complaint List */}
          {loading ? (
            <div className={`rounded-xl border p-12 text-center ${surface}`}>
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
              <p className={bodyText}>Loading complaints...</p>
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className={`rounded-xl border p-12 text-center ${surface}`}>
              <div className="mb-3 text-4xl">📋</div>
              <h3 className={`text-lg font-bold ${headingText}`}>
                No Complaints Found
              </h3>
              <p className={`mt-2 text-sm ${secondaryText}`}>
                Try changing your search or filter options.
              </p>
              <button
                onClick={resetFilters}
                className="mt-4 text-sm font-semibold text-indigo-500 hover:underline"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredComplaints.map((complaint) => {
                const id = complaint._id;
                const isExpanded = !!expandedComplaints[id];

                const deadlineState = getDeadlineState(complaint);
                const availableTechnicians = getTechniciansForComplaint(
                  complaint.category
                );

                const assignedTechnicianId = getTechnicianId(complaint);

                const assignmentHistory = complaint.assignmentHistory || [];

                const resolutionRemarks =
                  complaint.resolutionRemarks ||
                  complaint.resolutionNote ||
                  "";

                const completionPhoto =
                  complaint.completionPhoto ||
                  complaint.resolutionImage ||
                  complaint.afterImage;

                const complaintImage =
                  complaint.image ||
                  complaint.photo ||
                  complaint.imageUrl;

                const description =
                  complaint.description || "No description provided.";

                const locationText = [
                  complaint.block,
                  complaint.floor,
                  complaint.room,
                ]
                  .filter(Boolean)
                  .join(" · ");

                const timelineEvents = [
                  {
                    title: "Complaint Raised",
                    date: complaint.createdAt || complaint.date,
                  },
                  {
                    title: "Supervisor Assigned",
                    date: complaint.assignedAt,
                  },
                  {
                    title: "Technician Assigned",
                    date: complaint.technicianAssignedAt,
                  },
                  {
                    title: "Complaint Resolved",
                    date: complaint.resolvedAt,
                  },
                ];

                return (
                  <article
                    key={id}
                    className={`overflow-hidden rounded-2xl border shadow-sm ${surface}`}
                  >
                    {/* Complaint Header */}
                    <div
                      className={`border-b px-5 py-5 md:px-6 ${darkMode
                        ? "border-slate-700 bg-slate-800/70"
                        : "border-slate-200 bg-slate-50"
                        }`}
                    >
                      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                        <div className="min-w-0">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-700">
                              {complaint.category || "General"}
                            </span>

                            <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${getPriorityStyle(complaint.priority)}`}>
                              {complaint.priority || "Normal"} Priority
                            </span>

                            <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${getStatusStyle(complaint.status)}`}>
                              {complaint.status || "Unknown"}
                            </span>
                          </div>

                          <h3 className={`text-lg font-bold md:text-xl ${headingText}`}>
                            {complaint.title ||
                              `${complaint.category || "Maintenance"} Complaint`}
                          </h3>

                          <p className={`mt-1 text-xs ${secondaryText}`}>
                            Complaint ID:{" "}
                            <span className="font-semibold">
                              {String(id).slice(-12)}
                            </span>
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-5 sm:min-w-[280px]">
                          <InfoItem
                            label="Location"
                            value={locationText}
                            darkMode={darkMode}
                          />
                          <InfoItem
                            label="Submitted"
                            value={formatDateTime(complaint.createdAt || complaint.date)}
                            darkMode={darkMode}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-5 md:p-6">

                      {/* Complaint Description */}
                      <section>
                        <SectionHeading
                          title="Complaint Details"
                          subtitle="Read the reported problem and review its attachment."
                          darkMode={darkMode}
                        />

                        <div className={`rounded-xl border p-4 md:p-5 ${mutedSurface}`}>
                          <p className={`whitespace-pre-wrap text-sm leading-7 ${bodyText}`}>
                            {description}
                          </p>

                          {complaintImage && (
                            <div className={`mt-4 border-t pt-4 ${darkMode ? "border-slate-700" : "border-slate-200"
                              }`}>
                              <p className={`mb-2 text-xs font-semibold ${secondaryText}`}>
                                ATTACHMENT
                              </p>

                              <button
                                type="button"
                                onClick={() => setPreviewImage(complaintImage)}
                                className="group overflow-hidden rounded-lg border border-slate-300"
                              >
                                <img
                                  src={complaintImage}
                                  alt="Complaint attachment"
                                  className="h-32 w-44 object-cover transition group-hover:scale-105"
                                />
                              </button>
                            </div>
                          )}
                        </div>
                      </section>

                      {/* Read-only Deadline */}
                      <section className="mt-4">
                        <div className={`rounded-xl border p-4 ${mutedSurface}`}>
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className={`text-xs font-semibold uppercase tracking-wide ${secondaryText}`}>
                                Resolution Deadline
                              </p>
                              <p className={`mt-1 text-sm font-bold ${headingText}`}>
                                {formatDateTime(complaint.deadline)}
                              </p>
                            </div>

                            <div className="text-left sm:text-right">
                              <p className={`text-xs ${secondaryText}`}>
                                Time Remaining
                              </p>
                              <p className={`mt-1 text-sm font-bold ${getDeadlineStyle(deadlineState)}`}>
                                {getRemainingTime(complaint.deadline)}
                              </p>
                            </div>

                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${deadlineState === "Overdue"
                              ? "bg-red-100 text-red-700"
                              : deadlineState === "On Track"
                                ? "bg-emerald-100 text-emerald-700"
                                : deadlineState === "Completed"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-slate-200 text-slate-700"
                              }`}>
                              {deadlineState}
                            </span>
                          </div>

                          {complaint.deadlineReason && (
                            <p className={`mt-3 border-t pt-3 text-xs leading-5 ${darkMode
                              ? "border-slate-700 text-slate-400"
                              : "border-slate-200 text-slate-500"
                              }`}>
                              <span className="font-semibold">Reason: </span>
                              {complaint.deadlineReason}
                            </p>
                          )}
                        </div>
                      </section>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className={`mt-5 space-y-5 border-t pt-5 ${darkMode ? "border-slate-700" : "border-slate-200"
                          }`}>

                          {/* Technician Assignment */}
                          {complaint.status !== "Resolved" && (
                            <section>
                              <SectionHeading
                                title="Technician Assignment"
                                subtitle="Assign a suitable technician to handle this complaint."
                                darkMode={darkMode}
                              />

                              <div className={`rounded-xl border p-4 ${mutedSurface}`}>
                                <div className="mb-4">
                                  <InfoItem
                                    label="Currently Assigned Technician"
                                    value={getTechnicianName(complaint)}
                                    darkMode={darkMode}
                                  />
                                </div>

                                <div className="grid gap-3 md:grid-cols-2">
                                  <select
                                    value={
                                      selectedTechnician[id] ||
                                      assignedTechnicianId ||
                                      ""
                                    }
                                    onChange={(e) =>
                                      setSelectedTechnician((prev) => ({
                                        ...prev,
                                        [id]: e.target.value,
                                      }))
                                    }
                                    className={inputClass}
                                  >
                                    <option value="">Select Technician</option>

                                    {availableTechnicians.map((technician) => (
                                      <option
                                        key={technician._id}
                                        value={technician._id}
                                      >
                                        {technician.name ||
                                          technician.fullName ||
                                          "Technician"}
                                        {technician.specialization
                                          ? ` — ${technician.specialization}`
                                          : ""}
                                      </option>
                                    ))}
                                  </select>

                                  <input
                                    type="text"
                                    value={assignmentReasons[id] || ""}
                                    onChange={(e) =>
                                      setAssignmentReasons((prev) => ({
                                        ...prev,
                                        [id]: e.target.value,
                                      }))
                                    }
                                    placeholder="Reason for assignment / reassignment"
                                    className={inputClass}
                                  />
                                </div>

                                <button
                                  onClick={() => handleAssignTechnician(id)}
                                  disabled={assigningId === id}
                                  className={`${buttonClass} mt-3 bg-indigo-600 text-white hover:bg-indigo-700`}
                                >
                                  {assigningId === id
                                    ? "Assigning..."
                                    : assignedTechnicianId
                                      ? "Reassign Technician"
                                      : "Assign Technician"}
                                </button>

                                {availableTechnicians.length === 0 && (
                                  <p className="mt-3 text-xs font-medium text-amber-600">
                                    No matching technician is currently available for this category.
                                  </p>
                                )}
                              </div>
                            </section>

                          )}
                          {/* Completion & Verification */}
                          <section>
                            <SectionHeading
                              title="Completion & Verification"
                              subtitle="Review the technician's submitted work."
                              darkMode={darkMode}
                            />

                            <div className={`rounded-xl border p-4 ${mutedSurface}`}>
                              <div className="mb-4 grid gap-4 sm:grid-cols-2">
                                <InfoItem
                                  label="Verification Status"
                                  value={complaint.verificationStatus || "Not submitted"}
                                  darkMode={darkMode}
                                />
                                <InfoItem
                                  label="Complaint Status"
                                  value={complaint.status}
                                  darkMode={darkMode}
                                />
                              </div>

                              {resolutionRemarks && (
                                <div className="mb-4">
                                  <p className={`mb-1 text-xs font-semibold ${secondaryText}`}>
                                    TECHNICIAN'S REMARKS
                                  </p>
                                  <p className={`whitespace-pre-wrap text-sm leading-6 ${bodyText}`}>
                                    {resolutionRemarks}
                                  </p>
                                </div>
                              )}

                              {completionPhoto && (
                                <div className="mb-4">
                                  <p className={`mb-2 text-xs font-semibold ${secondaryText}`}>
                                    COMPLETION PHOTO
                                  </p>

                                  <button
                                    type="button"
                                    onClick={() => setPreviewImage(completionPhoto)}
                                    className="overflow-hidden rounded-lg border border-slate-300"
                                  >
                                    <img
                                      src={completionPhoto}
                                      alt="Completed work"
                                      className="h-32 w-44 object-cover"
                                    />
                                  </button>
                                </div>
                              )}

{complaint.verificationStatus === "Pending" &&
  complaint.status !== "Resolved" && (
                                  <div className={`border-t pt-4 ${darkMode ? "border-slate-700" : "border-slate-200"
                                    }`}>
                                    <label className={`mb-2 block text-sm font-semibold ${headingText}`}>
                                      Verification Remarks
                                    </label>

                                    <textarea
                                      rows={3}
                                      value={verificationRemarks[id] || ""}
                                      onChange={(e) =>
                                        setVerificationRemarks((prev) => ({
                                          ...prev,
                                          [id]: e.target.value,
                                        }))
                                      }
                                      placeholder="Enter remarks (required for rejection)..."
                                      className={inputClass}
                                    />

                                    <div className="mt-3 flex flex-wrap gap-3">
                                      <button
                                        onClick={() => handleVerification(id, "Approved")}
                                        disabled={verifyingId === id}
                                        className={`${buttonClass} bg-emerald-600 text-white hover:bg-emerald-700`}
                                      >
                                        {verifyingId === id
                                          ? "Processing..."
                                          : "Approve Completion"}
                                      </button>

                                      <button
                                        onClick={() => handleVerification(id, "Rejected")}
                                        disabled={verifyingId === id}
                                        className={`${buttonClass} bg-red-600 text-white hover:bg-red-700`}
                                      >
                                        Reject Completion
                                      </button>
                                    </div>
                                  </div>
                                )}

                              {complaint.verificationStatus === "Approved" && (
                                <p className="rounded-lg bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-800">
                                  Completion has been approved.
                                </p>
                              )}
                            </div>
                          </section>

                          {/* Compact Timeline */}
                          <section>
                            <SectionHeading
                              title="Complaint Timeline"
                              subtitle="Important complaint activity."
                              darkMode={darkMode}
                            />

                            <div className={`rounded-xl border p-4 ${mutedSurface}`}>
                              <div className="space-y-4">
                                {timelineEvents.map((event, index) => (
                                  <div key={event.title} className="flex items-start gap-3">
                                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${event.date
                                      ? "bg-indigo-600 text-white"
                                      : darkMode
                                        ? "bg-slate-700 text-slate-400"
                                        : "bg-slate-200 text-slate-500"
                                      }`}>
                                      {index + 1}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <p className={`text-sm font-semibold ${headingText}`}>
                                        {event.title}
                                      </p>
                                      <p className={`mt-1 text-xs ${secondaryText}`}>
                                        {formatDateTime(event.date)}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </section>

                          {/* Assignment History */}
                          {assignmentHistory.length > 0 && (
                            <section>
                              <SectionHeading
                                title="Assignment History"
                                subtitle="Previous technician assignments."
                                darkMode={darkMode}
                              />

                              <div className={`overflow-hidden rounded-xl border ${surface}`}>
                                <div className="overflow-x-auto">
                                  <table className="w-full min-w-[500px] text-left text-sm">
                                    <thead className={
                                      darkMode
                                        ? "bg-slate-900 text-slate-300"
                                        : "bg-slate-100 text-slate-600"
                                    }>
                                      <tr>
                                        <th className="px-4 py-3 font-semibold">Technician</th>
                                        <th className="px-4 py-3 font-semibold">Assigned At</th>
                                        <th className="px-4 py-3 font-semibold">Reason</th>
                                      </tr>
                                    </thead>

                                    <tbody>
                                      {assignmentHistory.map((history, index) => (
                                        <tr
                                          key={history._id || index}
                                          className={`border-t ${darkMode
                                            ? "border-slate-700 text-slate-300"
                                            : "border-slate-200 text-slate-700"
                                            }`}
                                        >
                                          <td className="px-4 py-3 font-medium">
                                            {history.technician?.name ||
                                              history.technicianName ||
                                              "Technician"}
                                          </td>
                                          <td className="px-4 py-3">
                                            {formatDateTime(history.assignedAt)}
                                          </td>
                                          <td className="px-4 py-3">
                                            {history.reason || "Not provided"}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </section>
                          )}
                        </div>
                      )}
                      {/* Delete Resolved Complaint */}
                      {complaint.status === "Resolved" && (
                        <div className="mt-5 flex justify-end">
                          <button
                            onClick={() => handleDeleteComplaint(id)}
                            disabled={deletingId === id}
                            className={`${buttonClass} bg-red-600 text-white hover:bg-red-700`}
                          >
                            {deletingId === id ? "Deleting..." : "Delete Complaint"}
                          </button>
                        </div>
                      )}
                      {/* Read More / Read Less */}
                      <div className="mt-5 flex justify-center">
                        <button
                          onClick={() => toggleComplaint(id)}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-6 py-2.5 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
                        >
                          {isExpanded ? "Show Less ↑" : "View More Details ↓"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-h-[90vh] max-w-5xl">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -right-3 -top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-xl font-bold text-slate-900 shadow-lg"
            >
              ×
            </button>

            <img
              src={previewImage}
              alt="Complaint Preview"
              className="max-h-[85vh] max-w-full rounded-xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      <LogoutModal
        isOpen={showLogout}
        onClose={() => setShowLogout(false)}
      />
    </div>
  );
}
