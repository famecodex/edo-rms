import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE || "https://edo-rms.onrender.com/api";

const api = axios.create({
  baseURL,
  withCredentials: true,
});

// attach token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || null;
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
