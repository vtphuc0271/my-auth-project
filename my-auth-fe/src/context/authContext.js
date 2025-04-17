import React, { createContext, useContext, useState, useEffect } from "react";
import {
  login as loginAPI,
  logout as logoutAPI,
  getCurrentUser,
  verifyOtp,
  generateQrCode,
} from "../services/authService";
import { Typography } from "@mui/material";
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState(null);
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isQrLoginActive, setIsQrLoginActive] = useState(false);

  const setUser = (user) => {
    console.log("Đặt thông tin người dùng:", user);
    setIsAuthenticated(!!user);
    setUsername(user?.username || null);
    localStorage.setItem("isLoggedIn", !!user ? "true" : "false");
  };

  const checkAuth = async () => {
    setLoading(true);
    try {
      const user = await getCurrentUser();
      console.log("Kết quả kiểm tra xác thực:", user);
      if (user?.success && user.data) {
        setUser(user.data);
        setRequiresOtp(false);
        setUserId(null);
      } else {
        setUser(null);
        setRequiresOtp(false);
        setUserId(null);
      }
    } catch (error) {
      console.error("Lỗi kiểm tra xác thực:", error.message);
      setUser(null);
      setRequiresOtp(false);
      setUserId(null);
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

  const login = async (phoneNumber, password) => {
    try {
      const result = await loginAPI({ phoneNumber, password });
      console.log("Kết quả đăng nhập:", result);
      if (result.userId && result.requiresOtp) {
        setRequiresOtp(true);
        setUserId(result.userId);
        return {
          requiresOtp: true,
          userId: result.userId,
          otpCode: result.otpCode,
        };
      }
      throw new Error("Đăng nhập không hỗ trợ trường hợp không yêu cầu OTP.");
    } catch (error) {
      setUser(null);
      setRequiresOtp(false);
      setUserId(null);
      throw error;
    }
  };

  const verifyOtpHandler = async (userId, otpCode) => {
    try {
      await verifyOtp({ userId, otpCode });
      const user = await getCurrentUser();
      console.log("Người dùng sau xác thực OTP:", user);
      if (user?.success && user.data) {
        setUser(user.data);
        setRequiresOtp(false);
        setUserId(null);
      } else {
        throw new Error("Không thể lấy thông tin người dùng sau khi xác thực OTP.");
      }
    } catch (error) {
      console.error("Lỗi xác thực OTP:", error.message);
      setUser(null);
      setRequiresOtp(false);
      setUserId(null);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutAPI();
    } catch (error) {
      console.warn("Đăng xuất thất bại:", error.message);
    } finally {
      setUser(null);
      setRequiresOtp(false);
      setUserId(null);
      localStorage.setItem("isLoggedIn", "false");
    }
  };

  useEffect(() => {
    let interval;
    if (!isAuthenticated && isQrLoginActive) {
      interval = setInterval(async () => {
        try {
          const user = await getCurrentUser();
          if (user?.success && user.data) {
            setUser(user.data);
            setIsQrLoginActive(false);
          }
        } catch (error) {
          if (error.response?.status !== 401) {
            console.error("Lỗi kiểm tra QR auth:", error.message);
          }
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isAuthenticated, isQrLoginActive]);

  const contextValue = {
    isAuthenticated,
    username,
    requiresOtp,
    userId,
    login,
    verifyOtp: verifyOtpHandler,
    generateQrCode,
    logout,
    loading,
    setIsQrLoginActive,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {loading ? <Typography>Đang tải...</Typography> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth phải được sử dụng trong AuthProvider");
  }
  return context;
};