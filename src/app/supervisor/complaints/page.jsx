import { Suspense } from "react";
import ProtectedRoute from "../../../components/ProtectedRoute";
import SupervisorComplaints from "../../../views/SupervisorComplaints";

export default function Page() {
  return (
    <ProtectedRoute allowedRole="supervisor">
      <Suspense fallback={null}>
        <SupervisorComplaints />
      </Suspense>
    </ProtectedRoute>
  );
}
