import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function TrainerDashboard() {
  const [athletes, setAthletes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAthlete, setSelectedAthlete] = useState(null)

  // Form States inside Modal
  const [targetCals, setTargetCals] = useState('')
  const [targetProtein, setTargetProtein] = useState('')
  const [targetSteps, setTargetSteps] = useState('')
  const [startDate, setStartDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [trainerNote, setTrainerNote] = useState('')

  useEffect(() => {
    fetchAthletes()
  }, [])

  const fetchAthletes = async () => {
  setLoading(true)
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false }) // Sorts newest created accounts first

  if (error) {
    console.error('Error fetching athletes:', error)
  } else {
    // Bring all 'pending' accounts to the absolute top of the list
    const sortedData = (data || []).sort((a, b) => {
      if (a.membership_type === 'pending' && b.membership_type !== 'pending') return -1
      if (a.membership_type !== 'pending' && b.membership_type === 'pending') return 1
      return 0
    })
    setAthletes(sortedData)
  }
  setLoading(false)
}

  const openManageModal = (athlete) => {
    setSelectedAthlete(athlete)
    setTargetCals(athlete.target_calories || '')
    setTargetProtein(athlete.target_protein || '')
    setTargetSteps(athlete.target_steps || '')
    setStartDate(athlete.membership_start || '')
    setExpiryDate(athlete.membership_end || '')
    setTrainerNote(athlete.trainer_notes || '')
  }

  const handleToggleMembership = async (athleteId, currentType) => {
    // If pending, grant PT access, otherwise toggle between PT and Normal
    const newType = currentType === 'pt' ? 'normal' : 'pt'
    const { error } = await supabase
      .from('profiles')
      .update({ membership_type: newType })
      .eq('id', athleteId)

    if (error) {
      alert('Error updating membership: ' + error.message)
    } else {
      fetchAthletes()
    }
  }

  const handleDeleteAthlete = async (athleteId, name) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${name || 'this athlete'}? This action cannot be undone.`
    )
    if (!confirmDelete) return

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', athleteId)

    if (error) {
      alert('Error deleting athlete: ' + error.message)
    } else {
      alert('Athlete deleted successfully.')
      fetchAthletes()
    }
  }

  const handleSaveSettings = async (e) => {
    e.preventDefault()
    if (!selectedAthlete) return

    // Auto-promote from 'pending' to 'normal' standard member if updating settings
    const updatedMembershipType = selectedAthlete.membership_type === 'pending' 
      ? 'normal' 
      : selectedAthlete.membership_type;

    const { error } = await supabase
      .from('profiles')
      .update({
        target_calories: targetCals ? Number(targetCals) : null,
        target_protein: targetProtein ? Number(targetProtein) : null,
        target_steps: targetSteps ? Number(targetSteps) : null,
        membership_start: startDate || null,
        membership_end: expiryDate || null,
        trainer_notes: trainerNote,
        membership_type: updatedMembershipType
      })
      .eq('id', selectedAthlete.id)

    if (error) {
      alert('Failed to save settings: ' + error.message)
    } else {
      alert(`Updated settings for ${selectedAthlete.full_name || selectedAthlete.athlete_name || 'Athlete'}!`)
      setSelectedAthlete(null)
      fetchAthletes()
    }
  }

  // Count pending sign-ups
  const pendingCount = athletes.filter(a => a.membership_type === 'pending').length

  return (
    <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px', border: '1px solid #333' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#8087ff' }}>👑 Trainer Management Dashboard</h3>
        <button 
          onClick={fetchAthletes} 
          style={{ padding: '8px 14px', backgroundColor: '#333', color: '#fff', border: '1px solid #555', borderRadius: '4px', cursor: 'pointer' }}>
          🔄 Refresh List
        </button>
      </div>

      {/* PENDING SIGN-UPS NOTIFICATION BANNER */}
      {pendingCount > 0 && (
        <div style={{
          backgroundColor: '#ff980022',
          border: '1px solid #ff9800',
          color: '#ffa726',
          padding: '12px 16px',
          borderRadius: '6px',
          marginBottom: '20px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>🔔 You have <strong>{pendingCount}</strong> new pending athlete(s) waiting for access approval!</span>
        </div>
      )}

      {loading ? (
        <p style={{ color: '#aaa' }}>Loading athletes...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {athletes.map((athlete) => {
            const isPT = athlete.membership_type === 'pt'
            const isPending = athlete.membership_type === 'pending'
            const isAdmin = athlete.role === 'admin'
            const displayName = athlete.full_name || athlete.athlete_name || athlete.name || athlete.email?.split('@')[0] || 'Unnamed Athlete'
            const isExpired = athlete.membership_end && new Date(athlete.membership_end) < new Date()

            return (
              <div 
                key={athlete.id} 
                style={{ 
                  backgroundColor: '#121212', 
                  padding: '15px', 
                  borderRadius: '8px', 
                  border: isPending ? '1px solid #ff9800' : isPT ? '1px solid #4caf50' : '1px solid #333',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '16px' }}>{displayName}</strong>
                    
                    {isAdmin && (
                      <span style={{ backgroundColor: '#646cff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', color: '#fff', fontWeight: 'bold' }}>
                        ADMIN / OWNER
                      </span>
                    )}

                    {isPending ? (
                      <span style={{ backgroundColor: '#ff9800', color: '#000', fontSize: '10px', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                        🆕 PENDING APPROVAL
                      </span>
                    ) : (
                      <span style={{ 
                        backgroundColor: isPT ? '#2e7d32' : '#333', 
                        color: isPT ? '#81c784' : '#aaa', 
                        fontSize: '11px', 
                        padding: '2px 8px', 
                        borderRadius: '12px',
                        fontWeight: 'bold' 
                      }}>
                        {isPT ? '⭐ PT Member' : '🏃 Standard Member'}
                      </span>
                    )}

                    {isExpired && !isPending && (
                      <span style={{ backgroundColor: '#d32f2f', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                        EXPIRED
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '12px', color: '#aaa', marginTop: '6px', display: 'flex', gap: '15px' }}>
                    <span>Weight: <strong>{athlete.body_weight ? `${athlete.body_weight} kg` : 'N/A'}</strong></span>
                    <span>Target Cals: <strong>{athlete.target_calories ? `${athlete.target_calories} kcal` : 'Default'}</strong></span>
                    <span>Target Protein: <strong>{athlete.target_protein ? `${athlete.target_protein} g` : 'Default'}</strong></span>
                  </div>

                  {athlete.membership_end && (
                    <div style={{ fontSize: '11px', color: isExpired ? '#ef5350' : '#888', marginTop: '4px' }}>
                      Membership valid through: <strong>{athlete.membership_end}</strong>
                    </div>
                  )}

                  {athlete.trainer_notes && (
                    <div style={{ fontSize: '12px', color: '#ffa726', marginTop: '6px', fontStyle: 'italic' }}>
                      💬 Note: "{athlete.trainer_notes}"
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => openManageModal(athlete)}
                    style={{ 
                      padding: '8px 12px', 
                      backgroundColor: isPending ? '#ff9800' : '#333', 
                      color: isPending ? '#000' : '#fff', 
                      border: '1px solid #555', 
                      borderRadius: '4px', 
                      cursor: 'pointer', 
                      fontSize: '13px', 
                      fontWeight: 'bold' 
                    }}>
                    ⚙️ Targets & Dates
                  </button>

                  <button 
                    onClick={() => handleToggleMembership(athlete.id, athlete.membership_type)}
                    style={{ 
                      padding: '8px 12px', 
                      backgroundColor: isPT ? '#c62828' : '#2e7d32', 
                      color: '#fff', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: 'pointer', 
                      fontSize: '13px',
                      fontWeight: 'bold' 
                    }}>
                    {isPT ? 'Downgrade to Standard' : 'Grant PT Access ⭐'}
                  </button>

                  <button 
                    onClick={() => handleDeleteAthlete(athlete.id, displayName)}
                    style={{ 
                      padding: '8px 12px', 
                      backgroundColor: '#b71c1c', 
                      color: '#fff', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: 'pointer', 
                      fontSize: '13px',
                      fontWeight: 'bold' 
                    }}>
                    🗑️ Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* POPUP MODAL */}
      {selectedAthlete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000
        }}>
          <div style={{
            backgroundColor: '#222',
            padding: '24px',
            borderRadius: '10px',
            width: '90%',
            maxWidth: '500px',
            border: '1px solid #444',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
          }}>
            <h3 style={{ marginTop: 0, color: '#8087ff' }}>
              ⚙️ Manage Athlete: {selectedAthlete.full_name || selectedAthlete.athlete_name || 'Athlete'}
            </h3>

            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '4px' }}>Daily Calorie Target (kcal)</label>
                <input 
                  type="number" 
                  value={targetCals} 
                  onChange={(e) => setTargetCals(e.target.value)} 
                  style={{ width: '100%', padding: '10px', backgroundColor: '#111', border: '1px solid #444', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }} 
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '4px' }}>Daily Protein Target (grams)</label>
                <input 
                  type="number" 
                  value={targetProtein} 
                  onChange={(e) => setTargetProtein(e.target.value)} 
                  style={{ width: '100%', padding: '10px', backgroundColor: '#111', border: '1px solid #444', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }} 
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '4px' }}>Daily Step Goal</label>
                <input 
                  type="number" 
                  value={targetSteps} 
                  onChange={(e) => setTargetSteps(e.target.value)} 
                  style={{ width: '100%', padding: '10px', backgroundColor: '#111', border: '1px solid #444', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '4px' }}>Start Date</label>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)} 
                    style={{ width: '100%', padding: '10px', backgroundColor: '#111', border: '1px solid #444', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '4px' }}>Expiry Date</label>
                  <input 
                    type="date" 
                    value={expiryDate} 
                    onChange={(e) => setExpiryDate(e.target.value)} 
                    style={{ width: '100%', padding: '10px', backgroundColor: '#111', border: '1px solid #444', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }} 
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#ffa726', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                  💬 Direct Trainer Feedback / Coaching Note
                </label>
                <textarea 
                  rows="3"
                  placeholder="e.g. Focus on compound lifts today! Maintain protein above target."
                  value={trainerNote} 
                  onChange={(e) => setTrainerNote(e.target.value)} 
                  style={{ width: '100%', padding: '10px', backgroundColor: '#111', border: '1px solid #ffa726', color: '#fff', borderRadius: '4px', boxSizing: 'border-box', fontFamily: 'sans-serif' }} 
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="submit" 
                  style={{ flex: 2, padding: '12px', backgroundColor: '#4caf50', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Save & Approve Member
                </button>
                <button 
                  type="button" 
                  onClick={() => setSelectedAthlete(null)} 
                  style={{ flex: 1, padding: '12px', backgroundColor: '#555', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default TrainerDashboard