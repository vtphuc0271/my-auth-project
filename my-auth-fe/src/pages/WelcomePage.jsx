import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import {
  Box,
  Typography,
  Button,
  Container,
  Paper,
  Fade,
  Grow,
  TextField,
  Snackbar,
  Alert,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import LockResetIcon from "@mui/icons-material/LockReset";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import {
  updatePassword as updatePasswordAPI,
  updateName as updateNameAPI,
} from "../services/authService";

const StyledButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(1.5, 4),
  borderRadius: "30px",
  fontWeight: "bold",
  transition: "transform 0.3s ease, background-color 0.3s ease",
  "&:hover": {
    transform: "scale(1.05)",
  },
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(1, 3),
  },
}));

const WelcomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, username, logout, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showChangePasswordForm, setShowChangePasswordForm] = useState(false);
  const [showChangeUsernameForm, setShowChangeUsernameForm] = useState(false);
  const [formValues, setFormValues] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
    newUsername: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate("/");
    }
    setLoading(false);
  }, [isAuthenticated, navigate, authLoading]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleChangePassword = () => {
    setShowChangePasswordForm(true);
    setShowChangeUsernameForm(false);
    resetForm();
  };

  const handleChangeUsername = () => {
    setShowChangeUsernameForm(true);
    setShowChangePasswordForm(false);
    resetForm();
  };

  const handleCancel = () => {
    setShowChangePasswordForm(false);
    setShowChangeUsernameForm(false);
    resetForm();
  };

  const resetForm = () => {
    setFormValues({
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
      newUsername: "",
    });
    setFormErrors({});
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const validatePasswordForm = () => {
    const errors = {};
    if (!formValues.oldPassword)
      errors.oldPassword = "Vui lòng nhập mật khẩu cũ";
    if (!formValues.newPassword)
      errors.newPassword = "Vui lòng nhập mật khẩu mới";
    else if (formValues.newPassword.length < 6)
      errors.newPassword = "Mật khẩu mới phải có ít nhất 6 ký tự";
    if (formValues.newPassword !== formValues.confirmPassword)
      errors.confirmPassword = "Xác nhận mật khẩu không khớp";
    return errors;
  };

  const validateUsernameForm = () => {
    const errors = {};
    if (!formValues.newUsername)
      errors.newUsername = "Vui lòng nhập tên người dùng mới";
    else if (formValues.newUsername.length < 3)
      errors.newUsername = "Tên người dùng phải có ít nhất 3 ký tự";
    return errors;
  };

  const handleSubmitPasswordChange = async (e) => {
    e.preventDefault();
    const errors = validatePasswordForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormLoading(true);
    try {
      await updatePasswordAPI({
        oldPassword: formValues.oldPassword,
        newPassword: formValues.newPassword,
      });
      setShowChangePasswordForm(false);
      resetForm();
      setSnackbar({
        open: true,
        message: "Đổi mật khẩu thành công!",
        severity: "success",
      });
    } catch (error) {
      handleError(error, "Đổi mật khẩu thất bại.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleSubmitUsernameChange = async (e) => {
    e.preventDefault();
    const errors = validateUsernameForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormLoading(true);
    try {
      await updateNameAPI({
        newUsername: formValues.newUsername,
      });
      setShowChangeUsernameForm(false);
      resetForm();
      setSnackbar({
        open: true,
        message: "Đổi tên người dùng thành công!",
        severity: "success",
      });
    } catch (error) {
      handleError(error, "Đổi tên người dùng thất bại.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleError = (error, defaultMessage) => {
    if (error.response?.status === 401) {
      setSnackbar({
        open: true,
        message: "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.",
        severity: "error",
      });
      setTimeout(() => {
        logout();
        navigate("/");
      }, 2000);
    } else {
      setSnackbar({
        open: true,
        message: error.message || defaultMessage,
        severity: "error",
      });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (authLoading || loading) {
    return <Typography>Đang tải...</Typography>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          py: { xs: 2, sm: 4 },
        }}
      >
        <Fade in timeout={800}>
          <Paper
            elevation={6}
            sx={{
              p: { xs: 3, sm: 5 },
              borderRadius: "20px",
              textAlign: "center",
              maxWidth: 600,
              width: "100%",
            }}
          >
            <Grow in timeout={1000}>
              <Typography
                variant="h2"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: "bold",
                  color: "primary.main",
                  mb: 3,
                  fontSize: { xs: "2.5rem", sm: "3.5rem" },
                }}
              >
                Chào mừng, {username || "bạn"}!
              </Typography>
            </Grow>

            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ mb: 4, fontSize: { xs: "1rem", sm: "1.25rem" } }}
            >
              Cảm ơn bạn đã tham gia cùng chúng tôi. Hãy khám phá ứng dụng ngay bây giờ!
            </Typography>

            <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
              <StyledButton
                variant="contained"
                color="error"
                onClick={handleLogout}
                startIcon={<LogoutIcon />}
              >
                Đăng Xuất
              </StyledButton>
              <StyledButton
                variant="contained"
                color="primary"
                onClick={handleChangePassword}
                startIcon={<LockResetIcon />}
              >
                Đổi Mật Khẩu
              </StyledButton>
              <StyledButton
                variant="contained"
                color="secondary"
                onClick={handleChangeUsername}
                startIcon={<PersonIcon />}
              >
                Đổi Tên Người Dùng
              </StyledButton>
            </Box>

            {showChangePasswordForm && (
              <Fade in={showChangePasswordForm}>
                <Box component="form" onSubmit={handleSubmitPasswordChange} sx={{ mt: 4 }}>
                  <TextField
                    label="Mật khẩu cũ"
                    type="password"
                    name="oldPassword"
                    value={formValues.oldPassword}
                    onChange={handleFormChange}
                    fullWidth
                    margin="normal"
                    error={!!formErrors.oldPassword}
                    helperText={formErrors.oldPassword}
                    required
                  />
                  <TextField
                    label="Mật khẩu mới"
                    type="password"
                    name="newPassword"
                    value={formValues.newPassword}
                    onChange={handleFormChange}
                    fullWidth
                    margin="normal"
                    error={!!formErrors.newPassword}
                    helperText={formErrors.newPassword}
                    required
                  />
                  <TextField
                    label="Xác nhận mật khẩu mới"
                    type="password"
                    name="confirmPassword"
                    value={formValues.confirmPassword}
                    onChange={handleFormChange}
                    fullWidth
                    margin="normal"
                    error={!!formErrors.confirmPassword}
                    helperText={formErrors.confirmPassword}
                    required
                  />
                  <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2, gap: 2 }}>
                    <StyledButton
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={formLoading}
                    >
                      {formLoading ? "Đang xử lý..." : "Xác nhận"}
                    </StyledButton>
                    <StyledButton
                      variant="outlined"
                      color="secondary"
                      onClick={handleCancel}
                    >
                      Hủy
                    </StyledButton>
                  </Box>
                </Box>
              </Fade>
            )}

            {showChangeUsernameForm && (
              <Fade in={showChangeUsernameForm}>
                <Box component="form" onSubmit={handleSubmitUsernameChange} sx={{ mt: 4 }}>
                  <TextField
                    label="Tên người dùng mới"
                    name="newUsername"
                    value={formValues.newUsername}
                    onChange={handleFormChange}
                    fullWidth
                    margin="normal"
                    error={!!formErrors.newUsername}
                    helperText={formErrors.newUsername}
                    required
                  />
                  <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2, gap: 2 }}>
                    <StyledButton
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={formLoading}
                    >
                      {formLoading ? "Đang xử lý..." : "Xác nhận"}
                    </StyledButton>
                    <StyledButton
                      variant="outlined"
                      color="secondary"
                      onClick={handleCancel}
                    >
                      Hủy
                    </StyledButton>
                  </Box>
                </Box>
              </Fade>
            )}
          </Paper>
        </Fade>
      </Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default WelcomePage;