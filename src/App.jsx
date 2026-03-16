import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ResidentDashboard from "./pages/Resident/ResidentDashboard";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import SubmitReport from "./pages/Resident/SubmitReport";
import MyReports from "./pages/resident/MyReports";
import Notifications from "./pages/Resident/Notifications";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/resident" element={<ResidentDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/submit-report" element={<SubmitReport />} />
        <Route path="/my-reports" element={<MyReports />} />
        <Route path="/notifications" element={<Notifications />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;