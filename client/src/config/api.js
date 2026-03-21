import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only clear auth if not on login/register pages (avoid redirect loop)
      const isAuthPage = window.location.pathname.includes('/login') || 
                         window.location.pathname.includes('/register')
      if (!isAuthPage) {
        localStorage.removeItem('authToken')
        localStorage.removeItem('authUser')
        // Use history pushState instead of full page reload
        window.history.pushState({}, '', '/login')
        window.dispatchEvent(new PopStateEvent('popstate'))
      }
    }
    return Promise.reject(error)
  }
)

export default api
