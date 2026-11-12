
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import LogoutModal from "../components/LogoutModal";
import ComplaintForm from "./ComplaintForm";
import MyComplaints from "./MyComplaints";
import CampusFixChatbot from "../components/CampusFixChatbot";
import { useTheme } from "../context/ThemeContext";


function StudentDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogout, setShowLogout] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { darkMode, toggleTheme } = useTheme();

  const [profileImage, setProfileImage] = useState(
    localStorage.getItem("campusfix_student_profile_image") || ""
  );

  const currentSection =
    location.pathname === "/student/report"
      ? "report"
      : location.pathname === "/student/complaints"
        ? "complaints"
        : new URLSearchParams(location.search).get("section") ||
        "dashboard";

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);

      const response = await api.get("/complaints/my", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const responseData = response.data;

      let complaintsData = [];

      if (Array.isArray(responseData)) {
        complaintsData = responseData;
      } else if (Array.isArray(responseData?.complaints)) {
        complaintsData = responseData.complaints;
      } else if (Array.isArray(responseData?.data)) {
        complaintsData = responseData.data;
      } else if (Array.isArray(responseData?.result)) {
        complaintsData = responseData.result;
      }

      setComplaints(complaintsData);
    } catch (error) {
      console.error("Failed to fetch complaints:", error);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  const total = complaints.length;

  const pending = complaints.filter(
    (item) => item.status === "Pending"
  ).length;

  const assigned = complaints.filter(
    (item) => item.status === "Assigned"
  ).length;

  const inProgress = complaints.filter(
    (item) => item.status === "In Progress"
  ).length;

  const resolved = complaints.filter(
    (item) => item.status === "Resolved"
  ).length;

  const recentComplaints = complaints.slice(0, 3);

  const getStatusStyle = (status) => {
    switch (status) {
      case "Resolved":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";

      case "In Progress":
        return "bg-blue-50 text-blue-700 border-blue-100";

      case "Assigned":
        return "bg-violet-50 text-violet-700 border-violet-100";

      default:
        return "bg-amber-50 text-amber-700 border-amber-100";
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-50 text-red-600 border-red-100";

      case "Medium":
        return "bg-orange-50 text-orange-600 border-orange-100";

      default:
        return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  /*
   * CENTRAL NAVIGATION FUNCTION
   *
   * Every sidebar option uses this function.
   * No activeSection state is used anymore.
   */
  const handleMenuClick = (item) => {
    switch (item.id) {
      case "dashboard":
        navigate("/student");
        break;

      case "profile":
        navigate("/student?section=profile");
        break;

      case "report":
        navigate("/student/report");
        break;

      case "complaints":
        navigate("/student/complaints");
        break;

      case "chatbot":
        navigate("/student?section=chatbot");
        break;

      case "activity":
        navigate("/student?section=activity");
        break;

      default:
        navigate("/student");
    }
  };

  const goToProfile = () => {
    navigate("/student?section=profile");
  };

  const goToActivity = () => {
    navigate("/student?section=activity");
  };

  const goToChatbot = () => {
    navigate("/student?section=chatbot");
  };

  const goToDashboard = () => {
    navigate("/student");
  };

  const goToReport = () => {
    navigate("/student/report");
  };

  const goToComplaints = () => {
    navigate("/student/complaints");
  };

  const handleProfileImage = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Profile image should be less than 5 MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const image = reader.result;

      setProfileImage(image);

      localStorage.setItem(
        "campusfix_student_profile_image",
        image
      );
    };

    reader.readAsDataURL(file);
  };

  const removeProfileImage = () => {
    setProfileImage("");

    localStorage.removeItem(
      "campusfix_student_profile_image"
    );

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "⌂",
    },
    {
      id: "profile",
      label: "My Profile",
      icon: "♙",
    },
    {
      id: "report",
      label: "Report Problem",
      icon: "＋",
    },
    {
      id: "complaints",
      label: "All Complaints",
      icon: "▤",
    },
    {
      id: "chatbot",
      label: "AI Chatbot",
      icon: "✦",
    },
    {
      id: "activity",
      label: "My Activity",
      icon: "◷",
    },
  ];

  const renderProfile = () => {
    return (
      <div className="space-y-6">
        <div
          className={`overflow-hidden rounded-3xl border ${darkMode
            ? "border-slate-700 bg-slate-900"
            : "border-indigo-100 bg-white"
            } shadow-sm`}
        >
          <div
            className={`h-28 ${darkMode
              ? "bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900"
              : "bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-500"
              }`}
          ></div>

          <div className="px-5 pb-6 sm:px-7">
            <div className="-mt-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="relative">
                  <div
                    className={`flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-4 ${darkMode
                      ? "border-slate-900 bg-slate-800"
                      : "border-white bg-indigo-50"
                      } shadow-lg`}
                  >
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt="Student profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-black text-indigo-600">
                        {(user.name || "S").charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-xl border-2 border-white bg-indigo-600 text-white shadow-md transition hover:bg-indigo-700"
                    title="Change profile photo"
                  >
                    ✎
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImage}
                    className="hidden"
                  />
                </div>

                <div>
                  <h2
                    className={`text-2xl font-black ${darkMode ? "text-white" : "text-slate-900"
                      }`}
                  >
                    {user.name || "Student"}
                  </h2>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${darkMode
                        ? "bg-indigo-950 text-indigo-300"
                        : "bg-indigo-50 text-indigo-700"
                        }`}
                    >
                      Student
                    </span>

                    <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                      Active
                    </span>
                  </div>
                </div>
              </div>

              {profileImage && (
                <button
                  type="button"
                  onClick={removeProfileImage}
                  className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${darkMode
                    ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                >
                  Remove Photo
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div
            className={`rounded-3xl border p-6 shadow-sm ${darkMode
              ? "border-slate-700 bg-slate-900"
              : "border-slate-200 bg-white"
              }`}
          >
            <div className="mb-6">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-500">
                Academic Information
              </p>

              <h3
                className={`mt-1 text-lg font-black ${darkMode ? "text-white" : "text-slate-900"
                  }`}
              >
                Student Details
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {
                [
                  ["Full Name", user.name || "—"],
                  ["Enrollment No.", user.enrollmentNumber || "—"],
                  ["University", "Medi-Caps University"],
                  ["Course", "B.Tech"],
                  ["Branch", user.branch || "—"],
                  ["Semester", user.semester || "—"],
                  ["Section", user.classSection || "—"],
                  ["Department", user.department || "—"],
                ].map(([label, value]) => (
                <div
                  key={label}
                  className={`rounded-2xl border p-4 ${darkMode
                    ? "border-slate-700 bg-slate-800"
                    : "border-slate-100 bg-slate-50"
                    }`}
                >
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    {label}
                  </p>

                  <p
                    className={`mt-1 text-sm font-bold ${darkMode ? "text-slate-200" : "text-slate-800"
                      }`}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div
            className={`rounded-3xl border p-6 shadow-sm ${darkMode
              ? "border-slate-700 bg-slate-900"
              : "border-slate-200 bg-white"
              }`}
          >
            <div className="mb-6">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-500">
                Account
              </p>

              <h3
                className={`mt-1 text-lg font-black ${darkMode ? "text-white" : "text-slate-900"
                  }`}
              >
                Contact & Security
              </h3>
            </div>

            <div className="space-y-4">
              <div
                className={`rounded-2xl border p-4 ${darkMode
                  ? "border-slate-700 bg-slate-800"
                  : "border-slate-100 bg-slate-50"
                  }`}
              >
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  College Email
                </p>

                <p
                  className={`mt-1 break-all text-sm font-bold ${darkMode ? "text-slate-200" : "text-slate-800"
                    }`}
                >
                  {user.email || "—"}
                </p>
              </div>

              <div
                className={`rounded-2xl border p-4 ${darkMode
                  ? "border-slate-700 bg-slate-800"
                  : "border-slate-100 bg-slate-50"
                  }`}
              >
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Phone
                </p>

                <p
                  className={`mt-1 text-sm font-bold ${darkMode ? "text-slate-200" : "text-slate-800"
                    }`}
                >
                 {user.phoneNumber || "Not added"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="flex w-full items-center justify-between rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-4 text-left transition hover:bg-indigo-100"
              >
                <div>
                  <p className="text-sm font-extrabold text-indigo-800">
                    Change Password
                  </p>

                  <p className="mt-1 text-xs font-medium text-indigo-600">
                    Update your CampusFix account password
                  </p>
                </div>

                <span className="text-xl font-bold text-indigo-600">
                  →
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderActivity = () => {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-500">
            Student Activity
          </p>

          <h2
            className={`mt-1 text-2xl font-black ${darkMode ? "text-white" : "text-slate-900"
              }`}
          >
            My Activity
          </h2>

          <p
            className={`mt-1 text-sm ${darkMode ? "text-slate-400" : "text-slate-500"
              }`}
          >
            Track your complaint activity and maintenance requests.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total",
              value: total,
              icon: "▤",
              bg: "bg-indigo-50",
              text: "text-indigo-600",
            },
            {
              label: "Pending",
              value: pending,
              icon: "◷",
              bg: "bg-amber-50",
              text: "text-amber-600",
            },
            {
              label: "In Progress",
              value: inProgress,
              icon: "↻",
              bg: "bg-blue-50",
              text: "text-blue-600",
            },
            {
              label: "Resolved",
              value: resolved,
              icon: "✓",
              bg: "bg-emerald-50",
              text: "text-emerald-600",
            },
          ].map((item) => (
            <div
              key={item.label}
              className={`rounded-2xl border p-5 shadow-sm ${darkMode
                ? "border-slate-700 bg-slate-900"
                : "border-slate-200 bg-white"
                }`}
            >
              <div
                className={`mb-5 flex h-10 w-10 items-center justify-center rounded-xl ${item.bg} ${item.text} text-lg font-black`}
              >
                {item.icon}
              </div>

              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                {item.label}
              </p>

              <p
                className={`mt-1 text-3xl font-black ${darkMode ? "text-white" : "text-slate-900"
                  }`}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div
          className={`rounded-3xl border p-6 shadow-sm ${darkMode
            ? "border-slate-700 bg-slate-900"
            : "border-slate-200 bg-white"
            }`}
        >
          <div className="mb-6">
            <h3
              className={`text-lg font-black ${darkMode ? "text-white" : "text-slate-900"
                }`}
            >
              Recent Activity
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              Your latest maintenance requests.
            </p>
          </div>

          {complaints.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-xl text-indigo-600">
                +
              </div>

              <p className="mt-4 font-bold text-slate-700">
                No activity yet
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Your complaint activity will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {complaints.slice(0, 6).map((complaint) => (
                <button
                  type="button"
                  key={complaint._id}
                  onClick={() =>
                    navigate(
                      `/student/complaints?id=${complaint._id}`
                    )
                  }
                  className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${darkMode
                    ? "border-slate-700 bg-slate-800 hover:border-indigo-500"
                    : "border-slate-100 bg-slate-50 hover:border-indigo-200 hover:bg-white"
                    }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 font-black text-indigo-600">
                    {complaint.category?.charAt(0) || "C"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm font-extrabold ${darkMode ? "text-white" : "text-slate-800"
                        }`}
                    >
                      {complaint.category || "Maintenance Complaint"}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {complaint.block || "—"} • Room{" "}
                      {complaint.room || "—"} •{" "}
                      {formatDate(complaint.createdAt)}
                    </p>
                  </div>

                  <span
                    className={`hidden rounded-full border px-3 py-1 text-[11px] font-bold sm:block ${getStatusStyle(
                      complaint.status
                    )}`}
                  >
                    {complaint.status || "Pending"}
                  </span>

                  <span className="text-slate-400">›</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };



