import React, { useState } from 'react'
import { supabase } from './supabaseClient'

export default function ForgotPassword({ onBackToLogin }) {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Clean call using your Supabase Dashboard's configured Site URL
    const { error } = await supabase.auth.resetPasswordForEmail(email)

    if (error) {
      alert(error.message)
    } else {
      alert('Password reset link sent! Check your inbox.')
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto', padding: '20px' }}>
      <h2>Forgot Password</h2>
      <form onSubmit={handleResetPassword}>
        <input
          type="email"
          placeholder="Enter your registered email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
        />
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px' }}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
    </div>
  )
}