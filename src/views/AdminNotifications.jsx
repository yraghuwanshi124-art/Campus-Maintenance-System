"use client";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  CheckCheck,
  Clock,
  ExternalLink,
  FileText,
  Inbox,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Trash2,
  CheckSquare,
  Square,
  Search,
  X,
  AlertTriangle,
  Building,
  Layers,
  Sparkles,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";
import AdminSidebar from "../components/AdminSidebar";
import LogoutModal from "../components/LogoutModal";

const AdminNotifications = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode } = useTheme();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const isDark = darkMode;

  const containerClass = isDark
    ? "bg-slate-950 text-white"
    : "bg-slate-50 text-slate-900";

  const cardClass = isDark
    ? "border-slate-800 bg-slate-900"
    : "border-slate-200 bg-white";

  const mutedText = isDark ? "text-slate-400" : "text-slate-500";

  // =====================================================
  // FETCH NOTIFICATIONS
  // =====================================================
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/notifications");

      setNotifications(response.data?.notifications || []);
    } catch (err) {
      console.error("Admin notification fetch error:", err);
      setError(
        err.response?.data?.message ||
          "Unable to load notifications. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Open notification received from notification bell or navigation state
  useEffect(() => {
    const notificationId = location.state?.notificationId;

    if (notificationId && notifications.length > 0) {
      const found = notifications.find(
        (item) => item._id === notificationId
      );

      if (found) {
        setSelectedNotification(found);
        if (!found.isRead) {
          markAsRead(found);
        }
      }
    }
  }, [location.state, notifications]);

  // =====================================================
  // MARK AS READ
  // =====================================================
  const markAsRead = async (notification) => {
    if (!notification || notification.isRead) return;

    try {
      await api.patch(`/notifications/${notification._id}/read`);

      setNotifications((previous) =>
        previous.map((item) =>
          item._id === notification._id
            ? { ...item, isRead: true }
            : item
        )
      );

      setSelectedNotification((previous) =>
        previous?._id === notification._id
          ? { ...previous, isRead: true }
          : previous
      );
    } catch (err) {
      console.error("Mark as read error:", err);
    }
  };

  const handleNotificationClick = async (notification) => {
    setSelectedNotification(notification);
    await markAsRead(notification);
  };

  // Back to notification list
  const handleBack = () => {
    setSelectedNotification(null);

    navigate("/admin/notifications", {
      replace: true,
      state: {},
    });
  };

  // =====================================================
  // MARK ALL AS READ
  // =====================================================
  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);

      await api.patch("/notifications/read-all");

      setNotifications((previous) =>
        previous.map((item) => ({
          ...item,
          isRead: true,
        }))
      );

      setSelectedNotification((previous) =>
        previous ? { ...previous, isRead: true } : null
      );
    } catch (err) {
      console.error("Mark all read error:", err);
    } finally {
      setMarkingAll(false);
    }
  };

  // =====================================================
  // SELECTION
  // =====================================================
  const toggleSelect = (id) => {
    setSelectedIds((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  };

  const handleSelectAll = () => {
    const visibleIds = filteredNotifications.map((item) => item._id);

    const allSelected =
      visibleIds.length > 0 &&
      visibleIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((previous) =>
        previous.filter((id) => !visibleIds.includes(id))
      );
    } else {
      setSelectedIds((previous) =>
        [...new Set([...previous, ...visibleIds])]
      );
    }
  };

  // =====================================================
  // DELETION
  // =====================================================
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this notification?"
    );

    if (!confirmed) return;

    try {
      await api.delete(`/notifications/${id}`);

      setNotifications((previous) =>
        previous.filter((item) => item._id !== id)
      );

      setSelectedIds((previous) =>
        previous.filter((item) => item !== id)
      );

      if (selectedNotification?._id === id) {
        setSelectedNotification(null);
      }
    } catch (error) {
      console.error("Delete notification error:", error);
      alert("Unable to delete notification.");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedIds.length} selected notifications?`
    );

    if (!confirmed) return;

    try {
      setDeleting(true);

      const results = await Promise.allSettled(
        selectedIds.map((id) =>
          api.delete(`/notifications/${id}`)
        )
      );

      const deletedIds = selectedIds.filter(
        (_, index) => results[index].status === "fulfilled"
      );

      setNotifications((previous) =>
        previous.filter((item) => !deletedIds.includes(item._id))
      );

      setSelectedIds((previous) =>
        previous.filter((id) => !deletedIds.includes(id))
      );

      if (
        selectedNotification &&
        deletedIds.includes(selectedNotification._id)
      ) {
        setSelectedNotification(null);
      }

      const failedCount = results.length - deletedIds.length;

      if (failedCount > 0) {
        alert(
          `${deletedIds.length} notifications deleted. ${failedCount} could not be deleted.`
        );
      }
    } catch (error) {
      console.error("Bulk delete error:", error);
      alert("Unable to delete selected notifications.");
    } finally {
      setDeleting(false);
    }
  };

  // =====================================================
  // COMPLAINT HELPERS
  // =====================================================
  const getComplaintId = (notification) => {
    return (
      notification?.complaint?._id ||
      notification?.complaintId ||
      notification?.data?.complaintId ||
      notification?.metadata?.complaintId
    );
  };

  const handleOpenComplaint = () => {
    const complaintId = getComplaintId(selectedNotification);

    if (!complaintId) return;

    navigate("/admin/complaints", {
      state: { complaintId },
    });
  };

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    return new Date(date).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =====================================================
  // COUNTS & FILTERING
  // =====================================================
  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  const readCount = notifications.length - unreadCount;

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "unread" && notification.isRead) return false;
    if (filter === "read" && !notification.isRead) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const titleMatch = (notification.title || "").toLowerCase().includes(q);
      const messageMatch = (notification.message || "").toLowerCase().includes(q);
      const categoryMatch = (notification.complaint?.category || "")
        .toLowerCase()
        .includes(q);
      const blockMatch = (notification.complaint?.block || "")
        .toLowerCase()
        .includes(q);
      const roomMatch = (notification.complaint?.room || "")
        .toLowerCase()
        .includes(q);
      const statusMatch = (notification.complaint?.status || "")
        .toLowerCase()
        .includes(q);

      if (
        !titleMatch &&
        !messageMatch &&
        !categoryMatch &&
        !blockMatch &&
        !roomMatch &&
        !statusMatch
      ) {
        return false;
      }
    }

    return true;
  });

  // =====================================================
  // RENDER: NOTIFICATION DETAIL VIEW
  // =====================================================
  if (selectedNotification) {
    const complaint = selectedNotification.complaint;
    const complaintId = getComplaintId(selectedNotification);

    return (
      <div className={`min-h-screen ${containerClass}`}>
        <AdminSidebar onLogout={() => setShowLogout(true)} />

        <div className="transition-all duration-300 lg:ml-64">
          {/* Top Navbar */}
          <nav
            className={`border-b shadow-sm ${
              isDark
                ? "border-slate-800 bg-slate-900/90 text-white"
                : "border-indigo-100 bg-indigo-50"
            }`}
          >
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
              <div className="flex items-center gap-5">
                <div
                  className={`rounded-xl px-3 py-1.5 shadow-sm ${
                    isDark ? "border border-slate-700 bg-slate-800" : "bg-white"
                  }`}
                >
                  <img
                    src="https://www.medicaps.ac.in/public/frontend/images/medicaps-logo-fin.webp"
                    alt="Medi-Caps University"
                    className="h-11 w-auto object-contain"
                  />
                </div>

                <div
                  className={`hidden border-l-2 pl-5 sm:block ${
                    isDark ? "border-slate-700" : "border-indigo-200"
                  }`}
                >
                  <p
                    className={`text-xl font-extrabold tracking-tight ${
                      isDark ? "text-indigo-400" : "text-indigo-700"
                    }`}
                  >
                    CampusFix
                  </p>
                  <p
                    className={`mt-1 text-sm font-medium ${
                      isDark ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    Notification Management
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    isDark
                      ? "border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  ← Notifications
                </button>
              </div>
            </div>
          </nav>

          {/* Main Detail Content */}
          <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Back Button */}
            <button
              type="button"
              onClick={handleBack}
              className={`mb-6 inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:-translate-x-1 ${
                isDark
                  ? "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              <ArrowLeft size={18} />
              Back to Notifications
            </button>

            {/* Detail Card */}
            <div
              className={`overflow-hidden rounded-2xl border shadow-sm ${cardClass}`}
            >
              <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-700 p-6 text-white sm:p-8">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 shadow-inner backdrop-blur-sm">
                  <Bell size={28} />
                </div>

                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-indigo-200">
                  Notification Details
                </p>

                <h1 className="text-2xl font-black sm:text-3xl">
                  {selectedNotification.title || "Admin Notification"}
                </h1>

                <p className="mt-2 text-sm text-indigo-100">
                  Detailed information regarding this campus maintenance update.
                </p>
              </div>

              <div className="space-y-6 p-5 sm:p-8">
                {/* Notification Message */}
                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h2 className="text-lg font-bold">Notification Message</h2>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        selectedNotification.isRead
                          ? isDark
                            ? "bg-slate-800 text-slate-300"
                            : "bg-slate-100 text-slate-600"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300"
                      }`}
                    >
                      {selectedNotification.isRead ? "Read" : "Unread"}
                    </span>
                  </div>

                  <div
                    className={`rounded-xl border p-5 ${
                      isDark
                        ? "border-slate-700 bg-slate-800/70"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <p className="text-base leading-7">
                      {selectedNotification.message ||
                        "No notification message available."}
                    </p>
                  </div>
                </div>

                {/* Received On Date */}
                <div
                  className={`flex items-center gap-3 rounded-xl border p-4 ${cardClass}`}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
                    <CalendarDays size={21} />
                  </div>

                  <div>
                    <p className={`text-xs ${mutedText}`}>Received On</p>
                    <p className="mt-1 text-sm font-semibold">
                      {formatDate(selectedNotification.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Related Complaint Details */}
                {complaint && (
                  <div>
                    <div className="mb-4 flex items-center gap-2">
                      <FileText size={20} className="text-indigo-500" />
                      <h2 className="text-lg font-bold">Related Complaint</h2>
                    </div>

                    <div className={`rounded-xl border p-5 ${cardClass}`}>
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div>
                          <p className={`text-xs ${mutedText}`}>Category</p>
                          <p className="mt-1 font-semibold">
                            {complaint.category || "Not available"}
                          </p>
                        </div>

                        <div>
                          <p className={`text-xs ${mutedText}`}>
                            Complaint Status
                          </p>
                          <p className="mt-1 font-semibold">
                            {complaint.status || "Not available"}
                          </p>
                        </div>

                        <div>
                          <p className={`text-xs ${mutedText}`}>Campus Block</p>
                          <p className="mt-1 font-semibold">
                            {complaint.block || "Not available"}
                          </p>
                        </div>

                        <div>
                          <p className={`text-xs ${mutedText}`}>Floor & Room</p>
                          <p className="mt-1 font-semibold">
                            {complaint.floor ? `Floor ${complaint.floor}, ` : ""}
                            {complaint.room || "Not available"}
                          </p>
                        </div>

                        <div>
                          <p className={`text-xs ${mutedText}`}>Priority</p>
                          <p className="mt-1 font-semibold">
                            {complaint.priority || "Medium"}
                          </p>
                        </div>

                        <div>
                          <p className={`text-xs ${mutedText}`}>Complaint ID</p>
                          <p className="mt-1 font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            #{complaintId ? complaintId.toString().slice(-6).toUpperCase() : "—"}
                          </p>
                        </div>
                      </div>

                      {complaintId && (
                        <button
                          type="button"
                          onClick={handleOpenComplaint}
                          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 sm:w-auto"
                        >
                          <ExternalLink size={18} />
                          View Complaint in All Complaints
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* If no related complaint */}
                {!complaint && (
                  <div
                    className={`rounded-xl border border-dashed p-5 ${cardClass}`}
                  >
                    <div className="flex items-center gap-3">
                      <ShieldCheck size={22} className="text-indigo-500" />
                      <div>
                        <p className="font-semibold">General Notification</p>
                        <p className={`mt-1 text-sm ${mutedText}`}>
                          No related complaint information is attached to this notification.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delete Button inside detail */}
                <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedNotification._id)}
                    className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/70 px-4 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
                  >
                    <Trash2 size={16} />
                    Delete Notification
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>

        <LogoutModal
          isOpen={showLogout}
          onClose={() => setShowLogout(false)}
        />
      </div>
    );
  }

  // =====================================================
  // RENDER: NOTIFICATION LIST VIEW
  // =====================================================
  return (
    <div className={`min-h-screen ${containerClass}`}>
      <AdminSidebar onLogout={() => setShowLogout(true)} />

      <div className="transition-all duration-300 lg:ml-64">
        {/* ================= TOP NAVBAR ================= */}
        <nav
          className={`border-b shadow-sm ${
            isDark
              ? "border-slate-800 bg-slate-900/90 text-white"
              : "border-indigo-100 bg-indigo-50"
          }`}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-5">
              <div
                className={`rounded-xl px-3 py-1.5 shadow-sm ${
                  isDark ? "border border-slate-700 bg-slate-800" : "bg-white"
                }`}
              >
                <img
                  src="https://www.medicaps.ac.in/public/frontend/images/medicaps-logo-fin.webp"
                  alt="Medi-Caps University"
                  className="h-11 w-auto object-contain"
                />
              </div>

              <div
                className={`hidden border-l-2 pl-5 sm:block ${
                  isDark ? "border-slate-700" : "border-indigo-200"
                }`}
              >
                <p
                  className={`text-xl font-extrabold tracking-tight ${
                    isDark ? "text-indigo-400" : "text-indigo-700"
                  }`}
                >
                  CampusFix
                </p>
                <p
                  className={`mt-1 text-sm font-medium ${
                    isDark ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  Campus Maintenance Management System
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden text-right sm:block">
                <p
                  className={`text-base font-bold ${
                    isDark ? "text-white" : "text-slate-800"
                  }`}
                >
                  {user?.assignedBlocks?.length
                    ? `${user.assignedBlocks.join(", ")} Admin`
                    : "Administrator"}
                </p>

                <p
                  className={`mt-0.5 max-w-[230px] truncate text-sm ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {user?.email || "No email"}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-600 text-base font-bold text-white shadow-sm">
                A
              </div>

              <button
                type="button"
                onClick={() => setShowLogout(true)}
                className={`rounded-xl px-5 py-2.5 text-base font-semibold shadow-sm transition ${
                  isDark
                    ? "border border-slate-700 bg-slate-800 text-slate-200 hover:border-red-900/50 hover:bg-red-950/30 hover:text-red-400"
                    : "border border-indigo-200 bg-white text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                }`}
              >
                Logout
              </button>
            </div>
          </div>
        </nav>

        {/* ================= MAIN CONTENT ================= */}
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          {/* Page Heading & Actions */}
          <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="mb-2 flex items-center gap-2 text-indigo-500">
                <Bell size={21} />
                <span className="text-sm font-semibold uppercase tracking-wider">
                  Admin Portal
                </span>
              </div>

              <h1 className="text-2xl font-black sm:text-3xl">
                Notifications
              </h1>

              <p className={`mt-2 text-sm ${mutedText}`}>
                Stay updated with complaint activity, facility reports, and system notices.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={fetchNotifications}
                disabled={loading}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                  isDark
                    ? "border-slate-700 bg-slate-900 hover:bg-slate-800"
                    : "border-slate-200 bg-white hover:bg-slate-100"
                }`}
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin text-indigo-500" : ""}
                />
                Refresh
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={markingAll}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
                >
                  <CheckCheck size={17} />
                  {markingAll ? "Please wait..." : "Mark All Read"}
                </button>
              )}
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className={`rounded-2xl border p-5 shadow-2xs ${cardClass}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${mutedText}`}>Total Notifications</p>
                  <h2 className="mt-2 text-3xl font-bold">
                    {notifications.length}
                  </h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
                  <Bell size={23} />
                </div>
              </div>
            </div>

            <div className={`rounded-2xl border p-5 shadow-2xs ${cardClass}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${mutedText}`}>Unread Notifications</p>
                  <h2 className="mt-2 text-3xl font-bold text-blue-500">
                    {unreadCount}
                  </h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                  <Clock size={23} />
                </div>
              </div>
            </div>

            <div className={`rounded-2xl border p-5 shadow-2xs ${cardClass}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${mutedText}`}>Read Notifications</p>
                  <h2 className="mt-2 text-3xl font-bold text-emerald-500">
                    {readCount}
                  </h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <CheckCheck size={23} />
                </div>
              </div>
            </div>
          </div>

          {/* Filter & Search Controls Bar */}
          <div
            className={`mb-5 flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${cardClass}`}
          >
            {/* Filter Tabs with Counts */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { value: "all", label: "All", count: notifications.length },
                { value: "unread", label: "Unread", count: unreadCount },
                { value: "read", label: "Read", count: readCount },
              ].map((item) => (
                <button
                  type="button"
                  key={item.value}
                  onClick={() => setFilter(item.value)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    filter === item.value
                      ? "bg-indigo-600 text-white shadow-sm"
                      : isDark
                      ? "text-slate-300 hover:bg-slate-800"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span>{item.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      filter === item.value
                        ? "bg-white/20 text-white"
                        : isDark
                        ? "bg-slate-800 text-slate-400"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {item.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-80">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Search size={16} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notifications..."
                className={`w-full rounded-xl border py-2.5 pl-10 pr-9 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-950 ${
                  isDark
                    ? "border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                    : "border-slate-200 bg-slate-50/80 text-slate-800 placeholder:text-slate-400"
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  title="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Selection & Bulk Actions Toolbar */}
          <div
            className={`mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 ${cardClass}`}
          >
            <button
              type="button"
              onClick={handleSelectAll}
              disabled={filteredNotifications.length === 0}
              className={`flex items-center gap-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                isDark ? "text-slate-200" : "text-slate-700"
              }`}
            >
              {filteredNotifications.length > 0 &&
              filteredNotifications.every((item) =>
                selectedIds.includes(item._id)
              ) ? (
                <CheckSquare size={19} className="text-indigo-500" />
              ) : (
                <Square size={19} />
              )}
              Select All
            </button>

            <div className="flex items-center gap-3">
              <span className={`text-sm ${mutedText}`}>
                {selectedIds.length} selected
              </span>

              <button
                type="button"
                onClick={handleDeleteSelected}
                disabled={selectedIds.length === 0 || deleting}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 size={16} />
                {deleting ? "Deleting..." : "Delete Selected"}
              </button>
            </div>
          </div>

          {/* Notification List Section */}
          <div className={`overflow-hidden rounded-2xl border ${cardClass}`}>
            <div
              className={`flex items-center justify-between border-b p-5 ${
                isDark ? "border-slate-800" : "border-slate-200"
              }`}
            >
              <div>
                <h2 className="font-bold">Recent Notifications</h2>
                <p className={`mt-1 text-xs ${mutedText}`}>
                  Click a notification to inspect details and related complaint info.
                </p>
              </div>

              <span className={`text-xs font-semibold ${mutedText}`}>
                {filteredNotifications.length} items
              </span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <RefreshCw
                  size={30}
                  className="animate-spin text-indigo-500"
                />
                <p className={`mt-4 text-sm ${mutedText}`}>
                  Loading notifications...
                </p>
              </div>
            ) : error ? (
              <div className="px-5 py-14 text-center">
                <p className="font-semibold text-red-500">{error}</p>
                <button
                  type="button"
                  onClick={fetchNotifications}
                  className="mt-4 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Try Again
                </button>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
                    isDark ? "bg-slate-800" : "bg-slate-100"
                  }`}
                >
                  <Inbox size={30} className={mutedText} />
                </div>

                <h3 className="mt-4 text-lg font-bold">
                  {searchQuery || filter !== "all"
                    ? "No Matching Notifications"
                    : "No Notifications Found"}
                </h3>

                <p className={`mt-2 max-w-sm text-sm ${mutedText}`}>
                  {searchQuery || filter !== "all"
                    ? "No notifications match your current search or filter criteria."
                    : "You are all caught up! There are no notifications for your account."}
                </p>

                {(searchQuery || filter !== "all") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setFilter("all");
                    }}
                    className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-700"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div>
                {filteredNotifications.map((notification) => {
                  const isSelected = selectedIds.includes(notification._id);

                  return (
                    <div
                      key={notification._id}
                      className={`flex items-center gap-3 border-b p-4 sm:p-5 last:border-b-0 transition ${
                        isDark
                          ? "border-slate-800 hover:bg-slate-800/60"
                          : "border-slate-100 hover:bg-slate-50/80"
                      } ${
                        !notification.isRead
                          ? isDark
                            ? "bg-indigo-950/20"
                            : "bg-indigo-50/40"
                          : ""
                      }`}
                    >
                      {/* Individual Select Checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleSelect(notification._id)}
                        className="shrink-0 p-1"
                        title="Select notification"
                      >
                        {isSelected ? (
                          <CheckSquare
                            size={21}
                            className="text-indigo-500"
                          />
                        ) : (
                          <Square size={21} className={mutedText} />
                        )}
                      </button>

                      {/* Notification Icon */}
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                          notification.isRead
                            ? isDark
                              ? "bg-slate-800 text-slate-400"
                              : "bg-slate-100 text-slate-500"
                            : "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                        }`}
                      >
                        <Bell size={20} />
                      </div>

                      {/* Notification Content Clickable */}
                      <button
                        type="button"
                        onClick={() =>
                          handleNotificationClick(notification)
                        }
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-slate-900 dark:text-white">
                            {notification.title || "Notification"}
                          </h3>

                          {!notification.isRead && (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/80 dark:text-blue-300">
                              NEW
                            </span>
                          )}
                        </div>

                        <p className={`mt-1 line-clamp-2 text-sm ${mutedText}`}>
                          {notification.message}
                        </p>

                        <div
                          className={`mt-2 flex flex-wrap items-center gap-3 text-xs ${mutedText}`}
                        >
                          <span className="flex items-center gap-1">
                            <CalendarDays size={13} />
                            {formatDate(notification.createdAt)}
                          </span>

                          {notification.complaint?.category && (
                            <span className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
                              <MapPin size={13} />
                              {notification.complaint.category}
                              {notification.complaint.block
                                ? ` • ${notification.complaint.block}`
                                : ""}
                            </span>
                          )}
                        </div>

                        <p className="mt-2 text-xs font-semibold text-indigo-500 hover:text-indigo-600">
                          View Details →
                        </p>
                      </button>

                      {/* Read / Unread Status Pill */}
                      <div className="hidden shrink-0 sm:block">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            notification.isRead
                              ? isDark
                                ? "bg-slate-800 text-slate-400"
                                : "bg-slate-100 text-slate-500"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300"
                          }`}
                        >
                          {notification.isRead ? "Read" : "Unread"}
                        </span>
                      </div>

                      {/* Single Delete Action */}
                      <button
                        type="button"
                        onClick={() => handleDelete(notification._id)}
                        className="shrink-0 rounded-xl p-2.5 text-red-500 transition hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
                        title="Delete notification"
                      >
                        <Trash2 size={19} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Logout Modal */}
      <LogoutModal
        isOpen={showLogout}
        onClose={() => setShowLogout(false)}
      />
    </div>
  );
};

export default AdminNotifications;


