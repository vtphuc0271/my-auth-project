// src/context/authContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  login as loginAPI,
  logout as logoutAPI,
  getCurrentUser,
  verifyOtp,
  generateQrCode, // Thêm import
} from "../services/authService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);

  const setUser = (user) => {
    setIsAuthenticated(!!user);
    setUsername(user?.username || null);
    localStorage.setItem("isLoggedIn", !!user ? "true" : "false");
  };

  // Kiểm tra trạng thái đăng nhập
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
        return {
          requiresOtp: true,
          userId: result.userId,
          otpCode: result.otpCode,
        };
      } else {
        setUser(result.user.data);
        return { requiresOtp: false };
      }
    } catch (error) {
      setUser(null);
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
    }
  };

  // Polling kiểm tra trạng thái đăng nhập sau khi quét QR
  useEffect(() => {
    let interval;
    if (!isAuthenticated) {
      interval = setInterval(async () => {
        try {
          const user = await getCurrentUser();
          if (user) {
            setUser(user.data); // Cập nhật user nếu đăng nhập thành công
          }
        } catch (error) {
          if (error.response?.status !== 401) {
            console.error("Check auth error:", error.message);
          }
        }
      }, 5000); // Kiểm tra mỗi 5 giây
    }
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const contextValue = {
    isAuthenticated,
    username,
    login,
    verifyOtp: verifyOtpHandler,
    generateQrCode, // Thêm vào context
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