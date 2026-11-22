import ProtectedRoute from "../../../components/ProtectedRoute";
import AdminMonthlyReport from "../../../views/AdminMonthlyReport";

export default function Page() {
  return (
    <ProtectedRoute allowedRole="admin">
      <AdminMonthlyReport />
    </ProtectedRoute>
  );
}
