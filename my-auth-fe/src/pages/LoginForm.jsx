// src/components/LoginForm.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import useForm from "../hooks/useForm";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Collapse,
  IconButton,
} from "@mui/material";
import { QRCodeCanvas } from "qrcode.react";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";

const LoginForm = () => {
  const navigate = useNavigate();
  const { login, verifyOtp, generateQrCode } = useAuth();
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [userId, setUserId] = useState(null);
  const [otp, setOtp] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [qrLoading, setQrLoading] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);

  const fetchQrCode = async () => {
    setQrLoading(true);
    try {
      const qrCode = await generateQrCode();
      setQrCode(qrCode);
    } catch (err) {
      console.error("Lỗi khi lấy mã QR:", err);
      setQrCode("");
    } finally {
      setQrLoading(false);
    }
  };

  useEffect(() => {
    if (showQrCode) {
      fetchQrCode();
      const interval = setInterval(fetchQrCode, 30000);
      return () => clearInterval(interval);
    } else {
      setQrCode("");
    }
  }, [showQrCode]);

  const validate = (values) => {
    const errors = {};
    const usernameRegex = /^[a-zA-Z0-9_]+$/;

    if (!values.username) errors.username = "Username là bắt buộc";
    else if (!usernameRegex.test(values.username))
      errors.username = "Username không được chứa ký tự đặc biệt";

    if (!values.password) errors.password = "Password là bắt buộc";
    else if (values.password.length < 6)
      errors.password = "Password phải ít nhất 6 ký tự";

    return errors;
  };

  const onSubmit = async (values) => {
    try {
      const result = await login(values.username, values.password);
      if (result.requiresOtp) {
        setRequiresOtp(true);
        setUserId(result.userId);
        setOtpMessage(`Nhập OTP: ${result.otpCode} (mock)`);
        setShowQrCode(false);
      } else {
        navigate("/welcome");
      }
    } catch (err) {
      throw err;
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    try {
      await verifyOtp(userId, otp);
      navigate("/welcome");
    } catch (err) {
      setOtpMessage(err.message || "Xác thực OTP thất bại");
    }
  };

  const { values, errors, serverError, loading, handleChange, handleSubmit } = useForm(
    { username: "", password: "" },
    validate,
    onSubmit
  );

  const handleToggleQrCode = () => {
    setShowQrCode((prev) => !prev);
    setRequiresOtp(false);
    setOtp("");
    setOtpMessage("");
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "80vh",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: "100%", maxWidth: 400 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="h5">Đăng Nhập</Typography>
            <IconButton onClick={handleToggleQrCode} color="primary" title="Quét mã QR">
              <QrCodeScannerIcon />
            </IconButton>
          </Box>

          {!requiresOtp ? (
            <form onSubmit={handleSubmit}>
              <TextField
                label="Username"
                name="username"
                value={values.username}
                onChange={handleChange}
                required
                fullWidth
                margin="normal"
                error={!!errors.username}
                helperText={errors.username}
              />
              <TextField
                label="Password"
                name="password"
                type="password"
                value={values.password}
                onChange={handleChange}
                required
                fullWidth
                margin="normal"
                error={!!errors.password}
                helperText={errors.password}
              />
              {serverError && (
                <Typography color="error" align="center" sx={{ mt: 2 }}>
                  {serverError}
                </Typography>
              )}
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? "Đang đăng nhập..." : "Đăng Nhập"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit}>
              <TextField
                label="OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                fullWidth
                margin="normal"
              />
              {otpMessage && (
                <Typography
                  color={otpMessage.includes("thất bại") ? "error" : "info"}
                  align="center"
                  sx={{ mt: 2 }}
                >
                  {otpMessage}
                </Typography>
              )}
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mt: 2 }}
              >
                Xác thực OTP
              </Button>
            </form>
          )}
        </Paper>

        <Collapse in={showQrCode} orientation="horizontal">
          <Paper
            elevation={3}
            sx={{
              p: 4,
              width: { xs: "100%", sm: 300 },
              maxWidth: 300,
              ml: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {qrLoading ? (
              <Typography>Đang tải mã QR...</Typography>
            ) : qrCode ? (
              <>
                <Typography variant="body1" sx={{ mb: 2, textAlign: "center" }}>
                  Quét mã QR bằng ứng dụng di động
                </Typography>
                <QRCodeCanvas value={qrCode} size={200} />
              </>
            ) : (
              <Typography color="error">Không thể tải mã QR</Typography>
            )}
          </Paper>
        </Collapse>
      </Box>
    </Box>
  );
};

export default LoginForm;