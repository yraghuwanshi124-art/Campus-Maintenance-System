
import React, { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CheckCheck,
  Clock,
  Trash2,
  ArrowLeft,
  ExternalLink,
  FileText,
  AlertCircle,
  Search,
  Check,
  MailOpen,
  Inbox,
  Sparkles,
  RefreshCw,
  X,
  Moon,
  Sun,
  ChevronRight,
} from "lucide-react";
import SupervisorSidebar from "../components/SupervisorSidebar";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";

const Notifications = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedNotification, setSelectedNotification] =
    useState(null);

  const [deletingId, setDeletingId] = useState(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  // THEME CLASSES

  const pageBg = darkMode
    ? "bg-[#0b1120]"
    : "bg-slate-50";

  const cardBg = darkMode
    ? "bg-[#151f32] border-slate-700/70"
    : "bg-white border-slate-200";

  const mutedBg = darkMode
    ? "bg-[#1c2940] border-slate-700"
    : "bg-slate-50 border-slate-200";

  const primaryText = darkMode
    ? "text-slate-100"
    : "text-slate-900";

  const secondaryText = darkMode
    ? "text-slate-300"
    : "text-slate-600";

  const mutedText = darkMode
    ? "text-slate-400"
    : "text-slate-500";

  const inputBg = darkMode
    ? "bg-[#101a2b] border-slate-700 text-slate-100 placeholder:text-slate-500"
    : "bg-slate-50 border-slate-200 text-slate-700 placeholder:text-slate-400";

  // FETCH NOTIFICATIONS

  const fetchNotifications = async () => {
    try {
      setLoading(true);

      const response = await api.get("/notifications");

      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error("FAILED TO FETCH NOTIFICATIONS:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // COUNTS

  const totalCount = notifications.length;

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  const readCount = notifications.filter(
    (notification) => notification.isRead
  ).length;

  // GET COMPLAINT ID

  const getComplaintId = (notification) => {
    return (
      notification?.complaintId ||
      notification?.complaint?._id ||
      notification?.data?.complaintId ||
      notification?.metadata?.complaintId ||
      null
    );
  };

  // FILTER NOTIFICATIONS

  const filteredNotifications = useMemo(() => {
    let result = [...notifications];

    if (activeFilter === "unread") {
      result = result.filter(
        (notification) => !notification.isRead
      );
    }

    if (activeFilter === "read") {
      result = result.filter(
        (notification) => notification.isRead
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();

      result = result.filter((notification) => {
        const title =
          notification.title?.toLowerCase() || "";

        const message =
          notification.message?.toLowerCase() || "";

        return (
          title.includes(query) ||
          message.includes(query)
        );
      });
    }

    return result;
  }, [notifications, activeFilter, searchQuery]);

  // MARK AS READ

  const markAsRead = async (notification) => {
    if (!notification || notification.isRead) {
      return;
    }

    try {
      await api.patch(
        `/notifications/${notification._id}/read`
      );

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
    } catch (error) {
      console.error(
        "FAILED TO MARK NOTIFICATION AS READ:",
        error
      );
    }
  };

  // OPEN NOTIFICATION

  const handleOpenNotification = async (notification) => {
    setSelectedNotification(notification);
    await markAsRead(notification);
  };

  // DELETE NOTIFICATION

  const handleDeleteNotification = async (
    event,
    notificationId
  ) => {
    event?.stopPropagation();

    try {
      setDeletingId(notificationId);

      await api.delete(
        `/notifications/${notificationId}`
      );

      setNotifications((previous) =>
        previous.filter(
          (notification) =>
            notification._id !== notificationId
        )
      );

      setSelectedNotification((previous) =>
        previous?._id === notificationId ? null : previous
      );
    } catch (error) {
      console.error(
        "FAILED TO DELETE NOTIFICATION:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to delete notification."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // DELETE ALL

  const handleDeleteAll = async () => {
    if (notifications.length === 0) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete all notifications?"
    );

    if (!confirmed) return;

    try {
      setDeletingAll(true);

      await api.delete("/notifications");

      setNotifications([]);
      setSelectedNotification(null);
    } catch (error) {
      console.error(
        "FAILED TO DELETE ALL NOTIFICATIONS:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to delete all notifications."
      );
    } finally {
      setDeletingAll(false);
    }
  };

  // MARK ALL AS READ

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;

    try {
      setMarkingAll(true);

      await api.patch("/notifications/read-all");

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );

      setSelectedNotification((previous) =>
        previous
          ? { ...previous, isRead: true }
          : previous
      );
    } catch (error) {
      console.error(
        "FAILED TO MARK ALL NOTIFICATIONS AS READ:",
        error
      );
    } finally {
      setMarkingAll(false);
    }
  };

  // OPEN RELATED COMPLAINT

  const handleViewComplaint = () => {
    const complaintId = getComplaintId(
      selectedNotification
    );

    if (!complaintId) return;

    navigate("/supervisor/complaints", {
      state: { complaintId },
    });
  };

  // FORMAT DATE

  const formatDateTime = (date) => {
    if (!date) return "Date not available";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date not available";
    }

    return parsedDate.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // FILTER BUTTONS

  const filterButtons = [
    {
      id: "all",
      label: "All",
      count: totalCount,
      icon: Inbox,
    },
    {
      id: "unread",
      label: "Unread",
      count: unreadCount,
      icon: Bell,
    },
    {
      id: "read",
      label: "Read",
      count: readCount,
      icon: CheckCheck,
    },
  ];

  // REUSABLE STAT CARD

  const StatCard = ({
    label,
    count,
    icon: Icon,
    color,
  }) => {
    const styles = {
      blue: darkMode
        ? "bg-blue-500/10 border-blue-400/20 text-blue-400"
        : "bg-blue-50 border-blue-100 text-blue-600",
      emerald: darkMode
        ? "bg-emerald-500/10 border-emerald-400/20 text-emerald-400"
        : "bg-emerald-50 border-emerald-100 text-emerald-600",
      violet: darkMode
        ? "bg-violet-500/10 border-violet-400/20 text-violet-400"
        : "bg-violet-50 border-violet-100 text-violet-600",
    };

    return (
      <div
        className={`rounded-2xl border p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg ${cardBg}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className={`text-xs font-bold uppercase tracking-wider ${mutedText}`}>
              {label}
            </p>

            <p className={`mt-2 text-3xl font-black ${primaryText}`}>
              {count}
            </p>
          </div>

          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${styles[color]}`}
          >
            <Icon size={23} />
          </div>
        </div>
      </div>
    );
  };

  // =========================================================
  // NOTIFICATION DETAIL VIEW
  // =========================================================

  if (selectedNotification) {
    const complaintId = getComplaintId(
      selectedNotification
    );

    return (
      <div className={`min-h-screen transition-colors duration-300 ${pageBg}`}>
        <SupervisorSidebar onLogout={handleLogout} />

        <main className="min-h-screen p-4 sm:p-6 lg:ml-64">
          <div className="mx-auto max-w-4xl">

            {/* TOP ACTIONS */}

            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 ${cardBg} ${secondaryText} hover:border-blue-400 hover:text-blue-500`}
              >
                <ArrowLeft size={17} />
                Back to Notifications
              </button>

              <button
                type="button"
                onClick={(event) =>
                  handleDeleteNotification(
                    event,
                    selectedNotification._id
                  )
                }
                disabled={
                  deletingId === selectedNotification._id
                }
                className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-bold text-red-500 transition hover:bg-red-500 hover:text-white disabled:opacity-50"
              >
                <Trash2 size={17} />

                {deletingId === selectedNotification._id
                  ? "Deleting..."
                  : "Delete"}
              </button>
            </div>

            {/* DETAIL CARD */}

            <div className={`overflow-hidden rounded-3xl border shadow-xl ${cardBg}`}>

              {/* HERO */}

              <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-800 p-6 text-white sm:p-9">
                <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[35px] border-white/5" />
                <div className="pointer-events-none absolute -bottom-28 right-32 h-64 w-64 rounded-full bg-white/5 blur-2xl" />

                <div className="relative flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 shadow-lg backdrop-blur">
                    <Bell size={27} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold">
                        Notification Details
                      </span>

                      {selectedNotification.isRead ? (
                        <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-bold text-emerald-100">
                          <CheckCheck size={12} className="mr-1 inline" />
                          Read
                        </span>
                      ) : (
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-700">
                          New
                        </span>
                      )}
                    </div>

                    <h1 className="mt-4 break-words text-2xl font-black leading-tight sm:text-3xl">
                      {selectedNotification.title ||
                        "CampusFix Notification"}
                    </h1>

                    <div className="mt-4 flex items-center gap-2 text-sm text-blue-100">
                      <Clock size={16} />
                      {formatDateTime(
                        selectedNotification.createdAt
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* BODY */}

              <div className="space-y-5 p-5 sm:p-8">

                <div className={`rounded-2xl border p-5 sm:p-6 ${mutedBg}`}>
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-blue-500" />

                    <h2 className={`text-xs font-black uppercase tracking-widest ${mutedText}`}>
                      Notification Message
                    </h2>
                  </div>

                  <p className={`mt-4 whitespace-pre-wrap text-base leading-8 ${secondaryText}`}>
                    {selectedNotification.message ||
                      "No additional message available."}
                  </p>
                </div>

                {/* INFORMATION */}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className={`rounded-2xl border p-5 ${cardBg}`}>
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-blue-500" />
                      <p className={`text-xs font-bold uppercase tracking-wider ${mutedText}`}>
                        Received
                      </p>
                    </div>

                    <p className={`mt-3 text-sm font-bold ${primaryText}`}>
                      {formatDateTime(
                        selectedNotification.createdAt
                      )}
                    </p>
                  </div>

                  <div className={`rounded-2xl border p-5 ${cardBg}`}>
                    <div className="flex items-center gap-2">
                      <CheckCheck size={16} className="text-emerald-500" />
                      <p className={`text-xs font-bold uppercase tracking-wider ${mutedText}`}>
                        Notification Status
                      </p>
                    </div>

                    <p className={`mt-3 flex items-center gap-2 text-sm font-bold ${primaryText}`}>
                      {selectedNotification.isRead ? (
                        <>
                          <CheckCheck size={17} className="text-emerald-500" />
                          Read
                        </>
                      ) : (
                        <>
                          <Bell size={17} className="text-blue-500" />
                          Unread
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* RELATED COMPLAINT */}

                {complaintId ? (
                  <div className={`rounded-2xl border p-5 sm:p-6 ${
                    darkMode
                      ? "border-blue-400/20 bg-blue-500/10"
                      : "border-blue-200 bg-blue-50"
                  }`}>
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
                        <FileText size={20} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h2 className={`text-base font-black ${
                          darkMode ? "text-blue-300" : "text-blue-900"
                        }`}>
                          Related Complaint
                        </h2>

                        <p className={`mt-1 text-sm leading-6 ${
                          darkMode ? "text-blue-200/70" : "text-blue-700"
                        }`}>
                          This notification is connected to a CampusFix maintenance complaint.
                        </p>

                        <p className={`mt-3 break-all text-xs font-bold ${
                          darkMode ? "text-blue-200" : "text-blue-800"
                        }`}>
                          Complaint ID: {complaintId}
                        </p>

                        <button
                          type="button"
                          onClick={handleViewComplaint}
                          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
                        >
                          View Related Complaint
                          <ExternalLink size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`rounded-2xl border p-5 ${mutedBg}`}>
                    <div className="flex items-start gap-3">
                      <AlertCircle
                        size={20}
                        className={`mt-0.5 shrink-0 ${mutedText}`}
                      />

                      <div>
                        <p className={`text-sm font-bold ${primaryText}`}>
                          No related complaint
                        </p>

                        <p className={`mt-1 text-sm leading-6 ${mutedText}`}>
                          This notification is not linked to a specific complaint.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================
  // NOTIFICATION LIST VIEW
  // =========================================================

  return (
    <div className={`min-h-screen transition-colors duration-300 ${pageBg}`}>
      <SupervisorSidebar onLogout={handleLogout} />

      <main className="min-h-screen p-4 sm:p-6 lg:ml-64">
        <div className="mx-auto max-w-6xl">

          {/* PAGE HEADER */}

          <div className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-800 p-6 text-white shadow-xl sm:p-8">
            <div className="pointer-events-none absolute -right-12 -top-24 h-72 w-72 rounded-full border-[40px] border-white/5" />
            <div className="pointer-events-none absolute -bottom-32 right-48 h-64 w-64 rounded-full bg-white/5 blur-2xl" />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/15 shadow-lg">
                    <Bell size={25} />
                  </div>

                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-blue-100">
                    Supervisor Center
                  </span>
                </div>

                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                  Notifications
                </h1>

                <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
                  Stay updated with complaint assignments, technician activity and CampusFix events.
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-white">
                    <Inbox size={15} />
                    {totalCount} Total
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-white">
                    <Bell size={15} />
                    {unreadCount} Unread
                  </span>
                </div>
              </div>

              <div className="hidden h-32 w-32 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 shadow-inner lg:flex">
                <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/15 bg-white/10">
                  <Sparkles size={42} className="text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* STATS */}

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Total Notifications"
              count={totalCount}
              icon={Inbox}
              color="blue"
            />

            <StatCard
              label="Unread Notifications"
              count={unreadCount}
              icon={Bell}
              color="violet"
            />

            <StatCard
              label="Read Notifications"
              count={readCount}
              icon={CheckCheck}
              color="emerald"
            />
          </div>

          {/* FILTER + SEARCH */}

          <div className={`mb-5 rounded-2xl border p-4 shadow-sm sm:p-5 ${cardBg}`}>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

              {/* FILTERS */}

              <div className="flex flex-wrap gap-2">
                {filterButtons.map((filter) => {
                  const Icon = filter.icon;
                  const isActive = activeFilter === filter.id;

                  return (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setActiveFilter(filter.id)}
                      className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition duration-200 ${
                        isActive
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                          : darkMode
                          ? "bg-[#1c2940] text-slate-300 hover:bg-slate-700"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <Icon size={16} />
                      {filter.label}

                      <span className={`rounded-lg px-2 py-0.5 text-[11px] ${
                        isActive
                          ? "bg-white/20 text-white"
                          : darkMode
                          ? "bg-slate-700 text-slate-300"
                          : "bg-white text-slate-500"
                      }`}>
                        {filter.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* SEARCH + REFRESH */}

              <div className="flex w-full flex-col gap-2 sm:flex-row xl:max-w-lg">
                <div className="relative min-w-0 flex-1">
                  <Search
                    size={18}
                    className={`absolute left-3 top-1/2 -translate-y-1/2 ${mutedText}`}
                  />

                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) =>
                      setSearchQuery(event.target.value)
                    }
                    placeholder="Search notifications..."
                    className={`w-full rounded-xl border py-3 pl-10 pr-10 text-sm font-medium outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${inputBg}`}
                  />

                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 ${mutedText} hover:text-blue-500`}
                      aria-label="Clear search"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={fetchNotifications}
                  disabled={loading}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition hover:border-blue-500 hover:text-blue-500 disabled:opacity-50 ${cardBg} ${secondaryText}`}
                >
                  <RefreshCw
                    size={16}
                    className={loading ? "animate-spin" : ""}
                  />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* ACTION BAR */}

          {(unreadCount > 0 || notifications.length > 0) && (
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className={`text-sm font-semibold ${mutedText}`}>
                Showing{" "}
                <span className={primaryText}>
                  {filteredNotifications.length}
                </span>{" "}
                of{" "}
                <span className={primaryText}>
                  {totalCount}
                </span>{" "}
                notifications
              </p>

              <div className="flex flex-wrap gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    disabled={markingAll}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition disabled:opacity-50 ${
                      darkMode
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                        : "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
                    }`}
                  >
                    <Check size={15} />
                    {markingAll ? "Updating..." : "Mark All Read"}
                  </button>
                )}

                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDeleteAll}
                    disabled={deletingAll}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition disabled:opacity-50 ${
                      darkMode
                        ? "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                        : "border-red-200 bg-white text-red-600 hover:bg-red-50"
                    }`}
                  >
                    <Trash2 size={15} />
                    {deletingAll ? "Deleting..." : "Delete All"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* LOADING */}

          {loading && (
            <div className={`rounded-3xl border p-12 text-center shadow-sm ${cardBg}`}>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10">
                <div className="h-9 w-9 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-600" />
              </div>

              <p className={`mt-5 text-sm font-bold ${secondaryText}`}>
                Loading notifications...
              </p>

              <p className={`mt-1 text-xs ${mutedText}`}>
                Please wait while we fetch your updates.
              </p>
            </div>
          )}

          {/* EMPTY STATE */}

          {!loading && filteredNotifications.length === 0 && (
            <div className={`rounded-3xl border p-10 text-center shadow-sm sm:p-14 ${cardBg}`}>
              <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-3xl ${
                darkMode ? "bg-slate-800" : "bg-slate-100"
              }`}>
                {searchQuery ? (
                  <Search size={35} className={mutedText} />
                ) : activeFilter === "unread" ? (
                  <MailOpen size={35} className={mutedText} />
                ) : (
                  <Bell size={35} className={mutedText} />
                )}
              </div>

              <h2 className={`mt-5 text-xl font-black ${primaryText}`}>
                {searchQuery
                  ? "No notifications found"
                  : activeFilter === "unread"
                  ? "No unread notifications"
                  : activeFilter === "read"
                  ? "No read notifications"
                  : "No notifications yet"}
              </h2>

              <p className={`mt-2 text-sm ${mutedText}`}>
                {searchQuery
                  ? "Try searching with a different keyword."
                  : "You're all caught up. New updates will appear here."}
              </p>

              {(searchQuery || activeFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveFilter("all");
                  }}
                  className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
                >
                  Show All Notifications
                </button>
              )}
            </div>
          )}

          {/* NOTIFICATION LIST */}

          {!loading && filteredNotifications.length > 0 && (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => {
                const complaintId = getComplaintId(notification);
                const isDeleting =
                  deletingId === notification._id;

                return (
                  <div
                    key={notification._id}
                    onClick={() =>
                      handleOpenNotification(notification)
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" ||
                        event.key === " "
                      ) {
                        event.preventDefault();
                        handleOpenNotification(notification);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className={`group relative cursor-pointer overflow-hidden rounded-2xl border p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-5 ${
                      notification.isRead
                        ? cardBg
                        : darkMode
                        ? "border-blue-400/30 bg-blue-500/[0.07]"
                        : "border-blue-200 bg-blue-50/70"
                    }`}
                  >
                    {/* UNREAD INDICATOR */}

                    {!notification.isRead && (
                      <div className="absolute bottom-0 left-0 top-0 w-1 bg-blue-500" />
                    )}

                    <div className="flex gap-3 sm:gap-4">
                      {/* ICON */}

                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl sm:h-12 sm:w-12 ${
                          notification.isRead
                            ? darkMode
                              ? "bg-slate-800 text-slate-400"
                              : "bg-slate-100 text-slate-500"
                            : "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                        }`}
                      >
                        {notification.isRead ? (
                          <CheckCheck size={21} />
                        ) : (
                          <Bell size={21} />
                        )}
                      </div>

                      {/* CONTENT */}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2 sm:gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className={`break-words text-sm font-black sm:text-base ${primaryText}`}>
                                {notification.title ||
                                  "CampusFix Notification"}
                              </h3>

                              {!notification.isRead && (
                                <span className="rounded-full bg-blue-600 px-2.5 py-1 text-[9px] font-black tracking-wider text-white">
                                  UNREAD
                                </span>
                              )}
                            </div>

                            <p className={`mt-1.5 line-clamp-2 text-sm leading-6 ${secondaryText}`}>
                              {notification.message ||
                                "No message available."}
                            </p>
                          </div>

                          {/* DELETE */}

                          <button
                            type="button"
                            onClick={(event) =>
                              handleDeleteNotification(
                                event,
                                notification._id
                              )
                            }
                            disabled={isDeleting}
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              darkMode
                                ? "text-slate-500 hover:bg-red-500/15 hover:text-red-400"
                                : "text-slate-400 hover:bg-red-50 hover:text-red-600"
                            }`}
                            title="Delete notification"
                            aria-label="Delete notification"
                          >
                            {isDeleting ? (
                              <RefreshCw size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={17} />
                            )}
                          </button>
                        </div>

                        {/* META */}

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <span className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${
                            darkMode
                              ? "bg-slate-800 text-slate-400"
                              : "bg-slate-100 text-slate-500"
                          }`}>
                            <Clock size={13} />
                            {formatDateTime(notification.createdAt)}
                          </span>

                          {complaintId && (
                            <span className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold ${
                              darkMode
                                ? "bg-blue-500/15 text-blue-300"
                                : "bg-blue-100 text-blue-700"
                            }`}>
                              <FileText size={13} />
                              Related Complaint
                            </span>
                          )}

                          <span className="ml-auto flex items-center gap-1 text-xs font-black text-blue-500 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                            View Details
                            <ChevronRight size={15} />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* FOOTER */}

          {!loading && notifications.length > 0 && (
            <div className={`mt-6 flex items-center justify-center gap-2 py-4 text-xs font-semibold ${mutedText}`}>
              <Sparkles size={14} />
              You're up to date with your CampusFix notifications
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Notifications;
