import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

// Resolve API base URL:
// - If `VITE_API_URL` is set (preferred), use it.
// - If running in a browser on localhost, default to local backend at port 4000 for dev.
// - Otherwise use the current origin so the frontend will call the same host when deployed
const API_BASE_URL = (() => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl;
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    // development on localhost -> talk to local backend
    if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:4000';
    // otherwise, assume backend is reachable at same origin (or VITE_API_URL will be set in prod)
    return window.location.origin;
  }
  // fallback to production API
  return 'https://folushovictory-backend.onrender.com';
})();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor for adding auth token
api.interceptors.request.use((config) => {
  const authStore = useAuthStore()
  if (authStore.token) {
    config.headers.Authorization = `Bearer ${authStore.token}`
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

// Response interceptor for handling 401s
api.interceptors.response.use((response) => {
  return response
}, (error) => {
  if (error.response?.status === 401) {
    const authStore = useAuthStore()
    authStore.logout()
    window.location.href = '/'
  }
  return Promise.reject(error)
})

export default api
