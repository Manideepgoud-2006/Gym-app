import { useState, useEffect } from 'react' // <--- STEP 2A: Included useEffect
import { supabase } from './supabaseClient'
import ForgotPassword from '../ForgotPassword'
import UpdatePassword from '../UpdatePassword' // <--- Line 4: Now used in return!

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  
  // STEP 2B: State to track if user opened the link from their email
  const [isResettingPassword, setIsResettingPassword] = useState(false)

  // STEP 2C: Listen for Supabase password recovery event when page loads
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      // Supabase fires 'PASSWORD_RECOVERY' when the user clicks the email link
      if (event === 'PASSWORD_RECOVERY') {
        setIsResettingPassword(true)
      }
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) alert(error.message)
      else alert('Account created successfully! You can now log in.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) alert(error.message)
    }
    setLoading(false)
  }

  // STEP 3: Return JSX with 3-Way Conditional Rendering
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#121212', color: '#fff' }}>
      
      {/* CONDITION 1: User clicked the reset link from their email */}
      {isResettingPassword ? (
        <div style={{ background: '#1e1e1e', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', width: '320px', textAlign: 'center' }}>
          <UpdatePassword />
        </div>
      ) : 
      
      /* CONDITION 2: User clicked "Forgot Password?" on login form */
      showForgotPassword ? (
        <div style={{ background: '#1e1e1e', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', width: '320px', textAlign: 'center' }}>
          <ForgotPassword />
          <button 
            type="button" 
            onClick={() => setShowForgotPassword(false)}
            style={{ marginTop: '1rem', background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            ← Back to Login
          </button>
        </div>
      ) : 

      /* CONDITION 3: Normal Login / Sign Up Form */
      (
        <form onSubmit={handleAuth} style={{ background: '#1e1e1e', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', width: '320px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>{isSignUp ? 'Create Account' : 'Athlete Login'}</h2>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #333', background: '#2a2a2a', color: '#fff' }} 
            />
          </div>

          <div style={{ marginBottom: '0.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #333', background: '#2a2a2a', color: '#fff' }} 
            />
          </div>

          {!isSignUp && (
            <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                style={{ background: 'transparent', border: 'none', color: '#00cf85', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Forgot Password?
              </button>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            style={{ width: '100%', padding: '0.75rem', background: '#00cf85', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Log In'}
          </button>

          <p 
            onClick={() => setIsSignUp(!isSignUp)} 
            style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem', color: '#aaa', cursor: 'pointer' }}
          >
            {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
          </p>
        </form>
      )}
    </div>
  )
}