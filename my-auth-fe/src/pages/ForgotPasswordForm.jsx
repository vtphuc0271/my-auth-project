// src/components/ForgotPasswordForm.jsx
import React, { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  requestOtpResetPassword,
  resetPassword,
} from "../services/authService";
import useForm from "../hooks/useForm";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Snackbar,
  Alert,
  Link,
} from "@mui/material";

const ForgotPasswordForm = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // Quản lý bước: 1 (nhập số điện thoại), 2 (nhập OTP và mật khẩu mới)
  const [successMessage, setSuccessMessage] = useState(null);
  const [otp, setOtp] = useState(""); // Lưu trữ OTP trả về từ API (cho mục đích test)
  const [storedPhoneNumber, setStoredPhoneNumber] = useState("");
  // Bước 1: Validate số điện thoại
  const validatePhoneNumber = (values) => {
    const errors = {};
    if (!values.phoneNumber || values.phoneNumber.length === 0) {
      errors.phoneNumber = "Số điện thoại không được để trống";
    } else if (!/^\d{10}$/.test(values.phoneNumber)) {
      errors.phoneNumber = "Số điện thoại phải có đúng 10 chữ số";
    }
    return errors;
  };

  // Bước 2: Validate OTP và mật khẩu mới
  const validateResetPassword = (values) => {
    const errors = {};
    if (!values.otpCode || values.otpCode.length === 0) {
      errors.otpCode = "Vui lòng nhập mã OTP";
    }
    if (!values.newPassword || values.newPassword.length < 6) {
      errors.newPassword = "Mật khẩu mới phải có ít nhất 6 ký tự";
    }
    if (!values.confirmNewPassword) {
      errors.confirmNewPassword = "Vui lòng nhập xác nhận mật khẩu";
    } else if (values.confirmNewPassword !== values.newPassword) {
      errors.confirmNewPassword = "Xác nhận mật khẩu không khớp";
    }
    return errors;
  };

  // Bước 1: Xử lý gửi OTP
  const handlePhoneNumberSubmit = async (values) => {
    try {
      const response = await requestOtpResetPassword(values.phoneNumber);
      setOtp(response.data);
      setStoredPhoneNumber(values.phoneNumber); // thêm
      setSuccessMessage("OTP đã được gửi thành công!");
      setStep(2);
    } catch (error) {
      throw error;
    }
  };

  // Bước 2: Xử lý đặt lại mật khẩu
  const handleResetPasswordSubmit = async (values) => {
    console.log(storedPhoneNumber);
    console.log(values.confirmNewPassword);
    console.log(values.otpCode);
    console.log(values.newPassword);
    try {
      await resetPassword(
        storedPhoneNumber,
        values.otpCode,
        values.newPassword,
        values.confirmNewPassword
      );
      setSuccessMessage("Đặt lại mật khẩu thành công! Đang chuyển hướng...");
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      throw error;
    }
  };

  // useForm cho bước 1
  const {
    values: phoneValues,
    errors: phoneErrors,
    serverError: phoneServerError,
    loading: phoneLoading,
    handleChange: handlePhoneChange,
    handleSubmit: handlePhoneSubmit,
  } = useForm(
    { phoneNumber: "" },
    validatePhoneNumber,
    handlePhoneNumberSubmit
  );

  // useForm cho bước 2
  const {
    values: resetValues,
    errors: resetErrors,
    serverError: resetServerError,
    loading: resetLoading,
    handleChange: handleResetChange,
    handleSubmit: handleResetSubmit,
  } = useForm(
    { otpCode: "", newPassword: "", confirmNewPassword: "" },
    validateResetPassword,
    handleResetPasswordSubmit
  );

  const handleCloseSnackbar = () => {
    setSuccessMessage(null);
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "80vh",
        px: 2,
      }}
    >
      <Paper elevation={3} sx={{ p: 4, width: "100%", maxWidth: 400 }}>
        <Typography variant="h5" align="center" gutterBottom>
          Quên Mật Khẩu
        </Typography>

        {step === 1 ? (
          // Bước 1: Nhập số điện thoại để nhận OTP
          <form onSubmit={handlePhoneSubmit}>
            <TextField
              label="Số điện thoại"
              name="phoneNumber"
              value={phoneValues.phoneNumber || ""}
              onChange={handlePhoneChange}
              fullWidth
              margin="normal"
              error={!!phoneErrors.phoneNumber}
              helperText={phoneErrors.phoneNumber}
              inputProps={{ type: "tel", maxLength: 10 }}
              required
            />
            {phoneServerError && (
              <Typography color="error" align="center" sx={{ mb: 2 }}>
                {phoneServerError}
              </Typography>
            )}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={phoneLoading}
              sx={{ mt: 2 }}
            >
              {phoneLoading ? "Đang gửi OTP..." : "Gửi OTP"}
            </Button>
          </form>
        ) : (
          // Bước 2: Nhập OTP và mật khẩu mới
          <form onSubmit={handleResetSubmit}>
            <TextField
              label="Mã OTP"
              name="otpCode"
              value={resetValues.otpCode || ""}
              onChange={handleResetChange}
              fullWidth
              margin="normal"
              error={!!resetErrors.otpCode}
              helperText={resetErrors.otpCode}
              required
            />
            <TextField
              label="Mật khẩu mới"
              name="newPassword"
              type="password"
              value={resetValues.newPassword || ""}
              onChange={handleResetChange}
              fullWidth
              margin="normal"
              error={!!resetErrors.newPassword}
              helperText={resetErrors.newPassword}
              required
            />
            <TextField
              label="Xác nhận mật khẩu mới"
              name="confirmNewPassword"
              type="password"
              value={resetValues.confirmNewPassword || ""}
              onChange={handleResetChange}
              fullWidth
              margin="normal"
              error={!!resetErrors.confirmNewPassword}
              helperText={resetErrors.confirmNewPassword}
              required
            />
            {resetServerError && (
              <Typography color="error" align="center" sx={{ mb: 2 }}>
                {resetServerError}
              </Typography>
            )}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={resetLoading}
              sx={{ mt: 2 }}
            >
              {resetLoading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
            </Button>
          </form>
        )}

        {/* Link quay lại đăng nhập */}
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Typography variant="body2" color="textSecondary">
            <Link component={RouterLink} to="/" underline="hover">
              Quay lại đăng nhập
            </Link>
          </Typography>
        </Box>
      </Paper>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={2000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="success"
          sx={{ width: "100%" }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ForgotPasswordForm;
