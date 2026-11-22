"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function ProtectedRoute({ children, allowedRole, allowedRoles }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "null");

      if (!token || !user) {
        router.replace("/");
        return;
      }

      if (allowedRole && user.role !== allowedRole) {
        router.replace("/");
        return;
      }

      if (allowedRoles && Array.isArray(allowedRoles) && !allowedRoles.includes(user.role)) {
        router.replace("/");
        return;
      }

      setAuthorized(true);
    } catch {
      router.replace("/");
    }
  }, [router, allowedRole, allowedRoles]);

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
