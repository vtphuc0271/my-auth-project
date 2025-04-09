// src/services/authService.js
import axios from "axios";
import { API_URL } from "../config";

// Hàm đăng nhập: gọi POST /api/Auth/login
// Hàm đăng ký: gọi POST /api/Auth/register
export const login = async (data) => {
    try {
      const response = await axios.post(`${API_URL}/api/Auth/login`, data, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  };

// Hàm đăng ký: gọi POST /api/Auth/register
export const register = async (data) => {
    try {
      const response = await axios.post(`${API_URL}/api/User/register`, data, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  };
  
