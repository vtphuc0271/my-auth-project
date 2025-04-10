import React, { createContext, useContext, useState, useEffect } from "react";
import { login, logout, getCurrentUser } from "../services/authService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Khởi tạo false thay vì null
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);

  // Kiểm tra trạng thái đăng nhập khi khởi động
  const checkAuth = async () => {
    setLoading(true); // Đặt lại loading để tránh hiển thị giao diện chưa sẵn sàng
    try {
      const currentUser = await getCurrentUser();
      setIsAuthenticated(true);
      setUsername(currentUser.username);
    } catch (error) {
      if (error.response?.status === 401) {
        setUsername(null);
        // Chưa đăng nhập, không coi là lỗi nghiêm trọng
        setIsAuthenticated(false);
      } else {
        // Lỗi khác (ví dụ: server down)
        console.error("Check auth error:", error.message);
        setIsAuthenticated(false);
        setUsername(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // Gọi checkAuth khi khởi động
  useEffect(() => {
    checkAuth();
  }, []);

  // Hàm đăng nhập
  const loginHandler = async (username, password) => {
    try {
      const user = await login({ username, password });
      setIsAuthenticated(true);
      setUsername(user.username);
      return user; // Trả về user để component gọi biết kết quả
    } catch (error) {
      setIsAuthenticated(false);
      setUsername(null);
      throw error; // Ném lỗi để component xử lý (ví dụ: hiển thị thông báo lỗi)
    }
  };

  // Hàm đăng xuất
  const logoutHandler = async () => {
    try {
      await logout();
      setIsAuthenticated(false);
      setUsername(null);
    } catch (error) {
      console.error("Logout failed:", error.message);
      setIsAuthenticated(false);
      setUsername(null);
      // Không throw lỗi vì logout thất bại vẫn nên coi như đã logout ở client
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        username,
        login: loginHandler,
        logout: logoutHandler,
        loading,
      }}
    >
      {loading ? <div>Loading...</div> : children} {/* Hiển thị loading nếu cần */}
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