// File: src/routes/authRoutes.js
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginForm from "../pages/LoginForm";
import RegisterForm from "../pages/RegisterForm";
import WelcomePage from "../pages/WelcomePage";
import { useAuth } from "../context/authContext"; // Không cần AuthProvider ở đây nữa

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  // Nếu isAuthenticated chưa được khởi tạo (null), hiển thị loading
  if (isAuthenticated === null) {
    return <div>Đang kiểm tra trạng thái đăng nhập...</div>;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={isAuthenticated ? <Navigate to="/welcome" /> : <LoginForm />}
      />
      <Route
        path="/welcome"
        element={isAuthenticated ? <WelcomePage /> : <Navigate to="/" />}
      />
      <Route path="/register" 
        element={isAuthenticated ? <WelcomePage /> : <RegisterForm />} 
      />
    </Routes>
  );
};

export default AppRoutes;