import axios from "axios";

/* In dev: VITE_API_URL=http://localhost:5000/api
   In prod: VITE_API_URL=/api  (Vercel proxies to Render) */
export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const UPLOADS_URL =
  import.meta.env.VITE_UPLOADS_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

/* ---------- Response interceptor ---------- */
api.interceptors.response.use(
  (res) => res,
  (err) => {
    /* Silence expected 401 from team session check on non-team pages */
    if (
      err.response?.status === 401 &&
      err.config?.url?.includes("/teams/me")
    ) {
      return Promise.reject({ ...err, silent: true });
    }
    return Promise.reject(err);
  }
);

/* ---------- Build full image URL ---------- */
export const imgUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;   // Cloudinary or absolute URLs pass through
  return `${UPLOADS_URL}${path}`;
};

export default api;