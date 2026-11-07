import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  Bot,
  Clock3,
  User,
  LogOut,
  ChevronLeft,
  Menu,
  GraduationCap,
  Sparkles,
} from "lucide-react";

function StudentSidebar({ onLogout, isOpen, setIsOpen }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Internal fallback if props not provided
  const [internalOpen, setInternalOpen] = useState(true);
  const openState = isOpen !== undefined ? isOpen : internalOpen;
  const toggleOpen = setIsOpen || (() => setInternalOpen(!internalOpen));

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const currentSection =
    location.pathname === "/student/report"
      ? "report"
      : location.pathname === "/student/complaints"
      ? "complaints"
      : new URLSearchParams(location.search).get("section") || "dashboard";

  const menuItems = [
    {
      id: "dashboard",
      name: "Dashboard",
      path: "/student",
      icon: LayoutDashboard,
    },
    {
      id: "report",
      name: "Report Problem",
      path: "/student/report",
      icon: PlusCircle,
    },
    {
      id: "complaints",
      name: "All Complaints",
      path: "/student/complaints",
      icon: ClipboardList,
    },
    {
      id: "chatbot",
      name: "AI Assistant",
      path: "/student?section=chatbot",
      icon: Bot,
      badge: "AI",
    },
    {
      id: "activity",
      name: "My Activity",
      path: "/student?section=activity",
      icon: Clock3,
    },
    {
      id: "profile",
      name: "My Profile",
      path: "/student?section=profile",
      icon: User,
    },
  ];

  const handleNavClick = (item) => {
    navigate(item.path);
    if (window.innerWidth < 1024) {
      if (setIsOpen) setIsOpen(false);
      else setInternalOpen(false);
    }
  };

  return (
    <>
      {/* ================= SIDEBAR TOGGLE BUTTON ================= */}
      <button
        type="button"
        onClick={() => toggleOpen(!openState)}
        className={`fixed top-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/95 text-slate-600 shadow-sm backdrop-blur-md transition-all duration-300 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 hover:shadow-md ${
          openState ? "left-[236px]" : "left-4"
        }`}
        aria-label={openState ? "Collapse sidebar" : "Expand sidebar"}
      >
        {openState ? (
          <ChevronLeft className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </button>

      {/* ================= MOBILE BACKDROP ================= */}
      {openState && (
        <div
          onClick={() => toggleOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-xs lg:hidden"
        ></div>
      )}

      {/* ================= SIDEBAR ASIDE ================= */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen overflow-hidden border-r border-slate-200/80 bg-white shadow-xl transition-all duration-300 ${
          openState ? "w-64 translate-x-0" : "w-64 -translate-x-full"
        } lg:translate-x-0 ${openState ? "lg:w-64" : "lg:w-20"}`}
      >
        {/* Subtle decorative background light */}
        <div className="pointer-events-none absolute -top-12 -left-12 h-36 w-36 rounded-full bg-indigo-50 blur-2xl"></div>

        {/* ================= BRAND HEADER ================= */}
        <div
          className={`relative flex h-20 items-center border-b border-slate-100 px-5 ${
            openState ? "justify-between" : "justify-center"
          }`}
        >
          {openState ? (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 font-bold text-white shadow-md shadow-indigo-500/20">
                <span className="text-lg tracking-tight font-black">CF</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base font-extrabold tracking-tight text-slate-900">
                    CampusFix
                  </h1>
                  <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[9px] font-bold text-indigo-600 uppercase">
                    Student
                  </span>
                </div>
                <p className="truncate text-[11px] font-medium text-slate-400">
                  Medi-Caps University
                </p>
              </div>
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-sm font-black text-white shadow-md shadow-indigo-500/20">
              CF
            </div>
          )}
        </div>

        {/* ================= NAVIGATION ================= */}
        <nav className="relative flex-1 px-3 py-6">
          {openState && (
            <div className="mb-3 px-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Student Menu
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentSection === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  title={!openState ? item.name : ""}
                  className={`group relative flex w-full items-center rounded-xl transition-all duration-200 ${
                    openState ? "gap-3 px-3.5 py-2.5" : "justify-center px-2 py-2.5"
                  } ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/20 font-semibold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600 font-medium"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                      isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-600"
                    }`}
                  />

                  {openState && (
                    <span className="truncate text-sm">{item.name}</span>
                  )}

                  {openState && item.badge && !isActive && (
                    <span className="ml-auto inline-flex items-center gap-0.5 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
                      <Sparkles className="h-2.5 w-2.5" />
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* ================= FOOTER USER / LOGOUT ================= */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-100 bg-slate-50/70 p-3.5 backdrop-blur-sm">
          {openState && (
            <div className="mb-2.5 rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-700">
                  <GraduationCap className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-800">
                    {user?.name || "Student"}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] font-medium text-slate-500 truncate">
                      {user?.enrollmentNumber || "Student Active"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onLogout}
            title={!openState ? "Sign Out" : ""}
            className={`group flex w-full items-center rounded-xl text-slate-600 transition-all duration-200 hover:bg-red-50 hover:text-red-600 ${
              openState ? "gap-3 px-3 py-2.5" : "justify-center p-2.5"
            }`}
          >
            <LogOut className="h-4 w-4 text-slate-400 transition group-hover:text-red-600" />
            {openState && <span className="text-xs font-semibold">Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

export default StudentSidebar;

