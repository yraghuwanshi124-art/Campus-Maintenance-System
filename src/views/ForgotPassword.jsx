"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/forgot-password", {
        email: email.trim().toLowerCase(),
      });

      const data = response.data;
      // const response = await fetch(
      //   // "http://localhost:5000/api/auth/forgot-password",
      //   "https://campus-maintainace-system-1.onrender.com/api/auth/forgot-password",
      //   {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json",
      //     },
      //     body: JSON.stringify({
      //       email: email.trim().toLowerCase(),
      //     }),
      //   }
      // );

      // const data = await response.json();

      // if (!response.ok) {
      //   setError(data.message || "Something went wrong.");
      //   return;
      // }

      setMessage(data.message);

      // Save email for the next reset-password step
      localStorage.setItem(
        "resetPasswordEmail",
        email.trim().toLowerCase()
      );

      // Go to OTP / reset password page
      setTimeout(() => {
        navigate("/reset-password");
      }, 1200);
    } catch (error) {
      console.error("Forgot password error:", error);

      setError(
        "Unable to connect to server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-5 py-10">

      <div className="w-full max-w-md">

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl sm:p-10">

          {/* Header */}
          <div className="text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-3xl">
              🔐
            </div>

            <h1 className="mt-5 text-3xl font-bold text-slate-800">
              Forgot Password?
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Enter your registered email address to receive a
              password reset OTP.
            </p>

          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Email Address
              </label>

              <input
                type="email"
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
              />

            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 px-5 py-3.5 text-base font-bold text-white shadow-sm transition hover:bg-indigo-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Sending OTP..." : "Send Reset OTP"}
            </button>

          </form>

          {/* Success Message */}
          {message && (
            <div className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-700">
              {message}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          {/* Back to Login */}
          <div className="mt-7 text-center">

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="font-semibold text-indigo-600 transition hover:text-indigo-700"
            >
              ← Back to Login
            </button>

          </div>

        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-slate-500">
          Medi-Caps University
        </p>

      </div>

    </div>
  );
}

export default ForgotPassword;

