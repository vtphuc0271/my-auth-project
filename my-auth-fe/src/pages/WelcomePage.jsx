// src/components/WelcomePage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import {
  Box,
  Typography,
  Button,
  Container,
  Paper,
  Fade,
  Grow,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import LogoutIcon from '@mui/icons-material/Logout';

// Tùy chỉnh button Đăng Xuất
const LogoutButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(3),
  padding: theme.spacing(1.5, 4),
  borderRadius: '30px',
  fontWeight: 'bold',
  backgroundColor: theme.palette.error.main,
  color: theme.palette.common.white,
  transition: 'transform 0.3s ease, background-color 0.3s ease',
  '&:hover': {
    backgroundColor: theme.palette.error.dark,
    transform: 'scale(1.05)',
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1, 3),
  },
}));

const WelcomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, username, logout } = useAuth();
  const [loading, setLoading] = useState(true); // Thêm trạng thái loading

  // Kiểm tra trạng thái đăng nhập
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/'); // Điều hướng về trang đăng nhập nếu chưa đăng nhập
    }
    setLoading(false); // Đã kiểm tra xong
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    logout(); // Gọi hàm logout từ AuthContext
    navigate('/'); // Điều hướng về trang đăng nhập
  };

  if (loading) {
    return null; // Hiển thị loading hoặc spinner trong khi kiểm tra
  }

  if (!isAuthenticated) {
    return null; // Không render nếu chưa đăng nhập
  }

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          py: 4,
        }}
      >
        {/* Hiệu ứng Fade cho toàn bộ nội dung */}
        <Fade in timeout={1000}>
          <Paper
            elevation={6}
            sx={{
              p: 6,
              borderRadius: '20px',
              textAlign: 'center',
              bgcolor: 'background.paper',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              maxWidth: 600,
              width: '100%',
            }}
          >
            {/* Hiệu ứng Grow cho tiêu đề */}
            <Grow in timeout={1200}>
              <Typography
                variant="h3"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 'bold',
                  color: 'primary.main',
                  mb: 2,
                  fontSize: { xs: '2rem', sm: '3rem' },
                }}
              >
                Chào mừng, {username || 'bạn'}!
              </Typography>
            </Grow>

            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ mb: 4, fontSize: { xs: '1rem', sm: '1.25rem' } }}
            >
              Cảm ơn bạn đã tham gia cùng chúng tôi. Hãy khám phá ứng dụng ngay bây giờ!
            </Typography>

            {/* Nút Đăng Xuất với icon và hiệu ứng */}
            <LogoutButton
              variant="contained"
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
            >
              Đăng Xuất
            </LogoutButton>
          </Paper>
        </Fade>
      </Box>
    </Container>
  );
};

export default WelcomePage;