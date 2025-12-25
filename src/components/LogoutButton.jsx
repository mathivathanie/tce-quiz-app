import React from "react";
import { useNavigate } from "react-router-dom";

const LogoutButton = () => {
  const navigate = useNavigate();
  const API_BASE_URL = 'http://localhost:3001';

  const handleLogout = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      
      // Update logout status on server if user exists
      if (user && user.email) {
        await fetch(`${API_BASE_URL}/api/user/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email })
        }).catch(err => console.error('Logout API error:', err));
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem("user");
      navigate("/login", { replace: true });
    }
  };

  return (
    <button
      onClick={handleLogout}
      style={{
        position: "absolute",
        top: 10,
        right: 10,
        padding: "5px 10px",
        background: "#f44336",
        color: "#fff",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
      }}
    >
      Logout
    </button>
  );
};

export default LogoutButton;
