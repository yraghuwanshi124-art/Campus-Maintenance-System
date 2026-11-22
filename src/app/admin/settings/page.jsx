import ProtectedRoute from "../../../components/ProtectedRoute";
import AdminSettings from "../../../views/AdminSettings";

export default function Page() {
  return (
    <ProtectedRoute allowedRole="admin">
      <AdminSettings />
    </ProtectedRoute>
  );
}
