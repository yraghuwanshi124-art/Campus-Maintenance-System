import { Suspense } from "react";
import ProtectedRoute from "../../../components/ProtectedRoute";
import AdminNotifications from "../../../views/AdminNotifications";

export default function Page() {
  return (
    <ProtectedRoute allowedRole="admin">
      <Suspense fallback={null}>
        <AdminNotifications />
      </Suspense>
    </ProtectedRoute>
  );
}
