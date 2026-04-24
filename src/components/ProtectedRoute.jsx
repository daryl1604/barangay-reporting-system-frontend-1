import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/authContext";

function readStoredUser() {
  try {
    const rawUser = localStorage.getItem("user");
    return rawUser ? JSON.parse(rawUser) : null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user } = useContext(AuthContext);
  const storedUser = readStoredUser();
  const activeUser = user || storedUser;
  const token = localStorage.getItem("token");

  if (!token || !activeUser) {
    return <Navigate to="/" replace />;
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0 && !allowedRoles.includes(activeUser.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
