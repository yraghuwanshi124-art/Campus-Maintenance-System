import axios from "axios";

// Automatically resolve the backend API URL
let rawBaseUrl =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? "https://campus-maintenance-backend.onrender.com/api"
    : "http://localhost:5000/api");

// Normalize: ensure it doesn't have trailing slashes and always ends with /api
let apiBaseUrl = rawBaseUrl.trim().replace(/\/+$/, "");
if (!apiBaseUrl.endsWith("/api")) {
  apiBaseUrl += "/api";
}

const api = axios.create({
  baseURL: apiBaseUrl,
});

// Attach JWT token to every protected request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
