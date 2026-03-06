import { Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useAppContext } from "./AppContext";
import { ExtensionProvider } from "./ExtensionContext";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import GuardDashboard from "./pages/GuardDashboard";
import ResidentDashboard from "./pages/ResidentDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";

const ProtectedRoute = ({ children, requiredRole }) => {
  const { currentUser } = useAppContext();

  if (!currentUser) {
    return <Navigate to="/" />;
  }

  if (currentUser.role !== requiredRole) {
    if (currentUser.role === "SUPERADMIN") return <Navigate to="/superadmin" />;
    if (currentUser.role === "ADMIN") return <Navigate to="/admin" />;
    if (currentUser.role === "GUARD") return <Navigate to="/guard" />;
    if (currentUser.role === "RESIDENT") return <Navigate to="/resident" />;
    return <Navigate to="/" />;
  }

  return children;
};

const AppContent = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/superadmin"
        element={
          <ProtectedRoute requiredRole="SUPERADMIN">
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/guard"
        element={
          <ProtectedRoute requiredRole="GUARD">
            <GuardDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resident"
        element={
          <ProtectedRoute requiredRole="RESIDENT">
            <ResidentDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default function App() {
  return (
    <AppProvider>
      <ExtensionProvider>
        <AppContent />
      </ExtensionProvider>
    </AppProvider>
  );
}
