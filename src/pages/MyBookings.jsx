import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

// Reuse BottomNav from BookTable (in a real project put this in a shared components folder)
function BottomNav({ active }) {
    const navigate = useNavigate()
    return (
        <nav className="bottom-nav">
            <button className={`bottom-nav-item ${active === 'book' ? 'active' : ''}`}
                onClick={() => navigate('/book')}>
                <span className="bottom-nav-icon">🪑</span>Book table
            </button>
            <button className={`bottom-nav-item ${active === 'my' ? 'active' : ''}`}
                onClick={() => navigate('/my-bookings')}>
                <span className="bottom-nav-icon">📋</span>My bookings
            </button>
        </nav>
    )
}

export default function MyBookings() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // For adding members
    const [searchName, setSearchName] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [activeBookingId, setActiveBookingId] = useState(null) // which booking we're adding to

    useEffect(() => {
        loadMyBookings()
    }, [])

    const loadMyBookings = async () => {
        setLoading(true)
        try {
            const res = await api.get('/bookings/my')
            setBookings(res.data.data)
        } catch {
            setError('Could not load bookings.')
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = async (bookingId) => {
        // window.confirm shows a popup asking "are you sure?"
        if (!window.confirm('Cancel this booking? Coins will not be refunded.')) return
        try {
            await api.delete(`/bookings/${bookingId}`)
            setSuccess('Booking cancelled.')
            loadMyBookings() // refresh list
        } catch (err) {
            setError(err.response?.data?.message || 'Could not cancel.')
        }
    }

    const handleSearch = async () => {
        if (!searchName.trim()) return
        try {
            const res = await api.get(`/bookings/search-colleagues?name=${searchName}`)
            setSearchResults(res.data.data)
        } catch {
            setError('Search failed.')
        }
    }

    const handleAddMember = async (bookingId, userId) => {
        try {
            await api.post(`/bookings/${bookingId}/members/${userId}`)
            setSuccess('Colleague added! 1 coin deducted from their balance.')
            setSearchResults([])
            setSearchName('')
            setActiveBookingId(null)
            loadMyBookings()
        } catch (err) {
            setError(err.response?.data?.message || 'Could not add member.')
        }
    }

    // Format date for display: "2024-01-15T13:00:00" → "15 Jan, 1:00 PM"
    const formatTime = (dt) => {
        return new Date(dt).toLocaleString('en-IN', {
            day: 'numeric', month: 'short',
            hour: '2-digit', minute: '2-digit'
        })
    }

    return (
        <>
            <nav className="navbar">
                <div className="navbar-logo">🍽️ Cafeteria</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="coin-badge">🪙 {user?.coinBalance} coins</span>
                    <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }}
                        onClick={() => { logout(); navigate('/login') }}>Logout</button>
                </div>
            </nav>

            <main className="page-content">
                {/* Coin info banner */}
                <div style={{
                    background: '#f0fdf4', border: '1px solid #bbf7d0',
                    borderRadius: '10px', padding: '14px', marginBottom: '1rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div>
                        <div style={{ fontSize: '22px', fontWeight: '600' }}>{user?.coinBalance}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>coins remaining</div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '12px', color: '#6b7280' }}>
                        <div>30 coins/month</div>
                        <div>Refills on 1st</div>
                    </div>
                </div>

                <h2 className="section-title">My bookings</h2>

                {error && <div className="error-box">{error}</div>}
                {success && <div className="success-box">{success}</div>}

                {loading && <div style={{ textAlign: 'center', padding: '2rem' }}><span className="spinner" /></div>}

                {!loading && bookings.length === 0 && (
                    <p style={{ color: '#6b7280', fontSize: '14px' }}>
                        No upcoming bookings. Go to "Book table" to make one!
                    </p>
                )}

                {bookings.map(booking => (
                    <div key={booking.id} className="booking-item">
                        <div className="booking-header">
                            <div>
                                <div className="booking-title">
                                    Table {booking.tableNumber} · {booking.cafeteriaName}
                                </div>
                                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                                    {formatTime(booking.startTime)} → {formatTime(booking.endTime)}
                                </div>
                            </div>
                            <span className={`status-badge ${booking.status === 'ACTIVE' ? 'status-active' : 'status-cancelled'}`}>
                                {booking.status}
                            </span>
                        </div>

                        {/* Members list */}
                        {booking.memberNames?.length > 0 && (
                            <div style={{ fontSize: '12px', color: '#374151', marginBottom: '8px' }}>
                                👥 {booking.memberNames.join(', ')}
                            </div>
                        )}

                        {/* Action buttons */}
                        {booking.status === 'ACTIVE' && (
                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                <button
                                    className="btn-secondary"
                                    style={{ flex: 1, padding: '7px', fontSize: '13px' }}
                                    onClick={() => setActiveBookingId(
                                        activeBookingId === booking.id ? null : booking.id
                                    )}
                                >
                                    {activeBookingId === booking.id ? 'Close' : '+ Add colleague'}
                                </button>
                                <button
                                    className="btn-secondary"
                                    style={{ padding: '7px 12px', fontSize: '13px', color: '#dc2626', borderColor: '#fecaca' }}
                                    onClick={() => handleCancel(booking.id)}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}

                        {/* Add colleague panel — only shows for the selected booking */}
                        {activeBookingId === booking.id && (
                            <div style={{
                                marginTop: '10px', background: '#f9fafb',
                                borderRadius: '8px', padding: '12px'
                            }}>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                    <input
                                        className="input"
                                        placeholder="Search colleague by name..."
                                        value={searchName}
                                        onChange={(e) => setSearchName(e.target.value)}
                                        style={{ flex: 1 }}
                                    />
                                    <button className="btn-primary" style={{ width: 'auto', padding: '0 14px' }}
                                        onClick={handleSearch}>
                                        Search
                                    </button>
                                </div>

                                {/* Search results */}
                                {searchResults.map(person => (
                                    <div key={person.id} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '8px 0', borderBottom: '1px solid #f3f4f6'
                                    }}>
                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: '500' }}>{person.name}</div>
                                            <div style={{ fontSize: '11px', color: '#6b7280' }}>{person.email}</div>
                                        </div>
                                        <button
                                            className="btn-primary"
                                            style={{ width: 'auto', padding: '5px 12px', fontSize: '12px' }}
                                            onClick={() => handleAddMember(booking.id, person.id)}
                                        >
                                            Add
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </main>

            <BottomNav active="my" />
        </>
    )
}