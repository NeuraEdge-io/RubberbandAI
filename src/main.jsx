import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import AuthScreen from './AuthScreen.jsx'
import { supabase } from './supabase.js'

function Root() {
  const [session, setSession]         = useState(undefined)
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('auth') === 'reset' || params.get('auth') === 'confirmed') {
      window.history.replaceState({}, '', window.location.pathname)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null)
      if (session) setShowAuthModal(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return (
      <div style={{minHeight:'100vh',background:'#0a0e14',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:18,color:'rgba(255,255,255,.3)',letterSpacing:2}}>
          RUBBERBAND<span style={{color:'#00e87a'}}>.</span>AI
        </div>
      </div>
    )
  }

  return (
    <>
      <App
        session={session}
        onSignOut={() => supabase.auth.signOut()}
        onRequestAuth={() => setShowAuthModal(true)}
      />
      {showAuthModal && (
        <AuthScreen
          onAuth={(user) => {
            setSession({ user })
            setShowAuthModal(false)
          }}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </>
  )
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode><Root /></React.StrictMode>
)
