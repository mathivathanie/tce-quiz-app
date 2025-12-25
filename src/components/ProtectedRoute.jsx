import React from "react";
import { Navigate } from "react-router-dom";
import LogoutButton from "./LogoutButton";

const ProtectedRoute = ({ children, role }) => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (role && user.role !== role) {
    return <Navigate to="/login" replace />;
  }

  // Don't show LogoutButton for SuperAdmin (it has its own)
  if (role === 'superadmin') {
    return <div>{children}</div>;
  }

  return (
    <div>
      <LogoutButton />
      {children}
    </div>
  );
};

export default ProtectedRoute;
