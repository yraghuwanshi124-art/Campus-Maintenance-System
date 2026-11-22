"use client";

import { useEffect, useState } from "react";
import api from "../services/api";
import LogoutModal from "../components/LogoutModal";
import AdminSidebar from "../components/AdminSidebar";
import { useTheme } from "../context/ThemeContext";

function AdminFakeComplaints() {
  const { darkMode } = useTheme();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedComplaints, setExpandedComplaints] = useState({});
  const [showLogout, setShowLogout] = useState(false);

  // FETCH FAKE COMPLAINTS
  const fetchFakeComplaints = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const response = await api.get("/complaints/fake", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setComplaints(response.data.complaints || []);
    } catch (err) {
      console.error("FAKE COMPLAINT ERROR:", err.response?.data || err);
      setError(
        err.response?.data?.message ||
        "Unable to load fake complaints."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFakeComplaints();
  }, []);

  // DATE FORMAT
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

  // EXPAND / COLLAPSE
  const toggleComplaint = (id) => {
    setExpandedComplaints((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // SEARCH
  const filteredComplaints = complaints.filter((complaint) => {
    const search = searchTerm.toLowerCase().trim();

    const searchableFields = [
      complaint._id,
      complaint.category,
      complaint.block,
      complaint.room,
      complaint.description,
      complaint.user?.name,
      complaint.user?.email,
      complaint.user?.enrollmentNumber,
      complaint.user?.department,
    ];

    return searchableFields.some((field) =>
      String(field || "").toLowerCase().includes(search)
    );
  });

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  return (
    <div className="min-h-screen bg-slate-50 transition-colors duration-200 dark:bg-slate-950">

      {/* SIDEBAR */}
      <AdminSidebar onLogout={() => setShowLogout(true)} />

      <div className="lg:ml-64">

        {/* NAVBAR */}
        <nav className="border-b border-indigo-100 bg-indigo-50 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

            <div className="flex items-center gap-5">
              <div className="rounded-xl bg-white px-3 py-1.5 shadow-sm dark:bg-slate-800">
                <img
                  src="https://www.medicaps.ac.in/public/frontend/images/medicaps-logo-fin.webp"
                  alt="Medi-Caps University"
                  className="h-11 w-auto object-contain"
                />
              </div>

              <div className="hidden border-l-2 border-indigo-200 pl-5 sm:block dark:border-indigo-800">
                <p className="text-xl font-extrabold text-indigo-700 dark:text-indigo-400">
                  CampusFix
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Campus Maintenance Management System
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden text-right sm:block">
                <p className="font-bold text-slate-800 dark:text-white">
                  {user?.assignedBlocks?.length
                    ? `${user.assignedBlocks.join(", ")} Admin`
                    : "Administrator"}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {user?.email || "No email"}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-600 font-bold text-white">
                A
              </div>

              <button
                onClick={() => setShowLogout(true)}
                className="rounded-xl border border-indigo-200 bg-white px-5 py-2.5 font-semibold text-slate-700 transition hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                Logout
              </button>
            </div>
          </div>
        </nav>

        {/* MAIN CONTENT */}
        <main className="mx-auto max-w-7xl px-6 py-10">

          {/* HEADER */}
          <div className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

            <div className="bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 p-6 sm:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                <div className="text-white">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-wider">
                    ⚠️ Administration Monitoring
                  </div>

                  <h1 className="text-2xl font-extrabold sm:text-3xl">
                    Fake Complaints
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-red-100">
                    Review complaints verified as false by the administration
                    and access complete student and complaint records.
                  </p>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-5 py-4 backdrop-blur-md">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-2xl">
                    🚫
                  </div>

                  <div>
                    <p className="text-2xl font-extrabold text-white">
                      {complaints.length}
                    </p>
                    <p className="text-xs font-medium text-red-100">
                      Total Fake Complaints
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* SEARCH */}
            <div className="flex flex-col gap-4 bg-slate-50 p-5 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">

              <div className="relative w-full sm:max-w-xl">
                <span className="absolute left-4 top-1/2 -translate-y-1/2">
                  🔍
                </span>

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by student, enrollment, complaint, block..."
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-indigo-950"
                />
              </div>

              <button
                onClick={fetchFakeComplaints}
                disabled={loading}
                className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
              >
                ↻ {loading ? "Refreshing..." : "Refresh Records"}
              </button>
            </div>
          </div>

          {/* LOADING */}
          {loading && (
            <div className="rounded-3xl border border-slate-200 bg-white p-16 text-center dark:border-slate-800 dark:bg-slate-900">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
              <p className="mt-5 font-semibold text-slate-500 dark:text-slate-400">
                Loading fake complaint records...
              </p>
            </div>
          )}

          {/* ERROR */}
          {!loading && error && (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950/30">
              <p className="text-lg font-bold text-red-700 dark:text-red-300">
                ⚠️ {error}
              </p>
              <button
                onClick={fetchFakeComplaints}
                className="mt-4 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          )}

          {/* EMPTY STATE */}
          {!loading && !error && filteredComplaints.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-14 text-center dark:border-slate-700 dark:bg-slate-900">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-4xl dark:bg-red-950/40">
                {searchTerm ? "🔎" : "🛡️"}
              </div>

              <h3 className="mt-5 text-xl font-extrabold text-slate-800 dark:text-white">
                {searchTerm
                  ? "No Matching Records"
                  : "No Fake Complaints Found"}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                {searchTerm
                  ? "Try another search term to find complaint records."
                  : "There are currently no complaints marked as fake by the administration."}
              </p>
            </div>
          )}

          {/* COMPLAINT RECORDS */}
          {!loading && !error && filteredComplaints.length > 0 && (
            <div className="space-y-5">

              {filteredComplaints.map((complaint) => {
                const isExpanded = expandedComplaints[complaint._id];
                const student = complaint.user || {};

                return (
                  <div
                    key={complaint._id}
                    className="overflow-hidden rounded-3xl border border-red-100 bg-white shadow-sm transition hover:shadow-lg dark:border-red-900/50 dark:bg-slate-900"
                  >

                    <div className="h-1.5 bg-gradient-to-r from-red-500 to-orange-500" />

                    <div className="p-5 sm:p-6">

                      {/* CARD HEADER */}
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

                        <div className="flex gap-4">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-2xl dark:bg-red-950/50">
                            🚫
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold uppercase tracking-widest text-red-600 dark:text-red-400">
                                Verified Fake Complaint
                              </span>

                              <span className="text-xs text-slate-400">
                                #{complaint._id?.slice(-6)}
                              </span>
                            </div>

                            <h3 className="mt-1 text-xl font-extrabold text-slate-800 dark:text-white">
                              {complaint.category || "Maintenance Complaint"}
                            </h3>

                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                              Submitted by{" "}
                              <span className="font-bold text-slate-700 dark:text-slate-200">
                                {student.name || "Unknown Student"}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300">
                            ⚠️ Marked Fake
                          </span>

                          <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {complaint.status || "Pending"}
                          </span>
                        </div>
                      </div>

                      {/* QUICK DETAILS */}
                      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                          <p className="text-xs font-bold uppercase text-slate-400">
                            Student
                          </p>
                          <p className="mt-2 font-bold text-slate-800 dark:text-white">
                            {student.name || "Unknown"}
                          </p>
                          <p className="mt-1 break-all text-xs text-slate-500 dark:text-slate-400">
                            {student.enrollmentNumber || "No enrollment number"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                          <p className="text-xs font-bold uppercase text-slate-400">
                            Location
                          </p>
                          <p className="mt-2 font-bold text-slate-800 dark:text-white">
                            Block {complaint.block || "—"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Room {complaint.room || "—"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                          <p className="text-xs font-bold uppercase text-slate-400">
                            Submitted On
                          </p>
                          <p className="mt-2 text-sm font-bold text-slate-800 dark:text-white">
                            {formatDateTime(complaint.createdAt)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
                          <p className="text-xs font-bold uppercase text-red-500">
                            Marked Fake On
                          </p>
                          <p className="mt-2 text-sm font-bold text-red-700 dark:text-red-300">
                            {formatDateTime(complaint.fakeMarkedAt)}
                          </p>
                        </div>
                      </div>

                      {/* EXPANDED DETAILS */}
                      {isExpanded && (
                        <div className="mt-6 space-y-4">

                          {/* STUDENT INFORMATION */}
                          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 dark:border-indigo-900 dark:bg-indigo-950/20">
                            <h4 className="mb-4 font-extrabold text-slate-800 dark:text-white">
                              👨‍🎓 Complete Student Information
                            </h4>

                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                              {[
                                ["Full Name", student.name],
                                ["Email Address", student.email],
                                ["Enrollment Number", student.enrollmentNumber],
                                ["Department", student.department],
                                ["Semester", student.semester],
                                ["Class / Section", student.classSection],
                                ["Mobile Number", complaint.mobileNumber || student.phoneNumber],
                              ].map(([label, value]) => (
                                <div key={label}>
                                  <p className="text-xs font-bold uppercase text-slate-400">
                                    {label}
                                  </p>
                                  <p className="mt-1 break-words text-sm font-semibold text-slate-700 dark:text-slate-200">
                                    {value || "Not available"}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* COMPLAINT INFORMATION */}
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">
                            <h4 className="mb-4 font-extrabold text-slate-800 dark:text-white">
                              📝 Complaint Information
                            </h4>

                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                              <div>
                                <p className="text-xs font-bold uppercase text-slate-400">
                                  Complaint ID
                                </p>
                                <p className="mt-1 break-all text-sm font-semibold text-slate-700 dark:text-slate-200">
                                  {complaint._id}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs font-bold uppercase text-slate-400">
                                  Category
                                </p>
                                <p className="mt-1 font-semibold text-slate-700 dark:text-slate-200">
                                  {complaint.category || "—"}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs font-bold uppercase text-slate-400">
                                  Priority
                                </p>
                                <p className="mt-1 font-semibold text-slate-700 dark:text-slate-200">
                                  {complaint.priority || "Low"}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs font-bold uppercase text-slate-400">
                                  Block
                                </p>
                                <p className="mt-1 font-semibold text-slate-700 dark:text-slate-200">
                                  {complaint.block || "—"}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs font-bold uppercase text-slate-400">
                                  Room
                                </p>
                                <p className="mt-1 font-semibold text-slate-700 dark:text-slate-200">
                                  {complaint.room || "—"}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs font-bold uppercase text-slate-400">
                                  Current Status
                                </p>
                                <p className="mt-1 font-semibold text-slate-700 dark:text-slate-200">
                                  {complaint.status || "—"}
                                </p>
                              </div>
                            </div>

                            <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-700">
                              <p className="text-xs font-bold uppercase text-slate-400">
                                Problem Description
                              </p>
                              <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                                {complaint.description || "No description provided."}
                              </p>
                            </div>
                          </div>

                          {/* ADMIN INFORMATION */}
                          <div className="rounded-2xl border border-red-100 bg-red-50/60 p-5 dark:border-red-900 dark:bg-red-950/20">
                            <h4 className="mb-3 font-extrabold text-red-800 dark:text-red-300">
                              🛡️ Administration Verification
                            </h4>

                            <p className="text-sm text-slate-600 dark:text-slate-300">
                              Marked by:{" "}
                              <span className="font-bold">
                                {complaint.fakeMarkedBy?.name || "Administrator"}
                              </span>
                            </p>

                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                              Verification date:{" "}
                              <span className="font-bold">
                                {formatDateTime(complaint.fakeMarkedAt)}
                              </span>
                            </p>
                          </div>

                          {/* PHOTOS */}
                          {(complaint.image || complaint.completionImage) && (
                            <div className="grid gap-4 md:grid-cols-2">

                              {complaint.image && (
                                <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                                  <p className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                                    📷 Original Complaint Photo
                                  </p>
                                  <img
                                    src={complaint.image}
                                    alt="Complaint"
                                    className="h-56 w-full rounded-xl object-cover"
                                  />
                                </div>
                              )}

                              {complaint.completionImage && (
                                <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                                  <p className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                                    ✅ Completion Photo
                                  </p>
                                  <img
                                    src={complaint.completionImage}
                                    alt="Completion proof"
                                    className="h-56 w-full rounded-xl object-cover"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* EXPAND BUTTON */}
                    <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-700 dark:bg-slate-900">
                      <button
                        onClick={() => toggleComplaint(complaint._id)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-5 py-3 text-sm font-bold text-indigo-600 transition hover:bg-indigo-50 dark:border-slate-600 dark:bg-slate-800 dark:text-indigo-300 dark:hover:bg-slate-700"
                      >
                        {isExpanded ? "Show Less ↑" : "View Complete Record ↓"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* FOOTER */}
        <footer className="mt-8 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-7 text-center sm:flex-row sm:text-left">
            <div>
              <p className="font-bold text-slate-800 dark:text-white">
                CampusFix
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Medi-Caps University
              </p>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Smart Campus • Faster Resolution • Better Management
            </p>
          </div>
        </footer>
      </div>

      {/* LOGOUT */}
      <LogoutModal
        isOpen={showLogout}
        onClose={() => setShowLogout(false)}
      />
    </div>
  );
}

export default AdminFakeComplaints;

