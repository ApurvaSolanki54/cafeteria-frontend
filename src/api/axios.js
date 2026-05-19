import axios from 'axios'

/*
 * baseURL: all calls start with "/api"
 * The Vite proxy in vite.config.js then forwards "/api" to Spring Boot.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/*
 * RESPONSE INTERCEPTOR
 * Runs automatically after EVERY API response.
 * If the server returns 401 (Unauthorized — token expired),
 * we clear the stored data and redirect to login.
 *
 * This handles the case where someone's token expires
 * while they're using the app — they get sent to login automatically.
 */
api.interceptors.response.use(
  (response) => response,  // success — just return the response as-is
  (error) => {
    console.log("res->", error.response?.status)
    if (error.response?.status === 403) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'  // redirect to login page
    }
    return Promise.reject(error)
  }
)

export default api