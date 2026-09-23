import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const UPLOADS_URL = import.meta.env.VITE_UPLOADS_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

/* Helper to build full image URL */
export const imgUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${UPLOADS_URL}${path}`;
};

export default api;