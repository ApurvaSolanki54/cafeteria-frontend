import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function Login() {

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')      // shows error message
    const [loading, setLoading] = useState(false) // disables button while calling API

    const { login } = useAuth()
    const navigate = useNavigate() // lets us redirect to another page

    const handleSubmit = async (e) => {
        e.preventDefault() // stops the page from reloading (default form behaviour)
        setError('')
        setLoading(true)

        try {
            /*
             * POST /api/auth/login
             * response.data looks like:
             * { success: true, message: "Login successful!", data: { token, name, email, role, coinBalance } }
             */
            const response = await api.post('/auth/login', { email, password })
            const { token, name, role, coinBalance } = response.data.data

            // Save user info + token in context and localStorage
            login({ name, email, role, coinBalance }, token)

            // Redirect based on role
            navigate(role === 'ADMIN' ? '/admin' : '/book')
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.')
        } finally {
            setLoading(false) // always runs, even if there's an error
        }
    }

    return (
        <div className="page-center">
            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '24px', marginBottom: '6px' }}>🍽️</div>
                    <h1 style={{ fontSize: '20px', fontWeight: '600' }}>Cafeteria Booking</h1>
                    <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
                        Sign in to book your table
                    </p>
                </div>

                {/* Error message — only shows when error is not empty */}
                {error && <div className="error-box">{error}</div>}

                {/*
                onSubmit calls handleSubmit when form is submitted.
                This works for both button click AND pressing Enter.
                */}
                <form onSubmit={handleSubmit}>
                    <div className="field">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            className="input"
                            placeholder="ravi@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)} // update state on every keystroke
                            required
                        />
                    </div>

                    <div className="field">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            className="input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {/* disabled while loading so user can't double-click */}
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? <span className="spinner" /> : 'Sign in'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '14px', color: '#6b7280' }}>
                    No account?{' '}
                    {/* Link from react-router — navigates without page reload */}
                    <Link to="/register" style={{ color: '#1D9E75', fontWeight: '500' }}>
                        Register
                    </Link>
                </p>
            </div>
        </div>
    )
}