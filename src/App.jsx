import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ResidentDashboard from "./pages/Resident/ResidentDashboard";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import SubmitReport from "./pages/Resident/SubmitReport";
import MyReports from "./pages/Resident/MyReports";
import History from "./pages/Resident/History";
import Settings from "./pages/Resident/Settings";
import Profile from "./pages/Resident/Profile";
import Notifications from "./pages/Resident/Notifications";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/resident"
          element={
            <ProtectedRoute allowedRoles={["resident"]}>
              <ResidentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/submit-report"
          element={
            <ProtectedRoute allowedRoles={["resident"]}>
              <SubmitReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-reports"
          element={
            <ProtectedRoute allowedRoles={["resident"]}>
              <MyReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute allowedRoles={["resident"]}>
              <History />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={["resident"]}>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={["resident"]}>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute allowedRoles={["resident"]}>
              <Notifications />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
