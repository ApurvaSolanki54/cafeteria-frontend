import axios from 'axios'

/*
 * baseURL: all calls start with "/api"
 * The Vite proxy in vite.config.js then forwards "/api" to Spring Boot.
 */
const api = axios.create({
  baseURL: '/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'  // redirect to login page
    }
    return Promise.reject(error)
  }
)

export default api