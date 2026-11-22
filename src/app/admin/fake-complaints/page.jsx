import ProtectedRoute from "../../../components/ProtectedRoute";
import AdminFakeComplaints from "../../../views/AdminFakeComplaints";

export default function Page() {
  return (
    <ProtectedRoute allowedRole="admin">
      <AdminFakeComplaints />
    </ProtectedRoute>
  );
}
