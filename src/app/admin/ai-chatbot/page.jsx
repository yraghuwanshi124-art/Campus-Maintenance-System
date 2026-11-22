import ProtectedRoute from "../../../components/ProtectedRoute";
import AdminAIChatbot from "../../../views/AdminAIChatbot";

export default function Page() {
  return (
    <ProtectedRoute allowedRole="admin">
      <AdminAIChatbot />
    </ProtectedRoute>
  );
}
