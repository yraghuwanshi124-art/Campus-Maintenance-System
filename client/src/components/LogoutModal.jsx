import { useNavigate } from "react-router-dom";
import { LogOut, X } from "lucide-react";

function LogoutModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    if (onClose) {
      onClose();
    }

    navigate("/", { replace: true });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm transition"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Top Header with Icon */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 px-6 py-8 text-center text-white">
          <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-indigo-500/20 blur-xl"></div>
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-white shadow-inner backdrop-blur-md border border-white/20">
            <LogOut className="h-7 w-7 text-indigo-300" />
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 text-center">
          <h2 className="text-xl font-black tracking-tight text-slate-900">
            Sign out of CampusFix?
          </h2>

          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            You will be signed out from your active session. You can sign back in at any time.
          </p>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-rose-700 active:scale-95"
            >
              Confirm Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LogoutModal;
