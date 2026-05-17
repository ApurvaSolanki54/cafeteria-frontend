import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function Login() {

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')      
    const [loading, setLoading] = useState(false) 

    const { login } = useAuth()
    const navigate = useNavigate() 

    const handleSubmit = async (e) => {
        e.preventDefault() 
        setError('')
        setLoading(true)

        try {
            const response = await api.post('/auth/login', { email, password })
            const { token, name, role, coinBalance } = response.data.data

            
            login({ name, email, role, coinBalance }, token)

            
            navigate(role === 'ADMIN' ? '/admin' : '/book')
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.')
        } finally {
            setLoading(false) 
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

                <form onSubmit={handleSubmit}>
                    <div className="field">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            className="input"
                            placeholder="ravi@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)} 
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