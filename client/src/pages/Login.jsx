
import { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

const campusImages = [
  "https://sunstoneprod.ctpl.io/images/sunstone_theme/Medicaps_University_IMAGE.jpeg",

  "https://www.medicaps.ac.in/uploads/school/medicaps-law-college.webp",

  "https://image-static.collegedunia.com/public/college_data/images/campusimage/1745581929Pictue-33.jpg",

  "https://www.knimbus.com/static-content/org_41ec1a01-e4f6-419d-906b-b90888112aa7/org_41ec1a01-e4f6-419d-906b-b90888112aa7_cover.jpeg",
];

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    campusImages.forEach((src) => {
      const img = new Image();
      img.src = src;
    });

    const interval = setInterval(() => {
      setActiveImage((prev) => (prev + 1) % campusImages.length);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem(
        "user",
        JSON.stringify(response.data.user)
      );

      setMessage("Login successful!");

      const role = response.data.user.role;

      if (role === "student") {
        navigate("/student");
      } else if (role === "admin") {
        navigate("/admin");
      } else if (role === "technician") {
        navigate("/technician");
      } else if (role === "supervisor") {
        navigate("/supervisor/dashboard");
      }
    } catch (error) {
      console.log(error);
      setMessage(
        error.response?.data?.message || "Login failed"
      );
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">

      {/* BACKGROUND SLIDESHOW */}
      {campusImages.map((image, index) => (
        <div
          key={image}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[1500ms] ease-in-out ${
            activeImage === index ? "opacity-100" : "opacity-0"
          }`}
          style={{ backgroundImage: `url("${image}")` }}
        />
      ))}

{/* LIGHT OVERLAY - KEEP IMAGES CLEAR */}
<div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/10" />

      {/* TOP BRANDING */}
      <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-5 py-5 sm:px-10 lg:px-14">

        <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 shadow-lg backdrop-blur-xl">
          <img
            src="https://www.medicaps.ac.in/public/frontend/images/medicaps-logo-fin.webp"
            alt="Medi-Caps University"
            className="h-16 w-auto object-contain shadow-none drop-shadow-none"
          />
        </div>

        <div className="hidden rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-xs font-semibold tracking-[0.18em] text-white shadow-lg backdrop-blur-xl sm:block">
          CAMPUS MAINTENANCE PORTAL
        </div>

      </div>

      {/* CENTER CONTENT */}
      <div className="relative z-10 flex min-h-screen items-center justify-end px-5 pb-20 pt-28 sm:px-10 lg:px-20">

        <div className="w-full max-w-[460px] lg:mr-4">

          {/* LOGIN CARD */}
          <div className="overflow-hidden rounded-[30px] border border-white/70 bg-white/95 shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-2xl">

            {/* CARD TOP ACCENT */}
            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-violet-500 to-blue-500" />

            <div className="p-7 sm:p-10">

              {/* CARD BRAND */}
              <div className="mb-8 text-center">

                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 shadow-inner">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    className="h-8 w-8 text-indigo-600"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 9h.01M15 9h.01M9 12h.01M15 12h.01"
                    />
                  </svg>
                </div>

                <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-600">
                  Medi-Caps University
                </p>

                <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                  Welcome Back
                </h1>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Sign in to access your Campus Maintenance
                  Management System.
                </p>

              </div>

              {/* LOGIN FORM */}
              <form onSubmit={handleLogin} className="space-y-5">

                {/* EMAIL */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Email Address
                  </label>

                  <div className="relative">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                    >
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="m3 7 9 6 9-6" />
                    </svg>

                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                {/* PASSWORD */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-sm font-semibold text-slate-700">
                      Password
                    </label>

                    <button
                      type="button"
                      onClick={() => navigate("/forgot-password")}
                      className="text-xs font-semibold text-indigo-600 transition hover:text-indigo-800"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <div className="relative">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                    >
                      <rect x="4" y="10" width="16" height="11" rx="2" />
                      <path
                        strokeLinecap="round"
                        d="M8 10V7a4 4 0 0 1 8 0v3"
                      />
                      <path strokeLinecap="round" d="M12 14v3" />
                    </svg>

                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
                    >
                      {showPassword ? (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="h-5 w-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A10.8 10.8 0 0 1 12 5c5.5 0 9.5 7 9.5 7a17 17 0 0 1-3.1 4.2M6.6 6.6C4 8.5 2.5 12 2.5 12s4 7 9.5 7c1 0 2-.2 2.9-.5"
                          />
                        </svg>
                      ) : (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="h-5 w-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"
                          />
                          <circle cx="12" cy="12" r="2.5" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* SIGN IN */}
                <button
                  type="submit"
                  className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4 text-sm font-bold tracking-wide text-white shadow-lg shadow-indigo-200 transition duration-300 hover:-translate-y-0.5 hover:from-indigo-700 hover:to-violet-700 hover:shadow-xl active:translate-y-0"
                >
                  Sign In
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
                  </svg>
                </button>

              </form>

              {/* REGISTER */}
              <div className="mt-7 text-center">
                <p className="text-sm text-slate-500">
                  Don't have an account?
                </p>

                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="mt-1 text-sm font-bold text-indigo-600 transition hover:text-indigo-800"
                >
                  Create an account
                </button>
              </div>

              {/* MESSAGE */}
              {message && (
                <div
                  className={`mt-5 rounded-xl px-4 py-3 text-center text-sm font-semibold ${
                    message === "Login successful!"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {message}
                </div>
              )}

              {/* FOOTER */}
              <div className="mt-8 border-t border-slate-100 pt-5 text-center">
                <p className="text-xs font-semibold text-slate-600">
                  Medi-Caps University
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Campus Maintenance Management System
                </p>
              </div>

            </div>
          </div>

          {/* SLIDESHOW INDICATORS */}
          <div className="mt-6 flex items-center justify-center gap-2">
            {campusImages.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setActiveImage(index)}
                aria-label={`Show campus image ${index + 1}`}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  activeImage === index
                    ? "w-8 bg-white"
                    : "w-2 bg-white/55 hover:bg-white"
                }`}
              />
            ))}
          </div>

        </div>
      </div>

      {/* BOTTOM BRANDING */}
      <div className="absolute bottom-4 left-0 right-0 z-10 px-4 text-center">
        <p className="text-[10px] font-medium tracking-[0.2em] text-white/80 sm:text-xs">
          SMART CAMPUS • FASTER RESOLUTION • BETTER MANAGEMENT
        </p>
      </div>

    </div>
  );
}

export default Login;
