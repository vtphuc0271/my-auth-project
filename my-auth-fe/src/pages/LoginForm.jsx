import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import useForm from "../hooks/useForm";
import { Box, TextField, Button, Typography, Paper } from "@mui/material";

const LoginForm = () => {
  const navigate = useNavigate();
  const { login, verifyOtp } = useAuth();
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [userId, setUserId] = useState(null);
  const [otp, setOtp] = useState("");
  const [otpMessage, setOtpMessage] = useState("");

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

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
      <Paper elevation={3} sx={{ p: 4, width: "100%", maxWidth: 400 }}>
        <Typography variant="h5" align="center" gutterBottom>
          Đăng Nhập
        </Typography>

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
              <Typography color={otpMessage.includes("thất bại") ? "error" : "info"} align="center" sx={{ mt: 2 }}>
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
    </Box>
  );
};

export default LoginForm;