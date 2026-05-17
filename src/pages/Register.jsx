import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function Register() {
    const [form, setForm] = useState({ name: '', email: '', password: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()
    
    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const response = await api.post('/auth/register', form)
            const { token, name, email, role, coinBalance } = response.data.data
            login({ name, email, role, coinBalance }, token)
            navigate('/book')
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="page-center">
            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '24px', marginBottom: '6px' }}>🍽️</div>
                    <h1 style={{ fontSize: '20px', fontWeight: '600' }}>Create account</h1>
                    <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
                        Join your office cafeteria system
                    </p>
                </div>

                {error && <div className="error-box">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="field">
                        <label>Full name</label>
                        {/* name="name" matches the key in our form state */}
                        <input name="name" type="text" className="input"
                            placeholder="Ravi Sharma" value={form.name}
                            onChange={handleChange} required />
                    </div>
                    <div className="field">
                        <label>Email</label>
                        <input name="email" type="email" className="input"
                            placeholder="ravi@company.com" value={form.email}
                            onChange={handleChange} required />
                    </div>
                    <div className="field">
                        <label>Password</label>
                        <input name="password" type="password" className="input"
                            placeholder="Min 6 characters" value={form.password}
                            onChange={handleChange} required minLength={6} />
                    </div>
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? <span className="spinner" /> : 'Create account'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '14px', color: '#6b7280' }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: '#1D9E75', fontWeight: '500' }}>Sign in</Link>
                </p>
            </div>
        </div>
    )
}