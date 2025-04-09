import React, { useState } from 'react';
import { register } from '../services/authService';
import { Box, TextField, Button, Typography, Paper } from '@mui/material';

const RegisterForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError("Mật khẩu không khớp!");
      return;
    }

    setLoading(true);

    try {
      const result = await register({ username, password });
      setSuccess("Đăng ký thành công! Bạn có thể đăng nhập ngay.");
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#f0f2f5">
      <Paper elevation={3} sx={{ padding: 4, width: 350 }}>
        <Typography variant="h5" fontWeight={600} mb={3}>Đăng Ký</Typography>
        <form onSubmit={handleRegister}>
          <TextField
            fullWidth
            label="Username"
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <TextField
            fullWidth
            type="password"
            label="Password"
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <TextField
            fullWidth
            type="password"
            label="Xác nhận Password"
            margin="normal"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {error && <Typography color="error" mt={1}>{error}</Typography>}
          {success && <Typography color="green" mt={1}>{success}</Typography>}
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }} disabled={loading}>
            {loading ? 'Đang đăng ký...' : 'Đăng Ký'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default RegisterForm;
