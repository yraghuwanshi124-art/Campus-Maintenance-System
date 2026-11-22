import ProtectedRoute from "../../../components/ProtectedRoute";
import StudentDashboard from "../../../views/StudentDashboard";

export default function Page() {
  return (
    <ProtectedRoute allowedRole="student">
      <StudentDashboard />
    </ProtectedRoute>
  );
}
