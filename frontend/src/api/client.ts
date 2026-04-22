import axios from "axios";

const apiBaseUrl =
  import.meta.env.VITE_API_URL ??
  `${window.location.protocol}//${window.location.hostname}:8000`;

const api = axios.create({ baseURL: apiBaseUrl, timeout: 15000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      const hasStoredToken = Boolean(localStorage.getItem("token"));
      const isOnLogin = window.location.pathname === "/login";

      // Only force navigation when an authenticated session expires.
      if (hasStoredToken) {
        localStorage.removeItem("token");
        if (!isOnLogin) window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;
