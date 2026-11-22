"use client";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const campusImages = [
  "https://d3lzcn6mbbadaf.cloudfront.net/media/details/ANI-20260603124917.jpg",
  "https://www.medicaps.ac.in/uploads/school/medicaps-law-college.webp",
  "https://image-static.collegedunia.com/public/college_data/images/campusimage/1745581929Pictue-33.jpg",
  "https://www.knimbus.com/static-content/org_41ec1a01-e4f6-419d-906b-b90888112aa7/org_41ec1a01-e4f6-419d-906b-b90888112aa7_cover.jpeg",
];

const logoUrl =
  "https://www.medicaps.ac.in/public/frontend/images/medicaps-logo-fin.webp";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

const initialForm = {
  name: "",
  enrollmentNumber: "",
  email: "",
  phoneNumber: "",
  department: "",
  branch: "",
  semester: "",
  classSection: "",
};

function FormField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={name} className={labelClass}>
        {label} <span className="text-red-500">*</span>
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={inputClass}
        required
      />
    </div>
  );
}

function Register() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);

  const [emailOTP, setEmailOTP] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [currentImage, setCurrentImage] = useState(0);

  // Campus slideshow
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % campusImages.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearMessages = () => {
    setError("");
    setMessage("");
  };

  const showError = (text) => {
    setError(text);
    setMessage("");
  };

  const showSuccess = (text) => {
    setMessage(text);
    setError("");
  };

  // Password requirements
  const passwordChecks = [
    { label: "8 characters", valid: password.length >= 8 },
    { label: "Uppercase letter", valid: /[A-Z]/.test(password) },
    { label: "Lowercase letter", valid: /[a-z]/.test(password) },
    { label: "One number", valid: /\d/.test(password) },
    {
      label: "Special character",
      valid: /[^A-Za-z0-9]/.test(password),
    },
  ];

  const passwordStrength = passwordChecks.filter(
    (item) => item.valid
  ).length;

  // Validate student details
  const validateDetails = () => {
    if (!form.name.trim()) {
      showError("Please enter your full name.");
      return false;
    }

    if (!/^[A-Za-z0-9]+$/.test(form.enrollmentNumber.trim())) {
      showError("Please enter a valid enrollment number.");
      return false;
    }

    if (
      !form.email.trim().toLowerCase().endsWith("@medicaps.ac.in")
    ) {
      showError("Please use your official Medi-Caps email address.");
      return false;
    }

    const normalizedPhone = form.phoneNumber.replace(/\D/g, "");

    if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
      showError("Please enter a valid 10-digit mobile number.");
      return false;
    }

    if (!form.department.trim()) {
      showError("Please enter your department.");
      return false;
    }

    if (!form.branch.trim()) {
      showError("Please enter your branch.");
      return false;
    }

    if (!form.semester) {
      showError("Please select your semester.");
      return false;
    }

    if (!form.classSection.trim()) {
      showError("Please enter your class section.");
      return false;
    }

    return true;
  };

  // STEP 1: Register details and send OTP
  const handleRegister = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!validateDetails()) return;

    try {
      setLoading(true);

      const normalizedPhone = form.phoneNumber.replace(/\D/g, "");

      await api.post("/auth/register", {
        name: form.name.trim(),
        enrollmentNumber: form.enrollmentNumber.trim().toUpperCase(),
        email: form.email.trim().toLowerCase(),
        phoneNumber: normalizedPhone,
        department: form.department.trim(),
        branch: form.branch.trim(),
        semester: Number(form.semester),
        classSection: form.classSection.trim(),
      });

      showSuccess("OTP sent successfully to your college email.");

      setTimeout(() => {
        setStep(2);
        clearMessages();
      }, 700);
    } catch (err) {
      showError(
        err.response?.data?.message ||
          "Unable to send OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!/^\d{6}$/.test(emailOTP.trim())) {
      showError("Please enter a valid 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);

      await api.post("/auth/verify-otp", {
        email: form.email.trim().toLowerCase(),
        otp: emailOTP.trim(),
      });

      showSuccess("Email verified successfully!");

      setTimeout(() => {
        setStep(3);
        clearMessages();
      }, 700);
    } catch (err) {
      showError(
        err.response?.data?.message ||
          "Invalid OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Complete registration
  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    clearMessages();

    if (passwordStrength !== 5) {
      showError("Please fulfill all password requirements.");
      return;
    }

    if (password !== confirmPassword) {
      showError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await api.post("/auth/complete-registration", {
        email: form.email.trim().toLowerCase(),
        password,
        confirmPassword,
      });

      showSuccess("Account created successfully! Redirecting to login...");

      setTimeout(() => {
        navigate("/");
      }, 1200);
    } catch (err) {
      showError(
        err.response?.data?.message ||
          "Unable to complete registration. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    clearMessages();
    setStep((prev) => Math.max(1, prev - 1));
  };

  // Progress indicator
  const StepIndicator = () => (
    <div className="mb-6 flex items-center">
      {[
        { number: 1, title: "Details" },
        { number: 2, title: "Verify" },
        { number: 3, title: "Password" },
      ].map((item, index) => (
        <div
          key={item.number}
          className="flex flex-1 items-center last:flex-none"
        >
          <div className="flex flex-col items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 ${
                step >= item.number
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {step > item.number ? "✓" : item.number}
            </div>

            <span
              className={`mt-1.5 text-[11px] font-medium ${
                step >= item.number
                  ? "text-blue-700"
                  : "text-slate-400"
              }`}
            >
              {item.title}
            </span>
          </div>

          {index !== 2 && (
            <div className="mx-2 mb-5 h-px flex-1 bg-slate-200">
              <div
                className={`h-full bg-blue-600 transition-all duration-500 ${
                  step > item.number ? "w-full" : "w-0"
                }`}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-2">
      <style>{`
        @keyframes imageZoom {
          from {
            transform: scale(1.08);
          }
          to {
            transform: scale(1);
          }
        }

        @keyframes formEnter {
          from {
            opacity: 0;
            transform: translateX(24px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes stepEnter {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .campus-photo {
          animation: imageZoom 6.5s ease both;
        }

        .form-enter {
          animation: formEnter .65s cubic-bezier(.2,.8,.2,1) both;
        }

        .step-enter {
          animation: stepEnter .4s ease both;
        }

        @media (prefers-reduced-motion: reduce) {
          .campus-photo,
          .form-enter,
          .step-enter {
            animation: none;
          }
        }
      `}</style>

      {/* LEFT: CAMPUS IMAGE */}
      <section className="relative hidden h-screen overflow-hidden bg-slate-900 lg:block">
        {campusImages.map((image, index) => (
          <img
            key={image}
            src={image}
            alt="Medi-Caps University Campus"
            className={`campus-photo absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
              currentImage === index ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}

        {/* Very subtle bottom gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />

        {/* Small university logo */}
        <div className="absolute left-8 top-8 z-10">
          <div className="rounded-xl bg-white/95 p-3 shadow-lg">
            <img
              src={logoUrl}
              alt="Medi-Caps University"
              className="h-12 w-auto max-w-[190px] object-contain"
            />
          </div>
        </div>

        {/* Minimal branding only */}
        <div className="absolute bottom-10 left-10 z-10">
          <p className="text-3xl font-bold tracking-tight text-white drop-shadow-lg">
            CampusFix
          </p>
          <p className="mt-1 text-sm text-white/90">
            Medi-Caps University
          </p>
        </div>

        {/* Slideshow indicators */}
        <div className="absolute bottom-12 right-10 z-10 flex gap-2">
          {campusImages.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentImage(index)}
              aria-label={`Show campus image ${index + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentImage === index
                  ? "w-7 bg-white"
                  : "w-1.5 bg-white/60"
              }`}
            />
          ))}
        </div>
      </section>

      {/* RIGHT: REGISTRATION */}
      <section className="form-enter flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 py-7 sm:px-8 lg:px-6 xl:px-12">
        <div className="w-full max-w-[630px]">
          {/* Mobile branding */}
          <div className="mb-6 flex items-center justify-center gap-3 lg:hidden">
            <img
              src={logoUrl}
              alt="Medi-Caps University"
              className="h-10 w-auto max-w-[150px] object-contain"
            />

            <div className="h-8 w-px bg-slate-200" />

            <span className="text-lg font-bold text-slate-800">
              CampusFix
            </span>
          </div>

          {/* Compact card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_45px_rgba(15,23,42,0.07)] sm:p-7">
            {/* Heading */}
            <div className="mb-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[1.5px] text-blue-600">
                Student Portal
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
                {step === 1 && "Create your account"}
                {step === 2 && "Verify your email"}
                {step === 3 && "Set your password"}
              </h1>

              <p className="mt-1.5 text-sm leading-5 text-slate-500">
                {step === 1 &&
                  "Enter your student details to get started."}
                {step === 2 &&
                  "Enter the OTP sent to your college email."}
                {step === 3 &&
                  "Create a secure password for your account."}
              </p>
            </div>

            <StepIndicator />

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {/* Success */}
            {message && (
              <div
                role="status"
                className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700"
              >
                {message}
              </div>
            )}

            {/* STEP 1 */}
            {step === 1 && (
              <form
                key="details"
                onSubmit={handleRegister}
                className="step-enter space-y-3.5"
              >
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <FormField
                    label="Full Name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                  />

                  <FormField
                    label="Enrollment Number"
                    name="enrollmentNumber"
                    value={form.enrollmentNumber}
                    onChange={handleChange}
                    placeholder="Enrollment number"
                  />

                  <div className="sm:col-span-2">
                    <FormField
                      label="College Email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="name@medicaps.ac.in"
                    />
                  </div>

                  <FormField
                    label="Mobile Number"
                    name="phoneNumber"
                    type="tel"
                    value={form.phoneNumber}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                  />

                  <FormField
                    label="Department"
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    placeholder="Department"
                  />

                  <FormField
                    label="Branch"
                    name="branch"
                    value={form.branch}
                    onChange={handleChange}
                    placeholder="Your branch"
                  />

                  <div>
                    <label htmlFor="semester" className={labelClass}>
                      Semester <span className="text-red-500">*</span>
                    </label>

                    <select
                      id="semester"
                      name="semester"
                      value={form.semester}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    >
                      <option value="">Select semester</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                        <option key={sem} value={sem}>
                          Semester {sem}
                        </option>
                      ))}
                    </select>
                  </div>

                  <FormField
                    label="Class / Section"
                    name="classSection"
                    value={form.classSection}
                    onChange={handleChange}
                    placeholder="e.g. A"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 hover:shadow-lg hover:shadow-blue-700/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Sending OTP..." : "Continue"}
                  {!loading && <span>→</span>}
                </button>
              </form>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <form
                key="verification"
                onSubmit={handleVerifyOTP}
                className="step-enter"
              >
                <div className="mb-5 rounded-xl bg-blue-50 p-4">
                  <p className="text-sm font-medium text-slate-700">
                    Verification code sent to
                  </p>

                  <p className="mt-1 break-all text-sm font-semibold text-blue-700">
                    {form.email}
                  </p>
                </div>

                <label htmlFor="emailOTP" className={labelClass}>
                  Enter 6-digit OTP
                </label>

                <input
                  id="emailOTP"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={emailOTP}
                  onChange={(e) =>
                    setEmailOTP(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="000000"
                  className={`${inputClass} text-center text-xl font-bold tracking-[10px]`}
                  required
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 w-full rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-60"
                >
                  {loading ? "Verifying..." : "Verify Email →"}
                </button>

                <button
                  type="button"
                  onClick={goBack}
                  className="mt-3 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  ← Back
                </button>
              </form>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <form
                key="password"
                onSubmit={handleCompleteRegistration}
                className="step-enter"
              >
                <div className="mb-5 rounded-lg bg-emerald-50 px-3.5 py-3">
                  <p className="text-sm font-semibold text-emerald-700">
                    ✓ Email successfully verified
                  </p>
                  <p className="mt-1 break-all text-xs text-emerald-700">
                    {form.email}
                  </p>
                </div>

                <div className="mb-4">
                  <label htmlFor="password" className={labelClass}>
                    Create Password
                  </label>

                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className={`${inputClass} pr-16`}
                      required
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-blue-600"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {/* Password strength */}
                <div className="mb-4 rounded-lg bg-slate-50 p-3.5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">
                      Password requirements
                    </span>
                    <span className="text-xs font-semibold text-blue-600">
                      {passwordStrength}/5
                    </span>
                  </div>

                  <div className="mb-3 flex gap-1">
                    {passwordChecks.map((item, index) => (
                      <div
                        key={index}
                        className={`h-1.5 flex-1 rounded-full ${
                          item.valid ? "bg-emerald-500" : "bg-slate-200"
                        }`}
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-x-2 gap-y-2">
                    {passwordChecks.map((item, index) => (
                      <p
                        key={index}
                        className={`text-xs ${
                          item.valid ? "text-emerald-700" : "text-slate-500"
                        }`}
                      >
                        {item.valid ? "✓" : "○"} {item.label}
                      </p>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className={labelClass}>
                    Confirm Password
                  </label>

                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) =>
                        setConfirmPassword(e.target.value)
                      }
                      placeholder="Confirm your password"
                      className={`${inputClass} pr-16`}
                      required
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-blue-600"
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {confirmPassword && (
                  <p
                    className={`mt-2 text-xs ${
                      password === confirmPassword
                        ? "text-emerald-600"
                        : "text-red-500"
                    }`}
                  >
                    {password === confirmPassword
                      ? "✓ Passwords match"
                      : "Passwords do not match"}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 w-full rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-60"
                >
                  {loading ? "Creating Account..." : "Create Account ✓"}
                </button>

                <button
                  type="button"
                  onClick={goBack}
                  className="mt-3 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  ← Back
                </button>
              </form>
            )}

            {/* Login link */}
            <div className="mt-5 border-t border-slate-100 pt-4 text-center">
              <p className="text-sm text-slate-500">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="font-semibold text-blue-700 hover:text-blue-900"
                >
                  Login
                </button>
              </p>
            </div>
          </div>

          <p className="mt-5 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} CampusFix · Medi-Caps University
          </p>
        </div>
      </section>
    </div>
  );
}

export default Register;
