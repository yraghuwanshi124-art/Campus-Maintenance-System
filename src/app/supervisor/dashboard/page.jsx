import ProtectedRoute from "../../../components/ProtectedRoute";
import SupervisorDashboard from "../../../views/SupervisorDashboard";

export default function Page() {
  return (
    <ProtectedRoute allowedRole="supervisor">
      <SupervisorDashboard />
    </ProtectedRoute>
  );
}