<CampusFixChatbot darkMode={darkMode} />


  const renderDashboard = () => {
    return (
      <div className="space-y-6">
        <section
          className={`relative overflow-hidden rounded-3xl ${darkMode
            ? "bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900"
            : "bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-500"
            } px-6 py-7 text-white shadow-sm sm:px-8`}
        >
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10"></div>
          <div className="absolute -bottom-24 right-24 h-48 w-48 rounded-full bg-white/5"></div>

          <div className="relative max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-lg font-bold">
              <span className="h-2 w-2 rounded-full bg-emerald-300"></span>
              Student Portal
            </div>

            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              Welcome back, {user.name?.split(" ")[0] || "Student"} 👋
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100 sm:text-base">
              Report campus problems, track your complaints and help
              keep Medi-Caps University running smoothly.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={goToReport}
                className="rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
              >
                + Report a Problem
              </button>

              <button
                type="button"
                onClick={goToComplaints}
                className="rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-extrabold text-white backdrop-blur transition hover:bg-white/20"
              >
                Track Complaints →
              </button>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-500">
                Quick Access
              </p>

              <h2
                className={`mt-1 text-xl font-black ${darkMode ? "text-white" : "text-slate-900"
                  }`}
              >
                What do you need?
              </h2>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button
              type="button"
              onClick={goToReport}
              className={`group rounded-2xl border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${darkMode
                ? "border-slate-700 bg-slate-900 hover:border-indigo-500"
                : "border-indigo-100 bg-white hover:border-indigo-200"
                }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-xl font-black text-indigo-600">
                  +
                </span>

                <span className="text-slate-300 transition group-hover:text-indigo-500">
                  →
                </span>
              </div>

              <h3
                className={`mt-5 font-black ${darkMode ? "text-white" : "text-slate-900"
                  }`}
              >
                Report Problem
              </h3>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                Report a maintenance issue with location and details.
              </p>
            </button>

            <button
              type="button"
              onClick={goToComplaints}
              className={`group rounded-2xl border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${darkMode
                ? "border-slate-700 bg-slate-900 hover:border-blue-500"
                : "border-blue-100 bg-white hover:border-blue-200"
                }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl font-black text-blue-600">
                  ▤
                </span>

                <span className="text-slate-300 transition group-hover:text-blue-500">
                  →
                </span>
              </div>

              <h3
                className={`mt-5 font-black ${darkMode ? "text-white" : "text-slate-900"
                  }`}
              >
                All Complaints
              </h3>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                View your submitted complaints and their progress.
              </p>
            </button>

            <button
              type="button"
              onClick={goToActivity}
              className={`group rounded-2xl border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${darkMode
                ? "border-slate-700 bg-slate-900 hover:border-emerald-500"
                : "border-emerald-100 bg-white hover:border-emerald-200"
                }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-xl font-black text-emerald-600">
                  ◷
                </span>

                <span className="text-slate-300 transition group-hover:text-emerald-500">
                  →
                </span>
              </div>

              <h3
                className={`mt-5 font-black ${darkMode ? "text-white" : "text-slate-900"
                  }`}
              >
                My Activity
              </h3>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                See your complaint history and recent activity.
              </p>
            </button>

            <button
              type="button"
              onClick={goToChatbot}
              className={`group rounded-2xl border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${darkMode
                ? "border-slate-700 bg-slate-900 hover:border-violet-500"
                : "border-violet-100 bg-white hover:border-violet-200"
                }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-xl font-black text-violet-600">
                  ✦
                </span>

                <span className="text-slate-300 transition group-hover:text-violet-500">
                  →
                </span>
              </div>

              <h3
                className={`mt-5 font-black ${darkMode ? "text-white" : "text-slate-900"
                  }`}
              >
                AI Chatbot
              </h3>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                Get help with CampusFix and maintenance questions.
              </p>
            </button>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-500">
                Overview
              </p>

              <h2
                className={`mt-1 text-xl font-black ${darkMode ? "text-white" : "text-slate-900"
                  }`}
              >
                Complaint Statistics
              </h2>
            </div>

            <button
              type="button"
              onClick={goToComplaints}
              className="text-sm font-bold text-indigo-600 hover:text-indigo-700"
            >
              View all →
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[
              {
                label: "Total",
                value: total,
                icon: "▤",
                bg: "bg-indigo-50",
                text: "text-indigo-600",
              },
              {
                label: "Pending",
                value: pending,
                icon: "◷",
                bg: "bg-amber-50",
                text: "text-amber-600",
              },
              {
                label: "Assigned",
                value: assigned,
                icon: "↗",
                bg: "bg-violet-50",
                text: "text-violet-600",
              },
              {
                label: "In Progress",
                value: inProgress,
                icon: "↻",
                bg: "bg-blue-50",
                text: "text-blue-600",
              },
              {
                label: "Resolved",
                value: resolved,
                icon: "✓",
                bg: "bg-emerald-50",
                text: "text-emerald-600",
              },
            ].map((item) => (
              <div
                key={item.label}
                className={`rounded-2xl border p-5 shadow-sm ${darkMode
                  ? "border-slate-700 bg-slate-900"
                  : "border-slate-200 bg-white"
                  }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.bg} ${item.text} text-lg font-black`}
                >
                  {item.icon}
                </div>

                <p className="mt-5 text-xs font-bold uppercase tracking-wide text-slate-400">
                  {item.label}
                </p>

                <p
                  className={`mt-1 text-3xl font-black ${darkMode ? "text-white" : "text-slate-900"
                    }`}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          className={`overflow-hidden rounded-3xl border shadow-sm ${darkMode
            ? "border-slate-700 bg-slate-900"
            : "border-slate-200 bg-white"
            }`}
        >
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-500">
                Your Requests
              </p>

              <h2
                className={`mt-1 text-lg font-black ${darkMode ? "text-white" : "text-slate-900"
                  }`}
              >
                Recent Complaints
              </h2>
            </div>

            <button
              type="button"
              onClick={goToComplaints}
              className="w-fit rounded-xl bg-indigo-50 px-4 py-2.5 text-xs font-extrabold text-indigo-700 transition hover:bg-indigo-100"
            >
              View All Complaints
            </button>
          </div>

          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="py-12 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-100 border-t-indigo-600"></div>

                <p className="mt-3 text-sm font-medium text-slate-400">
                  Loading your complaints...
                </p>
              </div>
            ) : recentComplaints.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-xl text-indigo-600">
                  +
                </div>

                <p className="mt-4 font-bold text-slate-700">
                  No complaints yet
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Your maintenance complaints will appear here.
                </p>

                <button
                  type="button"
                  onClick={goToReport}
                  className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
                >
                  Report Your First Problem
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentComplaints.map((complaint) => (
                  <button
                    type="button"
                    key={complaint._id}
                    onClick={() =>
                      navigate(
                        `/student/complaints?id=${complaint._id}`
                      )
                    }
                    className={`group flex w-full flex-col gap-4 rounded-2xl border p-4 text-left transition sm:flex-row sm:items-center ${darkMode
                      ? "border-slate-700 bg-slate-800 hover:border-indigo-500"
                      : "border-slate-100 bg-slate-50 hover:border-indigo-200 hover:bg-white"
                      }`}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 font-black text-indigo-600">
                        {complaint.category?.charAt(0) || "C"}
                      </div>

                      <div className="min-w-0">
                        <p
                          className={`truncate text-sm font-extrabold ${darkMode ? "text-white" : "text-slate-800"
                            }`}
                        >
                          {complaint.category ||
                            "Maintenance Complaint"}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-400">
                          {complaint.block || "—"} • Room{" "}
                          {complaint.room || "—"} •{" "}
                          {formatDate(complaint.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full border px-3 py-1.5 text-[11px] font-bold ${getPriorityStyle(
                          complaint.priority
                        )}`}
                      >
                        {complaint.priority || "Low"}
                      </span>

                      <span
                        className={`rounded-full border px-3 py-1.5 text-[11px] font-bold ${getStatusStyle(
                          complaint.status
                        )}`}
                      >
                        {complaint.status || "Pending"}
                      </span>

                      <span className="ml-1 text-slate-300 transition group-hover:text-indigo-500">
                        →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <div
            className={`rounded-3xl border p-6 shadow-sm ${darkMode
              ? "border-slate-700 bg-slate-900"
              : "border-slate-200 bg-white"
              }`}
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xl text-indigo-600">
                ♡
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-500">
                  Campus Impact
                </p>

                <h3
                  className={`mt-1 text-lg font-black ${darkMode ? "text-white" : "text-slate-900"
                    }`}
                >
                  Your report helps improve campus
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Every genuine complaint helps the maintenance team
                  identify and resolve issues faster.
                </p>
              </div>
            </div>
          </div>

          <div
            className={`rounded-3xl border p-6 shadow-sm ${darkMode
              ? "border-slate-700 bg-slate-900"
              : "border-slate-200 bg-white"
              }`}
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-xl text-amber-600">
                !
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-500">
                  CampusFix Tip
                </p>

                <h3
                  className={`mt-1 text-lg font-black ${darkMode ? "text-white" : "text-slate-900"
                    }`}
                >
                  Give an exact location
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Always mention your block, room number and a clear
                  description so the technician can find the issue quickly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

const renderContent = () => {
  if (location.pathname === "/student/report" || currentSection === "report") {
    return <ComplaintForm darkMode={darkMode} />;
  }

  if (location.pathname === "/student/complaints" || currentSection === "complaints") {
    return <MyComplaints darkMode={darkMode} />;
  }

  if (currentSection === "profile") {
    return renderProfile();
  }

  if (currentSection === "activity") {
    return renderActivity();
  }

  if (currentSection === "chatbot") {
    return <CampusFixChatbot darkMode={darkMode} />;
  }

  return renderDashboard();
};

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${darkMode ? "bg-slate-950 dark" : "bg-slate-50"
        }`}
    >
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/20 backdrop-blur-[1px] lg:hidden"
        ></button>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen w-[250px] border-r transition-transform duration-300 ${darkMode
          ? "border-slate-800 bg-slate-950"
          : "border-slate-200 bg-white"
          } ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar Header */}
          <div
            className={`flex h-20 items-center border-b px-5 ${darkMode
              ? "border-slate-800"
              : "border-slate-100"
              }`}
          >
            <div>
              <p
                className={`text-xl font-black ${darkMode ? "text-white" : "text-slate-900"
                  }`}
              >
                CampusFix
              </p>

              <p className="mt-0.5 text-[13px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                Student Portal
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-5">
            <p className="mb-3 px-3 text-[12px] font-black uppercase tracking-[0.18em] text-slate-400">
              Student Menu
            </p>

            <div className="space-y-1.5">
              {menuItems.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => handleMenuClick(item)}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${currentSection === item.id
                    ? darkMode
                      ? "bg-indigo-600 text-white"
                      : "bg-indigo-50 text-indigo-700"
                    : darkMode
                      ? "text-slate-400 hover:bg-slate-900 hover:text-white"
                      : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
                    }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base font-black ${currentSection === item.id
                      ? darkMode
                        ? "bg-white/15 text-white"
                        : "bg-white text-indigo-600 shadow-sm"
                      : darkMode
                        ? "bg-slate-900 text-slate-400"
                        : "bg-slate-50 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                      }`}
                  >
                    {item.icon}
                  </span>

                  <span className="text-sm font-bold">
                    {item.label}
                  </span>

                  {currentSection === item.id && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-current"></span>
                  )}
                </button>
              ))}
            </div>
          </nav>

          {/* Sidebar Bottom */}
          <div
            className={`border-t p-3 ${darkMode
              ? "border-slate-800"
              : "border-slate-100"
              }`}
          >
            <button
              type="button"
              onClick={toggleTheme}
              className={`mb-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${darkMode
                ? "text-slate-300 hover:bg-slate-900"
                : "text-slate-600 hover:bg-slate-50"
                }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-base transition ${
                  darkMode
                    ? "bg-slate-800 text-amber-400"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {darkMode ? "☀" : "☾"}
              </span>

              <span className="text-sm font-bold">
                {darkMode ? "Light Mode" : "Dark Mode"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowLogout(true)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                darkMode
                  ? "text-slate-400 hover:bg-red-950/30 hover:text-red-400"
                  : "text-slate-600 hover:bg-red-50 hover:text-red-600"
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-base transition ${
                  darkMode ? "bg-slate-800 text-slate-400" : "bg-slate-50 text-slate-500"
                }`}
              >
                ↪
              </span>

              <span className="text-sm font-bold">
                Logout
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div
        className={`min-h-screen transition-all duration-300 ${sidebarOpen ? "lg:pl-[250px]" : "lg:pl-0"
          }`}
      >
        {/* Top Navbar */}
        <header
          className={`sticky top-0 z-20 border-b backdrop-blur-md ${darkMode
            ? "border-slate-800 bg-slate-950/95"
            : "border-slate-200 bg-white/95"
            }`}
        >
          <div className="flex min-h-[88px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-4">
              {/* Sidebar Toggle */}
              <button
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label={
                  sidebarOpen
                    ? "Close sidebar"
                    : "Open sidebar"
                }
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-xl font-black transition ${darkMode
                  ? "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
              >
                {sidebarOpen ? "‹" : "☰"}
              </button>

              {/* Medi-Caps Logo */}
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-14 shrink-0 items-center rounded-xl bg-white px-3 shadow-sm ring-1 ring-slate-100">
                  <img
                    src="https://www.medicaps.ac.in/public/frontend/images/medicaps-logo-fin.webp"
                    alt="Medi-Caps University"
                    className="h-11 w-auto object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.parentElement.innerHTML =
                        '<span class="font-black text-indigo-600">M</span>';
                    }}
                  />
                </div>


              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <div className="hidden text-right sm:block">
                <p
                  className={`text-xl font-bold ${darkMode
                    ? "text-white"
                    : "text-slate-800"
                    }`}
                >
                  {user.name || "Student"}
                </p>

                <p className="text-lg font-medium text-slate-400">
                  Student Account
                </p>
              </div>

              <button
                type="button"
                onClick={goToProfile}
                className={`flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border font-black ${darkMode
                  ? "border-slate-700 bg-slate-800 text-indigo-300"
                  : "border-indigo-100 bg-indigo-50 text-indigo-600"
                  }`}
                title="My Profile"
              >
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  (user.name || "S").charAt(0).toUpperCase()
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            {renderContent()}
          </div>
        </main>

        {/* Footer */}
        <footer
          className={`border-t px-4 py-6 sm:px-6 lg:px-8 ${darkMode
            ? "border-slate-800"
            : "border-slate-200"
            }`}
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-2 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <p className="text-xs font-medium text-slate-400">
              © {new Date().getFullYear()} CampusFix • Medi-Caps University
            </p>

            <p className="text-xs font-medium text-slate-400">
              Campus Maintenance Management System
            </p>
          </div>
        </footer>
      </div>
      {showLogout && (
        <LogoutModal
          isOpen={showLogout}
          onClose={() => setShowLogout(false)}
        />
      )}
    </div>
  );
}

export default StudentDashboard;
