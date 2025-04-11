import React, { createContext, useContext, useState, useEffect } from "react";
import {
  login as loginAPI,
  logout as logoutAPI,
  getCurrentUser,
  verifyOtp,
} from "../services/authService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);

  const setUser = (user) => {
    setIsAuthenticated(!!user);
    setUsername(user?.username || null);
  };

  // Gọi API để kiểm tra user hiện tại (dành cho load lại trang)
  const checkAuth = async () => {
    setLoading(true);
    try {
      const user = await getCurrentUser();
      setUser(user);
    } catch (error) {
      if (error.response?.status !== 401) {
        console.error("Check auth error:", error.message);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (isLoggedIn) {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, []);

  // Đăng nhập
  const login = async (username, password) => {
    try {
      const result = await loginAPI({ username, password });
      if (result.requiresOtp) {
        // Trả về thông tin cần OTP để component xử lý
        return {
          requiresOtp: true,
          userId: result.userId,
          otpCode: result.otpCode, // Chỉ có khi mock
        };
      } else {
        // Không cần OTP, cập nhật state
        setUser(result.user.data);
        return { requiresOtp: false };
      }
    } catch (error) {
      setUser(null);
      localStorage.setItem("isLoggedIn", "false");
      console.error("Login failed:", error.message);
      throw error;
    }
  };

  // Xác thực OTP
  const verifyOtpHandler = async (userId, otpCode) => {
    try {
      const user = await verifyOtp({ userId, otpCode });
      setUser(user.data);
    } catch (error) {
      setUser(null);
      localStorage.setItem("isLoggedIn", "false");
      console.error("Verify OTP failed:", error.message);
      throw error;
    }
  };

  // Đăng xuất
  const logout = async () => {
    try {
      await logoutAPI();
    } catch (error) {
      console.warn("Logout failed:", error.message);
    } finally {
      setUser(null);
      localStorage.setItem("isLoggedIn", "false");
    }
  };

  const contextValue = {
    isAuthenticated,
    username,
    login,
    verifyOtp: verifyOtpHandler,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {loading ? <div>Loading...</div> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};