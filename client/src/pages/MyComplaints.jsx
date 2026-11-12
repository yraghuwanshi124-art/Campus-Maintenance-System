import { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

function MyComplaints({ darkMode: darkModeProp }) {
  const navigate = useNavigate();
  const { darkMode: contextDark } = useTheme();
  const isDark = typeof darkModeProp === "boolean" ? darkModeProp : contextDark;

  const [complaints, setComplaints] = useState([]);
  const [expandedComplaints, setExpandedComplaints] = useState({});
  const [feedbackRating, setFeedbackRating] = useState({});
  const [feedbackComment, setFeedbackComment] = useState({});
  const [feedbackLoading, setFeedbackLoading] = useState({});

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.get("/complaints/my", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setComplaints(response.data.complaints || []);
    } catch (error) {
      console.log("MY COMPLAINTS ERROR:", error.response?.data || error);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const toggleComplaint = (complaintId) => {
    setExpandedComplaints((prev) => ({
      ...prev,
      [complaintId]: !prev[complaintId],
    }));
  };

  const handleSubmitFeedback = async (complaintId) => {
    const rating = feedbackRating[complaintId];
    const comment = feedbackComment[complaintId] || "";

    if (!rating) {
      alert("Please select a rating.");
      return;
    }

    try {
      setFeedbackLoading((prev) => ({
        ...prev,
        [complaintId]: true,
      }));

      const token = localStorage.getItem("token");

      await api.post(
        `/complaints/${complaintId}/feedback`,
        {
          rating,
          comment,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Feedback submitted successfully! ⭐");

      setComplaints((prev) =>
        prev.map((complaint) =>
          complaint._id === complaintId
            ? {
                ...complaint,
                feedbackRating: Number(rating),
                feedbackComment: comment,
              }
            : complaint
        )
      );
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Failed to submit feedback."
      );
    } finally {
      setFeedbackLoading((prev) => ({
        ...prev,
        [complaintId]: false,
      }));
    }
  };

  // Delete complaint
  const deleteComplaint = async (complaintId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this complaint?"
    );

    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");

      const response = await api.delete(`/complaints/${complaintId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert(response.data.message);

      setComplaints((prevComplaints) =>
        prevComplaints.filter(
          (complaint) => complaint._id !== complaintId
        )
      );

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

  const getStatusStyle = (status) => {
    if (status === "Resolved") {
      return isDark
        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
        : "bg-emerald-100 text-emerald-700 border-emerald-200";
    }

    if (status === "In Progress") {
      return isDark
        ? "bg-purple-500/15 text-purple-300 border-purple-500/30"
        : "bg-purple-100 text-purple-700 border-purple-200";
    }

    if (status === "Assigned") {
      return isDark
        ? "bg-orange-500/15 text-orange-300 border-orange-500/30"
        : "bg-orange-100 text-orange-700 border-orange-200";
    }

    return isDark
      ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
      : "bg-blue-100 text-blue-700 border-blue-200";
  };

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

  const getPriorityStyle = (priority) => {
    if (priority === "High") {
      return isDark
        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
        : "bg-red-50 text-red-600";
    }

    if (priority === "Medium") {
      return isDark
        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
        : "bg-orange-50 text-orange-600";
    }

    return isDark
      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
      : "bg-emerald-50 text-emerald-600";
  };

  const resolvedCount = complaints.filter(
    (complaint) => complaint.status === "Resolved"
  ).length;

  const activeCount = complaints.filter(
    (complaint) => complaint.status !== "Resolved"
  ).length;

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"
      }`}
    >
      {/* ================= NAVBAR (when accessed standalone or directly) ================= */}
      <nav
        className={`border-b shadow-sm ${
          isDark
            ? "border-slate-800 bg-slate-900/90"
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

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/student")}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition ${
                isDark
                  ? "border border-slate-700 bg-slate-800 text-indigo-400 hover:bg-slate-700"
                  : "bg-white text-indigo-600 hover:bg-indigo-100"
              }`}
            >
              ← Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* ================= MAIN ================= */}
      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* ================= HEADER ================= */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div
              className={`mb-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                isDark
                  ? "border border-indigo-500/30 bg-indigo-500/15 text-indigo-300"
                  : "bg-indigo-100 text-indigo-700"
              }`}
            >
              📋 Student Portal
            </div>

            <h1
              className={`text-3xl font-extrabold tracking-tight sm:text-4xl ${
                isDark ? "text-white" : "text-slate-800"
              }`}
            >
              My Complaints
            </h1>

            <p
              className={`mt-2 max-w-2xl ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Track the maintenance requests you have submitted and monitor
              their progress.
            </p>
          </div>

          <button
            onClick={() => navigate("/student/report")}
            className="w-fit rounded-xl bg-gradient-to-r from-indigo-600 to-purple-700 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:from-indigo-700 hover:to-purple-800 hover:shadow-lg"
          >
            + New Complaint
          </button>
        </div>

        {/* ================= STATS ================= */}
        <div className="mb-10 grid gap-5 sm:grid-cols-3">
          {/* Total */}
          <div
            className={`rounded-2xl border p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${
              isDark
                ? "border-slate-800 bg-slate-900"
                : "border-indigo-100 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm font-semibold ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Total Complaints
                </p>

                <p
                  className={`mt-2 text-3xl font-extrabold ${
                    isDark ? "text-indigo-400" : "text-indigo-600"
                  }`}
                >
                  {complaints.length}
                </p>
              </div>

              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${
                  isDark ? "bg-indigo-950/60 text-indigo-300" : "bg-indigo-100"
                }`}
              >
                📋
              </div>
            </div>
          </div>

          {/* Active */}
          <div
            className={`rounded-2xl border p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${
              isDark
                ? "border-slate-800 bg-slate-900"
                : "border-orange-100 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm font-semibold ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Active
                </p>

                <p className="mt-2 text-3xl font-extrabold text-orange-500">
                  {activeCount}
                </p>
              </div>

              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${
                  isDark ? "bg-orange-950/60 text-orange-300" : "bg-orange-100"
                }`}
              >
                🔧
              </div>
            </div>
          </div>

          {/* Resolved */}
          <div
            className={`rounded-2xl border p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${
              isDark
                ? "border-slate-800 bg-slate-900"
                : "border-emerald-100 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm font-semibold ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Resolved
                </p>

                <p className="mt-2 text-3xl font-extrabold text-emerald-500">
                  {resolvedCount}
                </p>
              </div>

              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${
                  isDark
                    ? "bg-emerald-950/60 text-emerald-300"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                ✓
              </div>
            </div>
          </div>
        </div>

        {/* ================= COMPLAINTS ================= */}
        {complaints.length === 0 ? (
          <div
            className={`rounded-3xl border border-dashed p-14 text-center shadow-sm ${
              isDark
                ? "border-slate-800 bg-slate-900"
                : "border-indigo-200 bg-white"
            }`}
          >
            <div
              className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-4xl ${
                isDark ? "bg-slate-800" : "bg-indigo-50"
              }`}
            >
              📋
            </div>

            <h3
              className={`mt-6 text-xl font-bold ${
                isDark ? "text-white" : "text-slate-800"
              }`}
            >
              No complaints yet
            </h3>

            <p
              className={`mx-auto mt-2 max-w-md text-sm leading-6 ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              You haven't submitted any maintenance complaints. If you find an
              issue on campus, report it here.
            </p>

            <button
              onClick={() => navigate("/student/report")}
              className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
            >
              🛠️ Report a Problem
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {complaints.map((complaint, index) => {
              const isExpanded = expandedComplaints[complaint._id];

              return (
                <div
                  key={complaint._id}
                  className={`group overflow-hidden rounded-3xl border shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
                    isDark
                      ? "border-slate-800 bg-slate-900 hover:border-slate-700"
                      : "border-slate-200 bg-white hover:border-indigo-200"
                  }`}
                >
                  {/* ================= CARD HEADER ================= */}
                  <div
                    className={`p-5 sm:p-6 bg-gradient-to-r ${
                      isDark
                        ? "from-indigo-950/60 via-slate-900 to-purple-950/40"
                        : "from-indigo-50 via-white to-purple-50"
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-2xl text-white shadow-md">
                          🛠️
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-indigo-500">
                            Complaint #{index + 1}
                          </p>

                          <h3
                            className={`mt-1 text-xl font-extrabold ${
                              isDark ? "text-white" : "text-slate-800"
                            }`}
                          >
                            {complaint.category}
                          </h3>
                        </div>
                      </div>

                      <span
                        className={`w-fit rounded-full border px-4 py-2 text-xs font-extrabold ${getStatusStyle(
                          complaint.status
                        )}`}
                      >
                        {complaint.status === "Resolved" && "✓ "}
                        {complaint.status}
                      </span>
                    </div>
                  </div>

                  {/* ================= COMPACT BASIC DETAILS ================= */}
                  <div className="grid gap-4 p-5 sm:p-6 md:grid-cols-3">
                    {/* Location */}
                    <div
                      className={`rounded-2xl p-5 ${
                        isDark ? "bg-slate-800/60" : "bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📍</span>

                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Location
                        </p>
                      </div>

                      <p
                        className={`mt-3 font-bold ${
                          isDark ? "text-slate-200" : "text-slate-700"
                        }`}
                      >
                        {complaint.block}
                      </p>

                      <p
                        className={`mt-1 text-sm ${
                          isDark ? "text-slate-400" : "text-slate-600"
                        }`}
                      >
                        Room No: {complaint.room}
                      </p>
                    </div>

                    {/* Priority */}
                    <div
                      className={`rounded-2xl p-5 ${
                        isDark ? "bg-slate-800/60" : "bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">⚡</span>

                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Priority
                        </p>
                      </div>

                      <p
                        className={`mt-3 w-fit rounded-lg px-3 py-1.5 text-sm font-extrabold ${getPriorityStyle(
                          complaint.priority
                        )}`}
                      >
                        {complaint.priority}
                      </p>
                    </div>

                    {/* Current Status */}
                    <div
                      className={`rounded-2xl p-5 ${
                        isDark ? "bg-slate-800/60" : "bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📊</span>

                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Current Status
                        </p>
                      </div>

                      <p
                        className={`mt-3 font-bold ${
                          isDark ? "text-slate-200" : "text-slate-700"
                        }`}
                      >
                        {complaint.status}
                      </p>
                    </div>
                  </div>

                  {/* ================= READ MORE BUTTON ================= */}
                  <div
                    className={`border-t px-5 py-4 sm:px-6 ${
                      isDark
                        ? "border-slate-800 bg-slate-900/60"
                        : "border-slate-100 bg-slate-50/70"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleComplaint(complaint._id)}
                      className={`flex w-full items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold shadow-sm transition ${
                        isDark
                          ? "border-slate-700 bg-slate-800 text-indigo-400 hover:bg-slate-700 hover:shadow-md"
                          : "border-indigo-200 bg-white text-indigo-600 hover:bg-indigo-50 hover:shadow-md"
                      }`}
                    >
                      {isExpanded ? (
                        <>
                          Show Less
                          <span className="text-base">↑</span>
                        </>
                      ) : (
                        <>
                          Read More
                          <span className="text-base">↓</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* ================= EXPANDED DETAILS ================= */}
                  {isExpanded && (
                    <div
                      className={`border-t ${
                        isDark
                          ? "border-slate-800 bg-slate-900"
                          : "border-indigo-100 bg-white"
                      }`}
                    >
                      {/* ================= STUDENT INFORMATION ================= */}
                      <div
                        className={`mx-5 mt-5 rounded-2xl border p-5 sm:mx-6 ${
                          isDark
                            ? "border-slate-800 bg-slate-950/60"
                            : "border-indigo-100 bg-indigo-50/60"
                        }`}
                      >
                        <div className="mb-4 flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${
                              isDark ? "bg-slate-800" : "bg-indigo-100"
                            }`}
                          >
                            👨‍🎓
                          </div>

                          <div>
                            <p
                              className={`font-bold ${
                                isDark ? "text-white" : "text-slate-800"
                              }`}
                            >
                              Student Information
                            </p>

                            <p
                              className={`text-xs ${
                                isDark ? "text-slate-400" : "text-slate-500"
                              }`}
                            >
                              Complaint submitted by your account
                            </p>
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                          {/* Name */}
                          <div
                            className={`rounded-xl border p-4 ${
                              isDark
                                ? "border-slate-800 bg-slate-900"
                                : "border-slate-200 bg-white"
                            }`}
                          >
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                              Name
                            </p>

                            <p
                              className={`mt-2 truncate text-lg font-bold ${
                                isDark ? "text-slate-200" : "text-slate-700"
                              }`}
                            >
                              {complaint.user?.name || "Unknown"}
                            </p>
                          </div>

                          {/* Email */}
                          <div
                            className={`rounded-xl border p-4 ${
                              isDark
                                ? "border-slate-800 bg-slate-900"
                                : "border-slate-200 bg-white"
                            }`}
                          >
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                              Email
                            </p>

                            <p
                              className={`mt-2 truncate font-semibold ${
                                isDark ? "text-slate-300" : "text-slate-600"
                              }`}
                            >
                              {complaint.user?.email || "No email"}
                            </p>
                          </div>

                          {/* Class */}
                          <div
                            className={`rounded-xl border p-4 ${
                              isDark
                                ? "border-slate-800 bg-slate-900"
                                : "border-slate-200 bg-white"
                            }`}
                          >
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                              Class / Section
                            </p>

                            <p
                              className={`mt-2 font-bold ${
                                isDark ? "text-indigo-400" : "text-indigo-600"
                              }`}
                            >
                              🎓 {complaint.user?.classSection || "No class"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* ================= DESCRIPTION ================= */}
                      <div
                        className={`mx-5 mt-5 rounded-2xl border p-5 sm:mx-6 ${
                          isDark
                            ? "border-slate-800 bg-slate-800/40"
                            : "border-slate-100 bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>📝</span>

                          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Problem Description
                          </p>
                        </div>

                        <p
                          className={`mt-3 text-base leading-7 ${
                            isDark ? "text-slate-200" : "text-slate-700"
                          }`}
                        >
                          {complaint.description}
                        </p>
                      </div>

                      {/* ================= TIMELINE ================= */}
                      <div
                        className={`mx-5 mt-5 rounded-2xl border p-4 sm:mx-6 ${
                          isDark
                            ? "border-slate-800 bg-slate-950/60"
                            : "border-indigo-100 bg-indigo-50/40"
                        }`}
                      >
                        <div className="mb-4 flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-xl text-base ${
                              isDark ? "bg-slate-800" : "bg-indigo-100"
                            }`}
                          >
                            🕒
                          </div>

                          <div>
                            <p
                              className={`font-bold ${
                                isDark ? "text-white" : "text-slate-800"
                              }`}
                            >
                              Complaint Timeline
                            </p>

                            <p
                              className={`text-xs ${
                                isDark ? "text-slate-400" : "text-slate-500"
                              }`}
                            >
                              Track your complaint progress
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          {/* Complaint Raised */}
                          <div
                            className={`rounded-xl p-3 shadow-sm ${
                              isDark
                                ? "border border-slate-800 bg-slate-900"
                                : "bg-white"
                            }`}
                          >
                            <div className="mb-2 flex items-center gap-2">
                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${
                                  isDark
                                    ? "bg-blue-500/20 text-blue-400"
                                    : "bg-blue-100 text-blue-600"
                                }`}
                              >
                                ✓
                              </div>

                              <p
                                className={`text-sm font-bold ${
                                  isDark ? "text-white" : "text-slate-800"
                                }`}
                              >
                                Complaint Raised
                              </p>
                            </div>

                            <p
                              className={`text-xs ${
                                isDark ? "text-slate-400" : "text-slate-500"
                              }`}
                            >
                              Complaint submitted successfully.
                            </p>

                            <p
                              className={`mt-2 text-xs font-semibold ${
                                isDark ? "text-blue-400" : "text-blue-600"
                              }`}
                            >
                              🕒 {formatDateTime(complaint.createdAt)}
                            </p>
                          </div>

                          {/* Technician Assignment */}
                          <div
                            className={`rounded-xl p-3 shadow-sm ${
                              isDark
                                ? "border border-slate-800 bg-slate-900"
                                : "bg-white"
                            }`}
                          >
                            <div className="mb-2 flex items-center gap-2">
                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${
                                  complaint.assignedAt
                                    ? isDark
                                      ? "bg-orange-500/20 text-orange-400"
                                      : "bg-orange-100 text-orange-600"
                                    : isDark
                                      ? "bg-slate-800 text-slate-500"
                                      : "bg-slate-100 text-slate-400"
                                }`}
                              >
                                {complaint.assignedAt ? "✓" : "2"}
                              </div>

                              <p
                                className={`text-sm font-bold ${
                                  complaint.assignedAt
                                    ? isDark
                                      ? "text-white"
                                      : "text-slate-800"
                                    : "text-slate-400"
                                }`}
                              >
                                Technician Assigned
                              </p>
                            </div>

                            {complaint.assignedAt ? (
                              <>
                                <p
                                  className={`text-xs ${
                                    isDark ? "text-slate-400" : "text-slate-500"
                                  }`}
                                >
                                  Assigned to{" "}
                                  <span className="font-bold text-orange-500">
                                    {complaint.technician?.name || "Technician"}
                                  </span>
                                </p>

                                <p className="mt-2 text-xs font-semibold text-orange-500">
                                  🕒 {formatDateTime(complaint.assignedAt)}
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="text-xs text-slate-400">
                                  Waiting for technician assignment.
                                </p>

                                <p className="mt-2 text-xs font-semibold text-slate-400">
                                  Pending
                                </p>
                              </>
                            )}
                          </div>

                          {/* Resolution */}
                          <div
                            className={`rounded-xl p-3 shadow-sm ${
                              isDark
                                ? "border border-slate-800 bg-slate-900"
                                : "bg-white"
                            }`}
                          >
                            <div className="mb-2 flex items-center gap-2">
                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${
                                  complaint.resolvedAt
                                    ? isDark
                                      ? "bg-emerald-500/20 text-emerald-400"
                                      : "bg-emerald-100 text-emerald-600"
                                    : isDark
                                      ? "bg-slate-800 text-slate-500"
                                      : "bg-slate-100 text-slate-400"
                                }`}
                              >
                                {complaint.resolvedAt ? "✓" : "3"}
                              </div>

                              <p
                                className={`text-sm font-bold ${
                                  complaint.resolvedAt
                                    ? isDark
                                      ? "text-white"
                                      : "text-slate-800"
                                    : "text-slate-400"
                                }`}
                              >
                                Resolution
                              </p>
                            </div>

                            {complaint.resolvedAt ? (
                              <>
                                <p
                                  className={`text-xs ${
                                    isDark ? "text-slate-400" : "text-slate-500"
                                  }`}
                                >
                                  Maintenance issue successfully resolved.
                                </p>

                                <p className="mt-2 text-xs font-semibold text-emerald-500">
                                  🕒 {formatDateTime(complaint.resolvedAt)}
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="text-xs text-slate-400">
                                  Waiting for the issue to be resolved.
                                </p>

                                <p className="mt-2 text-xs font-semibold text-slate-400">
                                  Pending
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* ================= PROBLEM IMAGE ================= */}
                      {complaint.image && (
                        <div
                          className={`mx-5 mt-5 rounded-2xl border p-5 sm:mx-6 ${
                            isDark
                              ? "border-slate-800 bg-slate-800/40"
                              : "border-slate-100 bg-slate-50"
                          }`}
                        >
                          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                            📷 Problem Photo
                          </p>

                          <img
                            src={complaint.image}
                            alt="Reported problem"
                            className="h-64 w-full rounded-xl object-cover shadow-sm sm:w-96"
                          />
                        </div>
                      )}

                      {/* ================= FEEDBACK ================= */}
                      {complaint.status === "Resolved" && (
                        <div
                          className={`mx-5 mt-5 rounded-2xl border p-5 sm:mx-6 ${
                            isDark
                              ? "border-amber-900/40 bg-amber-950/20"
                              : "border-amber-200 bg-amber-50/50"
                          }`}
                        >
                          <h3
                            className={`text-lg font-black ${
                              isDark ? "text-amber-200" : "text-slate-800"
                            }`}
                          >
                            ⭐ Complaint Feedback
                          </h3>

                          {complaint.feedbackRating ? (
                            <div className="mt-4">
                              <p
                                className={`text-sm font-semibold ${
                                  isDark ? "text-slate-300" : "text-slate-600"
                                }`}
                              >
                                Your Rating
                              </p>

                              <div className="mt-2 text-2xl text-amber-400">
                                {"★".repeat(complaint.feedbackRating)}
                                {"☆".repeat(5 - complaint.feedbackRating)}
                              </div>

                              {complaint.feedbackComment && (
                                <p
                                  className={`mt-3 rounded-xl p-3 text-sm ${
                                    isDark
                                      ? "border border-slate-800 bg-slate-900 text-slate-200"
                                      : "bg-white text-slate-600"
                                  }`}
                                >
                                  {complaint.feedbackComment}
                                </p>
                              )}
                            </div>
                          ) : (
                            <>
                              <p
                                className={`mt-1 text-sm ${
                                  isDark ? "text-slate-400" : "text-slate-500"
                                }`}
                              >
                                How was your complaint resolution?
                              </p>

                              <div className="mt-4 flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() =>
                                      setFeedbackRating((prev) => ({
                                        ...prev,
                                        [complaint._id]: star,
                                      }))
                                    }
                                    className={`text-3xl transition hover:scale-110 ${
                                      (feedbackRating[complaint._id] || 0) >= star
                                        ? "text-amber-400"
                                        : isDark
                                          ? "text-slate-700"
                                          : "text-slate-300"
                                    }`}
                                  >
                                    ★
                                  </button>
                                ))}
                              </div>

                              <textarea
                                value={feedbackComment[complaint._id] || ""}
                                onChange={(e) =>
                                  setFeedbackComment((prev) => ({
                                    ...prev,
                                    [complaint._id]: e.target.value,
                                  }))
                                }
                                placeholder="Write your feedback..."
                                rows={3}
                                className={`mt-4 w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
                                  isDark
                                    ? "border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-900"
                                    : "border-slate-200 bg-white text-slate-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                                }`}
                              />

                              <button
                                type="button"
                                onClick={() =>
                                  handleSubmitFeedback(complaint._id)
                                }
                                disabled={feedbackLoading[complaint._id]}
                                className="mt-3 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                              >
                                {feedbackLoading[complaint._id]
                                  ? "Submitting..."
                                  : "Submit Feedback"}
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      {/* ================= ACTION ================= */}
                      <div
                        className={`mt-5 border-t p-5 sm:p-6 ${
                          isDark
                            ? "border-slate-800 bg-slate-950/50"
                            : "border-slate-100 bg-slate-50/70"
                        }`}
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p
                              className={`text-lg font-bold ${
                                isDark ? "text-slate-200" : "text-slate-700"
                              }`}
                            >
                              Complaint Management
                            </p>

                            <p className="mt-1 text-sm text-slate-400">
                              Keep track of your maintenance request.
                            </p>
                          </div>

                          <button
                            onClick={() => deleteComplaint(complaint._id)}
                            className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 hover:shadow-md"
                          >
                            🗑️ Delete Complaint
                          </button>
                        </div>
                      </div>

                      {/* ================= SHOW LESS ================= */}
                      <div className="px-5 py-4 sm:px-6">
                        <button
                          type="button"
                          onClick={() => toggleComplaint(complaint._id)}
                          className="w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 hover:shadow-md"
                        >
                          Show Less ↑
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

      {/* ================= FOOTER ================= */}
      <footer
        className={`mt-12 border-t ${
          isDark
            ? "border-slate-800 bg-slate-950 text-slate-400"
            : "border-slate-200 bg-white text-slate-500"
        }`}
      >
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
            <div>
              <p
                className={`text-lg font-extrabold ${
                  isDark ? "text-indigo-400" : "text-indigo-700"
                }`}
              >
                CampusFix
              </p>

              <p className="mt-1 text-xs font-medium text-slate-400">
                Medi-Caps University
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">
                Smart Campus • Faster Resolution • Better Management
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Campus Maintenance Management System
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default MyComplaints;
