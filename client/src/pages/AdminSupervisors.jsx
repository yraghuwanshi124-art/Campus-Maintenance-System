
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import AdminSidebar from "../components/AdminSidebar";
import { useTheme } from "../context/ThemeContext";

function AdminSupervisors() {
  const navigate = useNavigate();
  const { darkMode } = useTheme();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    block: "",
  });

  const assignedBlocks = user?.assignedBlocks || [];

  // ================= FETCH SUPERVISORS =================

  const fetchSupervisors = async () => {
    try {
      setLoading(true);

      const response = await api.get("/supervisor/");

      setSupervisors(response.data.supervisors || []);
    } catch (error) {
      console.error("Fetch Supervisors Error:", error);
      alert(
        error.response?.data?.message ||
          "Unable to load supervisors."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupervisors();
  }, []);

  // ================= FORM HANDLING =================

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      phoneNumber: "",
      password: "",
      block: "",
    });

    setEditingSupervisor(null);
    setShowForm(false);
  };

  const openCreateForm = () => {
    setEditingSupervisor(null);

    setForm({
      name: "",
      email: "",
      phoneNumber: "",
      password: "",
      block: assignedBlocks[0] || "",
    });

    setShowForm(true);
  };

  const openEditForm = (supervisor) => {
    if ((supervisor.assignedBlocks || []).length !== 1) {
      alert("Legacy common supervisors cannot be edited.");
      return;
    }

    setEditingSupervisor(supervisor);

    setForm({
      name: supervisor.name || "",
      email: supervisor.email || "",
      phoneNumber: supervisor.phoneNumber || "",
      password: "",
      block: supervisor.assignedBlocks[0],
    });

    setShowForm(true);
  };

  // ================= CREATE / UPDATE =================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.block) {
      alert("Please select a block.");
      return;
    }

    if (!editingSupervisor && !form.password.trim()) {
      alert("Please enter a password.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
      };

      if (form.password.trim()) {
        payload.password = form.password;
      }

      if (editingSupervisor) {
        await api.put(
          `/supervisor/${editingSupervisor._id}`,
          payload
        );

        alert("Supervisor updated successfully.");
      } else {
        payload.block = form.block;

        await api.post("/supervisor/create", payload);

        alert("Supervisor created successfully.");
      }

      resetForm();
      await fetchSupervisors();
    } catch (error) {
      console.error("Save Supervisor Error:", error);

      alert(
        error.response?.data?.message ||
          "Unable to save supervisor."
      );
    } finally {
      setSaving(false);
    }
  };

  // ================= LOGOUT =================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  // ================= THEME =================

  const pageBg = darkMode
    ? "bg-slate-950 text-white"
    : "bg-slate-50 text-slate-800";

  const cardBg = darkMode
    ? "bg-slate-900 border-slate-800"
    : "bg-white border-slate-200";

  const inputStyle = `w-full rounded-xl border p-3 outline-none ${
    darkMode
      ? "bg-slate-800 border-slate-700 text-white"
      : "bg-white border-slate-300 text-slate-800"
  }`;

  return (
    <div className={`min-h-screen ${pageBg}`}>
      <AdminSidebar onLogout={handleLogout} />

      <main className="min-h-screen px-5 py-10 transition-all duration-300 lg:ml-64">
        <div className="mx-auto max-w-7xl">

          {/* ================= HEADER ================= */}

          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mb-2 text-sm font-bold uppercase tracking-widest text-indigo-500">
                Administration
              </p>

              <h1 className="text-3xl font-black">
                Supervisor Management
              </h1>

              <p className="mt-2 text-sm opacity-70">
                Manage supervisors assigned to your blocks.
              </p>
            </div>

            <button
              onClick={openCreateForm}
              disabled={assignedBlocks.length === 0}
              className="rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              + Create Supervisor
            </button>
          </div>

          {/* ================= BLOCK SUMMARY ================= */}

          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assignedBlocks.map((block) => {
              const count = supervisors.filter(
                (supervisor) =>
                  (supervisor.assignedBlocks || []).length === 1 &&
                  String(supervisor.assignedBlocks[0]).toLowerCase() ===
                    String(block).toLowerCase()
              ).length;

              return (
                <div
                  key={block}
                  className={`rounded-2xl border p-5 shadow-sm ${cardBg}`}
                >
                  <p className="text-sm font-semibold opacity-60">
                    Block {block}
                  </p>

                  <h2 className="mt-2 text-3xl font-black text-indigo-500">
                    {count}
                  </h2>

                  <p className="mt-1 text-sm opacity-70">
                    Assigned Supervisors
                  </p>
                </div>
              );
            })}
          </div>

          {/* ================= SUPERVISOR LIST ================= */}

          <div className={`rounded-2xl border p-6 shadow-sm ${cardBg}`}>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black">
                  All Supervisors
                </h2>

                <p className="mt-1 text-sm opacity-60">
                  Supervisors belonging to your assigned blocks.
                </p>
              </div>

              <span className="rounded-lg bg-indigo-100 px-3 py-1 text-sm font-bold text-indigo-700">
                {supervisors.length} Total
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center">
                <p className="font-semibold opacity-60">
                  Loading supervisors...
                </p>
              </div>
            ) : supervisors.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-400/40 py-12 text-center">
                <p className="text-lg font-bold">
                  No Supervisors Found
                </p>

                <p className="mt-2 text-sm opacity-60">
                  Create a supervisor for one of your assigned blocks.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {supervisors.map((supervisor) => {
                  const isLegacy =
                    (supervisor.assignedBlocks || []).length !== 1;

                  return (
                    <div
                      key={supervisor._id}
                      className={`rounded-2xl border p-5 transition hover:shadow-md ${
                        darkMode
                          ? "border-slate-700 bg-slate-800/60"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-xl font-black text-white">
                            {supervisor.name?.charAt(0)?.toUpperCase() || "S"}
                          </div>

                          <div className="min-w-0">
                            <h3 className="truncate font-bold">
                              {supervisor.name}
                            </h3>

                            <p className="break-all text-xs opacity-60">
                              {supervisor.email}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`shrink-0 rounded-lg px-2 py-1 text-xs font-bold ${
                            isLegacy
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {isLegacy ? "Legacy" : "Active"}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="font-semibold opacity-60">
                            Phone:{" "}
                          </span>
                          {supervisor.phoneNumber || "Not available"}
                        </p>

                        <p>
                          <span className="font-semibold opacity-60">
                            Block:{" "}
                          </span>
                          {(supervisor.assignedBlocks || []).join(", ") || "Not assigned"}
                        </p>
                      </div>

                      {isLegacy ? (
                        <div className="mt-5 rounded-xl bg-amber-100/80 p-3 text-xs font-semibold text-amber-800">
                          Existing common Supervisor. Editing is disabled.
                        </div>
                      ) : (
                        <button
                          onClick={() => openEditForm(supervisor)}
                          className="mt-5 w-full rounded-xl border border-indigo-500 px-4 py-2.5 font-bold text-indigo-500 transition hover:bg-indigo-600 hover:text-white"
                        >
                          Edit Supervisor
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ================= CREATE / EDIT MODAL ================= */}

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 p-4">
          <div
            className={`my-auto w-full max-w-lg rounded-2xl border p-6 shadow-2xl ${
              darkMode
                ? "border-slate-700 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-800"
            }`}
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black">
                  {editingSupervisor
                    ? "Edit Supervisor"
                    : "Create Supervisor"}
                </h2>

                <p className="mt-1 text-sm opacity-60">
                  {editingSupervisor
                    ? "Update supervisor details."
                    : "Add a supervisor to one of your blocks."}
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="text-2xl opacity-60 hover:opacity-100"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-bold">
                  Supervisor Name
                </label>

                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  className={inputStyle}
                  placeholder="Enter supervisor name"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold">
                  Email Address
                </label>

                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  className={inputStyle}
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold">
                  Phone Number
                </label>

                <input
                  type="tel"
                  required
                  value={form.phoneNumber}
                  onChange={(e) =>
                    setForm({ ...form, phoneNumber: e.target.value })
                  }
                  className={inputStyle}
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold">
                  Assigned Block
                </label>

                <select
                  required
                  value={form.block}
                  disabled={!!editingSupervisor}
                  onChange={(e) =>
                    setForm({ ...form, block: e.target.value })
                  }
                  className={`${inputStyle} disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  <option value="">Select Block</option>

                  {assignedBlocks.map((block) => (
                    <option key={block} value={block}>
                      Block {block}
                    </option>
                  ))}
                </select>

                {editingSupervisor && (
                  <p className="mt-1 text-xs opacity-60">
                    Assigned block cannot be changed while editing.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold">
                  {editingSupervisor
                    ? "New Password (Optional)"
                    : "Password"}
                </label>

                <input
                  type="password"
                  required={!editingSupervisor}
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className={inputStyle}
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
                  onClick={resetForm}
                  className={`flex-1 rounded-xl py-3 font-bold ${
                    darkMode
                      ? "bg-slate-800 hover:bg-slate-700"
                      : "bg-slate-200 hover:bg-slate-300"
                  }`}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-indigo-600 py-3 font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingSupervisor
                      ? "Update Supervisor"
                      : "Create Supervisor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSupervisors;
