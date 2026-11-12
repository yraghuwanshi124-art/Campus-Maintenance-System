import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

function AdminSidebar({ onLogout }) {
  const [isOpen, setIsOpen] = useState(true);
  const { darkMode, toggleTheme } = useTheme();


const menuItems = [
  {
    name: "Dashboard",
    path: "/admin",
    icon: "⌂",
  },
  {
    name: "AI Chatbot",
    path: "/admin/ai-chatbot",
    icon: "🤖",
  },
  {
    name: "Monthly Reports",
    path: "/admin/monthly-report",
    icon: "▥",
  },
  {
    name: "All Complaints",
    path: "/admin/complaints",
    icon: "▤",
  },
  {
    name: "Supervisor Management",
    path: "/admin/supervisors",
    icon: "👨‍💼",
  },
  {
    name: "Settings",
    path: "/admin/settings",
    icon: "⚙",
  },
];


  return (
    <>
      {/* ================= SIDEBAR TOGGLE ================= */}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-5 z-50 flex h-14 w-14 items-center justify-center rounded-xl border text-lg font-bold shadow-md transition-all duration-300 ${
          darkMode
            ? "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:shadow-lg"
            : "border-indigo-100 bg-white text-indigo-600 hover:bg-indigo-50 hover:shadow-lg"
        } ${isOpen ? "left-[270px]" : "left-5"}`}
        aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        {isOpen ? "‹" : "☰"}
      </button>

      {/* ================= MOBILE OVERLAY ================= */}

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-[2px] lg:hidden"
        ></div>
      )}

      {/* ================= SIDEBAR ================= */}

      <aside
        className={`fixed left-0 top-0 z-40 h-screen overflow-hidden border-r shadow-xl transition-all duration-300 ${
          darkMode
            ? "border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-200"
            : "border-indigo-100 bg-gradient-to-b from-indigo-50 via-white to-slate-50 text-slate-700"
        } ${
          isOpen
            ? "w-64 translate-x-0"
            : "w-64 -translate-x-full"
        } lg:translate-x-0 ${
          isOpen ? "lg:w-64" : "lg:w-20"
        }`}
      >
        {/* Decorative background */}
        <div
          className={`pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full blur-3xl ${
            darkMode ? "bg-indigo-950/30" : "bg-indigo-100/60"
          }`}
        ></div>

        <div
          className={`pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full blur-3xl ${
            darkMode ? "bg-indigo-950/20" : "bg-indigo-100/50"
          }`}
        ></div>

        {/* ================= BRAND ================= */}

        <div
          className={`relative flex h-24 items-center border-b backdrop-blur-sm ${
            darkMode
              ? "border-slate-800 bg-slate-900/80"
              : "border-indigo-100 bg-white/80"
          } ${
            isOpen
              ? "justify-between px-5"
              : "justify-center px-2"
          }`}
        >
          {isOpen ? (
            <div className="flex items-center gap-3">
              {/* Logo */}
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-xl font-black text-white shadow-md shadow-indigo-600/30">
                C
              </div>

              <div>
                <h1
                  className={`text-xl font-black tracking-tight ${
                    darkMode ? "text-indigo-400" : "text-indigo-700"
                  }`}
                >
                  CampusFix
                </h1>

                <p className="mt-0.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                  Admin Portal
                </p>
              </div>
            </div>
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-xl font-black text-white shadow-md shadow-indigo-600/30">
              C
            </div>
          )}
        </div>

        {/* ================= NAVIGATION ================= */}

        <nav className="relative flex-1 overflow-y-auto px-3 py-6">
          {isOpen && (
            <div className="mb-4 px-3">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                Administration
              </p>
            </div>
          )}

          <div className="space-y-2">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/admin"}
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    setIsOpen(false);
                  }
                }}
                title={!isOpen ? item.name : ""}
                className={({ isActive }) =>
                  `group relative flex items-center rounded-2xl transition-all duration-200 ${
                    isOpen
                      ? "gap-4 px-4 py-3.5"
                      : "justify-center px-2 py-3.5"
                  } ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : darkMode
                        ? "text-slate-400 hover:bg-slate-800/70 hover:text-white"
                        : "text-slate-600 hover:bg-white hover:text-indigo-600 hover:shadow-sm"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Active indicator */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-white"></span>
                    )}

                    {/* Icon */}
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-bold transition ${
                        isActive
                          ? "bg-white/15 text-white"
                          : darkMode
                            ? "bg-slate-800/80 text-slate-300 group-hover:bg-slate-700 group-hover:text-white"
                            : "bg-indigo-50 text-indigo-500 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                      }`}
                    >
                      {item.icon}
                    </span>

                    {/* Menu Name */}
                    {isOpen && (
                      <span
                        className={`truncate text-[15px] tracking-wide ${
                          isActive
                            ? "font-extrabold"
                            : "font-bold"
                        }`}
                      >
                        {item.name}
                      </span>
                    )}

                    {/* Active Dot */}
                    {isOpen && isActive && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-white"></span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* ================= BOTTOM SECTION ================= */}

        <div
          className={`absolute bottom-0 left-0 right-0 border-t backdrop-blur-sm ${
            darkMode
              ? "border-slate-800 bg-slate-900/95"
              : "border-indigo-100 bg-white/95"
          } ${isOpen ? "p-4" : "p-2"}`}
        >
          {/* Admin Profile / System Status */}
          {isOpen && (
            <div
              className={`mb-3 rounded-2xl border p-3.5 ${
                darkMode
                  ? "border-slate-800 bg-slate-800/60"
                  : "border-indigo-100 bg-indigo-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-black text-white shadow-sm">
                  A
                </div>

                <div className="min-w-0">
                  <p
                    className={`truncate text-sm font-extrabold ${
                      darkMode ? "text-white" : "text-slate-800"
                    }`}
                  >
                    Administrator
                  </p>

                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>

                    <span className="text-[10px] font-bold text-slate-400">
                      System Operational
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dark / Light Mode Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            title={!isOpen ? (darkMode ? "Light Mode" : "Dark Mode") : ""}
            className={`mb-2 flex w-full items-center rounded-xl transition-all duration-200 ${
              darkMode
                ? "text-slate-300 hover:bg-slate-800"
                : "text-slate-600 hover:bg-slate-100"
            } ${
              isOpen
                ? "gap-4 px-4 py-3"
                : "justify-center px-2 py-3"
            }`}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base transition ${
                darkMode
                  ? "bg-slate-800 text-amber-400"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {darkMode ? "☀" : "☾"}
            </span>

            {isOpen && (
              <span className="text-sm font-bold">
                {darkMode ? "Light Mode" : "Dark Mode"}
              </span>
            )}
          </button>

          {/* Logout */}
          <button
            type="button"
            onClick={onLogout}
            title={!isOpen ? "Logout" : ""}
            className={`group flex w-full items-center rounded-xl transition-all duration-200 ${
              darkMode
                ? "text-slate-400 hover:bg-red-950/30 hover:text-red-400"
                : "text-slate-600 hover:bg-red-50 hover:text-red-600"
            } ${
              isOpen
                ? "gap-4 px-4 py-3"
                : "justify-center px-2 py-3"
            }`}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base font-bold transition ${
                darkMode
                  ? "bg-slate-800 text-slate-400 group-hover:bg-red-900/40 group-hover:text-red-300"
                  : "bg-slate-50 text-slate-500 group-hover:bg-red-100 group-hover:text-red-600"
              }`}
            >
              ↪
            </span>

            {isOpen && (
              <span className="text-sm font-bold">
                Logout
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;
