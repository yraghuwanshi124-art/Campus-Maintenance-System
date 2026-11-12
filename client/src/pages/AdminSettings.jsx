import { useEffect, useState } from "react";
import api from "../services/api";
import AdminSidebar from "../components/AdminSidebar";
import LogoutModal from "../components/LogoutModal";
import { useTheme } from "../context/ThemeContext";

function AdminSettings() {
  const { darkMode } = useTheme();

  const [showLogout, setShowLogout] = useState(false);
  const [admin, setAdmin] = useState(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        setAdmin(JSON.parse(storedUser));
      } catch (error) {
        console.log("Invalid stored user");
      }
    }
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();

    setPasswordMessage("");
    setPasswordError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError(
        "New password must be at least 6 characters long."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(
        "New password and confirm password do not match."
      );
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError(
        "New password must be different from your current password."
      );
      return;
    }

    try {
      setChangingPassword(true);

      const token = localStorage.getItem("token");

      const response = await api.patch(
        "/auth/change-password",
        {
          currentPassword,
          newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setPasswordMessage(
        response.data.message || "Password changed successfully."
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.log(
        "CHANGE PASSWORD ERROR:",
        error.response?.data || error
      );

      setPasswordError(
        error.response?.data?.message ||
        "Unable to change password. Please try again."
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const getInitial = () => {
    if (admin?.name) {
      return admin.name.charAt(0).toUpperCase();
    }

    return "A";
  };

  // Theme styles
  const pageBg = darkMode
    ? "bg-slate-950 text-slate-100"
    : "bg-slate-50 text-slate-800";

  const panelBg = darkMode
    ? "border-slate-800 bg-slate-900"
    : "border-slate-200 bg-white";

  const headingText = darkMode
    ? "text-white"
    : "text-slate-900";

  const mutedText = darkMode
    ? "text-slate-400"
    : "text-slate-500";

  const divider = darkMode
    ? "border-slate-800"
    : "border-slate-100";

  const innerCard = darkMode
    ? "border-slate-700 bg-slate-800/60"
    : "border-slate-100 bg-slate-50";

  const inputStyle = darkMode
    ? "border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus:border-indigo-400 focus:ring-indigo-500/20"
    : "border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-indigo-500/10";

  const labelStyle = darkMode
    ? "text-slate-300"
    : "text-slate-700";

  const iconBox = darkMode
    ? "bg-indigo-500/10 text-indigo-300"
    : "bg-indigo-50 text-indigo-700";

  const requirementBox = darkMode
    ? "border-indigo-500/20 bg-indigo-500/10"
    : "border-indigo-100 bg-indigo-50/60";

  const requirementHeading = darkMode
    ? "text-indigo-300"
    : "text-indigo-800";

  const requirementText = darkMode
    ? "text-indigo-200"
    : "text-indigo-700";

  const successStyle = darkMode
    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
    : "border-emerald-200 bg-emerald-50 text-emerald-700";

  const errorStyle = darkMode
    ? "border-red-500/20 bg-red-500/10 text-red-300"
    : "border-red-200 bg-red-50 text-red-600";

  const showPasswordButton = darkMode
    ? "text-slate-400 hover:bg-slate-700 hover:text-white"
    : "text-slate-400 hover:bg-slate-100 hover:text-slate-600";

  return (
    <div className={`min-h-screen transition-colors duration-200 ${pageBg}`}>
      <AdminSidebar
        onLogout={() => setShowLogout(true)}
      />

      <div className="min-h-screen lg:ml-64">

        {/* Header */}

        <header
          className={`sticky top-0 z-20 border-b px-5 py-5 backdrop-blur-xl sm:px-8 ${darkMode
              ? "border-slate-800 bg-slate-950/90"
              : "border-slate-200 bg-white/90"
            }`}
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p
                className={`mb-1 text-xs font-bold uppercase tracking-[0.2em] ${darkMode ? "text-indigo-300" : "text-indigo-600"
                  }`}
              >
                CampusFix · Administration
              </p>

              <h1 className={`text-2xl font-black tracking-tight sm:text-3xl ${headingText}`}>
                Settings
              </h1>

              <p className={`mt-1 text-sm ${mutedText}`}>
                Manage your administrator account and security
              </p>
            </div>

            <div className="hidden items-center gap-3 sm:flex">
              <div className="text-right">
                <p className={`text-sm font-bold ${headingText}`}>
                  {admin?.name || "Administrator"}
                </p>

                <p className={`text-xs ${mutedText}`}>
                  Administrator
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-600 text-sm font-black text-white shadow-sm">
                {getInitial()}
              </div>
            </div>

          </div>
        </header>

        <main className="mx-auto max-w-7xl space-y-7 p-5 sm:p-8">

          {/* Profile Hero */}

          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-900/10">

            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-sm" />
            <div className="pointer-events-none absolute -bottom-24 right-28 h-64 w-64 rounded-full bg-white/5" />

            <div className="relative flex flex-col gap-6 p-7 sm:flex-row sm:items-center sm:p-9">

              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-3xl font-black ring-1 ring-white/20">
                {getInitial()}
              </div>

              <div>
                <p className="text-sm font-semibold text-indigo-100">
                  Administrator Account
                </p>

                <h2 className="mt-1 text-2xl font-black sm:text-3xl">
                  {admin?.name || "CampusFix Administrator"}
                </h2>

                <p className="mt-1 text-sm text-indigo-100">
                  {admin?.email || "Administrator account"}
                </p>
              </div>

              <div className="sm:ml-auto">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-bold ring-1 ring-white/20">
                  <span className="h-2 w-2 rounded-full bg-emerald-300" />
                  Account Active
                </span>
              </div>

            </div>
          </section>


          {/* Profile Information */}

          <section className={`overflow-hidden rounded-3xl border shadow-sm ${panelBg}`}>

            <div className={`border-b px-6 py-5 ${divider}`}>
              <div className="flex items-center gap-3">

                <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg ${iconBox}`}>
                  👤
                </div>

                <div>
                  <h2 className={`font-black ${headingText}`}>
                    Profile Information
                  </h2>

                  <p className={`text-sm ${mutedText}`}>
                    Basic information about your administrator account
                  </p>
                </div>

              </div>
            </div>

            <div className="grid gap-5 p-6 sm:grid-cols-2 lg:grid-cols-3">

              <div className={`rounded-2xl border p-5 ${innerCard}`}>
                <p className={`text-xs font-bold uppercase tracking-wider ${mutedText}`}>
                  Full Name
                </p>

                <p className={`mt-2 break-words font-bold ${headingText}`}>
                  {admin?.name || "Administrator"}
                </p>
              </div>

              <div className={`rounded-2xl border p-5 ${innerCard}`}>
                <p className={`text-xs font-bold uppercase tracking-wider ${mutedText}`}>
                  Email Address
                </p>

                <p className={`mt-2 break-all font-bold ${headingText}`}>
                  {admin?.email || "Not available"}
                </p>
              </div>

              <div className={`rounded-2xl border p-5 ${innerCard}`}>
                <p className={`text-xs font-bold uppercase tracking-wider ${mutedText}`}>
                  Account Role
                </p>

                <span
                  className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${darkMode
                      ? "bg-indigo-500/15 text-indigo-300"
                      : "bg-indigo-100 text-indigo-700"
                    }`}
                >
                  Administrator
                </span>
              </div>

            </div>
          </section>

          {/* Change Password */}

          <section className={`overflow-hidden rounded-3xl border shadow-sm ${panelBg}`}>

            <div className={`border-b px-6 py-5 ${divider}`}>
              <div className="flex items-center gap-3">

                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg ${darkMode
                      ? "bg-amber-500/10 text-amber-300"
                      : "bg-amber-50 text-amber-700"
                    }`}
                >
                  🔐
                </div>

                <div>
                  <h2 className={`font-black ${headingText}`}>
                    Change Password
                  </h2>

                  <p className={`text-sm ${mutedText}`}>
                    Update your password to keep your account secure
                  </p>
                </div>

              </div>
            </div>

            <form
              onSubmit={handleChangePassword}
              className="p-6"
            >

              <div className="grid gap-5 lg:grid-cols-3">

                {/* Current Password */}

                <div>
                  <label className={`mb-2 block text-sm font-bold ${labelStyle}`}>
                    Current Password
                  </label>

                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      autoComplete="current-password"
                      className={`w-full rounded-xl border px-4 py-3 pr-12 text-sm outline-none transition focus:ring-4 ${inputStyle}`}
                    />

                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-sm transition ${showPasswordButton}`}
                      aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                    >
                      {showCurrentPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                {/* New Password */}

                <div>
                  <label className={`mb-2 block text-sm font-bold ${labelStyle}`}>
                    New Password
                  </label>

                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      autoComplete="new-password"
                      className={`w-full rounded-xl border px-4 py-3 pr-12 text-sm outline-none transition focus:ring-4 ${inputStyle}`}
                    />

                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-sm transition ${showPasswordButton}`}
                      aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                    >
                      {showNewPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}

                <div>
                  <label className={`mb-2 block text-sm font-bold ${labelStyle}`}>
                    Confirm New Password
                  </label>

                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                      className={`w-full rounded-xl border px-4 py-3 pr-12 text-sm outline-none transition focus:ring-4 ${inputStyle}`}
                    />

                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-sm transition ${showPasswordButton}`}
                      aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    >
                      {showConfirmPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

              </div>

              {/* Password Requirements */}

              <div className={`mt-6 rounded-2xl border p-5 ${requirementBox}`}>

                <div className="flex items-center gap-2">
                  <span className={requirementHeading}>🛡️</span>

                  <p className={`text-sm font-bold ${requirementHeading}`}>
                    Password requirements
                  </p>
                </div>

                <div className={`mt-3 grid gap-3 text-xs sm:grid-cols-2 ${requirementText}`}>

                  <p className="flex items-center gap-2">
                    <span className="font-bold">✓</span>
                    At least 6 characters
                  </p>

                  <p className="flex items-center gap-2">
                    <span className="font-bold">✓</span>
                    New password must be different
                  </p>

                  <p className="flex items-center gap-2">
                    <span className="font-bold">✓</span>
                    Confirm password must match
                  </p>

                  <p className="flex items-center gap-2">
                    <span className="font-bold">✓</span>
                    Current password must be correct
                  </p>

                </div>
              </div>

              {/* Error Message */}

              {passwordError && (
                <div className={`mt-5 rounded-xl border px-4 py-3 text-sm font-semibold ${errorStyle}`}>
                  ⚠️ {passwordError}
                </div>
              )}

              {/* Success Message */}

              {passwordMessage && (
                <div className={`mt-5 rounded-xl border px-4 py-3 text-sm font-semibold ${successStyle}`}>
                  ✓ {passwordMessage}
                </div>
              )}

              {/* Submit Button */}

              <div className="mt-6 flex flex-col-reverse justify-between gap-3 sm:flex-row sm:items-center">

                <p className={`text-xs ${mutedText}`}>
                  Keep your password confidential and secure.
                </p>

                <button
                  type="submit"
                  disabled={changingPassword}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {changingPassword ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Updating Password...
                    </>
                  ) : (
                    <>
                      <span>🔒</span>
                      Update Password
                    </>
                  )}
                </button>

              </div>

            </form>
          </section>

          {/* System Information */}

          <section className={`overflow-hidden rounded-3xl border shadow-sm ${panelBg}`}>

            <div className={`border-b px-6 py-5 ${divider}`}>
              <div className="flex items-center gap-3">

                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg ${darkMode
                      ? "bg-purple-500/10 text-purple-300"
                      : "bg-purple-50 text-purple-700"
                    }`}
                >
                  ⚙️
                </div>

                <div>
                  <h2 className={`font-black ${headingText}`}>
                    System Information
                  </h2>

                  <p className={`text-sm ${mutedText}`}>
                    CampusFix application information
                  </p>
                </div>

              </div>
            </div>

            <div className="grid gap-5 p-6 sm:grid-cols-2 lg:grid-cols-3">

              {/* Application */}

              <div className={`rounded-2xl border p-5 transition hover:-translate-y-1 ${innerCard}`}>
                <div className="flex items-center justify-between">
                  <p className={`text-xs font-bold uppercase tracking-wider ${mutedText}`}>
                    Application
                  </p>

                  <span className="text-xl">🏛️</span>
                </div>

                <p className={`mt-3 text-lg font-black ${headingText}`}>
                  CampusFix
                </p>

                <p className={`mt-1 text-xs ${mutedText}`}>
                  Campus Maintenance Management
                </p>
              </div>

              {/* Version */}

              <div className={`rounded-2xl border p-5 transition hover:-translate-y-1 ${innerCard}`}>
                <div className="flex items-center justify-between">
                  <p className={`text-xs font-bold uppercase tracking-wider ${mutedText}`}>
                    Version
                  </p>

                  <span className="text-xl">📦</span>
                </div>

                <p className={`mt-3 text-lg font-black ${headingText}`}>
                  1.0.0
                </p>

                <p className={`mt-1 text-xs ${mutedText}`}>
                  Production Release
                </p>
              </div>

              {/* System Status */}

              <div className={`rounded-2xl border p-5 transition hover:-translate-y-1 ${innerCard}`}>
                <div className="flex items-center justify-between">
                  <p className={`text-xs font-bold uppercase tracking-wider ${mutedText}`}>
                    System Status
                  </p>

                  <span className="text-xl">🖥️</span>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />

                  <span className="font-black text-emerald-500">
                    Operational
                  </span>
                </div>

                <p className={`mt-1 text-xs ${mutedText}`}>
                  All services are running
                </p>
              </div>

            </div>
          </section>

          {/* Logout Section */}

          <section
            className={`overflow-hidden rounded-3xl border shadow-sm ${darkMode
                ? "border-red-900/40 bg-slate-900"
                : "border-red-100 bg-white"
              }`}
          >

            <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-center gap-4">

                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ${darkMode
                      ? "bg-red-500/10 text-red-300"
                      : "bg-red-50 text-red-600"
                    }`}
                >
                  🚪
                </div>

                <div>
                  <h2 className={`font-black ${headingText}`}>
                    Sign Out
                  </h2>

                  <p className={`mt-1 text-sm ${mutedText}`}>
                    Sign out from your CampusFix administrator account
                  </p>
                </div>

              </div>

              <button
                type="button"
                onClick={() => setShowLogout(true)}
                className={`rounded-xl px-6 py-3 text-sm font-bold transition ${darkMode
                    ? "bg-red-500/10 text-red-300 hover:bg-red-500/20"
                    : "bg-red-50 text-red-600 hover:bg-red-100"
                  }`}
              >
                Logout →
              </button>

            </div>
          </section>

          {/* Footer */}

          <footer className={`pb-4 text-center text-xs ${mutedText}`}>
            CampusFix Administration Portal · Medi-Caps University
          </footer>

        </main>
      </div>

      {/* Logout Modal */}

      <LogoutModal
        isOpen={showLogout}
        onClose={() => setShowLogout(false)}
      />

    </div>
  );
}

export default AdminSettings;