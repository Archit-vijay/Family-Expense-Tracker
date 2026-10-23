import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Login2FA from "./pages/Login2FA";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import AcceptInvitation from "./pages/AcceptInvitation";

import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Budgets from "./pages/Budgets";
import Recurring from "./pages/Recurring";
import Family from "./pages/Family";
import Settings from "./pages/Settings";

import AIAssistant from "./pages/AIAssistant";
import AIInsights from "./pages/AIInsights";

import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  return (
    <BrowserRouter>
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

        {/* Unknown routes redirect to landing */}
        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
