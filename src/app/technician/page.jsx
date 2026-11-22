import ProtectedRoute from "../../components/ProtectedRoute";
import TechnicianDashboard from "../../views/TechnicianDashboard";

export default function Page() {
  return (
    <ProtectedRoute allowedRole="technician">
      <TechnicianDashboard />
    </ProtectedRoute>
  );
}
