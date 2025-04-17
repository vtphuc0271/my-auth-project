import React, { useState, useEffect } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useAuth } from "../context/authContext";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Collapse,
  Link,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";
import { QRCodeCanvas } from "qrcode.react";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";

const LoginForm = () => {
  const navigate = useNavigate();
  const {
    login,
    verifyOtp,
    generateQrCode,
    isAuthenticated,
    requiresOtp,
    userId,
    setIsQrLoginActive,
  } = useAuth();

  const [otp, setOtp] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [qrLoading, setQrLoading] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");

  // Redirect to welcome page if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/welcome");
    }
  }, [isAuthenticated, navigate]);

  // Fetch QR code
  const fetchQrCode = async () => {
    setQrLoading(true);
    try {
      const qrCode = await generateQrCode();
      setQrCode(qrCode);
    } catch (err) {
      console.error("Error fetching QR code:", err);
      setQrCode("");
    } finally {
      setQrLoading(false);
    }
  };

  // Handle QR code visibility and polling
  useEffect(() => {
    if (showQrCode) {
      setIsQrLoginActive(true);
      fetchQrCode();
      const interval = setInterval(fetchQrCode, 30000); // Refresh QR code every 30 seconds
      return () => {
        clearInterval(interval);
        setIsQrLoginActive(false);
      };
    } else {
      setQrCode("");
      setIsQrLoginActive(false);
    }
  }, [showQrCode, setIsQrLoginActive]);

  // Validate form inputs
  const validate = (values) => {
    const errors = {};
    const usernameRegex = /^[a-zA-Z0-9_]+$/;

    if (!values.phoneNumber) errors.phoneNumber = "Số điện thoại là bắt buộc";
    else if (!usernameRegex.test(values.phoneNumber))
      errors.phoneNumber = "Số điện thoại không được chứa ký tự đặc biệt";

    if (!values.password) errors.password = "Password là bắt buộc";
    else if (values.password.length < 6)
      errors.password = "Password phải ít nhất 6 ký tự";

    return errors;
  };

  // Handle login form submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
  
    const values = { phoneNumber, password };
    const errors = validate(values);
  
    if (Object.keys(errors).length > 0) {
      setSnackbar({ open: true, message: Object.values(errors)[0], severity: "warning" });
      return;
    }
  
    try {
      const result = await login(phoneNumber, password);
      if (result.requiresOtp) {
        setShowQrCode(false);
      } else {
        throw new Error("Đăng nhập không hỗ trợ trường hợp không yêu cầu OTP.");
      }
    } catch (err) {
      setSnackbar({ open: true, message: err.message || "Đăng nhập thất bại", severity: "error" });
    }
  };
  

  // Handle OTP submission
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    try {
      await verifyOtp(userId, otp);
      setOtp(""); // Clear OTP after successful verification
      setSnackbar({
        open: true,
        message: "Xác thực OTP thành công!",
        severity: "success",
      });
    } catch (err) {
      setOtpMessage(err.message || "Xác thực OTP thất bại");
    }
  };

  // Toggle QR code visibility
  const handleToggleQrCode = () => {
    setShowQrCode((prev) => !prev);
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
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Typography variant="h5">Đăng Nhập</Typography>
            <IconButton
              onClick={handleToggleQrCode}
              color="primary"
              title="Quét mã QR"
            >
              <QrCodeScannerIcon />
            </IconButton>
          </Box>

          {!requiresOtp ? (
            <form onSubmit={handleLoginSubmit}>
              <TextField
                label="Phone Number"
                name="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                fullWidth
                margin="normal"
              />

              <TextField
                label="Password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
                margin="normal"
              />

              <Box
                sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}
              >
                <Typography variant="body2" color="textSecondary">
                  <Link
                    component={RouterLink}
                    to="/otp-forgot-password"
                    underline="hover"
                  >
                    Quên mật khẩu?
                  </Link>
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  <Link component={RouterLink} to="/register" underline="hover">
                    Chưa có tài khoản?
                  </Link>
                </Typography>
              </Box>

              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mt: 2 }}
              >
                Đăng Nhập
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

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LoginForm;
