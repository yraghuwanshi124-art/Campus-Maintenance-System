import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Bell,
  Bot,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  Sparkles,
  Wrench,
} from "lucide-react";

function SupervisorSidebar({ onLogout }) {
  const [isOpen, setIsOpen] = useState(true);

  const menuItems = [
    {
      name: "Dashboard",
      path: "/supervisor/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Complaints",
      path: "/supervisor/complaints",
      icon: ClipboardList,
    },
    {
      name: "Technicians",
      path: "/supervisor/technicians",
      icon: Users,
    },
    {
      name: "Notifications",
      path: "/supervisor/notifications",
      icon: Bell,
    },
    {
      name: "AI Assistant",
      path: "/supervisor/ai-chatbot",
      icon: Bot,
      badge: "AI",
    },
    {
      name: "Settings",
      path: "/supervisor/settings",
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Sidebar Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/95 text-slate-600 shadow-sm backdrop-blur-md transition-all duration-300 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 hover:shadow-md ${
          isOpen ? "left-[236px]" : "left-4"
        }`}
        aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        {isOpen ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-xs lg:hidden"
        ></div>
      )}

      {/* Sidebar Aside */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen overflow-hidden border-r border-slate-200/80 bg-white shadow-xl transition-all duration-300 ${
          isOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full"
        } lg:translate-x-0 ${isOpen ? "lg:w-64" : "lg:w-20"}`}
      >
        <div className="pointer-events-none absolute -top-12 -left-12 h-36 w-36 rounded-full bg-indigo-50 blur-2xl"></div>

        {/* Brand */}
        <div
          className={`relative flex h-20 items-center border-b border-slate-100 px-5 ${
            isOpen ? "justify-between" : "justify-center"
          }`}
        >
          {isOpen ? (
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
                    Supervisor
                  </span>
                </div>
                <p className="truncate text-[11px] font-medium text-slate-400">
                  Operations Portal
                </p>
              </div>
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-sm font-black text-white shadow-md shadow-indigo-500/20">
              CF
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="relative flex-1 px-3 py-6">
          {isOpen && (
            <div className="mb-3 px-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Operations
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/supervisor/dashboard"}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      setIsOpen(false);
                    }
                  }}
                  title={!isOpen ? item.name : ""}
                  className={({ isActive }) =>
                    `group relative flex items-center rounded-xl transition-all duration-200 ${
                      isOpen ? "gap-3 px-3.5 py-2.5" : "justify-center px-2 py-2.5"
                    } ${
                      isActive
                        ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/20 font-semibold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600 font-medium"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                          isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-600"
                        }`}
                      />

                      {isOpen && (
                        <span className="truncate text-sm">{item.name}</span>
                      )}

                      {isOpen && item.badge && !isActive && (
                        <span className="ml-auto inline-flex items-center gap-0.5 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
                          <Sparkles className="h-2.5 w-2.5" />
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Bottom Section */}
        <div
          className={`absolute bottom-0 left-0 right-0 border-t border-slate-100 bg-slate-50/70 p-3.5 backdrop-blur-sm`}
        >
          {isOpen && (
            <div className="mb-2.5 rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-700">
                  <Wrench className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-800">
                    Supervisor
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] font-medium text-slate-500">
                      On Duty
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onLogout}
            title={!isOpen ? "Sign Out" : ""}
            className={`group flex w-full items-center rounded-xl text-slate-600 transition-all duration-200 hover:bg-red-50 hover:text-red-600 ${
              isOpen ? "gap-3 px-3 py-2.5" : "justify-center p-2.5"
            }`}
          >
            <LogOut className="h-4 w-4 text-slate-400 transition group-hover:text-red-600" />
            {isOpen && <span className="text-xs font-semibold">Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

export default SupervisorSidebar;
