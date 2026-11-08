import { lazy, Suspense } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import PageLoader from "./components/PageLoader";

// Lazy-loaded routes for code-splitting and rapid initial load
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Login2FA = lazy(() => import("./pages/Login2FA"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Signup = lazy(() => import("./pages/Signup"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const AcceptInvitation = lazy(() => import("./pages/AcceptInvitation"));

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Budgets = lazy(() => import("./pages/Budgets"));
const Recurring = lazy(() => import("./pages/Recurring"));
const Family = lazy(() => import("./pages/Family"));
const Settings = lazy(() => import("./pages/Settings"));

const AIAssistant = lazy(() => import("./pages/AIAssistant"));
const AIInsights = lazy(() => import("./pages/AIInsights"));
const NotFound = lazy(() => import("./pages/NotFound"));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>

          {/* Public Landing & Marketing */}
          <Route
            path="/"
            element={<Landing />}
          />

          {/* Public Authentication routes */}
          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/login/2fa"
            element={<Login2FA />}
          />

          <Route
            path="/login-2fa"
            element={<Navigate to="/login/2fa" replace />}
          />

          <Route
            path="/reset-password"
            element={<ResetPassword />}
          />

          <Route
            path="/signup"
            element={<Signup />}
          />

          <Route
            path="/invite/:token"
            element={<AcceptInvitation />}
          />

          {/* Protected Onboarding Flow (Full-screen, outside DashboardLayout) */}
          <Route element={<ProtectedRoute />}>
            <Route
              path="/onboarding"
              element={<Onboarding />}
            />
          </Route>

          {/* Protected Main Application (Inside DashboardLayout) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<ErrorBoundary><DashboardLayout /></ErrorBoundary>}>

              <Route
                path="/dashboard"
                element={<Dashboard />}
              />

              <Route
                path="/ai-assistant"
                element={<AIAssistant />}
              />

              <Route
                path="/insights"
                element={<AIInsights />}
              />

              <Route
                path="/ai-insights"
                element={<AIInsights />}
              />

              <Route
                path="/transactions"
                element={<Transactions />}
              />

              <Route
                path="/budgets"
                element={<Budgets />}
              />

              <Route
                path="/recurring"
                element={<Recurring />}
              />

              <Route
                path="/reports"
                element={<Navigate to="/insights" replace />}
              />

              <Route
                path="/family"
                element={<Family />}
              />

              <Route
                path="/settings"
                element={<Settings />}
              />

            </Route>
          </Route>

          {/* Branded 404 Not Found Page */}
          <Route
            path="*"
            element={<NotFound />}
          />

        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
