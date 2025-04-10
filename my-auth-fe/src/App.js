// src/App.js
import React from 'react';
import { BrowserRouter as Router, Link } from 'react-router-dom';
import AppRoutes from './routes/authRoutes';
import { AuthProvider, useAuth } from './context/authContext';
import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';

// Component thanh điều hướng
const Navigation = () => {
  const { isAuthenticated, logout } = useAuth();

  return (
    <AppBar position="static" color="primary">
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h6" color="inherit">
          My Auth App
        </Typography>
        <Box>
          {isAuthenticated ? (
            <Button color="inherit" onClick={logout}>
              Đăng Xuất
            </Button>
          ) : (
            <>
              <Button color="inherit" component={Link} to="/">
                Đăng Nhập
              </Button>
              <Button color="inherit" component={Link} to="/register">
                Đăng Ký
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navigation />
        <Container maxWidth="sm" sx={{ mt: 4 }}>
          <AppRoutes />
        </Container>
      </Router>
    </AuthProvider>
  );
}

export default App;