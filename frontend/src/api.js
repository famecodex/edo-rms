import axios from "axios";

const baseURL =
  (import.meta.env.VITE_API_BASE ? import.meta.env.VITE_API_BASE.replace(/\/$/, '') : "http://localhost:5001") +
  "/api";

const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || null;
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
