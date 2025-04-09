import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import WelcomePage from "./components/WelcomePage";
import { Box, Button } from "@mui/material";

function App() {
  return (
    <Router>
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, p: 2 }}>
        <Button variant="outlined" component={Link} to="/">Đăng Nhập</Button>
        <Button variant="outlined" component={Link} to="/register">Đăng Ký</Button>
      </Box>
      <Routes>
        <Route path="/" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/welcome" element={<WelcomeWrapper />} />
      </Routes>
    </Router>
  );
}

const WelcomeWrapper = () => {
  const username = localStorage.getItem("username") || "bạn";
  return <WelcomePage username={username} />;
};

export default App;
