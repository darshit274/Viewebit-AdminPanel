import axios from "axios";

// Default request timeout (ms). Read from VITE_API_TIMEOUT_MS so production can
// raise it without a code change. Falls back to 2 minutes if unset.
const DEFAULT_API_TIMEOUT_MS = parseInt(
  import.meta.env.VITE_API_TIMEOUT_MS as string,
  10
) || 120000;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: DEFAULT_API_TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("admin_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      sessionStorage.removeItem("admin_token");
      sessionStorage.removeItem("admin_user");
      if (!window.location.href.includes("login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
