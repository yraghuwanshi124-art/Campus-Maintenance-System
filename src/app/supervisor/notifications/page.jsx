import ProtectedRoute from "../../../components/ProtectedRoute";
import Notifications from "../../../views/Notifications";

export default function Page() {
  return (
    <ProtectedRoute allowedRole="supervisor">
      <Notifications />
    </ProtectedRoute>
  );
}
