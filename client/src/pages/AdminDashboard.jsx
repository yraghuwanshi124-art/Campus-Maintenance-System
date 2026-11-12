
import { useEffect, useState } from "react";
import api from "../services/api";
import LogoutModal from "../components/LogoutModal";
import AdminSidebar from "../components/AdminSidebar";
import { useTheme } from "../context/ThemeContext";

function AdminDashboard() {
  const { darkMode } = useTheme();
  const [complaints, setComplaints] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [selectedSupervisors, setSelectedSupervisors] = useState({});
  const [showLogout, setShowLogout] = useState(false);

  // Supervisor Management
  const [showSupervisorForm, setShowSupervisorForm] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState(null);
  const [supervisorForm, setSupervisorForm] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    block: "",
  });
  const [supervisorLoading, setSupervisorLoading] = useState(false);


  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Recent 3 / All complaints
  const [showAllComplaints, setShowAllComplaints] = useState(false);

  // Read More / Show Less
  const [expandedComplaints, setExpandedComplaints] = useState({});

const user = JSON.parse(localStorage.getItem("user"));
  // ================= TOGGLE COMPLAINT =================

  const toggleComplaint = (complaintId) => {
    setExpandedComplaints((prev) => ({
      ...prev,
      [complaintId]: !prev[complaintId],
    }));
  };

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
      console.log("Failed to fetch complaints:", error);
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

      console.log(
        "ADMIN SUPERVISOR DATA:",
        response.data.supervisors
      );

      setSupervisors(response.data.supervisors || []);
    } catch (error) {
      console.log(
        "Failed to fetch supervisors:",
        error.response?.data || error.message
      );
    }
  };

  // ================= SUPERVISOR MANAGEMENT =================

  const resetSupervisorForm = () => {
    setSupervisorForm({
      name: "",
      email: "",
      phoneNumber: "",
      password: "",
      block: "",
    });
    setEditingSupervisor(null);
    setShowSupervisorForm(false);
  };

  const openCreateSupervisorForm = () => {
    setEditingSupervisor(null);
    setSupervisorForm({
      name: "",
      email: "",
      phoneNumber: "",
      password: "",
      block: user?.assignedBlocks?.[0] || "",
    });
    setShowSupervisorForm(true);
  };

  const openEditSupervisorForm = (supervisor) => {
    setEditingSupervisor(supervisor);
    setSupervisorForm({
      name: supervisor.name || "",
      email: supervisor.email || "",
      phoneNumber: supervisor.phoneNumber || "",
      password: "",
      block: supervisor.assignedBlocks?.[0] || "",
    });
    setShowSupervisorForm(true);
  };

  const handleSupervisorSubmit = async (e) => {
    e.preventDefault();

    if (!supervisorForm.block) {
      alert("Please select a block.");
      return;
    }

    if (!editingSupervisor && !supervisorForm.password) {
      alert("Please enter a password.");
      return;
    }

    try {
      setSupervisorLoading(true);

      const token = localStorage.getItem("token");

      const payload = {
        name: supervisorForm.name.trim(),
        email: supervisorForm.email.trim(),
        phoneNumber: supervisorForm.phoneNumber.trim(),
        block: supervisorForm.block,
      };

      if (supervisorForm.password.trim()) {
        payload.password = supervisorForm.password;
      }

      if (editingSupervisor) {
        const response = await api.put(
          `/supervisor/${editingSupervisor._id}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        alert(response.data.message || "Supervisor updated successfully.");
      } else {
        const response = await api.post(
          "/supervisor/create",
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        alert(response.data.message || "Supervisor created successfully.");
      }

      resetSupervisorForm();
      await fetchSupervisors();
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Failed to save supervisor."
      );
    } finally {
      setSupervisorLoading(false);
    }
  };

  const normalizeBlock = (block) =>
    String(block || "").trim().toLowerCase();

  const getBlockSupervisors = (block) => {
    return supervisors.filter((supervisor) => {
      const assignedBlocks = supervisor.assignedBlocks || [];

      return (
        assignedBlocks.length === 1 &&
        normalizeBlock(assignedBlocks[0]) === normalizeBlock(block)
      );
    });
  };


  // ================= INITIAL LOAD =================

  useEffect(() => {
    fetchComplaints();
    fetchSupervisors();
  }, []);

  // ================= ASSIGN COMPLAINT TO SUPERVISOR =================

  const assignComplaint = async (complaintId, supervisorId) => {
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

  // ================= FORMAT DATE =================

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

  // ================= GET SUPERVISOR NAME =================

  const getSupervisorName = (complaint) => {
    if (complaint.supervisor?.name) {
      return complaint.supervisor.name;
    }

    if (typeof complaint.supervisor === "string") {
      const supervisor = supervisors.find(
        (item) => item._id === complaint.supervisor
      );

      return supervisor?.name || "Assigned Supervisor";
    }

    return "Not assigned";
  };

  // ================= STATISTICS =================

  const totalComplaints = complaints.length;

  const pendingComplaints = complaints.filter(
    (complaint) => complaint.status === "Pending"
  ).length;

  const assignedComplaints = complaints.filter(
    (complaint) => complaint.status === "Assigned"
  ).length;

  const inProgressComplaints = complaints.filter(
    (complaint) => complaint.status === "In Progress"
  ).length;

  const resolvedComplaints = complaints.filter(
    (complaint) => complaint.status === "Resolved"
  ).length;

  {/* ================= SUPERVISOR MANAGEMENT ================= */ }
  <section className={`mb-8 rounded-2xl border p-6 ${darkMode
      ? "bg-gray-900 border-gray-700 text-white"
      : "bg-white border-gray-200 text-gray-800"
    }`}>
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div>
        <h2 className="text-xl font-bold">Supervisor Management</h2>
        <p className="text-sm opacity-70 mt-1">
          Manage supervisors for your assigned blocks.
        </p>
      </div>

      <button
        onClick={openCreateSupervisorForm}
        disabled={!user?.assignedBlocks?.length}
        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-50"
      >
        + Create Supervisor
      </button>
    </div>

    {supervisors.length === 0 ? (
      <p className="text-sm opacity-70">
        No supervisors found for your assigned blocks.
      </p>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {supervisors.map((supervisor) => {
          const isLegacy =
            (supervisor.assignedBlocks || []).length !== 1;

          return (
            <div
              key={supervisor._id}
              className={`rounded-xl border p-4 ${darkMode
                  ? "border-gray-700 bg-gray-800"
                  : "border-gray-200 bg-gray-50"
                }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold">{supervisor.name}</h3>
                  <p className="text-sm opacity-70 break-all">
                    {supervisor.email}
                  </p>
                  <p className="text-sm opacity-70 mt-1">
                    {supervisor.phoneNumber || "No phone number"}
                  </p>
                </div>

                <span className={`text-xs px-2 py-1 rounded-lg font-semibold ${isLegacy
                    ? "bg-amber-100 text-amber-800"
                    : "bg-green-100 text-green-800"
                  }`}>
                  {isLegacy ? "Legacy" : "Block Supervisor"}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm font-semibold">
                  Block: {(supervisor.assignedBlocks || []).join(", ")}
                </span>

                {!isLegacy && (
                  <button
                    onClick={() => openEditSupervisorForm(supervisor)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold"
                  >
                    Edit
                  </button>
                )}
              </div>

              {isLegacy && (
                <p className="text-xs text-amber-600 mt-3">
                  Existing common supervisor. Editing is disabled.
                </p>
              )}
            </div>
          );
        })}
      </div>
    )}
  </section>

  {/* ================= SUPERVISOR FORM MODAL ================= */ }
  {
    showSupervisorForm && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className={`w-full max-w-lg rounded-2xl p-6 shadow-2xl ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800"
          }`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">
              {editingSupervisor ? "Edit Supervisor" : "Create Supervisor"}
            </h2>

            <button
              onClick={resetSupervisorForm}
              className="text-2xl opacity-70 hover:opacity-100"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSupervisorSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1">
                Supervisor Name
              </label>
              <input
                type="text"
                required
                value={supervisorForm.name}
                onChange={(e) =>
                  setSupervisorForm({
                    ...supervisorForm,
                    name: e.target.value,
                  })
                }
                className={`w-full rounded-xl border p-3 outline-none ${darkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-300"
                  }`}
                placeholder="Enter name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={supervisorForm.email}
                onChange={(e) =>
                  setSupervisorForm({
                    ...supervisorForm,
                    email: e.target.value,
                  })
                }
                className={`w-full rounded-xl border p-3 outline-none ${darkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-300"
                  }`}
                placeholder="Enter email"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                required
                value={supervisorForm.phoneNumber}
                onChange={(e) =>
                  setSupervisorForm({
                    ...supervisorForm,
                    phoneNumber: e.target.value,
                  })
                }
                className={`w-full rounded-xl border p-3 outline-none ${darkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-300"
                  }`}
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">
                Assigned Block
              </label>
              <select
                required
                value={supervisorForm.block}
                disabled={!!editingSupervisor}
                onChange={(e) =>
                  setSupervisorForm({
                    ...supervisorForm,
                    block: e.target.value,
                  })
                }
                className={`w-full rounded-xl border p-3 outline-none ${darkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-300"
                  }`}
              >
                <option value="">Select Block</option>
                {(user?.assignedBlocks || []).map((block) => (
                  <option key={block} value={block}>
                    Block {block}
                  </option>
                ))}
              </select>
              {editingSupervisor && (
                <p className="text-xs opacity-60 mt-1">
                  The assigned block cannot be changed while editing.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">
                {editingSupervisor
                  ? "New Password (Optional)"
                  : "Password"}
              </label>
              <input
                type="password"
                required={!editingSupervisor}
                value={supervisorForm.password}
                onChange={(e) =>
                  setSupervisorForm({
                    ...supervisorForm,
                    password: e.target.value,
                  })
                }
                className={`w-full rounded-xl border p-3 outline-none ${darkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-300"
                  }`}
                placeholder={
                  editingSupervisor
                    ? "Leave blank to keep current password"
                    : "Create password"
                }
              />
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={resetSupervisorForm}
                className={`flex-1 rounded-xl py-3 font-semibold ${darkMode
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-gray-200 hover:bg-gray-300"
                  }`}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={supervisorLoading}
                className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-3 font-semibold disabled:opacity-50"
              >
                {supervisorLoading
                  ? "Saving..."
                  : editingSupervisor
                    ? "Update Supervisor"
                    : "Create Supervisor"}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // ================= FILTERED COMPLAINTS =================

  const filteredComplaints = complaints.filter((complaint) => {
    const search = searchTerm.toLowerCase().trim();

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
        .includes(search);

    const matchesStatus =
      statusFilter === "All" ||
      complaint.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // ================= SORT BY RECENT =================

  const sortedComplaints = [...filteredComplaints].sort(
    (a, b) =>
      new Date(b.createdAt || 0) -
      new Date(a.createdAt || 0)
  );

  // ================= SHOW 3 OR ALL =================

  const displayedComplaints =
    showAllComplaints ||
      searchTerm.trim() ||
      statusFilter !== "All"
      ? sortedComplaints
      : sortedComplaints.slice(0, 3);

  const pendingComplaintList = displayedComplaints.filter(
    (complaint) => complaint.status === "Pending"
  );

  const activeComplaints = displayedComplaints.filter(
    (complaint) =>
      complaint.status === "Assigned" ||
      complaint.status === "In Progress"
  );

  const resolvedComplaintList = displayedComplaints.filter(
    (complaint) => complaint.status === "Resolved"
  );

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"
        }`}
    >
      <AdminSidebar
        onLogout={() => setShowLogout(true)}
      />

      <div className="lg:ml-64">
        {/* ================= NAVBAR ================= */}

        <nav
          className={`border-b shadow-sm transition-colors duration-200 ${darkMode
              ? "border-slate-800 bg-slate-900/90 text-white"
              : "border-indigo-100 bg-indigo-50"
            }`}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-5">
              <div
                className={`rounded-xl px-3 py-1.5 shadow-sm ${darkMode
                    ? "border border-slate-700 bg-slate-800"
                    : "bg-white"
                  }`}
              >
                <img
                  src="https://www.medicaps.ac.in/public/frontend/images/medicaps-logo-fin.webp"
                  alt="Medi-Caps University"
                  className="h-11 w-auto object-contain"
                />
              </div>

              <div
                className={`hidden border-l-2 pl-5 sm:block ${darkMode ? "border-slate-700" : "border-indigo-200"
                  }`}
              >
                <p
                  className={`text-xl font-extrabold tracking-tight ${darkMode ? "text-indigo-400" : "text-indigo-700"
                    }`}
                >
                  CampusFix
                </p>

                <p
                  className={`mt-1 text-sm font-medium ${darkMode ? "text-slate-400" : "text-slate-600"
                    }`}
                >
                  Campus Maintenance Management System
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden text-right sm:block">
                <p
                  className={`text-base font-bold ${darkMode ? "text-white" : "text-slate-800"
                    }`}
                >
                  {user?.assignedBlocks?.length
                    ? `${user.assignedBlocks.join(", ")} Admin`
                    : "Administrator"}
                </p>

                <p
                  className={`mt-0.5 max-w-[230px] truncate text-sm ${darkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                >
                  {user?.email || "No email"}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-600 text-base font-bold text-white shadow-sm">
                A
              </div>

              <button
                onClick={() => setShowLogout(true)}
                className={`rounded-xl px-5 py-2.5 text-base font-semibold shadow-sm transition ${darkMode
                    ? "border border-slate-700 bg-slate-800 text-slate-200 hover:border-red-900/50 hover:bg-red-950/30 hover:text-red-400"
                    : "border border-indigo-200 bg-white text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  }`}
              >
                Logout
              </button>
            </div>
          </div>
        </nav>

        {/* ================= MAIN ================= */}

        <main className="mx-auto max-w-7xl px-6 py-10">
          {/* ================= HERO ================= */}

          <div className="relative mb-10 overflow-hidden rounded-3xl bg-indigo-600 p-8 shadow-lg sm:p-10">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />

            <div className="absolute -bottom-20 right-24 h-48 w-48 rounded-full bg-white/5" />

            <div className="relative z-10 max-w-3xl text-white">
              <p className="text-sm font-semibold uppercase tracking-widest text-indigo-200">
                Medi-Caps University • Administration
              </p>

              <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
                {user?.assignedBlocks?.length
                  ? `${user.assignedBlocks.join(", ")} Admin Dashboard`
                  : "Admin Control Center 👨‍💼"}
              </h1>

              <p className="mt-4 max-w-2xl leading-7 text-indigo-100">
                Monitor campus maintenance requests, manage complaints,
                assign supervisors and track resolution progress from one
                centralized dashboard.
              </p>
            </div>
          </div>

          {/* ================= STATISTICS ================= */}

          <div className="mb-10">
            <div className="mb-5">
              <h2 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>
                Maintenance Overview
              </h2>

              <p className={`mt-1 text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                Real-time summary of campus maintenance complaints.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {/* TOTAL */}

              <div
                className={`rounded-2xl border p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${darkMode
                    ? "border-slate-800 bg-slate-900"
                    : "border-indigo-100 bg-white"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-semibold ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    Total
                  </p>

                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${darkMode ? "bg-indigo-950/60 text-indigo-300" : "bg-indigo-50"
                      }`}
                  >
                    📊
                  </div>
                </div>

                <p className={`mt-4 text-3xl font-extrabold ${darkMode ? "text-white" : "text-slate-800"}`}>
                  {totalComplaints}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  All complaints
                </p>
              </div>

              {/* PENDING */}

              <div
                className={`rounded-2xl border p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${darkMode
                    ? "border-slate-800 bg-slate-900"
                    : "border-blue-100 bg-white"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-semibold ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    Pending
                  </p>

                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${darkMode ? "bg-blue-950/60 text-blue-300" : "bg-blue-50"
                      }`}
                  >
                    ⏳
                  </div>
                </div>

                <p className="mt-4 text-3xl font-extrabold text-blue-500">
                  {pendingComplaints}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Awaiting assignment
                </p>
              </div>

              {/* ASSIGNED */}

              <div
                className={`rounded-2xl border p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${darkMode
                    ? "border-slate-800 bg-slate-900"
                    : "border-orange-100 bg-white"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-semibold ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    Assigned
                  </p>

                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${darkMode ? "bg-orange-950/60 text-orange-300" : "bg-orange-50"
                      }`}
                  >
                    👨‍💼
                  </div>
                </div>

                <p className="mt-4 text-3xl font-extrabold text-orange-500">
                  {assignedComplaints}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Supervisor assigned
                </p>
              </div>

              {/* IN PROGRESS */}

              <div
                className={`rounded-2xl border p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${darkMode
                    ? "border-slate-800 bg-slate-900"
                    : "border-purple-100 bg-white"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-semibold ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    In Progress
                  </p>

                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${darkMode ? "bg-purple-950/60 text-purple-300" : "bg-purple-50"
                      }`}
                  >
                    🔧
                  </div>
                </div>

                <p className="mt-4 text-3xl font-extrabold text-purple-500">
                  {inProgressComplaints}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Currently being fixed
                </p>
              </div>

              {/* RESOLVED */}

              <div
                className={`rounded-2xl border p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${darkMode
                    ? "border-slate-800 bg-slate-900"
                    : "border-emerald-100 bg-white"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-semibold ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    Resolved
                  </p>

                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${darkMode ? "bg-emerald-950/60 text-emerald-300" : "bg-emerald-50"
                      }`}
                  >
                    ✅
                  </div>
                </div>

                <p className="mt-4 text-3xl font-extrabold text-emerald-500">
                  {resolvedComplaints}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Successfully completed
                </p>
              </div>
            </div>
          </div>

          {/* ================= ALL / RECENT COMPLAINTS HEADER ================= */}

          <div
            className={`mb-8 overflow-hidden rounded-3xl border shadow-sm ${darkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"
              }`}
          >
            <div className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-700 p-6 sm:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="text-white">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                    🛠️ Maintenance Management
                  </div>

                  <h2 className="text-2xl font-extrabold sm:text-3xl">
                    {showAllComplaints ||
                      searchTerm.trim() ||
                      statusFilter !== "All"
                      ? "All Complaints"
                      : "Recent Complaints"}
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100">
                    {showAllComplaints ||
                      searchTerm.trim() ||
                      statusFilter !== "All"
                      ? "Manage and monitor every campus maintenance complaint."
                      : "Latest maintenance complaints reported on campus."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex w-fit items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-5 py-4 backdrop-blur-md">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl">
                      📋
                    </div>

                    <div>
                      <p className="text-2xl font-extrabold text-white">
                        {displayedComplaints.length}
                      </p>

                      <p className="text-xs font-medium text-indigo-100">
                        Showing complaints
                      </p>
                    </div>
                  </div>

                  {!searchTerm.trim() &&
                    statusFilter === "All" && (
                      <button
                        onClick={() =>
                          setShowAllComplaints(
                            !showAllComplaints
                          )
                        }
                        className="rounded-2xl border border-white/30 bg-white px-5 py-3.5 text-sm font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
                      >
                        {showAllComplaints
                          ? "← Show Recent"
                          : "View All →"}
                      </button>
                    )}
                </div>
              </div>
            </div>

            {/* SEARCH + FILTER */}

            <div
              className={`border-b p-5 sm:p-6 ${darkMode ? "border-slate-800 bg-slate-900/60" : "border-slate-100 bg-slate-50/70"
                }`}
            >
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
                    { name: "In Progress", icon: "🔧" },
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
            </div>
          </div>

          {/* ================= NO COMPLAINTS ================= */}

          {displayedComplaints.length === 0 ? (
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

              {displayedComplaints.map((complaint) => {
                const isExpanded =
                  expandedComplaints[complaint._id];

                return (
                  <div
                    key={complaint._id}
                    className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/40"
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

                    {/* CARD CONTENT */}

                    <div className="p-5 sm:p-6">
                      {/* HEADER */}

                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex gap-4">
                          <div
                            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl ${complaint.status === "Resolved"
                                ? "bg-emerald-50 dark:bg-emerald-950/50"
                                : complaint.status === "In Progress"
                                  ? "bg-purple-50 dark:bg-purple-950/50"
                                  : complaint.status === "Assigned"
                                    ? "bg-orange-50 dark:bg-orange-950/50"
                                    : "bg-indigo-50 dark:bg-indigo-950/50"
                              }`}
                          >
                            🛠️
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
                                Maintenance Request
                              </span>

                              <span className="text-xs text-slate-400 dark:text-slate-500">
                                • #{complaint._id?.slice(-6)}
                              </span>
                            </div>

                            <h3 className="mt-1 text-xl font-extrabold text-slate-800 dark:text-white">
                              {complaint.category}
                            </h3>

                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                              Reported by{" "}
                              <span className="font-semibold text-slate-700 dark:text-slate-200">
                                {complaint.user?.name ||
                                  "Unknown Student"}
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
                            {complaint.status === "Resolved" &&
                              "✓ "}

                            {complaint.status === "In Progress" &&
                              "⚙ "}

                            {complaint.status === "Assigned" &&
                              "👨‍💼 "}

                            {complaint.status === "Pending" &&
                              "⏳ "}

                            {complaint.status}
                          </span>

                          <span
                            className={`rounded-full border px-3.5 py-2 text-xs font-bold ${getPriorityStyle(
                              complaint.priority
                            )}`}
                          >
                            ⚡ {complaint.priority}
                          </span>
                        </div>
                      </div>

                      {/* ================= EXPANDED DETAILS ================= */}

                      {isExpanded && (
                        <>
                          {/* INFO GRID */}

                          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {/* LOCATION */}

                            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition group-hover:bg-indigo-50/40 dark:border-slate-800 dark:bg-slate-800/60 dark:group-hover:bg-slate-800">
                              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                                <span className="text-base">
                                  📍
                                </span>
                                Location
                              </div>

                              <p className="mt-2 text-xl font-bold text-slate-700 dark:text-slate-200">
                                {complaint.block}
                              </p>

                              <p className="mt-0.5 font-semibold text-slate-500 dark:text-slate-400">
                                Room {complaint.room}
                              </p>
                            </div>

                            {/* STUDENT */}

                            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition group-hover:bg-indigo-50/40 dark:border-slate-800 dark:bg-slate-800/60 dark:group-hover:bg-slate-800">
                              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                                <span className="text-base">
                                  👨‍🎓
                                </span>
                                Student
                              </div>

                              <p className="mt-2 truncate font-bold text-slate-700 dark:text-slate-200">
                                {complaint.user?.name ||
                                  "Unknown Student"}
                              </p>

                              <p className="mt-1 truncate text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                🎓{" "}
                                {complaint.user
                                  ?.enrollmentNumber ||
                                  "No enrollment number"}
                              </p>

                              <p className="mt-1 truncate text-sm font-semibold text-slate-500 dark:text-slate-400">
                                {complaint.user?.email ||
                                  "No email"}
                              </p>

                              {complaint.mobileNumber && (
                                <p className="mt-1 truncate text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                  📞 {complaint.mobileNumber}
                                </p>
                              )}

                              <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                                {complaint.user?.department ||
                                  "No department"}
                                {" • "}
                                {complaint.user?.semester
                                  ? `Semester ${complaint.user.semester}`
                                  : "No semester"}
                              </p>

                              <p className="mt-1 text-sm font-bold text-slate-600 dark:text-slate-300">
                                🏫{" "}
                                {complaint.user?.classSection ||
                                  "No class"}
                              </p>
                            </div>

                            {/* SUPERVISOR */}

                            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition group-hover:bg-indigo-50/40 dark:border-slate-800 dark:bg-slate-800/60 dark:group-hover:bg-slate-800">
                              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                                <span className="text-base">
                                  👨‍💼
                                </span>
                                Supervisor
                              </div>

                              <p className="mt-2 truncate font-bold text-slate-700 dark:text-slate-200">
                                {getSupervisorName(complaint)}
                              </p>

                              <p className="mt-0.5 font-semibold text-slate-500 dark:text-slate-400">
                                {complaint.status === "Resolved"
                                  ? "Work completed"
                                  : complaint.supervisor
                                    ? "Currently responsible"
                                    : "Waiting for assignment"}
                              </p>
                            </div>

                            {/* PRIORITY */}

                            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition group-hover:bg-indigo-50/40 dark:border-slate-800 dark:bg-slate-800/60 dark:group-hover:bg-slate-800">
                              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                                <span className="text-base">
                                  ⚡
                                </span>
                                Priority
                              </div>

                              <p
                                className={`mt-2 font-extrabold ${getPriorityStyle(
                                  complaint.priority
                                )
                                  .replace(/border-[a-z]+-[0-9]+ /g, "")
                                  .replace(/bg-[a-z]+-[0-9]+\/?[0-9]* /g, "")
                                  .replace(/dark:[^ ]+/g, "")}`}
                              >
                                {complaint.priority}
                              </p>

                              <p className="mt-0.5 font-semibold text-slate-500 dark:text-slate-400">
                                Maintenance priority
                              </p>
                            </div>
                          </div>

                          {/* DESCRIPTION */}

                          <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/60">
                            <div className="mb-2 flex items-center gap-2">
                              <span className="text-base">
                                📝
                              </span>

                              <p className="text-lg font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">
                                Problem Description
                              </p>
                            </div>

                            <p className="text-lg font-semibold leading-7 text-slate-600 dark:text-slate-300">
                              {complaint.description}
                            </p>
                          </div>

                          {/* TIMELINE */}

                          <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5 dark:border-slate-800 dark:bg-slate-800/40">
                            <div className="mb-5 flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-lg dark:bg-indigo-950/60">
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

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                              {/* RAISED */}

                              <div className="rounded-xl border border-transparent bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                <div className="flex items-center gap-2">
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                                    ✓
                                  </div>

                                  <p className="text-sm font-bold text-slate-800 dark:text-white">
                                    Complaint Raised
                                  </p>
                                </div>

                                <p className="mt-2 text-s text-slate-500 dark:text-slate-400">
                                  By{" "}
                                  {complaint.user?.name ||
                                    "Student"}
                                </p>

                                <p className="mt-1 text-s font-semibold text-blue-600 dark:text-blue-400">
                                  🕒{" "}
                                  {formatDateTime(
                                    complaint.createdAt
                                  )}
                                </p>
                              </div>

                              {/* SUPERVISOR ASSIGNMENT */}

                              <div className="rounded-xl border border-transparent bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                {complaint.assignedAt ? (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm text-orange-600 dark:bg-orange-950/60 dark:text-orange-400">
                                        ✓
                                      </div>

                                      <p className="text-sm font-bold text-slate-800 dark:text-white">
                                        Supervisor Assigned
                                      </p>
                                    </div>

                                    <p className="mt-2 text-s text-slate-500 dark:text-slate-400">
                                      Assigned to{" "}
                                      <span className="font-bold text-orange-600 dark:text-orange-400">
                                        {getSupervisorName(
                                          complaint
                                        )}
                                      </span>
                                    </p>

                                    <p className="mt-1 text-s font-semibold text-orange-600 dark:text-orange-400">
                                      🕒{" "}
                                      {formatDateTime(
                                        complaint.assignedAt
                                      )}
                                    </p>
                                  </>
                                ) : (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                                        2
                                      </div>

                                      <p className="text-sm font-bold text-slate-400 dark:text-slate-500">
                                        Supervisor Assignment
                                      </p>
                                    </div>

                                    <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                                      Waiting for supervisor assignment.
                                    </p>

                                    <p className="mt-1 text-xs font-semibold text-slate-400 dark:text-slate-500">
                                      Pending
                                    </p>
                                  </>
                                )}
                              </div>

                              {/* RESOLUTION */}

                              <div className="rounded-xl border border-transparent bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                {complaint.resolvedAt ? (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                                        ✓
                                      </div>

                                      <p className="text-sm font-bold text-slate-800 dark:text-white">
                                        Complaint Resolved
                                      </p>
                                    </div>

                                    <p className="mt-2 text-s text-slate-500 dark:text-slate-400">
                                      Maintenance issue successfully resolved.
                                    </p>

                                    <p className="mt-1 text-s font-semibold text-emerald-600 dark:text-emerald-400">
                                      🕒{" "}
                                      {formatDateTime(
                                        complaint.resolvedAt
                                      )}
                                    </p>
                                  </>
                                ) : (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                                        3
                                      </div>

                                      <p className="text-sm font-bold text-slate-400 dark:text-slate-500">
                                        Resolution
                                      </p>
                                    </div>

                                    <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                                      Waiting for the issue to be resolved.
                                    </p>

                                    <p className="mt-1 text-xs font-semibold text-slate-400 dark:text-slate-500">
                                      Pending
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* PHOTOS */}

                          {(complaint.image ||
                            complaint.completionImage) && (
                              <div className="mt-4 grid gap-4 md:grid-cols-2">
                                {complaint.image && (
                                  <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
                                    <div className="mb-3 flex items-center gap-2">
                                      <span>📷</span>

                                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                        Problem Photo
                                      </p>
                                    </div>

                                    <img
                                      src={complaint.image}
                                      alt="Reported problem"
                                      className="h-56 w-full rounded-xl object-cover transition duration-300 group-hover:scale-[1.01]"
                                    />
                                  </div>
                                )}

                                {complaint.completionImage && (
                                  <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/30">
                                    <div className="mb-3 flex items-center gap-2">
                                      <span>✅</span>

                                      <p className="text-xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                                        Completion Proof
                                      </p>
                                    </div>

                                    <img
                                      src={
                                        complaint.completionImage
                                      }
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

                          {/* ================= STUDENT FEEDBACK ================= */}

                          {complaint.status === "Resolved" && (
                            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/50 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
                              <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-lg dark:bg-amber-950/60">
                                  ⭐
                                </div>

                                <div>
                                  <p className="font-bold text-slate-800 dark:text-white">
                                    Student Feedback
                                  </p>

                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Feedback provided after complaint resolution
                                  </p>
                                </div>
                              </div>

                              {complaint.feedbackRating ? (
                                <div className="rounded-xl border border-amber-100 bg-white p-4 dark:border-amber-900/40 dark:bg-slate-900">
                                  <div className="flex flex-wrap items-center gap-3">
                                    <div className="text-2xl tracking-wide">
                                      {"★".repeat(
                                        complaint.feedbackRating
                                      )}
                                      {"☆".repeat(
                                        5 -
                                        complaint.feedbackRating
                                      )}
                                    </div>

                                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                                      {complaint.feedbackRating}/5
                                    </span>
                                  </div>

                                  {complaint.feedbackComment && (
                                    <div className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                        Student Comment
                                      </p>

                                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                        "{complaint.feedbackComment}"
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                                    No feedback submitted yet.
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* ================= READ MORE / SHOW LESS ================= */}

                    <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6 dark:border-slate-800 dark:bg-slate-800/40">
                      <button
                        type="button"
                        onClick={() =>
                          toggleComplaint(complaint._id)
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-5 py-3 text-sm font-bold text-indigo-600 shadow-sm transition hover:bg-indigo-50 hover:shadow-md dark:border-indigo-800/80 dark:bg-slate-900 dark:text-indigo-400 dark:hover:bg-slate-800"
                      >
                        {isExpanded
                          ? "Show Less"
                          : "Read More"}

                        <span className="text-base">
                          {isExpanded ? "↑" : "↓"}
                        </span>
                      </button>
                    </div>

                    {/* ================= ACTION BAR ================= */}

                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/80 px-5 py-5 sm:px-6 dark:border-slate-800 dark:bg-slate-800/50">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                          {/* ASSIGN SUPERVISOR */}

                          {complaint.status !== "Resolved" ? (
                            <div className="flex-1">
                              <div className="mb-2 flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950/60">
                                  👨‍💼
                                </div>

                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                  Supervisor Assignment
                                </p>
                              </div>

                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <select
                                  value={
                                    selectedSupervisors[
                                    complaint._id
                                    ] ||
                                    complaint.supervisor?._id ||
                                    complaint.supervisor ||
                                    ""
                                  }
                                  onChange={(e) =>
                                    setSelectedSupervisors(
                                      (prev) => ({
                                        ...prev,
                                        [complaint._id]:
                                          e.target.value,
                                      })
                                    )
                                  }
                                  className="w-full max-w-xl rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-950"
                                >
                                  <option value="">
                                    Select supervisor
                                  </option>


                                  {getBlockSupervisors(complaint.block).map((supervisor) => (
                                    <option key={supervisor._id} value={supervisor._id}>
                                      {supervisor.name} — Block {complaint.block}
                                    </option>
                                  ))}

                                </select>

                                <button
                                  onClick={() => {
                                    const supervisorId =
                                      selectedSupervisors[
                                      complaint._id
                                      ] ||
                                      complaint.supervisor?._id ||
                                      complaint.supervisor;

                                    assignComplaint(
                                      complaint._id,
                                      supervisorId
                                    );
                                  }}
                                  disabled={
                                    !selectedSupervisors[
                                    complaint._id
                                    ] &&
                                    !complaint.supervisor
                                  }
                                  className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
                                >
                                  👨‍💼 Assign Supervisor
                                </button>
                              </div>

                              <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                Supervisor responsible for:{" "}
                                <span className="text-indigo-600 dark:text-indigo-400">
                                  {complaint.block}
                                </span>
                              </p>
                            </div>
                          ) : (
                            <div className="flex flex-1 items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
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
                            onClick={() =>
                              deleteComplaint(
                                complaint._id
                              )
                            }
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

        <section className="mx-auto max-w-7xl px-6 pb-10">
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6 dark:border-indigo-900/40 dark:bg-indigo-950/30">
            <div className="flex gap-4">
              <div className="text-2xl">💡</div>

              <div>
                <h3 className="font-bold text-indigo-900 dark:text-indigo-200">
                  Admin Tip
                </h3>

                <p className="mt-2 text-sm leading-6 text-indigo-700 dark:text-indigo-300">
                  Assign pending complaints to the appropriate
                  supervisor as soon as possible. The supervisor
                  will coordinate with the suitable technician for
                  maintenance and resolution.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= FOOTER ================= */}

        <footer className="mt-6 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto max-w-7xl px-6 py-8">
            <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
              <div>
                <p className="text-lg font-bold text-slate-800 dark:text-white">
                  CampusFix
                </p>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Medi-Caps University
                </p>
              </div>

              <div className="text-sm text-slate-500 dark:text-slate-400">
                <p>
                  Smart Campus • Faster Resolution • Better Management
                </p>

                <p className="mt-1">
                  © 2026 Medi-Caps University
                </p>
              </div>
            </div>
          </div>
        </footer>

        {/* ================= LOGOUT MODAL ================= */}

        <LogoutModal
          isOpen={showLogout}
          onClose={() => setShowLogout(false)}
        />
      </div>
    </div>
  );
}

export default AdminDashboard;
