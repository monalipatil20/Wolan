import axios from "axios";

// In dev, Vite proxy forwards /api/* to http://localhost:5000.
// In production, set VITE_API_URL to your backend base URL.
const rawBaseURL = import.meta.env.VITE_API_URL || "/api/v1";
const API_BASE_URL = rawBaseURL.replace(/([^:/])\/+/g, '$1/');

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;

