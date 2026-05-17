import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function AdminPanel() {
    const { logout } = useAuth()
    const navigate = useNavigate()

    // tab controls which section is visible: 'cafeterias' or 'tables'
    const [tab, setTab] = useState('cafeterias')
    const [cafeterias, setCafeterias] = useState([])
    const [tables, setTables] = useState([])
    const [selectedCafe, setSelectedCafe] = useState(null)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // Modal state for adding cafeteria
    const [showCafeModal, setShowCafeModal] = useState(false)
    const [cafeForm, setCafeForm] = useState({ name: '', size: 'LARGE', description: '' })

    // Modal state for adding table
    const [showTableModal, setShowTableModal] = useState(false)
    const [tableForm, setTableForm] = useState({
        tableNumber: '', tableType: 'SMALL', minCapacity: 1, maxCapacity: 4
    })

    useEffect(() => {
        loadCafeterias()
    }, [])

    const loadCafeterias = async () => {
        try {
            const res = await api.get('/admin/cafeterias')
            setCafeterias(res.data.data)
            if (res.data.data.length > 0 && !selectedCafe) {
                setSelectedCafe(res.data.data[0])
                loadTables(res.data.data[0].id)
            }
        } catch {
            setError('Could not load cafeterias.')
        }
    }

    const loadTables = async (cafeId) => {
        try {
            const res = await api.get(`/admin/cafeterias/${cafeId}/tables`)
            setTables(res.data.data)
        } catch {
            setError('Could not load tables.')
        }
    }

    const handleAddCafeteria = async (e) => {
        e.preventDefault()
        try {
            await api.post('/admin/cafeterias', { ...cafeForm, isActive: true })
            setSuccess('Cafeteria added!')
            setShowCafeModal(false)
            setCafeForm({ name: '', size: 'LARGE', description: '' })
            loadCafeterias()
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add cafeteria.')
        }
    }

    const handleAddTable = async (e) => {
        e.preventDefault()
        if (!selectedCafe) return
        try {
            await api.post('/admin/tables', {
                ...tableForm,
                cafeteria: { id: selectedCafe.id },
                isActive: true,
                minCapacity: Number(tableForm.minCapacity),
                maxCapacity: Number(tableForm.maxCapacity)
            })
            setSuccess('Table added!')
            setShowTableModal(false)
            setTableForm({ tableNumber: '', tableType: 'SMALL', minCapacity: 1, maxCapacity: 4 })
            loadTables(selectedCafe.id)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add table.')
        }
    }

    const selectCafeteria = (cafe) => {
        setSelectedCafe(cafe)
        loadTables(cafe.id)
        setTab('tables') // switch to tables tab when cafeteria is clicked
    }

    return (
        <>
            <nav className="navbar">
                <div className="navbar-logo">🛡️ Admin panel</div>
                <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }}
                    onClick={() => { logout(); navigate('/login') }}>
                    Logout
                </button>
            </nav>

            <main className="page-content" style={{ paddingBottom: '1rem' }}>
                <h2 className="section-title">Manage cafeterias & tables</h2>

                {error && <div className="error-box">{error}</div>}
                {success && <div className="success-box">{success}</div>}

                {/* Tab switcher */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
                    {['cafeterias', 'tables'].map(t => (
                        <button key={t} onClick={() => setTab(t)} style={{
                            padding: '7px 16px', borderRadius: '20px', fontSize: '13px',
                            border: '1px solid',
                            borderColor: tab === t ? '#1D9E75' : '#d1d5db',
                            background: tab === t ? '#1D9E75' : 'white',
                            color: tab === t ? 'white' : '#374151',
                            fontWeight: tab === t ? '500' : '400'
                        }}>
                            {t === 'cafeterias' ? '🏛️ Cafeterias' : '🪑 Tables'}
                        </button>
                    ))}
                </div>

                {/* CAFETERIAS TAB */}
                {tab === 'cafeterias' && (
                    <div className="card">
                        {cafeterias.map(cafe => (
                            <div key={cafe.id} className="admin-list-item"
                                style={{ cursor: 'pointer' }}
                                onClick={() => selectCafeteria(cafe)}>
                                <div>
                                    <div style={{ fontWeight: '500', fontSize: '14px' }}>{cafe.name}</div>
                                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                        {cafe.description || 'No description'}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    <span style={{
                                        fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                                        background: cafe.size === 'LARGE' ? '#eff6ff' : cafe.size === 'MEDIUM' ? '#fef9c3' : '#f0fdf4',
                                        color: cafe.size === 'LARGE' ? '#1d4ed8' : cafe.size === 'MEDIUM' ? '#854d0e' : '#16a34a'
                                    }}>{cafe.size}</span>
                                    <span style={{
                                        fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                                        background: cafe.isActive ? '#f0fdf4' : '#fef2f2',
                                        color: cafe.isActive ? '#16a34a' : '#dc2626'
                                    }}>{cafe.isActive ? 'Active' : 'Inactive'}</span>
                                </div>
                            </div>
                        ))}

                        <button className="btn-primary" style={{ marginTop: '12px' }}
                            onClick={() => setShowCafeModal(true)}>
                            + Add cafeteria
                        </button>
                    </div>
                )}

                {/* TABLES TAB */}
                {tab === 'tables' && (
                    <div>
                        {/* Cafeteria selector */}
                        <div className="field" style={{ marginBottom: '12px' }}>
                            <label>Select cafeteria to manage</label>
                            <select className="input" value={selectedCafe?.id || ''}
                                onChange={(e) => {
                                    const cafe = cafeterias.find(c => c.id === Number(e.target.value))
                                    selectCafeteria(cafe)
                                }}>
                                {cafeterias.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="card">
                            {tables.length === 0 && (
                                <p style={{ color: '#6b7280', fontSize: '14px', padding: '8px 0' }}>
                                    No tables yet. Add the first one!
                                </p>
                            )}
                            {tables.map(table => (
                                <div key={table.id} className="admin-list-item">
                                    <div>
                                        <div style={{ fontWeight: '500', fontSize: '14px' }}>
                                            Table {table.tableNumber}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                            {table.tableType} · {table.minCapacity}–{table.maxCapacity} seats
                                        </div>
                                    </div>
                                    <span style={{
                                        fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                                        background: '#f0fdf4', color: '#16a34a'
                                    }}>Active</span>
                                </div>
                            ))}
                            <button className="btn-primary" style={{ marginTop: '12px' }}
                                onClick={() => setShowTableModal(true)}>
                                + Add table to {selectedCafe?.name}
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* ADD CAFETERIA MODAL */}
            {showCafeModal && (
                <div className="modal-overlay" onClick={() => setShowCafeModal(false)}>
                    {/*
                        stopPropagation stops the click from reaching the overlay behind.
                        Without this, clicking inside the modal would close it.
                    */}
                    <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3 style={{ fontWeight: '600' }}>Add cafeteria</h3>
                            <button onClick={() => setShowCafeModal(false)}
                                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleAddCafeteria}>
                            <div className="field">
                                <label>Name</label>
                                <input className="input" value={cafeForm.name} required
                                    onChange={(e) => setCafeForm({ ...cafeForm, name: e.target.value })} />
                            </div>
                            <div className="field">
                                <label>Size</label>
                                <select className="input" value={cafeForm.size}
                                    onChange={(e) => setCafeForm({ ...cafeForm, size: e.target.value })}>
                                    <option value="LARGE">Large</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="SMALL">Small</option>
                                </select>
                            </div>
                            <div className="field">
                                <label>Description (optional)</label>
                                <input className="input" value={cafeForm.description}
                                    onChange={(e) => setCafeForm({ ...cafeForm, description: e.target.value })} />
                            </div>
                            <button type="submit" className="btn-primary">Add cafeteria</button>
                        </form>
                    </div>
                </div>
            )}

            {/* ADD TABLE MODAL */}
            {showTableModal && (
                <div className="modal-overlay" onClick={() => setShowTableModal(false)}>
                    <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3 style={{ fontWeight: '600' }}>Add table to {selectedCafe?.name}</h3>
                            <button onClick={() => setShowTableModal(false)}
                                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleAddTable}>
                            <div className="field">
                                <label>Table number</label>
                                <input className="input" placeholder="e.g. A1, B2" required
                                    value={tableForm.tableNumber}
                                    onChange={(e) => setTableForm({ ...tableForm, tableNumber: e.target.value })} />
                            </div>
                            <div className="field">
                                <label>Type</label>
                                <select className="input" value={tableForm.tableType}
                                    onChange={(e) => {
                                        // Auto-set default capacities based on type
                                        const isBig = e.target.value === 'BIG'
                                        setTableForm({
                                            ...tableForm,
                                            tableType: e.target.value,
                                            minCapacity: isBig ? 3 : 1,
                                            maxCapacity: isBig ? 6 : 4
                                        })
                                    }}>
                                    <option value="SMALL">Small (1–4 people)</option>
                                    <option value="BIG">Big (3–6 people)</option>
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div className="field">
                                    <label>Min capacity</label>
                                    <input type="number" className="input" min="1"
                                        value={tableForm.minCapacity}
                                        onChange={(e) => setTableForm({ ...tableForm, minCapacity: e.target.value })} />
                                </div>
                                <div className="field">
                                    <label>Max capacity</label>
                                    <input type="number" className="input" min="1"
                                        value={tableForm.maxCapacity}
                                        onChange={(e) => setTableForm({ ...tableForm, maxCapacity: e.target.value })} />
                                </div>
                            </div>
                            <button type="submit" className="btn-primary">Add table</button>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}