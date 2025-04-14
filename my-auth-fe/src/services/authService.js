// src/services/authService.js
import axios from "axios";
import { API_URL } from "../config";
import Cookies from "js-cookie";

// Tạo một instance axios
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Gửi cookie theo mặc định
});

// Request interceptor: đính kèm CSRF token từ cookie vào header
api.interceptors.request.use(
  (config) => {
    const csrf = Cookies.get("X-CSRF-TOKEN");
    if (csrf) {
      config.headers["X-CSRF-TOKEN"] = csrf;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: bắt lỗi 401 toàn cục
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Token hết hạn hoặc chưa đăng nhập.");
      localStorage.setItem("isLoggedIn", "false");
    }
    return Promise.reject(error);
  }
);

// Đăng nhập
export const login = async ({ username, password }) => {
  try {
    const response = await api.post("/api/Auth/login", { username, password });
    if (response.data.success) {
      const result = response.data.data;
      localStorage.setItem("isLoggedIn", "true");
      if (result && result.requiresOtp) {
        // Cần OTP
        return {
          requiresOtp: true,
          userId: result.userId,
          otpCode: result.otpCode, // Chỉ có khi mock
        };
      } else {
        // Không cần OTP, lấy thông tin user ngay
        const userResponse = await getCurrentUser();
        localStorage.setItem("isLoggedIn", "true");
        return {
          requiresOtp: false,
          user: userResponse,
        };
      }
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    const message = error.response?.data?.message || "Đăng nhập thất bại. Vui lòng kiểm tra thông tin đăng nhập.";
    localStorage.setItem("isLoggedIn", "false");
    console.error("Login error:", error);
    throw new Error(message);
  }
};



// Xác thực OTP
export const verifyOtp = async ({ userId, otpCode }) => {
  localStorage.setItem("isVerifying", "true");
  try {
    const response = await api.post("/api/Auth/verify-otp", { userId, otpCode });
    if (response.data.success) {
      const userResponse = await getCurrentUser();
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("isVerifying", "false");
      return userResponse;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    const message = error.response?.data?.message || "Xác thực OTP thất bại.";
    console.error("Verify OTP error:", error);
    localStorage.setItem("isVerifying", "false");
    throw new Error(message);
  }
};

// Lấy user hiện tại
export const getCurrentUser = async () => {
  try {
    if(localStorage.getItem("isLoggedIn") === "true" && localStorage.getItem("isVerifying") === "false") {
      const response = await api.get("/api/Auth/me", { withCredentials: true });
    return response.data;
  }
  } catch (error) {
    throw error;
  }
};

// Đăng xuất
export const logout = async () => {
  try {
    await api.post("/api/Auth/logout");
    localStorage.setItem("isLoggedIn", "false");
  } catch (error) {
    const message = error.response?.data?.message || "Đăng xuất thất bại";
    throw new Error(message);
  }
};

// Đăng ký user mới
export const register = async (data) => {
  try {
    const response = await api.post("/api/User/register", data);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Đăng ký thất bại";
    throw new Error(message);
  }
};

// Tạo mã QR
export const generateQrCode = async () => {
  try {
    const response = await api.post("/api/Auth/generate-qr-code");
    if (response.data.success) {
      return response.data.data; // Trả về qrCode (chuỗi)
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    const message = error.response?.data?.message || "Tạo mã QR thất bại.";
    console.error("Generate QR code error:", error);
    throw new Error(message);
  }
};

export default api;