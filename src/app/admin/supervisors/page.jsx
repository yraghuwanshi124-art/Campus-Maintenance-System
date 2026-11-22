import ProtectedRoute from "../../../components/ProtectedRoute";
import AdminSupervisors from "../../../views/AdminSupervisors";

export default function Page() {
  return (
    <ProtectedRoute allowedRole="admin">
      <AdminSupervisors />
    </ProtectedRoute>
  );
}
