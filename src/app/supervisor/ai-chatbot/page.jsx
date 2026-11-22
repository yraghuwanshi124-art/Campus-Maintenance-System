import ProtectedRoute from "../../../components/ProtectedRoute";
import SupervisorAIChatbot from "../../../views/SupervisorAIChatbot";

export default function Page() {
  return (
    <ProtectedRoute allowedRole="supervisor">
      <SupervisorAIChatbot />
    </ProtectedRoute>
  );
}
