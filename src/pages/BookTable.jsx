import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

function Navbar({ onLogout }) {
    const { user } = useAuth()
    return (
        <nav className="navbar">
            <div className="navbar-logo">🍽️ Cafeteria</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                👤 {user?.name ?? 'User'} | 🪙 {user?.coinBalance ?? '...'} coins
                <button className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '13px' }}
                    onClick={onLogout}>Logout</button>
            </div>
        </nav>
    )
}

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

export default function BookTable() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const [cafeterias, setCafeterias] = useState([])
    const [selectedCafe, setSelectedCafe] = useState('')
    const [date, setDate] = useState(todayString())
    const [time, setTime] = useState('13:00')

    const [allTables, setAllTables] = useState([])
    const [freeTables, setFreeTables] = useState([])

    const [selectedTable, setSelectedTable] = useState(null)
    const [loading, setLoading] = useState(false)
    const [bookingLoading, setBookingLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    function todayString() {
        return new Date().toISOString().split('T')[0]
    }
    useEffect(() => {
        loadCafeterias()
    }, [])
    useEffect(() => {
        if (selectedCafe && date && time) {
            loadTables()
        }
    }, [selectedCafe, date, time])

    const loadCafeterias = async () => {
        try {
            const res = await api.get('/cafeterias')
            setCafeterias(res.data.data)
            if (res.data.data.length > 0) {
                setSelectedCafe(res.data.data[0].id)
            }
        } catch {
            setError('Could not load cafeterias.')
        }
    }

    const loadTables = async () => {
        setLoading(true)
        setSelectedTable(null)
        setError('')
        try {
            const startTime = `${date}T${time}:00`

        
            const res = await api.get(
                `/cafeterias/${selectedCafe}/table-statuses?startTime=${startTime}`
            )
            setAllTables(res.data.data)
        } catch {
            setError('Could not load tables.')
        } finally {
            setLoading(false)
        }
    }

    const handleBook = async () => {
        if (!selectedTable) return
        setBookingLoading(true)
        setError('')
        setSuccess('')
        try {
            const startTime = `${date}T${time}:00`
            await api.post('/bookings', {
                tableId: selectedTable.id,
                startTime,
                memberIds: []
            })
            setSuccess(
                `Table ${selectedTable.tableNumber} booked! ` +
                `Go to "My Bookings" to add colleagues.`
            )
            setSelectedTable(null)
            loadTables() 
        } catch (err) {
            setError(err.response?.data?.message || 'Booking failed.')
        } finally {
            setBookingLoading(false)
        }
    }

    return (
        <>
            <Navbar onLogout={() => { logout(); navigate('/login') }} />

            <main className="page-content">
                <h2 className="section-title" style={{ marginBottom: '1rem' }}>
                    Book a table
                </h2>

                {error && <div className="error-box">{error}</div>}
                {success && <div className="success-box">{success}</div>}

                {/* Cafeteria selector */}
                <div className="field">
                    <label>Cafeteria</label>
                    <select className="input" value={selectedCafe}
                        onChange={(e) => setSelectedCafe(e.target.value)}>
                        {cafeterias.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.name} ({c.size})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Date + Time */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="field">
                        <label>Date</label>
                        <input type="date" className="input"
                            value={date} min={todayString()}
                            onChange={(e) => setDate(e.target.value)} />
                    </div>
                    <div className="field">
                        <label>Time</label>
                        <input type="time" className="input"
                            value={time}
                            onChange={(e) => setTime(e.target.value)} />
                    </div>
                </div>

                {/* Legend — tells user what colours mean */}
                <div style={{
                    display: 'flex', gap: '14px', marginBottom: '10px',
                    fontSize: '12px', color: '#6b7280'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div style={{
                            width: 10, height: 10, borderRadius: 3,
                            background: '#f0fdf4', border: '1.5px solid #1D9E75'
                        }} />
                        Available
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div style={{
                            width: 10, height: 10, borderRadius: 3,
                            background: '#fef2f2', border: '1.5px solid #fca5a5'
                        }} />
                        Booked
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div style={{
                            width: 10, height: 10, borderRadius: 3,
                            background: '#f0fdf4', border: '2px solid #1D9E75'
                        }} />
                        Selected
                    </div>
                </div>

                {/* Section heading with count */}
                <div className="section-title" style={{ marginBottom: '8px' }}>
                    {loading
                        ? 'Loading tables...'
                        : `Tables — ${freeTables.length} free, ${allTables.length - freeTables.length} booked`
                    }
                </div>

                {/* Tables grid — now shows ALL tables with colour coding */}
                <div className="tables-grid">
                    {allTables.map(table => {
                        const isFree     = table.status === 'FREE'
                        const isSelected = selectedTable?.id === table.id

                        const bookedAtDisplay = !isFree && table.bookedFrom
                            ? new Date(table.bookedFrom).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                            })
                            : null

                        return (
                            <div
                                key={table.id}
                                onClick={() => isFree && setSelectedTable(table)}
                                style={{
                                    border: `${isSelected ? '2px' : '1.5px'} solid ${
                                        isSelected ? '#1D9E75' :
                                        isFree     ? '#bbf7d0' :
                                                    '#fca5a5'
                                    }`,
                                    borderRadius: '10px',
                                    padding: '12px',
                                    background: isSelected ? '#dcfce7' :
                                                isFree     ? 'white'   :
                                                            '#fef2f2',
                                    cursor: isFree ? 'pointer' : 'not-allowed',
                                    opacity: isFree ? 1 : 0.8,
                                    transition: 'all 0.15s'
                                }}
                            >
                                {/* Table number + type badge */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: '600', fontSize: '15px' }}>
                                        {table.tableNumber}
                                    </span>
                                    <span style={{
                                        fontSize: '10px', padding: '2px 6px', borderRadius: '20px',
                                        background: table.tableType === 'BIG' ? '#eff6ff' : '#f0fdf4',
                                        color:      table.tableType === 'BIG' ? '#1d4ed8' : '#16a34a'
                                    }}>
                                        {table.tableType}
                                    </span>
                                </div>

                                <div className="chairs-row" style={{ marginTop: '8px' }}>
                                    {Array.from({ length: table.maxCapacity }).map((_, i) => {
                                        
                                        const isOccupied = !isFree && i < (table.occupiedSeats || 0)
                                        
                                        return (
                                            <div
                                                key={i}
                                                title={
                                                    isFree ? `Seat ${i + 1}` :
                                                    isOccupied ? `Seat ${i + 1} — occupied` : `Seat ${i + 1} — empty`
                                                }
                                                style={{
                                                    width: 9,
                                                    height: 9,
                                                    borderRadius: '50%',
                                                    background:
                                                        isFree     ? '#9FE1CB' :  
                                                        isOccupied ? '#dc2626' :  
                                                                    '#fca5a5',   
                                                    transition: 'background 0.2s'
                                                }}
                                            />
                                        )
                                    })}
                                </div>

                                <div style={{
                                    fontSize: '11px', marginTop: '6px', fontWeight: '500',
                                    color: isFree ? '#16a34a' : '#dc2626'
                                }}>
                                    {isFree
                                        ? `Free · up to ${table.maxCapacity} people`
                                        : `Booked at ${bookedAtDisplay} · ${table.occupiedSeats}/${table.maxCapacity} seats`
                                    }
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Booking summary box — shows when table is selected */}
                {selectedTable && (
                    <div style={{
                        background: '#f0fdf4', border: '1px solid #bbf7d0',
                        borderRadius: '10px', padding: '14px', marginBottom: '12px'
                    }}>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                            Selected: Table {selectedTable.tableNumber}
                        </div>
                        <div style={{ fontSize: '13px', color: '#374151' }}>
                            {selectedTable.tableType} table · max {selectedTable.maxCapacity} seats
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                            Window: {time} – {addMinutes(time, 40)}
                            &nbsp;(30 min lunch + 10 min buffer)
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            Cost: 1 coin (you have {user?.coinBalance})
                        </div>
                    </div>
                )}

                <button className="btn-primary"
                    onClick={handleBook}
                    disabled={!selectedTable || bookingLoading}>
                    {bookingLoading
                        ? <span className="spinner" />
                        : selectedTable
                            ? `Book table ${selectedTable.tableNumber}`
                            : 'Select a table above'
                    }
                </button>
            </main>

            <BottomNav active="book" />
        </>
    )
}

function addMinutes(timeStr, mins) {
    const [h, m] = timeStr.split(':').map(Number)
    const total = h * 60 + m + mins
    const hh = Math.floor(total / 60) % 24
    const mm = total % 60
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}