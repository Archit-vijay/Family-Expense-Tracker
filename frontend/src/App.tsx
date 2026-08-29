import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Budgets from "./pages/Budgets";
import Reports from "./pages/Reports";
import Family from "./pages/Family";
import Settings from "./pages/Settings";
import Login from "./pages/Login";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public routes */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route
              path="/dashboard"
              element={<Dashboard />}
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
              path="/reports"
              element={<Reports />}
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

        {/* Unknown routes */}
        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;