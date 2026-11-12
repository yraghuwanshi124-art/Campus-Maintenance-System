import React, { useState } from "react";
import AdminSidebar from "../components/AdminSidebar";
import LogoutModal from "../components/LogoutModal";
import CampusFixChatbot from "../components/CampusFixChatbot";
import { useTheme } from "../context/ThemeContext";

function AdminAIChatbot() {
  const [showLogout, setShowLogout] = useState(false);
  const { darkMode } = useTheme();

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"
      }`}
    >
      <AdminSidebar onLogout={() => setShowLogout(true)} />

      <div className="lg:ml-64 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-6xl">
          <CampusFixChatbot darkMode={darkMode} />
        </div>
      </div>

      {showLogout && (
        <LogoutModal
          isOpen={showLogout}
          onClose={() => setShowLogout(false)}
        />
      )}
    </div>
  );
}

export default AdminAIChatbot;