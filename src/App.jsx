import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from './supabaseClient'
import Auth from './Auth'
import NutritionTracker from './NutritionTracker'
import NutritionCalculator from './NutritionCalculator'
import TrainerDashboard from './TrainerDashboard'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

// Default exercise catalog mapping muscle groups to exercise names
const DEFAULT_MUSCLE_EXERCISES = {
  Chest: ['Bench Press', 'Incline Dumbbell Press', 'Dips', 'Pushups'],
  Back: ['Deadlift', 'Pullups', 'Lat Pulldown', 'Barbell Row'],
  Legs: ['Barbell Squat', 'Leg Press', 'Romanian Deadlift', 'Walking Lunges'],
  Shoulders: ['Overhead Press', 'Lateral Raise', 'Face Pulls'],
  Arms: ['Bicep Curl', 'Hammer Curl', 'Tricep Pushdown', 'Skullcrushers'],
  Core: ['Plank', 'Hanging Leg Raise', 'Ab Wheel Rollout']
}

// Default list of exercises measured in reps (counts) rather than weight (kg)
const DEFAULT_REPS_EXERCISES = [
  'Pushups',
  'Pullups',
  'Dips',
  'Plank',
  'Hanging Leg Raise',
  'Ab Wheel Rollout'
]

// Weight brackets for leaderboard filtering
const WEIGHT_BRACKETS = [
  'All Brackets',
  'Under 60 kg',
  '60 - 70 kg',
  '70 - 80 kg',
  '80 - 90 kg',
  '90+ kg'
]

// Date Formatting Helpers
const formatFullDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return isNaN(date.getTime()) ? dateStr : date.toLocaleDateString()
}

const formatRelativeDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr

  const now = new Date()
  const diffInSeconds = Math.floor((now - date) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`

  return date.toLocaleDateString()
}

function App() {
  // Authentication & Session State
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  // User Profile & Membership State
  const [userRole, setUserRole] = useState('member')
  const [athleteName, setAthleteName] = useState(() => localStorage.getItem('athleteName') || '')
  const [userWeight, setUserWeight] = useState('')
  const [userWeightLabel, setUserWeightLabel] = useState('')
  const [membershipStart, setMembershipStart] = useState('')
  const [membershipEnd, setMembershipEnd] = useState('')
  const [membershipType, setMembershipType] = useState('Standard')
  const [isEditingName, setIsEditingName] = useState(false)
const isTrainerOrAdmin =userRole?.toLowerCase() === 'admin' || userRole?.toLowerCase() === 'trainer'

  // UI & Tab State
  const [activeTab, setActiveTab] = useState('home')
  const [showAddCustom, setShowAddCustom] = useState(false)

  // Dynamic Muscle & Exercise Mappings
  const [muscleExercises, setMuscleExercises] = useState(DEFAULT_MUSCLE_EXERCISES)
  const [repsExercises, setRepsExercises] = useState(DEFAULT_REPS_EXERCISES)

  // Log Form State
  const [formMuscle, setFormMuscle] = useState('Chest')
  const [workoutType, setWorkoutType] = useState('Bench Press')
  const [score, setScore] = useState('')
  const [editingLogId, setEditingLogId] = useState(null)
  const [logFilterMuscle, setLogFilterMuscle] = useState('All')

  // Custom Exercise Inputs
  const [customName, setCustomName] = useState('')
  const [customMuscle, setCustomMuscle] = useState('Chest')
  const [customUnit, setCustomUnit] = useState('kg')

  // Data Store
  const [logs, setLogs] = useState([])
  const [allRankings, setAllRankings] = useState([])

  // Nutrition Target State
  const [targetCalories, setTargetCalories] = useState(2000)
  const [targetProtein, setTargetProtein] = useState(150)
  const [targetSteps, setTargetSteps] = useState(10000)

  // Leaderboard Filtering State
  const [selectedMuscle, setSelectedMuscle] = useState('Chest')
  const [selectedExercise, setSelectedExercise] = useState('Bench Press')
  const [selectedBracket, setSelectedBracket] = useState('All Brackets')

  // Analytics State
  const [chartExercise, setChartExercise] = useState('Bench Press')

  // Derived current weight fallback (defaults to 55kg if not set)
  const currentWeight = Number(userWeight) || 55

  // 1. Initial Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // 2. Fetch User Profile & Data on Session Change
  useEffect(() => {
    if (session?.user) {
      fetchUserProfile()
      fetchUserLogs()
      fetchRankings()
      fetchCustomExercises()
    }
  }, [session])
  {/* Tab 6: Profile & Membership Settings */}
{activeTab === 'profile' && (
  <div>
    <h3>⚙️ Profile & Membership Details</h3>
    <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px', border: '1px solid #333' }}>
      
      {/* 1. NAME FIELD WITH EDIT & SAVE LOCK */}
<div style={{ marginBottom: '15px' }}>
  <label style={{ fontSize: '0.85rem', color: '#aaa', display: 'block', marginBottom: '4px' }}>
    Full Name / Athlete Name
  </label>
  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
    <input
      type="text"
      placeholder="Enter your full name"
      value={athleteName}
      disabled={!isEditingName && athleteName !== ''}
      onChange={(e) => setAthleteName(e.target.value)}
      style={{
        flex: 1,
        padding: '10px',
        backgroundColor: (!isEditingName && athleteName !== '') ? '#1a1a1a' : '#2a2a2a',
        color: (!isEditingName && athleteName !== '') ? '#888' : '#fff',
        border: '1px solid #444',
        borderRadius: '4px'
      }}
    />
    <button
      type="button"
      onClick={() => {
        if (isEditingName || athleteName === '') {
          localStorage.setItem('athleteName', athleteName)
          setIsEditingName(false)
        } else {
          setIsEditingName(true)
        }
      }}
      style={{
        padding: '10px 15px',
        backgroundColor: (isEditingName || athleteName === '') ? '#4caf50' : '#333',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        fontWeight: 'bold',
        cursor: 'pointer',
        whiteSpace: 'nowrap'
      }}
    >
      {(isEditingName || athleteName === '') ? '💾 Save Name' : '✏️ Edit'}
    </button>
  </div>
</div>

      {/* 2. BODY WEIGHT FIELD */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ fontSize: '0.85rem', color: '#aaa', display: 'block', marginBottom: '4px' }}>
          Body Weight (kg)
        </label>
        <input
          type="number"
          step="0.1"
          placeholder="e.g. 57"
          value={userWeight}
          onChange={(e) => setUserWeight(e.target.value)}
          style={{ width: '100%', padding: '10px', backgroundColor: '#2a2a2a', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
        />
      </div>

      {/* 3. MEMBERSHIP DATES */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
        <div>
          <label style={{ fontSize: '0.85rem', color: '#aaa', display: 'block', marginBottom: '4px' }}>Membership Paid On</label>
          <input
            type="date"
            value={membershipStart}
            onChange={(e) => setMembershipStart(e.target.value)}
            style={{ width: '100%', padding: '10px', backgroundColor: '#2a2a2a', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
          />
        </div>
        <div>
          <label style={{ fontSize: '0.85rem', color: '#aaa', display: 'block', marginBottom: '4px' }}>Expiry / Next Due Date</label>
          <input
            type="date"
            value={membershipEnd}
            onChange={(e) => setMembershipEnd(e.target.value)}
            style={{ width: '100%', padding: '10px', backgroundColor: '#2a2a2a', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
          />
        </div>
      </div>

      {/* 4. MEMBERSHIP TIER */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ fontSize: '0.85rem', color: '#aaa', display: 'block', marginBottom: '4px' }}>Membership Tier</label>
        <select
          value={membershipType}
          onChange={(e) => setMembershipType(e.target.value)}
          style={{ width: '100%', padding: '10px', backgroundColor: '#2a2a2a', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
        >
          <option value="Standard">Standard Tier</option>
          <option value="Premium">Premium VIP</option>
          <option value="Trainer">Trainer / Staff</option>
        </select>
      </div>

      {/* 5. SAVE BUTTON */}
      <button
        onClick={saveProfileWeight}
        style={{ padding: '12px 20px', backgroundColor: '#4caf50', color: '#fff', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%' }}
      >
        💾 Save Profile & Membership
      </button>
    </div>
  </div>
)}

  // Fetch User Profile
  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error)
      }

      if (data) {
        setUserRole(data.role || 'member')
        setAthleteName(data.full_name || session.user.email.split('@')[0])
        setUserWeight(data.body_weight ? data.body_weight.toString() : '')
        setMembershipStart(data.membership_start || '')
        setMembershipEnd(data.membership_end || '')
        setMembershipType(data.membership_type || 'Standard')
        if (data.target_calories) setTargetCalories(data.target_calories)
        if (data.target_protein) setTargetProtein(data.target_protein)
        if (data.target_steps) setTargetSteps(data.target_steps)

        updateWeightBracketLabel(data.body_weight)
      } else {
        setAthleteName(session.user.email.split('@')[0])
      }
    } catch (err) {
      console.error('Unexpected error fetching profile:', err)
    }
  }

  // Fetch User's Logs
  const fetchUserLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('performance_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true })

      if (error) console.error('Error fetching logs:', error)
      else setLogs(data || [])
    } catch (err) {
      console.error('Unexpected error fetching logs:', err)
    }
  }

  // Fetch All Rankings / Standings
  const fetchRankings = async () => {
    try {
      const { data, error } = await supabase
        .from('performance_logs')
        .select(`
          id,
          user_id,
          athlete_name,
          workout_type,
          score,
          created_at,
          profiles ( body_weight )
        `)
        .order('score', { ascending: false })

      if (error) console.error('Error fetching standings:', error)
      else setAllRankings(data || [])
    } catch (err) {
      console.error('Unexpected error fetching standings:', err)
    }
  }

  // Fetch Custom Exercises added by users
  const fetchCustomExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_exercises')
        .select('*')

      if (error) {
        console.error('Error fetching custom exercises:', error)
        return
      }

      if (data && data.length > 0) {
        const updatedMuscleExercises = { ...DEFAULT_MUSCLE_EXERCISES }
        const updatedReps = [...DEFAULT_REPS_EXERCISES]

        data.forEach((ex) => {
          const m = ex.muscle_group
          if (!updatedMuscleExercises[m]) {
            updatedMuscleExercises[m] = []
          }
          if (!updatedMuscleExercises[m].includes(ex.name)) {
            updatedMuscleExercises[m].push(ex.name)
          }
          if (ex.unit === 'reps' && !updatedReps.includes(ex.name)) {
            updatedReps.push(ex.name)
          }
        })

        setMuscleExercises(updatedMuscleExercises)
        setRepsExercises(updatedReps)
      }
    } catch (err) {
      console.error('Unexpected error fetching custom exercises:', err)
    }
  }

  // Calculate Weight Category Bracket Label
  const updateWeightBracketLabel = (weightVal) => {
    const w = Number(weightVal)
    if (!w || isNaN(w)) {
      setUserWeightLabel('Unassigned')
      return
    }
    const lower = Math.floor(w / 10) * 10
    const upper = lower + 10
    setUserWeightLabel(`${lower} - ${upper} kg Category`)
  }

  // Handle Profile & Membership Saving
  // Handle Profile & Membership Saving
  // Handle Profile & Membership Saving
  const saveProfileWeight = async () => {
  if (!session?.user) return;

  try {
    const profileUpdate = {
      full_name: athleteName,
      body_weight: userWeight ? parseFloat(userWeight) : null,
      membership_start: membershipStart || null,
      membership_end: membershipEnd || null,
      membership_type: membershipType || 'Standard',
      target_calories: targetCalories ? parseInt(targetCalories) : null,
      target_protein: targetProtein ? parseInt(targetProtein) : null,
      target_steps: targetSteps ? parseInt(targetSteps) : null,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('id', session.user.id);

    if (error) {
      console.error('Error saving profile:', error.message);
      alert('Error saving profile: ' + error.message);
    } else {
      alert('Profile updated successfully!');
      fetchUserProfile(); // Refresh local state
    }
  } catch (err) {
    console.error('Unexpected error:', err);
    alert('Failed to save profile. Check internet/Supabase connection.');
  }
};

  // Save Nutrition Goals from NutritionCalculator
  const handleSaveTargets = async (newCals, newProt, newSteps) => {
    setTargetCalories(newCals)
    setTargetProtein(newProt)
    setTargetSteps(newSteps)

    try {
      const { error } = await supabase.from('profiles').upsert({
        id: session.user.id,
        target_calories: newCals,
        target_protein: newProt,
        target_steps: newSteps,
        updated_at: new Date()
      })
      if (error) console.error('Error saving targets:', error)
    } catch (err) {
      console.error('Error updating targets:', err)
    }
  }

  // Save Custom Exercise Definition
  const handleAddCustomExercise = async (e) => {
    e.preventDefault()
    if (!customName.trim()) return

    const nameFormatted = customName.trim()
    try {
      const { error } = await supabase.from('custom_exercises').insert([
        {
          name: nameFormatted,
          muscle_group: customMuscle,
          unit: customUnit,
          created_by: session.user.id
        }
      ])

      if (error) {
        alert('Error adding custom exercise: ' + error.message)
        return
      }

      const updatedExercises = { ...muscleExercises }
      if (!updatedExercises[customMuscle]) {
        updatedExercises[customMuscle] = []
      }
      if (!updatedExercises[customMuscle].includes(nameFormatted)) {
        updatedExercises[customMuscle].push(nameFormatted)
      }
      setMuscleExercises(updatedExercises)

      if (customUnit === 'reps' && !repsExercises.includes(nameFormatted)) {
        setRepsExercises([...repsExercises, nameFormatted])
      }

      setCustomName('')
      setShowAddCustom(false)
      alert('Custom exercise added successfully!')
    } catch (err) {
      alert('Failed to add custom exercise: ' + err.message)
    }
  }

  // Handle Form Muscle Dropdown Switch
  const handleFormMuscleChange = (muscle) => {
    setFormMuscle(muscle)
    const available = muscleExercises[muscle] || []
    if (available.length > 0) {
      setWorkoutType(available[0])
    }
  }

  // Handle Standings Muscle Dropdown Switch
  const handleMuscleChange = (muscle) => {
    setSelectedMuscle(muscle)
    const available = muscleExercises[muscle] || []
    if (available.length > 0) {
      setSelectedExercise(available[0])
    }
  }
  // Handler to Edit/Rename Exercise
  const handleEditExerciseName = (muscle, oldName) => {
    const newName = prompt(`Edit exercise name for "${oldName}":`, oldName)
    if (!newName || newName.trim() === '' || newName === oldName) return

    setMuscleExercises((prev) => {
      const updatedList = prev[muscle].map((item) => (item === oldName ? newName.trim() : item))
      return { ...prev, [muscle]: updatedList }
    })
  }

  // Handler to Delete Exercise
  const handleDeleteExercise = (muscle, exerciseToDelete) => {
    if (!window.confirm(`Are you sure you want to delete "${exerciseToDelete}"?`)) return

    setMuscleExercises((prev) => {
      const updatedList = prev[muscle].filter((item) => item !== exerciseToDelete)
      return { ...prev, [muscle]: updatedList }
    })

    if (workoutType === exerciseToDelete) {
      setWorkoutType(muscleExercises[muscle]?.find((item) => item !== exerciseToDelete) || '')
    }
  }

  // Save or Update Performance Log Record
  const handleSaveLog = async (e) => {
    e.preventDefault()
    if (!score) return

    try {
      const payload = {
        user_id: session.user.id,
        athlete_name: athleteName || 'Anonymous',
        workout_type: workoutType,
        score: parseFloat(score)
      }

      if (editingLogId) {
        const { error } = await supabase
          .from('performance_logs')
          .update(payload)
          .eq('id', editingLogId)

        if (error) throw error
        setEditingLogId(null)
      } else {
        const { error } = await supabase.from('performance_logs').insert([payload])
        if (error) throw error
      }

      setScore('')
      fetchUserLogs()
      fetchRankings()
    } catch (err) {
      alert('Error saving log: ' + err.message)
    }
  }

  // Start Editing Existing Log
  const startEditingLog = (log) => {
    setEditingLogId(log.id)
    setAthleteName(log.athlete_name || '')
    setWorkoutType(log.workout_type)

    // Find parent muscle group
    let parentMuscle = 'Chest'
    for (const [m, list] of Object.entries(muscleExercises)) {
      if (list.includes(log.workout_type)) {
        parentMuscle = m
        break
      }
    }
    setFormMuscle(parentMuscle)
    setScore(log.score.toString())
  }

  const cancelEditing = () => {
    setEditingLogId(null)
    setScore('')
  }

  // Delete Log Record
  const handleDeleteLog = async (logId) => {
    if (!window.confirm('Are you sure you want to delete this performance record?')) return

    try {
      const { error } = await supabase
        .from('performance_logs')
        .delete()
        .eq('id', logId)

      if (error) throw error
      fetchUserLogs()
      fetchRankings()
    } catch (err) {
      alert('Error deleting log: ' + err.message)
    }
  }

  // Logout Handler
  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  // Helper score unit formatter (kg vs reps)
  const formatScoreUnit = (exercise, val) => {
    const isReps = repsExercises.includes(exercise)
    return `${val} ${isReps ? 'reps' : 'kg'}`
  }

  // Helper Membership Days Left & Expiry Info
  const getMembershipStatus = () => {
    if (!membershipEnd) return { status: 'No Active Expiry Set', color: '#888', daysLeft: 0 }
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expiry = new Date(membershipEnd)
    expiry.setHours(0, 0, 0, 0)

    const diffTime = expiry - today
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (daysLeft < 0) return { status: 'Expired', color: '#e53935', daysLeft }
    if (daysLeft <= 7) return { status: `Expiring Soon (${daysLeft}d)`, color: '#ff9800', daysLeft }
    return { status: 'Active', color: '#4caf50', daysLeft }
  }

  // Calculate Personal Record (PR) map per exercise
  const userExercisePRMap = useMemo(() => {
    const prMap = {}
    logs.forEach((log) => {
      const key = `${log.user_id}_${log.workout_type?.toLowerCase().trim()}`
      if (!prMap[key] || Number(log.score) > prMap[key]) {
        prMap[key] = Number(log.score)
      }
    })
    return prMap
  }, [logs])

  // Filtered Standings Leaderboard Records
  const filteredRankings = useMemo(() => {
    return allRankings.filter((log) => {
      if (log.workout_type !== selectedExercise) return false

      if (selectedBracket === 'All Brackets') return true

      const bw = log.profiles?.body_weight
      if (!bw) return false

      if (selectedBracket === 'Under 60 kg') return bw < 60
      if (selectedBracket === '60 - 70 kg') return bw >= 60 && bw < 70
      if (selectedBracket === '70 - 80 kg') return bw >= 70 && bw < 80
      if (selectedBracket === '80 - 90 kg') return bw >= 80 && bw < 90
      if (selectedBracket === '90+ kg') return bw >= 90
      return true
    })
  }, [allRankings, selectedExercise, selectedBracket])

  // Chart Data Processing for Selected Exercise Analytics
  const chartData = useMemo(() => {
    return logs
      .filter((l) => l.workout_type === chartExercise)
      .map((l) => ({
        date: new Date(l.created_at).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric'
        }),
        score: Number(l.score)
      }))
  }, [logs, chartExercise])

  // Weekly breakdown calculation for Analytics
  const weeklyCalendar = useMemo(() => {
    const filtered = logs.filter((l) => l.workout_type === chartExercise)
    const weeks = {}

    filtered.forEach((log) => {
      const d = new Date(log.created_at)
      const weekNum = Math.ceil(d.getDate() / 7)
      const key = `${d.toLocaleString('default', { month: 'short' })} W${weekNum}`

      if (!weeks[key]) {
        weeks[key] = { week: key, date: formatFullDate(log.created_at), maxLift: Number(log.score), logsCount: 1 }
      } else {
        weeks[key].logsCount += 1
        if (Number(log.score) > weeks[key].maxLift) {
          weeks[key].maxLift = Number(log.score)
        }
      }
    })

    return Object.values(weeks)
  }, [logs, chartExercise])

  // Show Loading Spinner or Auth Form if not authenticated
  if (loading) {
    return (
      <div style={{ backgroundColor: '#121212', minHeight: '100vh', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <h3>Loading Gym App...</h3>
      </div>
    )
  }

  if (!session) {
    return <Auth />
  }

  const memberStatus = getMembershipStatus()

  // Filter logs by Muscle Category
  const recentLogs = [...logs].reverse().filter((log) => {
    if (logFilterMuscle === 'All') return true
    const validExercises = muscleExercises[logFilterMuscle] || []
    return validExercises.includes(log.workout_type)
  })

  const isFormReps = repsExercises.includes(workoutType)
  const isChartReps = repsExercises.includes(chartExercise)

  const startingWeight = chartData.length > 0 ? chartData[0].score : 0
  const latestWeight = chartData.length > 0 ? chartData[chartData.length - 1].score : 0
  const totalGain = latestWeight - startingWeight

  // Helper check for Admin or Trainer
    userRole?.toLowerCase() === 'admin' || userRole?.toLowerCase() === 'trainer'

  return (
    <div style={{ backgroundColor: '#121212', minHeight: '100vh', color: '#fff', padding: '20px', fontFamily: 'sans-serif', position: 'relative' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#fff' }}>🏋️ Athlete Performance Tracker</h2>
          <button
            onClick={handleLogout}
            style={{ padding: '8px 14px', backgroundColor: '#333', color: '#fff', border: '1px solid #444', borderRadius: '4px', cursor: 'pointer' }}
          >
            Logout
          </button>
        </div>

        {/* Navigation Tabs Header */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', overflowX: 'auto' }}>
          <button
            onClick={() => setActiveTab('home')}
            style={{
              flex: 1,
              padding: '12px 6px',
              backgroundColor: activeTab === 'home' ? '#646cff' : '#252525',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            🏠 Log & Profile
          </button>

          <button
            onClick={() => setActiveTab('nutrition')}
            style={{
              flex: 1,
              padding: '12px 6px',
              backgroundColor: activeTab === 'nutrition' ? '#646cff' : '#252525',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            🥗 Nutrition Hub
          </button>

          <button
            onClick={() => setActiveTab('compare')}
            style={{
              flex: 1,
              padding: '12px 6px',
              backgroundColor: activeTab === 'compare' ? '#646cff' : '#252525',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            🏆 Standings
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            style={{
              flex: 1,
              padding: '12px 6px',
              backgroundColor: activeTab === 'analytics' ? '#646cff' : '#252525',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            📈 Analytics
          </button>

          {/* Trainer View Tab - Case-insensitive Role Check */}
          {(userRole?.toLowerCase() === 'trainer' || userRole?.toLowerCase() === 'admin') && (
            <button
              onClick={() => setActiveTab('trainer')}
              style={{
                flex: 1,
                padding: '12px 6px',
                backgroundColor: activeTab === 'trainer' ? '#646cff' : '#252525',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              👑 Trainer View
            </button>
          )}
        </div>

        {/* TAB 1: Profile, Membership & Log Form */}
        {/* TAB 1: Profile, Membership & Log Form */}
{activeTab === 'home' && (
  <div>
    <div style={{ backgroundColor: '#1e1e1e', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: `1px solid ${memberStatus?.color || '#333'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: '13px', color: '#aaa' }}>Gym Membership Status</div>
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: memberStatus?.color || '#fff', marginTop: '2px' }}>
          ● {memberStatus?.status || 'Unknown'}
        </div>
      </div>
      {membershipEnd ? (
        <div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
            Expires on: <strong>{formatFullDate(membershipEnd)}</strong> ({memberStatus?.daysLeft > 0 ? `${memberStatus.daysLeft} days remaining` : 'Expired'})
          </div>
        </div>
      ) : (
        <div>
          <span style={{ fontSize: '12px', color: '#aaa', fontStyle: 'italic' }}>Set dates below ↘</span>
        </div>
      )}
    </div>

    <div style={{ backgroundColor: '#252525', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #333' }}>
      <h3 style={{ marginTop: 0 }}>👤 Profile & Membership Details</h3>
      <div style={{ marginBottom: '15px' }}>
        <label style={{ fontSize: '0.85rem', color: '#aaa', display: 'block', textAlign: 'center', marginBottom: '4px' }}>
          Full Name / Athlete Name
        </label>
        <input
          type="text"
          placeholder="Enter your name"
          value={athleteName || ''}
          onChange={(e) => setAthleteName(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#1a1a1a',
            color: '#fff',
            border: '1px solid #333',
            borderRadius: '4px',
            textAlign: 'center'
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label style={{ fontSize: '12px', color: '#aaa' }}>Body Weight (kg)</label>
          <input
            type="number"
            placeholder="Enter body weight (e.g. 70)"
            value={
              typeof userWeight === 'object' && userWeight !== null
                ? (userWeight.weightKg || userWeight.body_weight || userWeight.userWeight || '')
                : (userWeight ?? '')
            }
            onChange={(e) => setUserWeight(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: '#fff', marginTop: '4px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
  <div>
    <label style={{ fontSize: '12px', color: '#aaa' }}>
      Membership Paid On {!isTrainerOrAdmin && '🔒'}
    </label>
    <input
      type="date"
      value={membershipStart || ''}
      disabled={!isTrainerOrAdmin}
      onChange={(e) => setMembershipStart(e.target.value)}
      style={{
        width: '100%',
        padding: '10px',
        borderRadius: '4px',
        border: '1px solid #444',
        backgroundColor: isTrainerOrAdmin ? '#1a1a1a' : '#111',
        color: isTrainerOrAdmin ? '#fff' : '#777',
        marginTop: '4px',
        boxSizing: 'border-box',
        cursor: isTrainerOrAdmin ? 'text' : 'not-allowed'
      }}
    />
  </div>
  <div>
    <label style={{ fontSize: '12px', color: '#aaa' }}>
      Expiry / Next Due Date {!isTrainerOrAdmin && '🔒'}
    </label>
    <input
      type="date"
      value={membershipEnd || ''}
      disabled={!isTrainerOrAdmin}
      onChange={(e) => setMembershipEnd(e.target.value)}
      style={{
        width: '100%',
        padding: '10px',
        borderRadius: '4px',
        border: '1px solid #444',
        backgroundColor: isTrainerOrAdmin ? '#1a1a1a' : '#111',
        color: isTrainerOrAdmin ? '#fff' : '#777',
        marginTop: '4px',
        boxSizing: 'border-box',
        cursor: isTrainerOrAdmin ? 'text' : 'not-allowed'
      }}
    />
  </div>
</div>

{!isTrainerOrAdmin && (
  <p style={{ fontSize: '11px', color: '#888', margin: '8px 0 0 0', fontStyle: 'italic' }}>
    🔒 Membership dates can only be updated by a gym owner or trainer.
  </p>
)}

        <div
          style={{
            marginTop: '15px',
            marginBottom: '15px',
            padding: '12px',
            backgroundColor: '#1a1a1a',
            borderRadius: '6px',
            border: '1px solid #444',
            textAlign: 'center'
          }}
        >
          <span style={{ fontSize: '14px', color: '#aaa' }}>Current Active Plan: </span>
          {typeof membershipType === 'string' && membershipType.toLowerCase().trim().includes('pt') ? (
            <span style={{ color: '#4caf50', fontWeight: 'bold', fontSize: '14px' }}>
              ⭐ PT Member (Custom Targets Set by Trainer)
            </span>
          ) : (
            <span style={{ color: '#646cff', fontWeight: 'bold', fontSize: '14px' }}>
              🏃 Standard Gym Member
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={saveProfileWeight}
          style={{ padding: '10px 20px', backgroundColor: '#4caf50', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          💾 Save Profile & Membership
        </button>
      </div>

      <p style={{ fontSize: '13px', color: '#aaa', marginTop: '12px', marginBottom: 0 }}>
        Weight Category: {' '}
        <strong style={{ color: '#646cff' }}>
          {typeof userWeightLabel === 'object' && userWeightLabel !== null
            ? (userWeightLabel.label || userWeightLabel.category || JSON.stringify(userWeightLabel))
            : (userWeightLabel || 'N/A')}
        </strong>
      </p>
    </div>

    <div style={{ backgroundColor: '#1e1e1e', padding: '12px 15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '14px', fontWeight: 'bold' }}>✨ Don't see your exercise?</span>
      <button
        onClick={() => setShowAddCustom(!showAddCustom)}
        style={{ padding: '6px 12px', backgroundColor: showAddCustom ? '#555' : '#8087ff', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}
      >
        {showAddCustom ? 'Close' : '➕ Add Custom Exercise'}
      </button>
    </div>

    {showAddCustom && (
      <form onSubmit={handleAddCustomExercise} style={{ backgroundColor: '#1a232a', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #646cff' }}>
        <h4 style={{ marginTop: 0, color: '#8087ff' }}>➕ Add Custom Exercise</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            type="text"
            placeholder="Exercise Name (e.g. Hammer Curls)"
            value={customName || ''}
            onChange={(e) => setCustomName(e.target.value)}
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#111', color: '#fff' }}
            required
          />

          <div style={{ display: 'flex', gap: '10px' }}>
            <select
              value={customMuscle}
              onChange={(e) => setCustomMuscle(e.target.value)}
              style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#111', color: '#fff' }}
            >
              {Object.keys(muscleExercises || {}).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            <select
              value={customUnit}
              onChange={(e) => setCustomUnit(e.target.value)}
              style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#111', color: '#fff' }}
            >
              <option value="kg">Weight (kg)</option>
              <option value="reps">Reps (Counts)</option>
            </select>
          </div>

          <button
            type="submit"
            style={{ padding: '10px', backgroundColor: '#4caf50', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Save Custom Exercise
          </button>
        </div>
      </form>
    )}

    <form onSubmit={handleSaveLog} style={{ backgroundColor: editingLogId ? '#2a2115' : '#252525', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: editingLogId ? '2px solid #ffa726' : '1px solid #333' }}>
      <h3 style={{ marginTop: 0 }}>
        {editingLogId ? '✏️ Edit Performance Log' : '➕ Log New Performance'}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

        <select
          value={formMuscle}
          onChange={(e) => handleFormMuscleChange(e.target.value)}
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: '#fff' }}
        >
          {Object.keys(muscleExercises || {}).map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>


        {/* Single Select Box with Edit & Delete Buttons on the Right */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select
                    value={workoutType}
                    onChange={(e) => setWorkoutType(e.target.value)}
                    style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: '#fff' }}
                  >
                    {muscleExercises[formMuscle]?.map((ex) => (
                      <option key={ex} value={ex}>{ex}</option>
                    ))}
                  </select>

                  {workoutType && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleEditExerciseName(formMuscle, workoutType)}
                        style={{ padding: '8px 12px', backgroundColor: '#ffa726', color: '#000', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteExercise(formMuscle, workoutType)}
                        style={{ padding: '8px 12px', backgroundColor: '#e53935', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  )}
                </div>

        <input
          type="number"
          step="any"
          placeholder={isFormReps ? 'Total Reps Count (e.g. 35)' : 'Weight Lifted in kg (e.g. 2.5 or 5)'}
          value={score || ''}
          onChange={(e) => setScore(e.target.value)}
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: '#fff' }}
          required
        />

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="submit"
            style={{ flex: 1, padding: '12px', backgroundColor: editingLogId ? '#ffa726' : '#646cff', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {editingLogId ? 'Update Record' : 'Save Record'}
          </button>
          {editingLogId && (
            <button
              type="button"
              onClick={cancelEditing}
              style={{ padding: '12px 20px', backgroundColor: '#555', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </form>

    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
      <h3 style={{ color: '#aaa', margin: 0 }}>📋 My Logs</h3>
    </div>

    {/* Filter Buttons for Logs */}
    <div style={{ display: 'flex', gap: '6px', marginBottom: '15px', overflowX: 'auto' }}>
      <button
        onClick={() => setLogFilterMuscle('All')}
        style={{ padding: '6px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', backgroundColor: logFilterMuscle === 'All' ? '#646cff' : '#222', color: '#fff' }}
      >
        All
      </button>
      {Object.keys(muscleExercises || {}).map((m) => (
        <button
          key={m}
          onClick={() => setLogFilterMuscle(m)}
          style={{ padding: '6px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', backgroundColor: logFilterMuscle === m ? '#646cff' : '#222', color: '#fff' }}
        >
          {m}
        </button>
      ))}
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {recentLogs.length === 0 ? (
        <p style={{ color: '#666' }}>No logs found for this muscle filter.</p>
      ) : (
        recentLogs.map((log) => {
          const prKey = `${log.user_id}_${log.workout_type?.toLowerCase().trim()}`
          const isPR = Number(log.score) === userExercisePRMap[prKey]

          return (
            <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#252525', borderRadius: '6px', border: '1px solid #333' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong>{log.athlete_name}</strong> - {log.workout_type}
                  {isPR && (
                    <span style={{ backgroundColor: '#ff9800', color: '#000', fontSize: '11px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px' }}>
                      🔥 PR
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                  🗓️ {formatRelativeDate(log.created_at)}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#4caf50', fontWeight: 'bold', marginRight: '5px' }}>
                  {formatScoreUnit(log.workout_type, log.score)}
                </span>
                <button
                  onClick={() => startEditingLog(log)}
                  style={{ padding: '4px 10px', backgroundColor: '#ffa726', color: '#111', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteLog(log.id)}
                  style={{ padding: '4px 10px', backgroundColor: '#e53935', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Delete
                </button>
              </div>
            </div>
          )
        })
      )}
    </div>
  </div>
)}

        {/* TAB 2: Nutrition Hub */}
        {activeTab === 'nutrition' && (
          <div>
            <NutritionCalculator
              userWeight={currentWeight}
              onSaveTargets={handleSaveTargets}
            />
            <NutritionTracker
              session={session}
              targetCalories={targetCalories}
              targetProtein={targetProtein}
              targetSteps={targetSteps}
              membershipType={membershipType}
              userWeight={userWeight || currentWeight}
            />
          </div>
        )}

        {/* TAB 3: Standings */}
        {activeTab === 'compare' && (
          <div>
            <div style={{ backgroundColor: '#252525', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #333' }}>
              <h3 style={{ marginTop: 0 }}>🏆 Gym Standings & Leaderboard</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#aaa' }}>Muscle Group</label>
                  <select
                    value={selectedMuscle}
                    onChange={(e) => handleMuscleChange(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: '#fff', marginTop: '4px' }}
                  > 
                    {Object.keys(muscleExercises).map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#aaa' }}>Exercise</label>
                  <select
                    value={selectedExercise}
                    onChange={(e) => setSelectedExercise(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: '#fff', marginTop: '4px' }}
                  >
                    {muscleExercises[selectedMuscle]?.map((ex) => (
                      <option key={ex} value={ex}>{ex}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#aaa' }}>Weight Bracket</label>
                  <select
                    value={selectedBracket}
                    onChange={(e) => setSelectedBracket(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: '#fff', marginTop: '4px' }}
                  >
                    {WEIGHT_BRACKETS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredRankings.length === 0 ? (
                <p style={{ color: '#666' }}>No records found for this weight class and exercise combination.</p>
              ) : (
                filteredRankings.map((log, rank) => (
                  <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#252525', borderRadius: '6px', border: '1px solid #333' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '18px', fontWeight: 'bold', color: rank === 0 ? '#ffd700' : rank === 1 ? '#c0c0c0' : rank === 2 ? '#cd7f32' : '#888', width: '25px' }}>
                        #{rank + 1}
                      </span>
                      <div>
                        <strong>{log.athlete_name}</strong>
                        <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                          Weight Bracket: {log.profiles?.body_weight ? `${Math.floor(log.profiles.body_weight / 10) * 10}-${Math.floor(log.profiles.body_weight / 10) * 10 + 10} kg` : 'N/A'}
                        </div>
                      </div>
                    </div>
                    <span style={{ color: '#646cff', fontWeight: 'bold', fontSize: '16px' }}>
                      {formatScoreUnit(log.workout_type, log.score)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: Analytics */}
        {activeTab === 'analytics' && (
          <div>
            <div style={{ backgroundColor: '#252525', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #333' }}>
              <h3 style={{ marginTop: 0 }}>📊 Performance Analytics</h3>

              <label style={{ fontSize: '12px', color: '#aaa' }}>Select Exercise to Track Progress</label>
              <select
                value={chartExercise}
                onChange={(e) => setChartExercise(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: '#fff', marginTop: '4px' }}
              >
                {Object.values(muscleExercises).flat().map((ex) => (
                  <option key={ex} value={ex}>{ex}</option>
                ))}
              </select>
            </div>

            {chartData.length === 0 ? (
              <p style={{ color: '#666' }}>No entries found for {chartExercise}. Start logging items on the Home tab!</p>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ backgroundColor: '#1e1e1e', padding: '12px', borderRadius: '6px', textAlign: 'center', border: '1px solid #333' }}>
                    <div style={{ fontSize: '12px', color: '#aaa' }}>Starting Score</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '4px' }}>{startingWeight} {isChartReps ? 'reps' : 'kg'}</div>
                  </div>
                  <div style={{ backgroundColor: '#1e1e1e', padding: '12px', borderRadius: '6px', textAlign: 'center', border: '1px solid #333' }}>
                    <div style={{ fontSize: '12px', color: '#aaa' }}>Latest Score</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '4px' }}>{latestWeight} {isChartReps ? 'reps' : 'kg'}</div>
                  </div>
                  <div style={{ backgroundColor: '#1e1e1e', padding: '12px', borderRadius: '6px', textAlign: 'center', border: '1px solid #333' }}>
                    <div style={{ fontSize: '12px', color: '#aaa' }}>Total Gain</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '4px', color: totalGain >= 0 ? '#4caf50' : '#e53935' }}>
                      {totalGain >= 0 ? `+${totalGain}` : totalGain} {isChartReps ? 'reps' : 'kg'}
                    </div>
                  </div>
                </div>

                <div style={{ backgroundColor: '#1e1e1e', padding: '15px', borderRadius: '8px', border: '1px solid #333', marginBottom: '20px' }}>
                  <h4 style={{ marginTop: 0, color: '#aaa' }}>Progress Trend Chart</h4>
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="date" stroke="#aaa" />
                        <YAxis stroke="#aaa" />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#222', borderColor: '#444' }}
                          labelStyle={{ color: '#fff' }}
                        />
                        <Line type="monotone" dataKey="score" stroke="#646cff" strokeWidth={3} dot={{ r: 6, fill: '#646cff' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div style={{ backgroundColor: '#1e1e1e', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
                  <h4 style={{ marginTop: 0, color: '#aaa' }}>Weekly Breakdown</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {weeklyCalendar.map((wk) => (
                      <div key={wk.week} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#252525', borderRadius: '4px' }}>
                        <div>
                          <strong>Week #{wk.week}</strong>
                          <div style={{ fontSize: '11px', color: '#888' }}>{wk.date} ({wk.logsCount} logs)</div>
                        </div>
                        <span style={{ fontWeight: 'bold', color: '#4caf50' }}>
                          Max: {wk.maxLift} {isChartReps ? 'reps' : 'kg'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: Trainer View */}
        {activeTab === 'trainer' && isTrainerOrAdmin && (
          <TrainerDashboard session={session} userRole={userRole} />
        )}

      </div>
    </div>
  )
}

export default App