import ProtectedRoute from "../../../components/ProtectedRoute";
import AdminComplaints from "../../../views/AdminComplaints";

export default function Page() {
  return (
    <ProtectedRoute allowedRole="admin">
      <AdminComplaints />
    </ProtectedRoute>
  );
}
