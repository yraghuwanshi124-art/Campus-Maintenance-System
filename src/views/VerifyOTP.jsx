"use client";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";

function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;

  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");

  const handleVerify = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!email) {
      setMessage("Email not found. Please register again.");
      return;
    }

    try {
      await api.post("/auth/verify-otp", {
        email,
        otp,
      });

      setMessage("Email verified successfully!");

      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "OTP verification failed"
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-5">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl sm:p-10">

          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-slate-800">
              Verify Email
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Enter the 6-digit OTP sent to
            </p>

            <p className="mt-1 font-semibold text-indigo-600">
              {email}
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-5">

            <div>
              <label className="mb-2 block font-semibold text-slate-700">
                Verification OTP
              </label>

              <input
                type="text"
                inputMode="numeric"
                maxLength="6"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, ""))
                }
                required
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-center text-xl tracking-[0.5em] outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-indigo-600 px-5 py-3.5 font-bold text-white transition hover:bg-indigo-700"
            >
              Verify OTP
            </button>

          </form>

          {message && (
            <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-center font-medium">
              {message}
            </div>
          )}

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Back to Registration
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default VerifyOTP;
