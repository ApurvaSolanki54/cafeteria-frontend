import { createContext, useContext, useState } from 'react'
import api from '../api/axios'

// Step 1: Create the context (empty container)
const AuthContext = createContext(null)

/*
 * Step 2: AuthProvider wraps the whole app and "provides" the user data.
 * Any component inside it can read the data.
 */
export function AuthProvider({ children }) {

    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('user')
        return stored ? JSON.parse(stored) : null
    })

    // Called after successful login — saves user data and token
    const login = (userData, token) => {
        localStorage.setItem('token', token)
        // JSON.stringify converts object to string for localStorage
        localStorage.setItem('user', JSON.stringify(userData))
        setUser(userData)
    }

    // Called on logout — clears everything
    const logout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
    }

    /*
   * NEW — refreshUser fetches latest user data from backend.
   * Call this after any action that changes coin balance
   * (booking a table, adding a member).
   *
   * It updates both React state (setUser) AND localStorage
   * so the coin count in navbar updates immediately.
   */
    const refreshUser = async () => {
        try {
            const res = await api.get('/users/me')
            const freshData = res.data.data
            // Merge fresh data with existing user (keeps token etc.)
            const updated = { ...user, ...freshData }
            localStorage.setItem('user', JSON.stringify(updated))
            setUser(updated)
        } catch {
        // If refresh fails, silently ignore — not critical
        }
    }

    /*
     * We provide: user object, login function, logout function
     * to every child component that asks for it via useAuth() hook below.
     */
    return (
        <AuthContext.Provider value={{ user, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    )
}

/*
 * Step 3: Custom hook — instead of writing useContext(AuthContext)
 * in every component, we write useAuth(). Much cleaner.
 *
 * Usage in any component:
 * const { user, login, logout } = useAuth()
 */
export function useAuth() {
    return useContext(AuthContext)
}