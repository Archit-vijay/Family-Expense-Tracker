import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function ProtectedRoute() {
  const { isAuthenticated, hasFamily } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // If user is authenticated but has no family yet, and trying to access main app pages
  if (hasFamily === false && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  // If user already has a family and visits /onboarding, redirect to /dashboard
  if (hasFamily === true && location.pathname === "/onboarding") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
