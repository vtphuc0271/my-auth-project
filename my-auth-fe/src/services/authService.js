// src/services/authService.js
import axios from "axios";
import { API_URL } from "../config";

// Tạo một instance chung (có thể thêm interceptor nếu cần sau này)
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Gửi cookie theo mặc định
});

// Đăng nhập
export const login = async ({ username, password }) => {
  try {
    // Gửi yêu cầu đăng nhập
    await api.post("/api/Auth/login", { username, password });

    // Lấy thông tin user sau khi đăng nhập thành công
    const response = await api.get("/api/Auth/me");
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message || "Đăng nhập thất bại";
    throw new Error(message);
  }
};

// Đăng xuất
export const logout = async () => {
  try {
    await api.post("/api/Auth/logout");
  } catch (error) {
    const message =
      error.response?.data?.message || "Đăng xuất thất bại";
    throw new Error(message);
  }
};

// Lấy user hiện tại (khi reload trang)
export const getCurrentUser = async () => {
  try {
    const response = await api.get("/api/Auth/me");
    return response.data;
  } catch (error) {
    throw error; // Cho phép context xử lý cụ thể 401
  }
};

// Đăng ký user mới
export const register = async (data) => {
  try {
    const response = await api.post("/api/User/register", data);
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message || "Đăng ký thất bại";
    throw new Error(message);
  }
};
