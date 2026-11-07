import { useState, useEffect } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import medicapsLawImg from "../assets/medicaps-law.webp";

// Motion Slideshow: Present Image + Uploaded Faculty of Law Image
const slides = [
  {
    id: "main-campus",
    image: "https://www.medicaps.ac.in/public/frontend/images/home_about-img.webp",
    tag: "Medi-Caps University Campus",
    animationClass: "animate-kenburns-1",
  },
  {
    id: "faculty-of-law",
    image: medicapsLawImg,
    tag: "Medi-Caps Faculty of Law",
    animationClass: "animate-kenburns-2",
  },
];

function Login() {
  const navigate = useNavigate();

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Motion Slideshow State
  const [activeSlide, setActiveSlide] = useState(0);

  // Auto-advance motion slides every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  // Login Submission
  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      setMessage("Login successful!");

      const role = response.data.user.role;
      setTimeout(() => {
        if (role === "student") {
          navigate("/student");
        } else if (role === "admin") {
          navigate("/admin");
        } else if (role === "technician") {
          navigate("/technician");
        } else if (role === "supervisor") {
          navigate("/supervisor/dashboard");
        }
      }, 500);
    } catch (error) {
      console.log(error);
      setMessage(
        error.response?.data?.message || "Login failed. Please check your credentials."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      {/* ======================================================== */}
      {/* FULL SCREEN ANIMATED MOTION BACKGROUND                   */}
      {/* ======================================================== */}
      <div className="fixed inset-0 z-0 overflow-hidden bg-slate-950">
        {slides.map((slide, index) => {
          const isActive = index === activeSlide;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              {/* Full-Screen Edge-to-Edge Motion Image with Zoom Out */}
              <img
                key={`${slide.id}-${isActive}`}
                src={slide.image}
                alt={slide.tag}
                className={`h-full w-full object-cover ${
                  slide.id === "main-campus" ? "object-[center_68%]" : "object-center"
                } will-change-transform ${
                  isActive ? slide.animationClass : "scale-100"
                }`}
              />
            </div>
          );
        })}

        {/* Subtle, clear gradient overlays so the image is fully visible and vibrant */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-950/25 to-slate-950/50"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-slate-950/25"></div>
      </div>

      {/* ======================================================== */}
      {/* FOREGROUND CONTENT (LEFT BRANDING + RIGHT LOGIN CARD)    */}
      {/* ======================================================== */}
      <div className="relative z-10 grid min-h-screen lg:grid-cols-12">
        {/* ---------------- LEFT SIDE - BRANDING ---------------- */}
        <div className="hidden flex-col justify-between p-10 lg:col-span-7 lg:flex lg:p-16 xl:p-20 text-white">
          {/* Top Section */}
          <div>
            {/* Subtitle */}
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-200 drop-shadow">
              Medi-Caps University
            </p>

            {/* Heading */}
            <h1 className="mt-4 max-w-xl text-5xl font-extrabold leading-tight drop-shadow-lg xl:text-6xl">
              Campus Maintenance
              <span className="block text-indigo-300">
                Management System
              </span>
            </h1>

            {/* Caption */}
            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-200 drop-shadow-md">
              A centralized platform to report, track and
              manage maintenance issues across the campus.
            </p>
          </div>

          {/* Bottom Section */}
          <div>
            {/* Minimal Slide Indicators */}
            <div className="mb-5 flex items-center gap-2">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveSlide(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    idx === activeSlide
                      ? "w-8 bg-indigo-300 shadow-md shadow-indigo-300/50"
                      : "w-2 bg-white/40 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>

            {/* Indigo Divider Line */}
            <div className="mb-6 h-px w-24 bg-indigo-300 shadow-sm"></div>

            {/* Tagline */}
            <p className="text-sm font-medium text-slate-300 drop-shadow">
              Smart Campus • Faster Resolution • Better Management
            </p>
          </div>
        </div>

        {/* ---------------- RIGHT SIDE - FLOATING LOGIN CARD ---------------- */}
        <div className="flex items-center justify-center p-6 sm:p-10 lg:col-span-5 lg:p-12 xl:p-16">
          <div className="w-full max-w-md">
            {/* Mobile Branding (Visible only on small screens) */}
            <div className="mb-8 text-center lg:hidden">
              <div className="mb-4 flex justify-center">
                <img
                  src="https://www.medicaps.ac.in/public/frontend/images/medicaps-logo-fin.webp"
                  alt="Medi-Caps University"
                  className="h-14 w-auto object-contain drop-shadow-md"
                />
              </div>

              <h1 className="text-3xl font-extrabold text-white drop-shadow">
                Medi-Caps University
              </h1>

              <p className="mt-1 text-sm font-semibold text-indigo-200 drop-shadow">
                Campus Maintenance Management System
              </p>
            </div>

            {/* Production-Level Floating Glassmorphic Login Card */}
            <div className="rounded-3xl border border-white/40 bg-white/95 p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.45)] backdrop-blur-2xl ring-1 ring-black/5 sm:p-10 transition duration-300 hover:shadow-[0_30px_70px_-10px_rgba(0,0,0,0.55)]">
              {/* Card Header */}
              <div className="mb-8">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/90 px-3 py-1 text-xs font-semibold text-indigo-700 shadow-xs">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Institutional Portal</span>
                </div>

                <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
                  Welcome back
                </h2>

                <p className="mt-1.5 text-sm text-slate-500">
                  Please sign in to access your maintenance dashboard.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-5">
                {/* Email Address */}
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Email Address
                  </label>

                  <div className="group relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 transition group-focus-within:text-indigo-600">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      type="email"
                      placeholder="e.g. name@medicaps.ac.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-3.5 pl-10 pr-4 text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none transition duration-150 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-100 shadow-xs"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Password
                    </label>

                    {/* Forgot Password */}
                    <button
                      type="button"
                      onClick={() => navigate("/forgot-password")}
                      className="text-xs font-semibold text-indigo-600 transition hover:text-indigo-700 hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {/* Password Input with Show/Hide */}
                  <div className="group relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 transition group-focus-within:text-indigo-600">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-3.5 pl-10 pr-12 text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none transition duration-150 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-100 shadow-xs"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 py-3.5 px-5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 transition duration-200 hover:from-indigo-500 hover:to-indigo-600 hover:shadow-indigo-600/40 active:scale-[0.99] disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                      Signing In...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>

              {/* Register Callout */}
              <div className="mt-6 text-center">
                <p className="text-sm text-slate-500">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/register")}
                    className="font-bold text-indigo-600 transition hover:text-indigo-700 hover:underline"
                  >
                    Create an account
                  </button>
                </p>
              </div>

              {/* Feedback Alerts */}
              {message && (
                <div
                  className={`mt-5 flex items-center justify-center gap-2 rounded-xl border p-3.5 text-center text-sm font-medium shadow-xs ${
                    message === "Login successful!"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-red-200 bg-red-50 text-red-800"
                  }`}
                >
                  {message === "Login successful!" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  )}
                  <span>{message}</span>
                </div>
              )}

              {/* Security Pill */}
              <div className="mt-8 flex items-center justify-center gap-1.5 border-t border-slate-100 pt-5 text-xs text-slate-400">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span>256-Bit SSL Secured Institutional Access</span>
              </div>

              {/* Footer */}
              <div className="mt-3 text-center">
                <p className="text-xs font-semibold text-slate-600">
                  Medi-Caps University
                </p>
                <p className="text-[11px] text-slate-400">
                  Campus Maintenance Management System
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
