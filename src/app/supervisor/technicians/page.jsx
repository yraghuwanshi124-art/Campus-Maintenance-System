import ProtectedRoute from "../../../components/ProtectedRoute";
import SupervisorTechnicians from "../../../views/SupervisorTechnicians";

export default function Page() {
  return (
    <ProtectedRoute allowedRole="supervisor">
      <SupervisorTechnicians />
    </ProtectedRoute>
  );
}
