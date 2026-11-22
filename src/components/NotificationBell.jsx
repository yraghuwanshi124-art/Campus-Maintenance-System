"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bell,
  CheckCheck,
  Clock,
  Inbox,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";

function NotificationBell({ role = "student" }) {
  const navigate = useNavigate();
  const { darkMode } = useTheme();

  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);

      const response = await api.get("/notifications");

      setNotifications(
        response.data?.notifications || []
      );
    } catch (error) {
      console.error("Notification fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  // Mark notification as read
  const handleNotificationClick = async (notification) => {
  try {
    if (!notification.isRead) {
      await api.patch(`/notifications/${notification._id}/read`);

      setNotifications((prev) =>
        prev.map((item) =>
          item._id === notification._id
            ? { ...item, isRead: true }
            : item
        )
      );
    }

    setOpen(false);

    navigate(`/${role}/notifications`, {
      state: { notificationId: notification._id },
    });
  } catch (error) {
    console.error("Notification error:", error);
  }
};

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");

      setNotifications((previous) =>
        previous.map((item) => ({
          ...item,
          isRead: true,
        }))
      );
    } catch (error) {
      console.error("Mark all read error:", error);
    }
  };

  // View all notifications
  const handleViewAll = () => {
    setOpen(false);
    navigate(`/${role}/notifications`);
  };

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className={`relative flex h-11 w-11 items-center justify-center rounded-xl border transition ${
          darkMode
            ? "border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
        }`}
        aria-label="Notifications"
      >
        <Bell size={21} />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className={`absolute right-0 z-50 mt-3 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border shadow-2xl ${
            darkMode
              ? "border-slate-700 bg-slate-900 text-white"
              : "border-slate-200 bg-white text-slate-900"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200/20 px-4 py-4">
            <div>
              <h3 className="font-bold">Notifications</h3>
              <p className="mt-1 text-xs text-slate-500">
                {unreadCount} unread notifications
              </p>
            </div>

            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
              className="flex items-center gap-1 text-xs font-semibold text-indigo-500 disabled:opacity-40"
            >
              <CheckCheck size={15} />
              Mark all read
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-[350px] overflow-y-auto">
            {loading ? (
              <div className="p-7 text-center text-sm text-slate-500">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Inbox
                  size={30}
                  className="mx-auto mb-3 text-slate-400"
                />

                <p className="font-semibold">
                  You're all caught up!
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  No notifications available.
                </p>
              </div>
            ) : (
              notifications.slice(0, 5).map((notification) => (
                <button
                  key={notification._id}
                  type="button"
                  onClick={() =>
                    handleNotificationClick(notification)
                  }
                  className={`flex w-full gap-3 border-b border-slate-200/10 px-4 py-4 text-left transition ${
                    darkMode
                      ? "hover:bg-slate-800"
                      : "hover:bg-slate-50"
                  } ${
                    !notification.isRead
                      ? darkMode
                        ? "bg-indigo-500/10"
                        : "bg-indigo-50"
                      : ""
                  }`}
                >
                  <span
                    className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                      notification.isRead
                        ? "bg-slate-300"
                        : "bg-indigo-500"
                    }`}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold">
                      {notification.message || "New notification"}
                    </p>

                    <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                      <Clock size={12} />
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>

                  <ExternalLink
                    size={15}
                    className="mt-1 shrink-0 text-slate-400"
                  />
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <button
            type="button"
            onClick={handleViewAll}
            className="w-full px-4 py-3 text-center text-sm font-bold text-indigo-500 transition hover:bg-indigo-500/10"
          >
            View All Notifications
          </button>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;

