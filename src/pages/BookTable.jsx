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
    const { user, logout, refreshUser } = useAuth()
    const navigate = useNavigate()

    const [cafeterias, setCafeterias] = useState([])
    const [selectedCafe, setSelectedCafe] = useState('')
    const [date, setDate] = useState(todayString())
    const [time, setTime] = useState(getCurrentTimePlus5)

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
            setSelectedTable(null)
            loadTables()
        }
    }, [selectedCafe, date, time])

    useEffect(() => {
        // Don't start polling until cafeteria and time are selected
        if (!selectedCafe || !date || !time) return

        const interval = setInterval(() => {
        /*
         * document.hidden is true when user switches tabs or minimizes.
         * No point polling when user can't see the screen.
         * This reduces unnecessary calls by ~60%.
         */
            if (!document.hidden) {
                loadTables()
            }
        }, 1000) // 1 seconds is fast enough for a cafeteria booking

        return () => clearInterval(interval)
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
        // setSelectedTable(null)
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

    const handleTableClick = async (table) => {
        // If table is not free, do nothing (can't click a booked table)
        if (table.status !== 'FREE') return

        setSelectedTable(table)

        try {
            const startTime = `${date}T${time}:00`
            console.log("startTime for hold ", startTime);
            await api.post('/bookings/hold', {
                tableId:   table.id,
                startTime: startTime
            })
            loadTables()
        } catch {
            setError('Table was just taken. Please select another.')
            setSelectedTable(null)
            loadTables()
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
            await refreshUser()
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

                {error   && <div className="error-box">{error}</div>}
                {success && <div className="success-box">{success}</div>}

                {/* Cafeteria dropdown */}
                <div className="field">
                <label>Cafeteria</label>
                <select
                    className="input"
                    value={selectedCafe}
                    onChange={(e) => setSelectedCafe(e.target.value)}
                >
                    {cafeterias.map(c => (
                    <option key={c.id} value={c.id}>
                        {c.name} ({c.size})
                    </option>
                    ))}
                </select>
                </div>

                {/* Date + Time side by side */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="field">
                    <label>Date</label>
                    <input
                    type="date"
                    className="input"
                    value={date}
                    min={todayString()}
                    onChange={(e) => setDate(e.target.value)}
                    />
                </div>
                <div className="field">
                    <label>Time</label>
                    <input
                        type="time"
                        className="input"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                    />
                </div>
                </div>

                {/* Colour legend */}
                <div style={{
                    display: 'flex', gap: '12px', marginBottom: '10px',
                    flexWrap: 'wrap', fontSize: '11px', color: '#6b7280'
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3,
                    background: '#f0fdf4', border: '1.5px solid #1D9E75' }} />
                    Available
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3,
                    background: '#fff7ed', border: '1.5px solid #fed7aa' }} />
                    Someone selecting
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3,
                    background: '#fef2f2', border: '1.5px solid #fca5a5' }} />
                    Booked
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3,
                    background: '#dcfce7', border: '2px solid #1D9E75' }} />
                    Your selection
                </div>
                </div>

                {/* Tables count heading */}
                <div className="section-title" style={{ marginBottom: '8px' }}>
                {loading ? 'Loading tables...' : (() => {
                    const free    = allTables.filter(t => t.status === 'FREE').length
                    const pending = allTables.filter(t => t.bookingStatus === 'PENDING').length
                    const booked  = allTables.filter(t => t.bookingStatus === 'ACTIVE').length
                    return `Tables — ${free} free · ${pending} pending · ${booked} booked`
                })()}
                </div>

                <div className="tables-grid">
                {allTables.map(table => {

                    const isFree     = table.status === 'FREE'
                    const isPending  = table.status === 'BOOKED' && table.bookingStatus === 'PENDING'
                    const isBooked   = table.status === 'BOOKED' && table.bookingStatus === 'ACTIVE'
                    const isSelected = selectedTable?.id === table.id

                    const bookedAtDisplay = isBooked && table.bookedFrom
                    ? new Date(table.bookedFrom).toLocaleTimeString('en-IN', {
                        hour:   '2-digit',
                        minute: '2-digit',
                        hour12: true
                        })
                    : null

                    return (
                    <div
                        key={table.id}

                        onClick={() => handleTableClick(table)}
                        style={{
                        borderRadius: '10px',
                        padding: '12px',
                        transition: 'all 0.15s',

                        border: `${isSelected ? '2px' : '1.5px'} solid ${
                            isSelected ? '#1D9E75' : // dark green — your selection
                            isBooked   ? '#fca5a5' : // red — confirmed booking
                            isPending  ? '#fed7aa' : // orange — someone selecting
                                        '#bbf7d0'  // light green — free
                        }`,

                        background:
                            isSelected ? '#dcfce7' : // light green — your selection
                            isBooked   ? '#fef2f2' : // light red — booked
                            isPending  ? '#fff7ed' : // light orange — pending
                                        'white',   // white — free

                        // Can't click a booked or pending table
                        cursor:  isFree ? 'pointer' : 'not-allowed',
                        opacity: isFree ? 1 : 0.8,
                        }}
                    >
                        {/* Table number + type badge */}
                        <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                        }}>
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

                        {/* ──────────────────────────────────────────────────
                            SEAT DOTS
                            Free table    -> all dots light green
                            Pending table -> all dots light orange
                            Booked table  -> first N dots dark red (occupied)
                                            remaining dots light red (empty)

                        ────────────────────────────────────────────────── */}
                        <div className="chairs-row" style={{ marginTop: '8px' }}>
                        {Array.from({ length: table.maxCapacity }).map((_, i) => {
                            /*
                            * isOccupied = true for the first N dots
                            * where N = number of people confirmed sitting.
                            * Only applies to ACTIVE booked tables.
                            */
                            const isOccupied = isBooked && i < (table.occupiedSeats || 0)

                            return (
                            <div
                                key={i}
                                title={
                                isFree       ? `Seat ${i + 1} — free` :
                                isPending    ? `Seat ${i + 1} — pending` :
                                isOccupied   ? `Seat ${i + 1} — occupied` :
                                                `Seat ${i + 1} — empty`
                                }
                                style={{
                                width: 9, height: 9,
                                borderRadius: '50%',
                                // ── colour logic for each dot ──
                                background:
                                    isFree     ? '#9FE1CB' : // green — free seat
                                    isPending  ? '#fdba74' : // orange — pending
                                    isOccupied ? '#dc2626' : // dark red — person sitting
                                                '#fca5a5',  // light red — empty on booked table
                                }}
                            />
                            )
                        })}
                        </div>

                        {/* ──────────────────────────────────────────────────
                            STATUS TEXT — bottom of the tile
                            Free:    "Free · up to 4 people"
                            Pending: "⏳ Someone selecting... (~5 sec)"
                            Booked:  "Booked at 5:00 PM · 2/6 seats"
                                    ↑ actual booking time, NOT viewer's time (FIX in prev message)
                        ────────────────────────────────────────────────── */}
                        <div style={{
                        fontSize: '11px', marginTop: '6px', fontWeight: '500',
                        color:
                            isFree    ? '#16a34a' : // green text
                            isPending ? '#c2410c' : // orange text
                                        '#dc2626'  // red text
                        }}>
                        {isFree
                            ? `Free · up to ${table.maxCapacity} people`
                            : isPending
                            ? `⏳ Someone selecting... (~5 sec)`
                            : `Booked at ${bookedAtDisplay} · ${table.occupiedSeats}/${table.maxCapacity} seats`
                        }
                        </div>

                    </div> // end of tile div
                    )
                })}
                </div>
                {/* end tables grid */}

                {/* Booking summary — shows when user selected a table */}
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
                    Cost: 1 coin · you have {user?.coinBalance} coins
                    </div>
                </div>
                )}

                {/* Book button */}
                <button
                className="btn-primary"
                onClick={handleBook}
                disabled={!selectedTable || bookingLoading}
                >
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

function getCurrentTimePlus5() {
  const now = new Date()
  now.setMinutes(now.getMinutes() + 5)  // add 5 minutes
  // padStart(2, '0') ensures single digits get a leading zero
  // e.g. 8 → "08", 55 → "55"
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`  // returns "20:55"
}