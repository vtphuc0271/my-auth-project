// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Link } from "react-router-dom";
import AppRoutes from "./routes/authRoutes";
import { AuthProvider, useAuth } from "./context/authContext";
import { AppBar, Toolbar, Typography, Button, Box, Container } from "@mui/material";

const Navigation = () => {
  const { isAuthenticated, username, logout } = useAuth();
  return (
    <AppBar position="static" color="primary">
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h6" color="inherit">
          My Auth App
        </Typography>
        <Box>
          {isAuthenticated ? (
            <>
              <Typography variant="body1" color="inherit" sx={{ display: "inline", mr: 2 }}>
                Xin chào, {username}
              </Typography>
              <Button color="inherit" onClick={logout}>
                Đăng Xuất
              </Button>
            </>
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
        <Container maxWidth="md" sx={{ mt: 4 }}> {/* Tăng từ sm lên md */}
          <AppRoutes />
        </Container>
      </Router>
    </AuthProvider>
  );
}

export default App;