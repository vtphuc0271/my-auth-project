import React from "react";
import { motion } from "framer-motion";
import { Typography, Box } from "@mui/material";
import { styled } from "@mui/system";

const WelcomePage = ({ username }) => {
  return (
    <Background>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <Typography
          variant="h3"
          fontWeight={700}
          textAlign="center"
          color="#ffffff"
        >
          Xin chào, {username} 👋
        </Typography>
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 150,
            damping: 10,
            delay: 0.5,
          }}
        >
          <SubText>Chúc bạn một ngày tuyệt vời! ☀️</SubText>
        </motion.div>
      </motion.div>
    </Background>
  );
};

export default WelcomePage;

const Background = styled(Box)({
  width: "100vw",
  height: "100vh",
  background: "linear-gradient(135deg, #74ebd5, #9face6)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  flexDirection: "column",
});

const SubText = styled(Typography)({
  fontSize: "20px",
  fontWeight: 500,
  marginTop: "20px",
  color: "#ffffff",
  textAlign: "center",
});
