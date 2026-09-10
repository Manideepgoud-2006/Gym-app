import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function NutritionTracker({ session, targetCalories = 2000, targetProtein = 150, targetSteps = 10000, membershipType }) {
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fats, setFats] = useState('')
  const [fiber, setFiber] = useState('')
  const [steps, setSteps] = useState('')
  const [trainerNote, setTrainerNote] = useState('')

  // Default Macro Targets
  const targetCarbs = 250
  const targetFats = 60
  const targetFiber = 30

  // Today's logged state
  const [todayLog, setTodayLog] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    fiber: 0,
    steps: 0
  })

  useEffect(() => {
    if (session?.user?.id) {
      fetchTodayLog()
      fetchUserProfile()
    }
  }, [session])

  // Fetch Trainer Notes from profiles table safely
  const fetchUserProfile = async () => {
    try {
      if (!session?.user?.id) return
      const { data, error } = await supabase
        .from('profiles')
        .select('trainer_notes')
        .eq('id', session.user.id)
        .maybeSingle()

      if (error) {
        console.error('Error fetching profile notes:', error)
      } else if (data && data.trainer_notes) {
        setTrainerNote(data.trainer_notes)
      }
    } catch (err) {
      console.error('Unexpected error fetching trainer notes:', err)
    }
  }

  // Fetch Today's Log safely without crashing when empty
  const fetchTodayLog = async () => {
    try {
      if (!session?.user?.id) return
      const todayStr = new Date().toISOString().split('T')[0]

      // Use .maybeSingle() instead of .single() to prevent white screen crashes when no row exists
      const { data, error } = await supabase
        .from('nutrition_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('created_at', todayStr)
        .maybeSingle()

      if (error) {
        console.error('Error fetching today log:', error)
        return
      }

      if (data) {
        setTodayLog({
          calories: data.calories || 0,
          protein: data.protein || 0,
          carbs: data.carbs || 0,
          fats: data.fats || 0,
          fiber: data.fiber || 0,
          steps: data.steps || 0
        })
        setCalories(data.calories ?? '')
        setProtein(data.protein ?? '')
        setCarbs(data.carbs ?? '')
        setFats(data.fats ?? '')
        setFiber(data.fiber ?? '')
        setSteps(data.steps ?? '')
      }
    } catch (err) {
      console.error('Unexpected error fetching log:', err)
    }
  }

  const handleSaveLog = async (e) => {
    e.preventDefault()

    if (!session?.user?.id) {
      alert('User session not found. Please log in again.')
      return
    }

    try {
      const logPayload = {
        user_id: session.user.id,
        calories: Number(calories) || 0,
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fats: Number(fats) || 0,
        fiber: Number(fiber) || 0,
        steps: Number(steps) || 0,
        created_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('nutrition_logs')
        .upsert(logPayload)

      if (error) {
        alert('Error saving log: ' + error.message)
      } else {
        alert('Nutrition & Step log updated successfully!')
        fetchTodayLog()
      }
    } catch (err) {
      console.error('Save error:', err)
      alert('An error occurred while saving your log.')
    }
  }

  const isPT = Boolean(
    membershipType && 
    membershipType.toString().toLowerCase().trim().includes('pt')
  )

  const getPercentage = (current, target) => {
    const numCurrent = Number(current) || 0
    const numTarget = Number(target) || 0
    if (!numTarget || numTarget === 0) return 0
    return Math.min(Math.round((numCurrent / numTarget) * 100), 100)
  }

  // Safe fallback values for targets to prevent rendering undefined
  const safeTargetCal = targetCalories || 2000
  const safeTargetProt = targetProtein || 150
  const safeTargetSteps = targetSteps || 10000

  return (
    <div style={{ backgroundColor: '#252525', padding: '20px', borderRadius: '8px', border: '1px solid #333' }}>
      
      {/* Dynamic Tier Header */}
      <div style={{
        backgroundColor: isPT ? '#2a220a' : '#1e1e1e',
        padding: '12px 16px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: isPT ? '1px solid #ffb74d' : '1px solid #444',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <span style={{ fontSize: '12px', color: '#aaa' }}>Current Active Plan: </span>
          <strong style={{ color: isPT ? '#ffa726' : '#8087ff', fontSize: '15px' }}>
            {isPT ? '⭐ Personal Training (PT) VIP Member' : '🏃 Standard Gym Member'}
          </strong>
        </div>
        {isPT && (
          <span style={{ backgroundColor: '#ffa726', color: '#000', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
            FULL MACROS UNLOCKED
          </span>
        )}
      </div>

      <h3 style={{ marginTop: 0, color: '#fff' }}>🥣 Daily Nutrition & Step Tracker</h3>

      {/* Input Form */}
      <form onSubmit={handleSaveLog} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '25px' }}>
        
        {/* Row 1: Basic Inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat( auto-fit, minmax(130px, 1fr) )', gap: '10px' }}>
          <div>
            <label style={{ fontSize: '11px', color: '#aaa' }}>Calories Consumed</label>
            <input
              type="number"
              placeholder={`Target: ${safeTargetCal}`}
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: '#fff', marginTop: '4px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', color: '#aaa' }}>Protein (g)</label>
            <input
              type="number"
              placeholder={`Target: ${safeTargetProt}g`}
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: '#fff', marginTop: '4px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', color: '#aaa' }}>Steps Count</label>
            <input
              type="number"
              placeholder={`Target: ${safeTargetSteps}`}
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: '#fff', marginTop: '4px', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Row 2: Full Macro Inputs (Unlocked for PT Members) */}
        {isPT ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat( auto-fit, minmax(130px, 1fr) )', gap: '10px', padding: '10px', backgroundColor: '#1e1a10', borderRadius: '6px', border: '1px dashed #ffa726' }}>
            <div>
              <label style={{ fontSize: '11px', color: '#ffa726' }}>🍞 Carbs (g)</label>
              <input
                type="number"
                placeholder={`Target: ${targetCarbs}g`}
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ffa726', backgroundColor: '#111', color: '#fff', marginTop: '4px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', color: '#ffa726' }}>🥑 Healthy Fats (g)</label>
              <input
                type="number"
                placeholder={`Target: ${targetFats}g`}
                value={fats}
                onChange={(e) => setFats(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ffa726', backgroundColor: '#111', color: '#fff', marginTop: '4px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', color: '#ffa726' }}>🌾 Dietary Fiber (g)</label>
              <input
                type="number"
                placeholder={`Target: ${targetFiber}g`}
                value={fiber}
                onChange={(e) => setFiber(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ffa726', backgroundColor: '#111', color: '#fff', marginTop: '4px', boxSizing: 'border-box' }}
              />
            </div>
          </div>
        ) : (
          <div style={{ backgroundColor: '#1a1a1a', padding: '10px', borderRadius: '6px', border: '1px solid #333', textAlign: 'center' }}>
            <span style={{ fontSize: '12px', color: '#888' }}>
              🔒 Upgrade to <strong>Personal Training (PT)</strong> to unlock daily Carbs, Fats & Fiber breakdown tracking!
            </span>
          </div>
        )}

        <button type="submit" style={{ padding: '12px', backgroundColor: '#4caf50', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px' }}>
          💾 Save Today's Daily Log
        </button>
      </form>

      {/* Progress Bars Section */}
      <h4 style={{ color: '#aaa', marginBottom: '15px' }}>📊 Today's Progress</h4>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* Calories Progress */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
            <span>🔥 Calories</span>
            <strong>{todayLog.calories} / {safeTargetCal} kcal ({getPercentage(todayLog.calories, safeTargetCal)}%)</strong>
          </div>
          <div style={{ backgroundColor: '#111', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{ width: `${getPercentage(todayLog.calories, safeTargetCal)}%`, backgroundColor: '#ff7043', height: '100%' }} />
          </div>
        </div>

        {/* Protein Progress */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
            <span>🥩 Protein</span>
            <strong>{todayLog.protein} / {safeTargetProt} g ({getPercentage(todayLog.protein, safeTargetProt)}%)</strong>
          </div>
          <div style={{ backgroundColor: '#111', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{ width: `${getPercentage(todayLog.protein, safeTargetProt)}%`, backgroundColor: '#ab47bc', height: '100%' }} />
          </div>
        </div>

        {/* Steps Progress */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
            <span>👟 Steps</span>
            <strong>{todayLog.steps} / {safeTargetSteps} ({getPercentage(todayLog.steps, safeTargetSteps)}%)</strong>
          </div>
          <div style={{ backgroundColor: '#111', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{ width: `${getPercentage(todayLog.steps, safeTargetSteps)}%`, backgroundColor: '#29b6f6', height: '100%' }} />
          </div>
        </div>

        {/* Premium Macros Progress (PT Exclusive) */}
        {isPT && (
          <>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                <span>🍞 Carbohydrates</span>
                <strong>{todayLog.carbs} / {targetCarbs} g ({getPercentage(todayLog.carbs, targetCarbs)}%)</strong>
              </div>
              <div style={{ backgroundColor: '#111', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ width: `${getPercentage(todayLog.carbs, targetCarbs)}%`, backgroundColor: '#ffa726', height: '100%' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                <span>🥑 Healthy Fats</span>
                <strong>{todayLog.fats} / {targetFats} g ({getPercentage(todayLog.fats, targetFats)}%)</strong>
              </div>
              <div style={{ backgroundColor: '#111', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ width: `${getPercentage(todayLog.fats, targetFats)}%`, backgroundColor: '#66bb6a', height: '100%' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                <span>🌾 Dietary Fiber</span>
                <strong>{todayLog.fiber} / {targetFiber} g ({getPercentage(todayLog.fiber, targetFiber)}%)</strong>
              </div>
              <div style={{ backgroundColor: '#111', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ width: `${getPercentage(todayLog.fiber, targetFiber)}%`, backgroundColor: '#26a69a', height: '100%' }} />
              </div>
            </div>
          </>
        )}

      </div>

      {/* Trainer Direct Notes Section */}
      {isPT && trainerNote && (
        <div style={{ marginTop: '25px', backgroundColor: '#1e1a10', padding: '15px', borderRadius: '8px', border: '1px solid #ffa726' }}>
          <h4 style={{ marginTop: 0, color: '#ffa726' }}>👑 Personal Trainer Direct Notes</h4>
          <p style={{ fontSize: '13px', color: '#ccc', margin: 0, fontStyle: 'italic' }}>
            "{trainerNote}"
          </p>
        </div>
      )}

    </div>
  )
}