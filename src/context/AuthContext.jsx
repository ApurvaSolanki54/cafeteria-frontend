import { createContext, useContext, useEffect, useState } from 'react'
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

        /*
    * NEW — when app first loads, if user is logged in,
    * immediately fetch fresh data from backend.
    *
    * This handles the case where:
    * - Priya's coins were deducted by Ravi adding her
    * - Priya refreshes the page
    * - Instead of showing stale localStorage data,
    *   we fetch fresh coinBalance from server right away
    */
    useEffect(() => {
        const token = localStorage.getItem('token')
        if (token && user) {
            // Fetch fresh user data silently on startup
            refreshUserSilently()
        }
    }, []) // empty [] = runs once when app first loads

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
       * refreshUserSilently — fetches fresh user data from backend.
       * Called on page load and when tab gets focus.
       * "Silently" means no loading spinner — happens in background.
       */
    const refreshUserSilently = async () => {
        try {
          const res = await api.get('/users/me')
          const freshData = res.data.data
          /*
           * Merge fresh data with existing user object.
           * ...user keeps fields like role that /users/me might not return.
           * ...freshData overwrites coinBalance with the fresh value.
           */
          setUser(prev => {
            if (!prev) return prev // if logged out during fetch, do nothing
            const updated = { ...prev, ...freshData }
            localStorage.setItem('user', JSON.stringify(updated))
            return updated
          })
        } catch {
          // Silently ignore — if fetch fails, just keep showing old data
          // Don't logout here — network hiccup should not kick user out
        }
    }

    /*
   * NEW — refreshUser fetches latest user data from backend.
   * Call this after any action that changes coin balance
   * (booking a table, adding a member).
   *
   * It updates both React state (setUser) AND localStorage
   * so the coin count in navbar updates immediately.
   */
    // const refreshUser = async () => {
    //     try {
    //         const res = await api.get('/users/me')
    //         const freshData = res.data.data
    //         // Merge fresh data with existing user (keeps token etc.)
    //         const updated = { ...user, ...freshData }
    //         localStorage.setItem('user', JSON.stringify(updated))
    //         setUser(updated)
    //     } catch {
    //     // If refresh fails, silently ignore — not critical
    //     }
    // }

    /*
    * refreshUser — same as above but exported for components to call
    * explicitly after actions like booking or adding members.
    */
    const refreshUser = async () => {
        await refreshUserSilently()
    }

    /*
   * NEW — refresh coins when user comes back to the tab.
   *
   * Scenario: Priya has the app open in background.
   * Ravi adds her as member. Priya clicks back on the tab.
   * → visibilitychange fires → we fetch fresh coins → shows updated balance.
   */
    useEffect(() => {
        const handleVisibilityChange = () => {
        /*
        * document.visibilityState === 'visible' means
        * user just switched back to this tab.
        */
            if (document.visibilityState === 'visible') {
                const token = localStorage.getItem('token')
                if (token) {
                    refreshUserSilently()
                }
            }
        }

        // Add listener for tab focus change
        document.addEventListener('visibilitychange', handleVisibilityChange)

        // Cleanup — remove listener when component unmounts
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [])

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
 * in every component, we write useAuth().
 *
 * Usage in any component:
 * const { user, login, logout } = useAuth()
 */
export function useAuth() {
    return useContext(AuthContext)
}