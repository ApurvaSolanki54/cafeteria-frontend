import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import BookTable from './pages/BookTable'
import MyBookings from './pages/MyBookings'
import AdminPanel from './pages/AdminPanel'

/*
 * ProtectedRoute — a wrapper component that checks if user is logged in.
 */
function ProtectedRoute({ children, adminOnly = false }) {
  const { user } = useAuth()

  // Not logged in at all -> go to login
  if (!user) return <Navigate to="/login" replace />

  // Trying to access admin page but not admin -> go to employee page
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/book" replace />

  // All good — show the actual page
  return children
}

/*
 * AppRoutes defines what URL shows what page.
 * It's like a table of contents for your app.
 */
function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      {/* Public routes — no login needed */}
      <Route path="/login" element={
        // If already logged in, skip login page
        user ? <Navigate to={user.role === 'ADMIN' ? '/admin' : '/book'} replace /> : <Login />
      } />
      <Route path="/register" element={
        user ? <Navigate to="/book" replace /> : <Register />
      } />

      {/* Employee routes — need login */}
      <Route path="/book" element={
        <ProtectedRoute><BookTable /></ProtectedRoute>
      } />
      <Route path="/my-bookings" element={
        <ProtectedRoute><MyBookings /></ProtectedRoute>
      } />

      {/* Admin route — need ADMIN role */}
      <Route path="/admin" element={
        <ProtectedRoute adminOnly={true}><AdminPanel /></ProtectedRoute>
      } />

      {/* Default redirect */}
      <Route path="/" element={
        <Navigate to={user ? (user.role === 'ADMIN' ? '/admin' : '/book') : '/login'} replace />
      } />
    </Routes>
  )
}

/*
 * BrowserRouter enables URL-based navigation (like a real website).
 * AuthProvider wraps everything so all pages can access the logged-in user.
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}