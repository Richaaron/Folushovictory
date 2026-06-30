import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

// Resolve API base URL:
// - If `VITE_API_URL` is set (preferred), use it.
// - If running in a browser on localhost, default to local backend at port 4000 for dev.
// - Otherwise use the current origin so the frontend will call the same host when deployed
function normalizeApiUrl(value: string | undefined): string | undefined {
  const normalized = typeof value === 'string' ? value.trim() : undefined;
  if (!normalized) return undefined;
  // Preserve relative paths for same-origin deployments.
  if (normalized.startsWith('/') || normalized.startsWith('./') || normalized.startsWith('../')) {
    return normalized;
  }
  // If the URL is already absolute, keep it.
  if (/^[a-zA-Z][a-zA-Z\d+-.]*:/.test(normalized)) {
    return normalized;
  }
  // If the environment variable contains just a hostname, assume HTTPS.
  return `https://${normalized}`;
}

const API_BASE_URL = (() => {
  const envUrl = normalizeApiUrl(import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL);
  if (envUrl) return envUrl;
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const protocol = window.location.protocol;
    // development on localhost -> talk to local backend at port 4000 for dev.
    if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:4000';
    // Capacitor native builds use capacitor://localhost as the origin.
    if (protocol === 'capacitor:') return 'https://folushovictory-backend.onrender.com';
    // production front-end deployed on Netlify should call the backend service on Render
    if (host.endsWith('.netlify.app')) return 'https://folushovictory-backend.onrender.com';
    // otherwise use same origin for bundled fullstack deployments
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

console.debug('[API] baseURL:', API_BASE_URL)

// Request interceptor for adding auth token
api.interceptors.request.use((config) => {
  const authStore = useAuthStore()
  if (authStore.token) {
    config.headers.Authorization = `Bearer ${authStore.token}`
  }
  const requestUrl = config.url?.startsWith('http') ? config.url : `${config.baseURL || ''}${config.url}`
  console.debug('[API] request', config.method?.toUpperCase(), requestUrl, config.headers)
  return config
}, (error) => {
  console.debug('[API] request error', error)
  return Promise.reject(error)
})

api.interceptors.response.use((response) => {
  return response
}, (error) => {
  const requestUrl = error.config?.url?.startsWith('http') ? error.config.url : `${error.config?.baseURL || ''}${error.config?.url}`
  console.debug('[API] response error', error.config?.method?.toUpperCase(), requestUrl, error.message, error.response?.status, error.response?.data)
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
