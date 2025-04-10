// src/components/LoginForm.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/authService';
import { useAuth } from '../context/authContext';
import useForm from '../hooks/useForm';
import { Box, TextField, Button, Typography, Paper } from '@mui/material';

const LoginForm = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const validate = (values) => {
    const errors = {};
    const usernameRegex = /^[a-zA-Z0-9_]+$/;

    if (!values.username) {
      errors.username = 'Username là bắt buộc';
    } else if (!usernameRegex.test(values.username)) {
      errors.username = 'Username không được chứa ký tự đặc biệt';
    }

    if (!values.password) {
      errors.password = 'Password là bắt buộc';
    } else if (values.password.length < 6) {
      errors.password = 'Password phải ít nhất 6 ký tự';
    }

    return errors;
  };

  // Logic xử lý submit (truyền vào useForm)
  const onSubmit = async (values) => {
    const result = await login(values);
    authLogin(result.token || '', values.username);
    navigate('/welcome');
  };

  const { values, errors, serverError, loading, handleChange, handleSubmit } = useForm(
    { username: '', password: '' },
    validate,
    onSubmit // Truyền onSubmit thay vì handleSubmit
  );

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
          Đăng Nhập
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
            {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default LoginForm;