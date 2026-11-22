"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function ResetPassword() {
  const navigate = useNavigate();

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const email = localStorage.getItem("resetPasswordEmail");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!email) {
      setError(
        "Email not found. Please start the password reset process again."
      );
      return;
    }

    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
const response = await api.post("/auth/reset-password", {
  email,
  otp,
  newPassword,
});

const data = response.data;

      setMessage(
        "Password reset successfully. Redirecting to login..."
      );

      localStorage.removeItem("resetPasswordEmail");

      setTimeout(() => {
        navigate("/login");
      }, 1800);
    } catch (error) {
      console.error("Reset password error:", error);

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
              🔑
            </div>

            <h1 className="mt-5 text-3xl font-bold text-slate-800">
              Reset Password
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Enter the OTP sent to your email and create a new password.
            </p>

            {email && (
              <p className="mt-3 break-all text-sm font-semibold text-indigo-600">
                {email}
              </p>
            )}

          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >

            {/* OTP */}
            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                6-Digit OTP
              </label>

              <input
                type="text"
                inputMode="numeric"
                maxLength="6"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) =>
                  setOtp(
                    e.target.value.replace(/\D/g, "")
                  )
                }
                required
                disabled={loading}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3.5 text-center text-lg font-bold tracking-[0.4em] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
              />

            </div>

            {/* New Password */}
            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                New Password
              </label>

              <input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(e.target.value)
                }
                required
                disabled={loading}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
              />

            </div>

            {/* Confirm Password */}
            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Confirm New Password
              </label>

              <input
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                required
                disabled={loading}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
              />

            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 px-5 py-3.5 text-base font-bold text-white shadow-sm transition hover:bg-indigo-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Resetting Password..."
                : "Reset Password"}
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

export default ResetPassword;

