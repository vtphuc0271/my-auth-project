// src/components/RegisterForm.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../services/authService';
import useForm from '../hooks/useForm';
import { Box, TextField, Button, Typography, Paper, Snackbar, Alert } from '@mui/material';

const RegisterForm = () => {
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState(null); // Trạng thái để quản lý thông báo thành công

  const validate = (values) => {
    const errors = {};

    if (!values.username || values.username.length < 3) {
      errors.username = 'Username phải ít nhất 3 ký tự';
    }

    if (!values.password || values.password.length < 6) {
      errors.password = 'Password phải ít nhất 6 ký tự';
    }

    if (!values.confirmPassword) {
      errors.confirmPassword = 'Vui lòng nhập xác nhận mật khẩu';
    } else if (values.confirmPassword !== values.password) {
      errors.confirmPassword = 'Xác nhận mật khẩu không khớp';
    }

    return errors;
  };

  const onSubmit = async (values) => {
    try {
      await register(values); // Gọi API đăng ký
      setSuccessMessage('Đăng ký thành công! Đang chuyển hướng...'); // Hiển thị thông báo
      setTimeout(() => {
        navigate('/'); // Điều hướng về trang đăng nhập sau 1 giây
      }, 1000);
    } catch (error) {
      throw error; // Ném lỗi để useForm xử lý và hiển thị serverError
    }
  };

  const { values, errors, serverError, loading, handleChange, handleSubmit } = useForm(
    { username: '', password: '', confirmPassword: '' },
    validate,
    onSubmit
  );

  const handleCloseSnackbar = () => {
    setSuccessMessage(null);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
      }}
    >
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Typography variant="h5" align="center" gutterBottom>
          Đăng Ký
        </Typography>
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
          <TextField
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={values.confirmPassword}
            onChange={handleChange}
            required
            fullWidth
            margin="normal"
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
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
            {loading ? 'Đang đăng ký...' : 'Đăng Ký'}
          </Button>
        </form>
      </Paper>

      {/* Hiển thị thông báo thành công bằng Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={2000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RegisterForm;