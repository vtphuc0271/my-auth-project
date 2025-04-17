import axios from "axios";
import { API_URL } from "../config";
import Cookies from "js-cookie";

// Tạo instance axios
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: đính kèm CSRF token
api.interceptors.request.use(
  (config) => {
    const csrf = Cookies.get("X-CSRF-TOKEN");
    console.log("Cookies trước yêu cầu:", Cookies.get());
    console.log("Request headers:", { ...config.headers, "X-CSRF-TOKEN": csrf });
    if (csrf) {
      config.headers["X-CSRF-TOKEN"] = csrf;
    } else {
      console.warn("Không tìm thấy X-CSRF-TOKEN trong cookies.");
    }
    return config;
  },
  (error) => {
    console.error("Lỗi interceptor yêu cầu:", error);
    return Promise.reject(error);
  }
);

// Response interceptor: bắt lỗi 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Token hết hạn hoặc chưa đăng nhập.");
      Cookies.remove("X-CSRF-TOKEN");
      localStorage.setItem("isLoggedIn", "false");
    }
    return Promise.reject(error);
  }
);

// Đăng nhập
export const login = async ({ phoneNumber, password }) => {
  try {
    const response = await api.post("/Auth/login", { phoneNumber, password });
    console.log("Phản hồi đăng nhập:", response.data);
    console.log("Cookies sau đăng nhập:", Cookies.get());
    if (response.data.success) {
      const result = response.data.data;
      localStorage.setItem("isLoggedIn", "true");
      return {
        requiresOtp: true,
        userId: result.userId,
        otpCode: result.otpCode,
      };
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    const message =
      error.response?.data?.message ||
      "Đăng nhập thất bại. Vui lòng kiểm tra thông tin đăng nhập.";
    localStorage.setItem("isLoggedIn", "false");
    console.error("Lỗi đăng nhập:", error);
    throw new Error(message);
  }
};

// Xác thực OTP
export const verifyOtp = async ({ userId, otpCode }) => {
  console.log("Gửi xác thực OTP:", { userId, otpCode });
  try {
    const response = await api.post("/Auth/verify-otp", { userId, otpCode });
    console.log("Phản hồi xác thực OTP:", response.data);
    localStorage.setItem("isLoggedIn", "true");
    return response.data;
  } catch (error) {
    console.error("Lỗi xác thực OTP:", error.response?.data || error);
    const message = error.response?.data?.message || "Xác thực OTP thất bại.";
    throw new Error(message);
  }
};

// Gửi OTP để đặt lại mật khẩu
export const requestOtpResetPassword = async (phoneNumber) => {
  const response = await api.post("/User/otp-reset-password", { phoneNumber });
  return response.data;
};

// Đặt lại mật khẩu
export const resetPassword = async (phoneNumber, otpCode, password, confirmNewPassword) => {
  if (password !== confirmNewPassword) {
    console.warn("Mật khẩu xác nhận không khớp:", { password, confirmNewPassword });
    throw new Error("Mật khẩu xác nhận không khớp.");
  }

  const data = {
    phoneNumber,
    otpCode,
    newPassword: password,
  };

  console.log("Đặt lại mật khẩu với dữ liệu:", data);
  try {
    const response = await api.post("/user/reset-password", data);
    console.log("Phản hồi đặt lại mật khẩu:", response.data);
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message || "Đặt lại mật khẩu thất bại.";
    console.error("Lỗi đặt lại mật khẩu:", error.response?.data || error);
    throw new Error(message);
  }
};


// Đặt lại tên người dùng
export const updateName = async (data) => {
  try {
    const response = await api.post("/User/update-name", data);
    console.log("Phản hồi cập nhật tên:", response.data);
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message || "Cập nhật tên người dùng thất bại";
    console.error("Lỗi cập nhật tên:", error.response?.data || error);
    throw new Error(message);
  }
};
// Lấy user hiện tại
export const getCurrentUser = async () => {
  try {
    const response = await api.get("/Auth/me", { withCredentials: true });
    console.log("Phản hồi lấy user hiện tại:", response.data);
    return response.data;
  } catch (error) {
    console.error("Lỗi lấy user hiện tại:", error.response?.data || error);
    return null;
  }
};

// Đăng xuất
export const logout = async () => {
  try {
    await api.post("/Auth/logout");
    localStorage.setItem("isLoggedIn", "false");
    Cookies.remove("X-CSRF-TOKEN");
  } catch (error) {
    const message = error.response?.data?.message || "Đăng xuất thất bại";
    throw new Error(message);
  }
};

// Đăng ký user mới
export const register = async (data) => {
  try {
    const response = await api.post("/User/register", data);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Đăng ký thất bại";
    throw new Error(message);
  }
};

// Cập nhật mật khẩu
export const updatePassword = async (data) => {
  console.log("Cập nhật mật khẩu:", data);
  try {
    const response = await api.post("/User/update-password", data);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Cập nhật mật khẩu thất bại";
    throw new Error(message);
  }
};

// Tạo mã QR
export const generateQrCode = async () => {
  try {
    const response = await api.post("/Auth/generate-qr-code");
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    const message = error.response?.data?.message || "Tạo mã QR thất bại.";
    console.error("Lỗi tạo mã QR:", error);
    throw new Error(message);
  }
};

export default api;