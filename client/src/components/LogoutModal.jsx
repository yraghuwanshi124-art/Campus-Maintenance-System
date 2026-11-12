import { useNavigate } from "react-router-dom";

function LogoutModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLogout = () => {
    // Remove login data
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Close modal
    if (onClose) {
      onClose();
    }

    // Go to login/home page
    navigate("/", { replace: true });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">

        {/* Top Illustration */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-6 py-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/15 text-5xl shadow-inner backdrop-blur-sm">
            👋
          </div>
        </div>

        {/* Content */}
        <div className="px-7 py-7 text-center">
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">
            Ready to leave?
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Are you sure you want to logout from
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              {" "}CampusFix
            </span>
            ?
          </p>

          {/* Buttons */}
          <div className="mt-7 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex-1 rounded-xl bg-red-600 px-4 py-3 font-bold text-white shadow-sm transition hover:bg-red-700 hover:shadow-md"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LogoutModal;