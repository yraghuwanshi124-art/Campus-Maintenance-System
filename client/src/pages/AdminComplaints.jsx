
import { useEffect, useState } from "react";
import api from "../services/api";
import LogoutModal from "../components/LogoutModal";
import AdminSidebar from "../components/AdminSidebar";
import { useTheme } from "../context/ThemeContext";

function AdminComplaints() {
  const { darkMode } = useTheme();
  const [complaints, setComplaints] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [showLogout, setShowLogout] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [expandedComplaints, setExpandedComplaints] = useState({});
  const [selectedSupervisors, setSelectedSupervisors] = useState({});

  // ================= FETCH COMPLAINTS =================

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.get("/complaints/all", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(
        "ADMIN COMPLAINT DATA:",
        response.data.complaints
      );

      setComplaints(response.data.complaints || []);
    } catch (error) {
      console.log(
        "Failed to fetch complaints:",
        error.response?.data || error
      );
    }
  };

  // ================= FETCH SUPERVISORS =================

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
        error.response?.data || error
      );
    }
  };

  // ================= INITIAL LOAD =================

  useEffect(() => {
    fetchComplaints();
    fetchSupervisors();
  }, []);

  // ================= TOGGLE =================

  const toggleComplaint = (complaintId) => {
    setExpandedComplaints((prev) => ({
      ...prev,
      [complaintId]: !prev[complaintId],
    }));
  };

  // ================= ASSIGN COMPLAINT TO SUPERVISOR =================

  const assignComplaint = async (
    complaintId,
    supervisorId
  ) => {
    if (!supervisorId) {
      alert("Please select a supervisor first.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await api.patch(
        `/complaints/${complaintId}/assign`,
        {
          supervisorId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(response.data.message);

      const assignedSupervisor =
        supervisors.find(
          (supervisor) =>
            supervisor._id === supervisorId
        ) || null;

      setComplaints((prevComplaints) =>
        prevComplaints.map((complaint) =>
          complaint._id === complaintId
            ? {
              ...complaint,
              supervisor:
                assignedSupervisor || supervisorId,
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
        error.response?.data?.message ||
        "Failed to assign complaint"
      );
    }
  };

  // ================= DELETE COMPLAINT =================

  const deleteComplaint = async (complaintId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this complaint?"
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

      setComplaints((prevComplaints) =>
        prevComplaints.filter(
          (complaint) =>
            complaint._id !== complaintId
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
        error.response?.data?.message ||
        "Failed to delete complaint"
      );
    }
  };

  // ================= STATUS STYLE =================

  const getStatusStyle = (status) => {
    if (status === "Resolved") {
      return "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-300";
    }

    if (status === "In Progress") {
      return "border-purple-100 bg-purple-50 text-purple-700 dark:border-purple-800/60 dark:bg-purple-950/50 dark:text-purple-300";
    }

    if (status === "Assigned") {
      return "border-orange-100 bg-orange-50 text-orange-700 dark:border-orange-800/60 dark:bg-orange-950/50 dark:text-orange-300";
    }

    return "border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-800/60 dark:bg-blue-950/50 dark:text-blue-300";
  };

  // ================= PRIORITY STYLE =================

  const getPriorityStyle = (priority) => {
    if (priority === "High") {
      return "border-red-100 bg-red-50 text-red-600 dark:border-red-800/60 dark:bg-red-950/50 dark:text-red-300";
    }

    if (priority === "Medium") {
      return "border-orange-100 bg-orange-50 text-orange-600 dark:border-orange-800/60 dark:bg-orange-950/50 dark:text-orange-300";
    }

    return "border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-300";
  };

  // ================= DATE FORMAT =================

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

  // ================= FILTER =================

  const filteredComplaints = complaints.filter(
    (complaint) => {
      const search = searchTerm
        .toLowerCase()
        .trim();

      const supervisorName =
        typeof complaint.supervisor === "object"
          ? complaint.supervisor?.name || ""
          : supervisors.find(
            (supervisor) =>
              supervisor._id ===
              complaint.supervisor
          )?.name || "";

      const matchesSearch =
        complaint.category
          ?.toLowerCase()
          .includes(search) ||
        complaint.block
          ?.toLowerCase()
          .includes(search) ||
        complaint.room
          ?.toLowerCase()
          .includes(search) ||
        complaint.description
          ?.toLowerCase()
          .includes(search) ||
        complaint.user?.name
          ?.toLowerCase()
          .includes(search) ||
        complaint.user?.email
          ?.toLowerCase()
          .includes(search) ||
        complaint.user?.classSection
          ?.toLowerCase()
          .includes(search) ||
        complaint.user?.enrollmentNumber
          ?.toLowerCase()
          .includes(search) ||
        complaint.user?.department
          ?.toLowerCase()
          .includes(search) ||
        supervisorName
          .toLowerCase()
          .includes(search);

      const matchesStatus =
        statusFilter === "All" ||
        complaint.status === statusFilter;

      return matchesSearch && matchesStatus;
    }
  );

  // ================= SORT BY RECENT =================

  const sortedComplaints = [
    ...filteredComplaints,
  ].sort(
    (a, b) =>
      new Date(b.createdAt || 0) -
      new Date(a.createdAt || 0)
  );

  // ================= STATUS LISTS =================

  const pendingComplaintList =
    sortedComplaints.filter(
      (complaint) =>
        complaint.status === "Pending"
    );

  const activeComplaints =
    sortedComplaints.filter(
      (complaint) =>
        complaint.status === "Assigned" ||
        complaint.status === "In Progress"
    );

  const resolvedComplaintList =
    sortedComplaints.filter(
      (complaint) =>
        complaint.status === "Resolved"
    );

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* ================= SIDEBAR ================= */}

      <AdminSidebar
        onLogout={() => setShowLogout(true)}
      />

      <div className="lg:ml-64">
        {/* ================= NAVBAR ================= */}

        <nav className="border-b border-indigo-100 bg-indigo-50 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-5">
              <div className="rounded-xl bg-white px-3 py-1.5 shadow-sm dark:border dark:border-slate-700 dark:bg-slate-800">
                <img
                  src="https://www.medicaps.ac.in/public/frontend/images/medicaps-logo-fin.webp"
                  alt="Medi-Caps University"
                  className="h-11 w-auto object-contain"
                />
              </div>

              <div className="hidden border-l-2 border-indigo-200 pl-5 sm:block dark:border-indigo-800">
                <p className="text-xl font-extrabold tracking-tight text-indigo-700 dark:text-indigo-400">
                  CampusFix
                </p>

                <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">
                  Campus Maintenance Management System
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden text-right sm:block">
                <p className="text-base font-bold text-slate-800 dark:text-white">
                  {user?.assignedBlocks?.length
                    ? `${user.assignedBlocks.join(
                      ", "
                    )} Admin`
                    : "Administrator"}
                </p>

                <p className="mt-0.5 max-w-[230px] truncate text-sm text-slate-500 dark:text-slate-400">
                  {user?.email || "No email"}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-600 text-base font-bold text-white shadow-sm">
                A
              </div>

              <button
                onClick={() => setShowLogout(true)}
                className="rounded-xl border border-indigo-200 bg-white px-5 py-2.5 text-base font-semibold text-slate-700 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Logout
              </button>
            </div>
          </div>
        </nav>

        {/* ================= MAIN ================= */}

        <main className="mx-auto max-w-7xl px-6 py-10">
          {/* ================= HEADER ================= */}

          <div className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-700 p-6 sm:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="text-white">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                    🛠️ Complaint Management
                  </div>

                  <h1 className="text-2xl font-extrabold sm:text-3xl">
                    All Complaints
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100">
                    Manage and monitor every campus maintenance
                    complaint from one centralized panel.
                  </p>
                </div>

                <div className="flex w-fit items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-5 py-4 backdrop-blur-md">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl dark:bg-slate-800">
                    📋
                  </div>

                  <div>
                    <p className="text-2xl font-extrabold text-white">
                      {sortedComplaints.length}
                    </p>

                    <p className="text-xs font-medium text-indigo-100">
                      Showing complaints
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ================= SEARCH + FILTER ================= */}

            <div className="border-b border-slate-100 bg-slate-50/70 p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative w-full lg:max-w-xl">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">
                    🔍
                  </span>

                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) =>
                      setSearchTerm(e.target.value)
                    }
                    placeholder="Search by complaint, student, block, room..."
                    className={`w-full rounded-2xl border py-3.5 pl-12 pr-4 text-sm font-medium shadow-sm outline-none transition ${darkMode
                      ? "border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-950"
                      : "border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                      }`}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    { name: "All", icon: "📋" },
                    { name: "Pending", icon: "⏳" },
                    { name: "Assigned", icon: "👨‍💼" },
                    {
                      name: "In Progress",
                      icon: "🔧",
                    },
                    { name: "Resolved", icon: "✅" },
                  ].map((filter) => (
                    <button
                      key={filter.name}
                      onClick={() =>
                        setStatusFilter(filter.name)
                      }
                      className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${statusFilter === filter.name
                        ? "bg-indigo-600 text-white shadow-md"
                        : darkMode
                          ? "border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                          : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                        }`}
                    >
                      {filter.icon} {filter.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Showing{" "}
                  <span className="font-extrabold text-slate-800 dark:text-white">
                    {sortedComplaints.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-extrabold text-slate-800 dark:text-white">
                    {complaints.length}
                  </span>{" "}
                  complaints
                </p>

                {(searchTerm ||
                  statusFilter !== "All") && (
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setStatusFilter("All");
                      }}
                      className="text-sm font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                    >
                      Clear Filters
                    </button>
                  )}
              </div>
            </div>
          </div>

          {/* ================= NO COMPLAINTS ================= */}

          {sortedComplaints.length === 0 ? (
            <div
              className={`rounded-3xl border border-dashed p-12 text-center shadow-sm ${darkMode
                ? "border-slate-800 bg-slate-900"
                : "border-slate-300 bg-white"
                }`}
            >
              <div
                className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-4xl ${darkMode ? "bg-slate-800" : "bg-indigo-50"
                  }`}
              >
                {searchTerm || statusFilter !== "All"
                  ? "🔎"
                  : "📋"}
              </div>

              <h3 className={`mt-5 text-xl font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>
                {searchTerm || statusFilter !== "All"
                  ? "No matching complaints"
                  : "No complaints found"}
              </h3>

              <p className={`mx-auto mt-2 max-w-md text-sm leading-6 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                {searchTerm || statusFilter !== "All"
                  ? "Try changing your search or status filter to find other complaints."
                  : "There are currently no maintenance complaints in the system."}
              </p>

              {(searchTerm ||
                statusFilter !== "All") && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("All");
                    }}
                    className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
                  >
                    Clear Filters
                  </button>
                )}
            </div>
          ) : (
            <div className="space-y-5">
              {/* ================= PENDING ================= */}

              {pendingComplaintList.length > 0 && (
                <div className="mb-8">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">
                        🟡 Pending Complaints
                      </h2>

                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Complaints waiting for supervisor assignment
                      </p>
                    </div>

                    <span className="rounded-full bg-yellow-100 px-4 py-2 text-sm font-bold text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-400">
                      {pendingComplaintList.length}
                    </span>
                  </div>
                </div>
              )}

              {/* ================= ACTIVE ================= */}

              {activeComplaints.length > 0 && (
                <div className="mb-4 mt-10 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">
                      🔵 Active Complaints
                    </h2>

                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Assigned and currently in-progress complaints
                    </p>
                  </div>

                  <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                    {activeComplaints.length}
                  </span>
                </div>
              )}

              {/* ================= RESOLVED ================= */}

              {resolvedComplaintList.length > 0 && (
                <div className="mb-4 mt-10 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">
                      🟢 Resolved Complaints
                    </h2>

                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Complaints successfully resolved by technicians
                    </p>
                  </div>

                  <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                    {resolvedComplaintList.length}
                  </span>
                </div>
              )}

              {/* ================= COMPLAINT CARDS ================= */}


              {/* ================= COMPLAINT CARDS ================= */}

              {sortedComplaints.map((complaint) => {
                const isExpanded =
                  expandedComplaints[complaint._id];

                const supervisorId =
                  typeof complaint.supervisor === "object"
                    ? complaint.supervisor?._id
                    : complaint.supervisor;

                const supervisorName =
                  typeof complaint.supervisor === "object"
                    ? complaint.supervisor?.name
                    : supervisors.find(
                      (supervisor) =>
                        supervisor._id === supervisorId
                    )?.name;

                return (
                  <div
                    key={complaint._id}
                    className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:hover:border-indigo-500"
                  >
                    {/* TOP STATUS LINE */}

                    <div
                      className={`h-1.5 ${complaint.status === "Resolved"
                          ? "bg-emerald-500"
                          : complaint.status === "In Progress"
                            ? "bg-purple-500"
                            : complaint.status === "Assigned"
                              ? "bg-orange-500"
                              : "bg-blue-500"
                        }`}
                    />

                    <div className="p-5 sm:p-6">
                      {/* HEADER */}

                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex gap-4">
                          <div
                            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl ${complaint.status === "Resolved"
                                ? "bg-emerald-50 dark:bg-emerald-950/40"
                                : complaint.status === "In Progress"
                                  ? "bg-purple-50 dark:bg-purple-950/40"
                                  : complaint.status === "Assigned"
                                    ? "bg-orange-50 dark:bg-orange-950/40"
                                    : "bg-indigo-50 dark:bg-indigo-950/40"
                              }`}
                          >
                            🛠️
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold uppercase tracking-widest text-indigo-500">
                                Maintenance Request
                              </span>

                              <span className="text-xs text-slate-400">
                                • #{complaint._id?.slice(-6)}
                              </span>
                            </div>

                            <h3 className="mt-1 text-xl font-extrabold text-slate-800 dark:text-white">
                              {complaint.category}
                            </h3>

                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                              Reported by{" "}
                              <span className="font-semibold text-slate-700 dark:text-slate-200">
                                {complaint.user?.name || "Unknown Student"}
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* STATUS + PRIORITY */}

                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-3.5 py-2 text-xs font-bold ${getStatusStyle(
                              complaint.status
                            )}`}
                          >
                            {complaint.status === "Resolved" && "✓ "}
                            {complaint.status === "In Progress" && "⚙ "}
                            {complaint.status === "Assigned" && "👨‍💼 "}
                            {complaint.status === "Pending" && "⏳ "}
                            {complaint.status}
                          </span>

                          <span
                            className={`rounded-full border px-3.5 py-2 text-xs font-bold ${getPriorityStyle(
                              complaint.priority
                            )}`}
                          >
                            ⚡ {complaint.priority || "Low"}
                          </span>
                        </div>
                      </div>

                      {/* ================= EXPANDED ================= */}

                      {isExpanded && (
                        <>
                          {/* INFO GRID */}

                          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                            {/* LOCATION */}

                            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                                <span className="text-base">📍</span>
                                Location
                              </div>

                              <p className="mt-2 text-xl font-bold text-slate-700 dark:text-slate-100">
                                {complaint.block || "—"}
                              </p>

                              <p className="mt-0.5 font-semibold text-slate-500 dark:text-slate-400">
                                Room {complaint.room || "—"}
                              </p>
                            </div>

                            {/* STUDENT */}

                            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                                <span className="text-base">👨‍🎓</span>
                                Student
                              </div>

                              <p className="mt-2 truncate font-bold text-slate-700 dark:text-slate-100">
                                {complaint.user?.name || "Unknown Student"}
                              </p>

                              <p className="mt-1 truncate text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                🎓 {complaint.user?.enrollmentNumber || "No enrollment number"}
                              </p>

                              <p className="mt-1 truncate text-sm font-semibold text-slate-500 dark:text-slate-400">
                                {complaint.user?.email || "No email"}
                              </p>

                              {complaint.mobileNumber && (
                                <p className="mt-1 truncate text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                  📞 {complaint.mobileNumber}
                                </p>
                              )}

                              <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                                {complaint.user?.department || "No department"}
                                {" • "}
                                {complaint.user?.semester
                                  ? `Semester ${complaint.user.semester}`
                                  : "No semester"}
                              </p>

                              <p className="mt-1 text-sm font-bold text-slate-600 dark:text-slate-300">
                                🏫 {complaint.user?.classSection || "No class"}
                              </p>
                            </div>

                            {/* SUPERVISOR */}

                            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                                <span className="text-base">👨‍💼</span>
                                Supervisor
                              </div>

                              <p className="mt-2 truncate font-bold text-slate-700 dark:text-slate-100">
                                {supervisorName || "Not assigned"}
                              </p>

                              <p className="mt-0.5 font-semibold text-slate-500 dark:text-slate-400">
                                {supervisorId
                                  ? "Currently assigned"
                                  : "Waiting for assignment"}
                              </p>
                            </div>

                            {/* PRIORITY */}

                            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                                <span className="text-base">⚡</span>
                                Priority
                              </div>

                              <p className="mt-2 font-extrabold text-slate-700 dark:text-slate-100">
                                {complaint.priority || "Low"}
                              </p>

                              <p className="mt-0.5 font-semibold text-slate-500 dark:text-slate-400">
                                Maintenance priority
                              </p>
                            </div>
                          </div>

                          {/* DESCRIPTION */}

                          <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">
                            <div className="mb-2 flex items-center gap-2">
                              <span className="text-base">📝</span>

                              <p className="text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">
                                Problem Description
                              </p>
                            </div>

                            <p className="text-sm font-medium leading-7 text-slate-600 dark:text-slate-300">
                              {complaint.description || "No description provided."}
                            </p>
                          </div>

                          {/* TIMELINE */}

                          <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5 dark:border-indigo-800 dark:bg-indigo-950/30">
                            <div className="mb-5 flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-lg dark:bg-indigo-900">
                                🕒
                              </div>

                              <div>
                                <p className="font-bold text-slate-800 dark:text-white">
                                  Complaint Timeline
                                </p>

                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  Complete history of this maintenance request
                                </p>
                              </div>
                            </div>

                            <div className="grid gap-3 md:grid-cols-3">

                              {/* RAISED */}

                              <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800">
                                <div className="flex items-center gap-2">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm text-blue-600">
                                    ✓
                                  </div>

                                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                    Complaint Raised
                                  </p>
                                </div>

                                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                  By {complaint.user?.name || "Student"}
                                </p>

                                <p className="mt-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                                  🕒 {formatDateTime(complaint.createdAt)}
                                </p>
                              </div>

                              {/* SUPERVISOR ASSIGNED */}

                              <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800">
                                {complaint.assignedAt ? (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-sm text-orange-600">
                                        ✓
                                      </div>

                                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                        Supervisor Assigned
                                      </p>
                                    </div>

                                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                      Assigned to{" "}
                                      <span className="font-bold text-orange-600 dark:text-orange-400">
                                        {supervisorName || "Supervisor"}
                                      </span>
                                    </p>

                                    <p className="mt-1 text-xs font-semibold text-orange-600 dark:text-orange-400">
                                      🕒 {formatDateTime(complaint.assignedAt)}
                                    </p>
                                  </>
                                ) : (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm text-slate-400 dark:bg-slate-700">
                                        2
                                      </div>

                                      <p className="text-sm font-bold text-slate-400">
                                        Supervisor Assignment
                                      </p>
                                    </div>

                                    <p className="mt-2 text-xs text-slate-400">
                                      Waiting for supervisor assignment.
                                    </p>

                                    <p className="mt-1 text-xs font-semibold text-slate-400">
                                      Pending
                                    </p>
                                  </>
                                )}
                              </div>

                              {/* RESOLVED */}

                              <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800">
                                {complaint.resolvedAt ? (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm text-emerald-600">
                                        ✓
                                      </div>

                                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                        Complaint Resolved
                                      </p>
                                    </div>

                                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                      Maintenance issue successfully resolved.
                                    </p>

                                    <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                      🕒 {formatDateTime(complaint.resolvedAt)}
                                    </p>
                                  </>
                                ) : (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm text-slate-400 dark:bg-slate-700">
                                        3
                                      </div>

                                      <p className="text-sm font-bold text-slate-400">
                                        Resolution
                                      </p>
                                    </div>

                                    <p className="mt-2 text-xs text-slate-400">
                                      Waiting for the issue to be resolved.
                                    </p>

                                    <p className="mt-1 text-xs font-semibold text-slate-400">
                                      Pending
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* PHOTOS */}

                          {(complaint.image || complaint.completionImage) && (
                            <div className="mt-4 grid gap-4 md:grid-cols-2">

                              {complaint.image && (
                                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                                  <div className="mb-3 flex items-center gap-2">
                                    <span>📷</span>

                                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                                      Problem Photo
                                    </p>
                                  </div>

                                  <img
                                    src={complaint.image}
                                    alt="Reported problem"
                                    className="h-56 w-full rounded-xl object-cover"
                                  />
                                </div>
                              )}

                              {complaint.completionImage && (
                                <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
                                  <div className="mb-3 flex items-center gap-2">
                                    <span>✅</span>

                                    <p className="text-xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                                      Completion Proof
                                    </p>
                                  </div>

                                  <img
                                    src={complaint.completionImage}
                                    alt="Completed maintenance work"
                                    className="h-56 w-full rounded-xl object-cover"
                                  />

                                  <p className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                    ✓ Technician uploaded completion proof
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* ================= READ MORE ================= */}

                    <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6 dark:border-slate-700 dark:bg-slate-900">
                      <button
                        type="button"
                        onClick={() => toggleComplaint(complaint._id)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-5 py-3 text-sm font-bold text-indigo-600 shadow-sm transition hover:bg-indigo-50 hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:text-indigo-300 dark:hover:bg-slate-700"
                      >
                        {isExpanded ? "Show Less" : "Read More"}

                        <span className="text-base">
                          {isExpanded ? "↑" : "↓"}
                        </span>
                      </button>
                    </div>

                    {/* ================= ACTION BAR ================= */}

                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/80 px-5 py-5 sm:px-6 dark:border-slate-700 dark:bg-slate-900">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

                          {/* SUPERVISOR ASSIGNMENT */}

                          {complaint.status !== "Resolved" ? (
                            <div className="flex-1">
                              <div className="mb-2 flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900">
                                  👨‍💼
                                </div>

                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                  Supervisor Assignment
                                </p>
                              </div>

                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <select
                                  value={
                                    selectedSupervisors[complaint._id] ||
                                    supervisorId ||
                                    ""
                                  }
                                  onChange={(e) =>
                                    setSelectedSupervisors((prev) => ({
                                      ...prev,
                                      [complaint._id]: e.target.value,
                                    }))
                                  }
                                  className="w-full max-w-xl rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-indigo-900"
                                >
                                  <option value="">
                                    Select supervisor
                                  </option>

                                  {supervisors
                                    .filter((supervisor) =>
                                      supervisor.assignedBlocks?.includes(
                                        complaint.block
                                      )
                                    )
                                    .map((supervisor) => (
                                      <option
                                        key={supervisor._id}
                                        value={supervisor._id}
                                      >
                                        {supervisor.name} -{" "}
                                        {supervisor.assignedBlocks?.join(", ")}
                                      </option>
                                    ))}
                                </select>

                                <button
                                  onClick={() => {
                                    const selectedId =
                                      selectedSupervisors[complaint._id] ||
                                      supervisorId;

                                    assignComplaint(
                                      complaint._id,
                                      selectedId
                                    );
                                  }}
                                  disabled={
                                    !selectedSupervisors[complaint._id] &&
                                    !supervisorId
                                  }
                                  className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                >
                                  👨‍💼{" "}
                                  {supervisorId
                                    ? "Reassign Supervisor"
                                    : "Assign Supervisor"}
                                </button>
                              </div>

                              <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                Assigned block:{" "}
                                <span className="text-indigo-600 dark:text-indigo-400">
                                  {complaint.block || "Not specified"}
                                </span>
                              </p>
                            </div>
                          ) : (
                            <div className="flex flex-1 items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm dark:bg-slate-800">
                                ✅
                              </div>

                              <div>
                                <p className="font-bold text-emerald-800 dark:text-emerald-300">
                                  Work Completed
                                </p>

                                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                  Complaint successfully resolved by technician.
                                </p>
                              </div>
                            </div>
                          )}

                          {/* DELETE */}

                          <button
                            onClick={() => deleteComplaint(complaint._id)}
                            className="rounded-xl bg-red-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 hover:shadow-lg active:scale-[0.98]"
                          >
                            🗑️ Delete Complaint
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

            </div>
          )}
        </main>

        {/* ================= ADMIN TIP ================= */}

        {/* ================= ADMIN TIP ================= */}

        <section className="mx-auto max-w-7xl px-6 pb-10">
          <div
            className={`rounded-2xl border p-6 transition-colors ${darkMode
              ? "border-indigo-800 bg-indigo-950/40"
              : "border-indigo-100 bg-indigo-50"
              }`}
          >
            <div className="flex gap-4">
              <div className="text-2xl">💡</div>

              <div>
                <h3
                  className={`font-bold ${darkMode ? "text-indigo-300" : "text-indigo-900"
                    }`}
                >
                  Admin Tip
                </h3>

                <p
                  className={`mt-2 text-sm leading-6 ${darkMode ? "text-indigo-200" : "text-indigo-700"
                    }`}
                >
                  Assign pending complaints to the appropriate
                  supervisor as soon as possible. The supervisor
                  will then assign the suitable technician for
                  the maintenance work.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= FOOTER ================= */}

        <footer
          className={`mt-6 border-t transition-colors ${darkMode
            ? "border-slate-700 bg-slate-900"
            : "border-slate-200 bg-white"
            }`}
        >
          <div className="mx-auto max-w-7xl px-6 py-8">
            <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
              <div>
                <p
                  className={`text-lg font-bold ${darkMode ? "text-white" : "text-slate-800"
                    }`}
                >
                  CampusFix
                </p>

                <p
                  className={`mt-1 text-sm ${darkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                >
                  Medi-Caps University
                </p>
              </div>

              <div
                className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"
                  }`}
              >
                <p>
                  Smart Campus • Faster Resolution • Better
                  Management
                </p>

                <p className="mt-1">
                  © 2026 Medi-Caps University
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* ================= LOGOUT ================= */}

      <LogoutModal
        isOpen={showLogout}
        onClose={() => setShowLogout(false)}
      />
    </div>
  );
}

export default AdminComplaints;
