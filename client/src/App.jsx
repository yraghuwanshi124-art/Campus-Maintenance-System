
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import TechnicianDashboard from "./pages/TechnicianDashboard";
import ComplaintForm from "./pages/ComplaintForm";
import MyComplaints from "./pages/MyComplaints";
import Register from "./pages/Register";
import VerifyOTP from "./pages/VerifyOTP";

import ProtectedRoute from "./components/ProtectedRoute";

import AdminMonthlyReport from "./pages/AdminMonthlyReport";
import AdminComplaints from "./pages/AdminComplaints";
import AdminSettings from "./pages/AdminSettings";
import AdminAIChatbot from "./pages/AdminAIChatbot";

import SupervisorDashboard from "./pages/SupervisorDashboard";
import SupervisorTechnicians from "./pages/SupervisorTechnicians";
import SupervisorComplaints from "./pages/SupervisorComplaints";
import SupervisorAIChatbot from "./pages/SupervisorAIChatbot";

import Notifications from "./pages/Notifications";

import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import { ThemeProvider } from "./context/ThemeContext";

// Supervisor Management
import AdminSupervisors from "./pages/AdminSupervisors";

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* ==================== AUTH ==================== */}

          <Route path="/" element={<Login />} />

          <Route path="/register" element={<Register />} />

          <Route path="/verify-otp" element={<VerifyOTP />} />

          <Route
            path="/forgot-password"
            element={<ForgotPassword />}
          />

          <Route
            path="/reset-password"
            element={<ResetPassword />}
          />

          {/* ==================== STUDENT ==================== */}

          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/report"
            element={
              <ProtectedRoute allowedRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/complaints"
            element={
              <ProtectedRoute allowedRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          {/* ==================== ADMIN ==================== */}

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/monthly-report"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminMonthlyReport />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/complaints"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminComplaints />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminSettings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/ai-chatbot"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminAIChatbot />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/supervisors"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminSupervisors />
              </ProtectedRoute>
            }
          />

          {/* ==================== TECHNICIAN ==================== */}

          <Route
            path="/technician"
            element={
              <ProtectedRoute allowedRole="technician">
                <TechnicianDashboard />
              </ProtectedRoute>
            }
          />

          {/* ==================== SUPERVISOR ==================== */}

          <Route
            path="/supervisor/dashboard"
            element={
              <ProtectedRoute allowedRole="supervisor">
                <SupervisorDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/supervisor/complaints"
            element={
              <ProtectedRoute allowedRole="supervisor">
                <SupervisorComplaints />
              </ProtectedRoute>
            }
          />

          <Route
            path="/supervisor/technicians"
            element={
              <ProtectedRoute allowedRole="supervisor">
                <SupervisorTechnicians />
              </ProtectedRoute>
            }
          />

          <Route
            path="/supervisor/notifications"
            element={
              <ProtectedRoute allowedRole="supervisor">
                <Notifications />
              </ProtectedRoute>
            }
          />

          <Route
            path="/supervisor/ai-chatbot"
            element={
              <ProtectedRoute allowedRole="supervisor">
                <SupervisorAIChatbot />
              </ProtectedRoute>
            }
          />

          {/* ==================== UNKNOWN URL ==================== */}

          <Route path="*" element={<Login />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
