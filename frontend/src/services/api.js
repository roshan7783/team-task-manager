import axios from "axios";

// Base URL: uses env var in production, falls back to proxy path in dev
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

// Attach JWT token to every request automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global response interceptor — redirect to login on 401
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  signup: (data) => API.post("/auth/signup", data),
  login: (data) => API.post("/auth/login", data),
  getMe: () => API.get("/auth/me"),
};

// ─── Projects ─────────────────────────────────────────────────────────────────
export const projectAPI = {
  getAll: () => API.get("/projects"),
  getById: (id) => API.get(`/projects/${id}`),
  create: (data) => API.post("/projects", data),
  addMember: (id, userId) => API.post(`/projects/${id}/members`, { userId }),
  removeMember: (id, userId) => API.delete(`/projects/${id}/members/${userId}`),
  getAllUsers: () => API.get("/projects/users"),
};

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const taskAPI = {
  getAll: (projectId) =>
    API.get("/tasks", { params: projectId ? { projectId } : {} }),
  getById: (id) => API.get(`/tasks/${id}`),
  create: (data) => API.post("/tasks", data),
  update: (id, data) => API.put(`/tasks/${id}`, data),
  delete: (id) => API.delete(`/tasks/${id}`),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  getStats: () => API.get("/dashboard"),
};

export default API;
