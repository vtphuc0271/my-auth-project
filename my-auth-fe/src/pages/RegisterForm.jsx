// src/components/RegisterForm.jsx
import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom'; // Thêm RouterLink
import { register } from '../services/authService';
import useForm from '../hooks/useForm';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Snackbar,
  Alert,
  Checkbox,
  FormControlLabel,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const RegisterForm = () => {
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState(null);
  const [openPolicyDialog, setOpenPolicyDialog] = useState(false);

  const validate = (values) => {
    const errors = {};

    if (!values.phoneNumber || values.phoneNumber.length === 0) {
      errors.phoneNumber = 'Số điện thoại không được để trống';
    } else if (!/^\d{10}$/.test(values.phoneNumber)) {
      errors.phoneNumber = 'Số điện thoại phải có đúng 10 chữ số';
    }

    if (!values.username || values.username.length < 3) {
      errors.username = 'Username phải có ít nhất 3 ký tự';
    }

    if (!values.password || values.password.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (!values.confirmPassword) {
      errors.confirmPassword = 'Vui lòng nhập xác nhận mật khẩu';
    } else if (values.confirmPassword !== values.password) {
      errors.confirmPassword = 'Xác nhận mật khẩu không khớp';
    }

    if (!values.terms) {
      errors.terms = 'Bạn phải đồng ý với chính sách trước khi đăng ký';
    }

    return errors;
  };

  const initialValues = {
    phoneNumber: '',
    username: '',
    password: '',
    confirmPassword: '',
    terms: false,
  };

  const onSubmit = async (values) => {
    try {
      const { terms, confirmPassword, ...registerData } = values;
      await register(registerData);
      setSuccessMessage('Đăng ký thành công! Đang chuyển hướng...');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      throw error;
    }
  };

  const { values, errors, serverError, loading, handleChange, handleSubmit } = useForm(
    initialValues,
    validate,
    onSubmit
  );

  const handleCloseSnackbar = () => {
    setSuccessMessage(null);
  };

  const handleOpenPolicyDialog = (e) => {
    e.preventDefault();
    setOpenPolicyDialog(true);
  };

  const handleClosePolicyDialog = () => {
    setOpenPolicyDialog(false);
  };

  const handleAgreePolicy = () => {
    handleChange({ target: { name: 'terms', type: 'checkbox', checked: true } });
    handleClosePolicyDialog();
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
        px: 2,
      }}
    >
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Typography variant="h5" align="center" gutterBottom>
          Đăng Ký
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Số điện thoại"
            name="phoneNumber"
            value={values.phoneNumber || ''}
            onChange={handleChange}
            fullWidth
            margin="normal"
            error={!!errors.phoneNumber}
            helperText={errors.phoneNumber}
            inputProps={{ type: 'tel', maxLength: 10 }}
            required
          />
          <TextField
            label="Họ Tên"
            name="username"
            value={values.username || ''}
            onChange={handleChange}
            fullWidth
            margin="normal"
            error={!!errors.username}
            helperText={errors.username}
            required
          />
          <TextField
            label="Mật khẩu"
            name="password"
            type="password"
            value={values.password || ''}
            onChange={handleChange}
            fullWidth
            margin="normal"
            error={!!errors.password}
            helperText={errors.password}
            required
          />
          <TextField
            label="Xác nhận mật khẩu"
            name="confirmPassword"
            type="password"
            value={values.confirmPassword || ''}
            onChange={handleChange}
            fullWidth
            margin="normal"
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
            required
          />
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  name="terms"
                  checked={values.terms || false}
                  onChange={handleChange}
                  color="primary"
                />
              }
              label={
                <Typography>
                  Tôi đồng ý với{' '}
                  <Link component="button" onClick={handleOpenPolicyDialog} underline="hover">
                    Chính sách
                  </Link>
                </Typography>
              }
            />
          </Box>
          {errors.terms && (
            <Typography color="error" variant="caption" sx={{ mb: 2, display: 'block' }}>
              {errors.terms}
            </Typography>
          )}

          {serverError && (
            <Typography color="error" align="center" sx={{ mb: 2 }}>
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

          {/* Sửa các link để không load lại trang */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Typography variant="body2" color="textSecondary">
              <Link component={RouterLink} to="/otp-forgot-password" underline="hover">
                Quên mật khẩu?
              </Link>
            </Typography>
            <Typography variant="body2" color="textSecondary">
              <Link component={RouterLink} to="/" underline="hover">
                Đã có tài khoản?
              </Link>
            </Typography>
          </Box>
        </form>
      </Paper>

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

      <Dialog
        open={openPolicyDialog}
        onClose={handleClosePolicyDialog}
        maxWidth="sm"
        fullWidth
        sx={{ '& .MuiDialog-paper': { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Chính sách
          <IconButton onClick={handleClosePolicyDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" paragraph>
            Đây là chính sách bảo mật của chúng tôi. Vui lòng đọc kỹ trước khi đăng ký tài khoản.
          </Typography>
          <Typography variant="body2" paragraph>
            1. Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn, bao gồm số điện thoại, tên đăng nhập và mật khẩu.
          </Typography>
          <Typography variant="body2" paragraph>
            2. Dữ liệu của bạn sẽ không được chia sẻ với bên thứ ba mà không có sự đồng ý của bạn.
          </Typography>
          <Typography variant="body2" paragraph>
            3. Bạn có quyền yêu cầu xóa dữ liệu cá nhân của mình bất kỳ lúc nào.
          </Typography>
          <Typography variant="body2">
            Nếu bạn có bất kỳ câu hỏi nào về chính sách này, vui lòng liên hệ với chúng tôi qua email: support@example.com.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', mt: 1, mb: 1 }}>
          <Button onClick={handleAgreePolicy} variant="contained" color="primary">
            <span style={{ alignSelf: 'center' }}>
              Đồng ý
            </span>
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RegisterForm;