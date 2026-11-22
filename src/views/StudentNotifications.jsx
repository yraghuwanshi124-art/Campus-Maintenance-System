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
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";

const StudentNotifications = ({ darkMode = false }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("all");
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [markingAll, setMarkingAll] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [deleting, setDeleting] = useState(false);

    const isDark = darkMode;

    const containerClass = isDark
        ? "bg-slate-950 text-white"
        : "bg-slate-50 text-slate-900";

    const cardClass = isDark
        ? "border-slate-800 bg-slate-900"
        : "border-slate-200 bg-white";

    const mutedText = isDark ? "text-slate-400" : "text-slate-500";

    // Fetch notifications
    const fetchNotifications = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/notifications");

            setNotifications(response.data?.notifications || []);
        } catch (err) {
            console.error("Notification fetch error:", err);
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

    // Open notification received from notification bell
    useEffect(() => {
        const notificationId = location.state?.notificationId;

        if (notificationId && notifications.length > 0) {
            const notification = notifications.find(
                (item) => item._id === notificationId
            );

            if (notification) {
                setSelectedNotification(notification);
            }
        }
    }, [location.state, notifications]);

    // Update notification as read
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

    // Open notification details
    const handleNotificationClick = async (notification) => {
        setSelectedNotification(notification);
        await markAsRead(notification);
    };

    // Back to notification list
    const handleBack = () => {
        setSelectedNotification(null);

        navigate("/student/notifications", {
            replace: true,
            state: {},
        });
    };

    // Mark all notifications as read
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
    // Select or deselect one notification
    const toggleSelect = (id) => {
        setSelectedIds((previous) =>
            previous.includes(id)
                ? previous.filter((item) => item !== id)
                : [...previous, id]
        );
    };

    // Select all currently filtered notifications
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

    // Delete single notification
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

    // Delete selected notifications
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

            const failedCount = results.length - deletedIds.length;

            if (failedCount > 0) {
                alert(`${deletedIds.length} deleted. ${failedCount} could not be deleted.`);
            }
        } catch (error) {
            console.error("Bulk delete error:", error);
            alert("Unable to delete selected notifications.");
        } finally {
            setDeleting(false);
        }
    };
    // Complaint ID helper
    const getComplaintId = (notification) => {
        return (
            notification?.complaintId ||
            notification?.complaint?._id ||
            notification?.data?.complaintId ||
            notification?.metadata?.complaintId
        );
    };

    // Open related complaint separately
    const handleOpenComplaint = () => {
        const complaintId = getComplaintId(selectedNotification);

        if (!complaintId) return;

        navigate("/student/complaints", {
            state: { complaintId },
        });
    };

    // Date formatting
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

    const unreadCount = notifications.filter(
        (notification) => !notification.isRead
    ).length;

    const readCount = notifications.length - unreadCount;

    const filteredNotifications = notifications.filter((notification) => {
        if (filter === "unread") return !notification.isRead;
        if (filter === "read") return notification.isRead;
        return true;
    });

    // Detail page
    if (selectedNotification) {
        const complaint = selectedNotification.complaint;
        const complaintId = getComplaintId(selectedNotification);

        return (
            <div className={`min-h-screen p-4 sm:p-6 lg:p-8 ${containerClass}`}>
                <div className="mx-auto max-w-4xl">

                    {/* Back Button */}
                    <button
                        onClick={handleBack}
                        className={`mb-6 inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:-translate-x-1 ${isDark
                                ? "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                            }`}
                    >
                        <ArrowLeft size={18} />
                        Back to Notifications
                    </button>

                    {/* Detail Header */}
                    <div
                        className={`overflow-hidden rounded-2xl border shadow-sm ${cardClass}`}
                    >
                        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white sm:p-8">
                            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                                <Bell size={28} />
                            </div>

                            <p className="mb-2 text-sm font-medium text-indigo-100">
                                Notification Details
                            </p>

                            <h1 className="text-2xl font-bold sm:text-3xl">
                                Notification
                            </h1>

                            <p className="mt-2 text-sm text-indigo-100">
                                View complete information about this notification.
                            </p>
                        </div>

                        <div className="space-y-6 p-5 sm:p-8">

                            {/* Notification Message */}
                            <div>
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <h2 className="text-lg font-bold">
                                        Notification Message
                                    </h2>

                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${selectedNotification.isRead
                                                ? isDark
                                                    ? "bg-slate-800 text-slate-300"
                                                    : "bg-slate-100 text-slate-600"
                                                : "bg-blue-100 text-blue-700"
                                            }`}
                                    >
                                        {selectedNotification.isRead ? "Read" : "Unread"}
                                    </span>
                                </div>

                                <div
                                    className={`rounded-xl border p-5 ${isDark
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

                            {/* Date */}
                            <div
                                className={`flex items-center gap-3 rounded-xl border p-4 ${cardClass}`}
                            >
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                                    <CalendarDays size={21} />
                                </div>

                                <div>
                                    <p className={`text-xs ${mutedText}`}>
                                        Received On
                                    </p>
                                    <p className="mt-1 text-sm font-semibold">
                                        {formatDate(selectedNotification.createdAt)}
                                    </p>
                                </div>
                            </div>

                            {/* Related Complaint */}
                            {complaint && (
                                <div>
                                    <div className="mb-4 flex items-center gap-2">
                                        <FileText size={20} className="text-indigo-500" />
                                        <h2 className="text-lg font-bold">
                                            Related Complaint
                                        </h2>
                                    </div>

                                    <div
                                        className={`rounded-xl border p-5 ${cardClass}`}
                                    >
                                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                                            <div>
                                                <p className={`text-xs ${mutedText}`}>
                                                    Category
                                                </p>
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
                                                <p className={`text-xs ${mutedText}`}>
                                                    Block
                                                </p>
                                                <p className="mt-1 font-semibold">
                                                    {complaint.block || "Not available"}
                                                </p>
                                            </div>

                                            <div>
                                                <p className={`text-xs ${mutedText}`}>
                                                    Floor
                                                </p>
                                                <p className="mt-1 font-semibold">
                                                    {complaint.floor || "Not available"}
                                                </p>
                                            </div>

                                            <div>
                                                <p className={`text-xs ${mutedText}`}>
                                                    Room
                                                </p>
                                                <p className="mt-1 font-semibold">
                                                    {complaint.room || "Not available"}
                                                </p>
                                            </div>

                                            <div>
                                                <p className={`text-xs ${mutedText}`}>
                                                    Priority
                                                </p>
                                                <p className="mt-1 font-semibold">
                                                    {complaint.priority || "Not available"}
                                                </p>
                                            </div>
                                        </div>

                                        {complaintId && (
                                            <button
                                                onClick={handleOpenComplaint}
                                                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 sm:w-auto"
                                            >
                                                <ExternalLink size={18} />
                                                View Related Complaint
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* No Complaint */}
                            {!complaint && (
                                <div
                                    className={`rounded-xl border border-dashed p-5 ${cardClass}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <ShieldCheck
                                            size={22}
                                            className="text-indigo-500"
                                        />
                                        <div>
                                            <p className="font-semibold">
                                                General Notification
                                            </p>
                                            <p className={`mt-1 text-sm ${mutedText}`}>
                                                No related complaint information is available.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Notification list page
    return (
        <div className={`min-h-screen p-4 sm:p-6 lg:p-8 ${containerClass}`}>
            <div className="mx-auto max-w-6xl">

                {/* Page Heading */}
                <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-indigo-500">
                            <Bell size={21} />
                            <span className="text-sm font-semibold">
                                Student Portal
                            </span>
                        </div>

                        <h1 className="text-2xl font-bold sm:text-3xl">
                            Notifications
                        </h1>

                        <p className={`mt-2 text-sm ${mutedText}`}>
                            Stay updated with your complaint activity and campus updates.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={fetchNotifications}
                            disabled={loading}
                            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${isDark
                                    ? "border-slate-700 bg-slate-900 hover:bg-slate-800"
                                    : "border-slate-200 bg-white hover:bg-slate-100"
                                }`}
                        >
                            <RefreshCw
                                size={16}
                                className={loading ? "animate-spin" : ""}
                            />
                            Refresh
                        </button>

                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                disabled={markingAll}
                                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                            >
                                <CheckCheck size={17} />
                                {markingAll ? "Please wait..." : "Mark All Read"}
                            </button>
                        )}
                    </div>
                </div>

                {/* Statistics */}
                <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">

                    <div className={`rounded-2xl border p-5 ${cardClass}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm ${mutedText}`}>
                                    Total Notifications
                                </p>
                                <h2 className="mt-2 text-3xl font-bold">
                                    {notifications.length}
                                </h2>
                            </div>

                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                                <Bell size={23} />
                            </div>
                        </div>
                    </div>

                    <div className={`rounded-2xl border p-5 ${cardClass}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm ${mutedText}`}>
                                    Unread Notifications
                                </p>
                                <h2 className="mt-2 text-3xl font-bold text-blue-500">
                                    {unreadCount}
                                </h2>
                            </div>

                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                                <Clock size={23} />
                            </div>
                        </div>
                    </div>

                    <div className={`rounded-2xl border p-5 ${cardClass}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm ${mutedText}`}>
                                    Read Notifications
                                </p>
                                <h2 className="mt-2 text-3xl font-bold text-emerald-500">
                                    {readCount}
                                </h2>
                            </div>

                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                <CheckCheck size={23} />
                            </div>
                        </div>
                    </div>

                </div>

                {/* Filters */}
                <div
                    className={`mb-5 flex flex-wrap items-center gap-2 rounded-2xl border p-3 ${cardClass}`}
                >
                    {[
                        { value: "all", label: "All Notifications" },
                        { value: "unread", label: "Unread" },
                        { value: "read", label: "Read" },
                    ].map((item) => (
                        <button
                            key={item.value}
                            onClick={() => setFilter(item.value)}
                            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${filter === item.value
                                    ? "bg-indigo-600 text-white"
                                    : isDark
                                        ? "text-slate-300 hover:bg-slate-800"
                                        : "text-slate-600 hover:bg-slate-100"
                                }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
                                {/* Notification Selection Toolbar */}
                <div
                    className={`mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 ${cardClass}`}
                >
                    <button
                        onClick={handleSelectAll}
                        disabled={filteredNotifications.length === 0}
                        className={`flex items-center gap-2 text-sm font-semibold ${
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
                            onClick={handleDeleteSelected}
                            disabled={selectedIds.length === 0 || deleting}
                            className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <Trash2 size={16} />
                            {deleting ? "Deleting..." : "Delete Selected"}
                        </button>
                    </div>
                </div>

                {/* Notification List */}
                <div className={`overflow-hidden rounded-2xl border ${cardClass}`}>
                    <div
                        className={`flex items-center justify-between border-b p-5 ${
                            isDark ? "border-slate-800" : "border-slate-200"
                        }`}
                    >
                        <div>
                            <h2 className="font-bold">Recent Notifications</h2>
                            <p className={`mt-1 text-xs ${mutedText}`}>
                                Select a notification to view its complete details.
                            </p>
                        </div>

                        <span className={`text-xs font-medium ${mutedText}`}>
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
                                No Notifications Found
                            </h3>

                            <p className={`mt-2 max-w-sm text-sm ${mutedText}`}>
                                {filter === "unread"
                                    ? "You are all caught up. There are no unread notifications."
                                    : filter === "read"
                                    ? "You have no read notifications yet."
                                    : "You don't have any notifications right now."}
                            </p>
                        </div>
                    ) : (
                        <div>
                            {filteredNotifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    className={`flex items-center gap-3 border-b p-4 sm:p-5 last:border-b-0 ${
                                        isDark
                                            ? "border-slate-800 hover:bg-slate-800/70"
                                            : "border-slate-100 hover:bg-slate-50"
                                    } ${
                                        !notification.isRead
                                            ? isDark
                                                ? "bg-indigo-950/20"
                                                : "bg-indigo-50/50"
                                            : ""
                                    }`}
                                >
                                    {/* Individual Select */}
                                    <button
                                        onClick={() =>
                                            toggleSelect(notification._id)
                                        }
                                        className="shrink-0"
                                        title="Select notification"
                                    >
                                        {selectedIds.includes(notification._id) ? (
                                            <CheckSquare
                                                size={21}
                                                className="text-indigo-500"
                                            />
                                        ) : (
                                            <Square
                                                size={21}
                                                className={mutedText}
                                            />
                                        )}
                                    </button>

                                    {/* Notification Icon */}
                                    <div
                                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                                            notification.isRead
                                                ? isDark
                                                    ? "bg-slate-800 text-slate-400"
                                                    : "bg-slate-100 text-slate-500"
                                                : "bg-indigo-100 text-indigo-700"
                                        }`}
                                    >
                                        <Bell size={20} />
                                    </div>

                                    {/* Notification Content */}
                                    <button
                                        onClick={() =>
                                            setSelectedNotification(notification)
                                        }
                                        className="min-w-0 flex-1 text-left"
                                    >
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="font-semibold">
                                                {notification.message ||
                                                    "New Notification"}
                                            </h3>

                                            {!notification.isRead && (
                                                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                                                    NEW
                                                </span>
                                            )}
                                        </div>

                                        <div
                                            className={`mt-2 flex flex-wrap items-center gap-3 text-xs ${mutedText}`}
                                        >
                                            <span className="flex items-center gap-1">
                                                <CalendarDays size={13} />
                                                {formatDate(notification.createdAt)}
                                            </span>

                                            {notification.complaint?.category && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin size={13} />
                                                    {notification.complaint.category}
                                                </span>
                                            )}
                                        </div>

                                        <p className="mt-3 text-xs font-semibold text-indigo-500">
                                            View Details →
                                        </p>
                                    </button>

                                    {/* Read / Unread Status */}
                                    <div className="hidden shrink-0 sm:block">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                notification.isRead
                                                    ? isDark
                                                        ? "bg-slate-800 text-slate-400"
                                                        : "bg-slate-100 text-slate-500"
                                                    : "bg-blue-100 text-blue-700"
                                            }`}
                                        >
                                            {notification.isRead
                                                ? "Read"
                                                : "Unread"}
                                        </span>
                                    </div>

                                    {/* Single Delete */}
                                    <button
                                        onClick={() =>
                                            handleDelete(notification._id)
                                        }
                                        className="shrink-0 rounded-xl p-2.5 text-red-500 transition hover:bg-red-100 hover:text-red-700"
                                        title="Delete notification"
                                    >
                                        <Trash2 size={19} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default StudentNotifications;
