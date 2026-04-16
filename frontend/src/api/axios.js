import axios from 'axios'

// 🔥 Get API URL from env
const API_URL = import.meta.env.VITE_API_URL

// ✅ Debug log (will help in Vercel)
console.log("🚀 API BASE URL:", API_URL)

// ❌ If missing, fail loudly (instead of silent bugs)
if (!API_URL) {
  console.error("❌ VITE_API_URL is NOT defined. Check Vercel environment variables.");
}

const api = axios.create({
  baseURL: API_URL, // ❌ removed fallback '/api'
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // optional but good practice
})

// ✅ Attach token on every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ✅ Handle responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log("🔥 API ERROR:", error.response || error)

    // Handle unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

export default api