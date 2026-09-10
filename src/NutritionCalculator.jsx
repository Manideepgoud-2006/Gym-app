import React, { useState, useEffect } from 'react'
import { calculateBulkingTargets } from './utils/macroCalculator'

export default function NutritionCalculator({ initialWeight = 60, onSaveTargets }) {
  // 1. Read saved weight from localStorage as a string (default to initialWeight/60 if empty)
  const [weight, setWeight] = useState(() => localStorage.getItem('nutritionWeight') || String(initialWeight || 60))
  const [goal, setGoal] = useState('bulking')

  // Helper function to safely calculate targets without throwing uncaught runtime errors
  const getSafeTargets = (currentWeight, currentGoal) => {
    const numericWeight = parseFloat(currentWeight)
    const safeWeight = (!isNaN(numericWeight) && numericWeight > 0) ? numericWeight : 60
    
    if (typeof calculateBulkingTargets === 'function') {
      const calculated = calculateBulkingTargets(safeWeight, currentGoal)
      if (calculated) return calculated
    }

    // Default object shape if calculateBulkingTargets returns undefined/null
    return {
      totalCalories: safeWeight * 30,
      proteinG: Math.round(safeWeight * 2),
      carbsG: Math.round(safeWeight * 4),
      fatG: Math.round(safeWeight * 1),
      fiberG: 25,
      recommendedSteps: 8000,
      cardioMinutes: currentGoal === 'cutting' ? 20 : 0
    }
  }

  // 2. Initialize targets safely
  const [targets, setTargets] = useState(() => getSafeTargets(weight, 'bulking'))

  // 3. Auto-save ANY weight input to localStorage and recalculate targets smoothly
  useEffect(() => {
    // Save raw string input to localStorage so user typing isn't interrupted
    localStorage.setItem('nutritionWeight', weight)

    // Compute updated targets safely
    const updatedTargets = getSafeTargets(weight, goal)
    setTargets(updatedTargets)
  }, [weight, goal])

  return (
    <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '10px', color: '#fff', border: '1px solid #333' }}>
      <h3 style={{ marginTop: 0, color: '#646cff', display: 'flex', alignItems: 'center', gap: '8px' }}>
        ⚡ Automatic Target Calculator
      </h3>

      {/* Goal Selector */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <button
          type="button"
          onClick={() => setGoal('bulking')}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: goal === 'bulking' ? '#ff9800' : '#2a2a2a',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}>
          🥩 Bulking Mode
        </button>
        <button
          type="button"
          onClick={() => setGoal('cutting')}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: goal === 'cutting' ? '#e53935' : '#2a2a2a',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}>
          🔥 Cutting Mode
        </button>
      </div>

      {/* Weight Input */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ fontSize: '13px', color: '#aaa', display: 'block', marginBottom: '5px' }}>
          Enter Current Body Weight (kg):
        </label>
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="e.g. 60"
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid #444',
            backgroundColor: '#121212',
            color: '#fff',
            fontSize: '16px',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Computed Macro Display */}
      <div style={{ backgroundColor: '#121212', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
        <div style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
          Auto-Calculated Daily Targets for {weight || 0}kg ({goal.toUpperCase()})
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          <div style={{ backgroundColor: '#1a1a1a', padding: '10px', borderRadius: '6px', borderLeft: '4px solid #4caf50' }}>
            <span style={{ fontSize: '12px', color: '#aaa' }}>🔥 Daily Calories</span>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{targets?.totalCalories || 0} kcal</div>
          </div>

          <div style={{ backgroundColor: '#1a1a1a', padding: '10px', borderRadius: '6px', borderLeft: '4px solid #646cff' }}>
            <span style={{ fontSize: '12px', color: '#aaa' }}>🥩 Protein</span>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{targets?.proteinG || 0} g</div>
          </div>

          <div style={{ backgroundColor: '#1a1a1a', padding: '10px', borderRadius: '6px', borderLeft: '4px solid #ff9800' }}>
            <span style={{ fontSize: '12px', color: '#aaa' }}>🍞 Carbohydrates</span>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{targets?.carbsG || 0} g</div>
          </div>

          <div style={{ backgroundColor: '#1a1a1a', padding: '10px', borderRadius: '6px', borderLeft: '4px solid #e91e63' }}>
            <span style={{ fontSize: '12px', color: '#aaa' }}>🥑 Healthy Fats</span>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{targets?.fatG || 0} g</div>
          </div>

          <div style={{ backgroundColor: '#1a1a1a', padding: '10px', borderRadius: '6px', borderLeft: '4px solid #00bcd4' }}>
            <span style={{ fontSize: '12px', color: '#aaa' }}>🌾 Dietary Fiber</span>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{targets?.fiberG || 0} g</div>
          </div>

          <div style={{ backgroundColor: '#1a1a1a', padding: '10px', borderRadius: '6px', borderLeft: '4px solid #ffeb3b' }}>
            <span style={{ fontSize: '12px', color: '#aaa' }}>👟 Daily Steps Goal</span>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{(targets?.recommendedSteps || 0).toLocaleString()} steps</div>
          </div>
        </div>

        {goal === 'cutting' && (
          <div style={{ marginTop: '10px', backgroundColor: '#2d1515', padding: '10px', borderRadius: '6px', color: '#ff8a80', fontSize: '13px' }}>
            🏃 Recommended Cardio: <strong>{targets?.cardioMinutes || 0} mins</strong> (Incline Treadmill / Stairmaster)
          </div>
        )}
      </div>

      {onSaveTargets && (
        <button
          type="button"
          onClick={() => onSaveTargets(targets)}
          style={{
            width: '100%',
            marginTop: '15px',
            padding: '12px',
            backgroundColor: '#4caf50',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            fontSize: '15px',
            cursor: 'pointer'
          }}>
          💾 Save Targets to My Profile
        </button>
      )}
    </div>
  )
}