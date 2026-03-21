import { useState } from 'react'
import { supabase } from './supabase.js'

/* ── AUTH SCREEN ──
   Handles: Sign Up, Sign In, Forgot Password, Email Verification notice.
   Supabase handles: password hashing (bcrypt), JWT sessions, email verification,
   rate limiting, and brute-force protection automatically.
*/

const S = {
  overlay: {
    position:'fixed',inset:0,zIndex:2000,
    background:'radial-gradient(ellipse 80% 60% at 50% -10%,rgba(0,232,122,.08) 0%,transparent 60%),rgba(0,0,0,.97)',
    display:'flex',alignItems:'center',justifyContent:'center',padding:16,
  },
  card: {
    background:'linear-gradient(135deg,#0d1117 0%,#111820 100%)',
    border:'1px solid rgba(0,232,122,.2)',
    borderRadius:20,
    padding:'36px 32px',
    width:'100%',maxWidth:420,
    boxShadow:'0 40px 100px rgba(0,0,0,.7),0 0 60px rgba(0,232,122,.06)',
    position:'relative',
  },
  logo: {fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:22,letterSpacing:1,marginBottom:4},
  logoSpan: {color:'var(--green,#00e87a)'},
  sub: {fontSize:12,color:'rgba(255,255,255,.4)',marginBottom:28,lineHeight:1.5},
  label: {display:'block',fontSize:10,color:'rgba(255,255,255,.5)',letterSpacing:.8,textTransform:'uppercase',marginBottom:5},
  input: {
    width:'100%',background:'rgba(255,255,255,.05)',
    border:'1px solid rgba(255,255,255,.12)',
    color:'#fff',borderRadius:10,padding:'12px 14px',
    fontSize:13,fontFamily:"'DM Mono',monospace",outline:'none',
    boxSizing:'border-box',transition:'border-color .15s',
  },
  inputFocus: {borderColor:'rgba(0,232,122,.5)'},
  btn: {
    width:'100%',padding:'13px 0',borderRadius:10,border:'none',
    background:'linear-gradient(135deg,#00e87a,#00d4ff)',
    color:'#000',fontFamily:"'Syne',sans-serif",fontWeight:800,
    fontSize:14,cursor:'pointer',letterSpacing:.3,marginTop:4,
    transition:'opacity .15s',
  },
  btnSecondary: {
    width:'100%',padding:'11px 0',borderRadius:10,
    background:'transparent',border:'1px solid rgba(255,255,255,.12)',
    color:'rgba(255,255,255,.6)',fontFamily:"'DM Mono',monospace",
    fontSize:12,cursor:'pointer',marginTop:8,transition:'all .15s',
  },
  error: {
    background:'rgba(255,59,48,.1)',border:'1px solid rgba(255,59,48,.3)',
    borderRadius:8,padding:'10px 12px',fontSize:11,color:'#ff8080',
    marginBottom:14,lineHeight:1.6,
  },
  success: {
    background:'rgba(0,232,122,.08)',border:'1px solid rgba(0,232,122,.25)',
    borderRadius:8,padding:'10px 12px',fontSize:11,color:'#7eeebb',
    marginBottom:14,lineHeight:1.6,
  },
  divider: {
    display:'flex',alignItems:'center',gap:10,margin:'18px 0',
    color:'rgba(255,255,255,.2)',fontSize:10,fontFamily:"'DM Mono',monospace",
  },
  dividerLine: {flex:1,height:1,background:'rgba(255,255,255,.08)'},
  link: {color:'#00e87a',cursor:'pointer',fontWeight:700,textDecoration:'none'},
  footer: {fontSize:10,color:'rgba(255,255,255,.25)',marginTop:20,textAlign:'center',lineHeight:1.7},
  strength: {height:3,borderRadius:2,marginTop:5,transition:'width .3s,background .3s'},
  secBadge: {
    display:'flex',alignItems:'center',gap:6,fontSize:9,
    color:'rgba(255,255,255,.3)',fontFamily:"'DM Mono',monospace",
    justifyContent:'center',marginTop:16,
  },
}

function PasswordStrength({ pw }) {
  if (!pw) return null
  const checks = [pw.length >= 8, /[A-Z]/.test(pw), /[0-9]/.test(pw), /[^A-Za-z0-9]/.test(pw)]
  const score = checks.filter(Boolean).length
  const color = score <= 1 ? '#ff4d6a' : score === 2 ? '#f5a623' : score === 3 ? '#00d4ff' : '#00e87a'
  const label = score <= 1 ? 'Weak' : score === 2 ? 'Fair' : score === 3 ? 'Good' : 'Strong'
  return (
    <div style={{marginTop:6}}>
      <div style={{display:'flex',gap:3}}>
        {[1,2,3,4].map(i=>(
          <div key={i} style={{flex:1,height:3,borderRadius:2,
            background:i<=score?color:'rgba(255,255,255,.08)',transition:'background .2s'}}/>
        ))}
      </div>
      <div style={{fontSize:9,color,marginTop:3,fontFamily:"'DM Mono',monospace"}}>{label}</div>
    </div>
  )
}

export default function AuthScreen({ onAuth, onClose }) {
  const [mode, setMode]           = useState('signin')   // signin | signup | forgot | verify
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState('')
  const [focused, setFocused]     = useState('')

  const reset = () => { setError(''); setSuccess('') }

  const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
  const validatePw    = (p) => p.length >= 8

  const handleSignUp = async () => {
    reset()
    if (!validateEmail(email))         return setError('Please enter a valid email address.')
    if (!validatePw(password))         return setError('Password must be at least 8 characters.')
    if (password !== confirmPw)        return setError('Passwords do not match.')
    if (!/[A-Z]/.test(password))       return setError('Password must contain at least one uppercase letter.')
    if (!/[0-9]/.test(password))       return setError('Password must contain at least one number.')

    setLoading(true)
    const { error: err } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/?auth=confirmed`,
        data: { tier: 'free', created_at: new Date().toISOString() },
      },
    })
    setLoading(false)

    if (err) {
      if (err.message.includes('already registered')) {
        setError('An account with this email already exists. Sign in instead.')
      } else {
        setError(err.message)
      }
    } else {
      setMode('verify')
    }
  }

  const handleSignIn = async () => {
    reset()
    if (!validateEmail(email))   return setError('Please enter a valid email address.')
    if (!password)               return setError('Please enter your password.')

    setLoading(true)
    const { data, error: err } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    setLoading(false)

    if (err) {
      if (err.message.includes('Invalid login')) {
        setError('Incorrect email or password. Please try again.')
      } else if (err.message.includes('Email not confirmed')) {
        setError('Please verify your email before signing in. Check your inbox.')
        setMode('verify')
      } else {
        setError(err.message)
      }
    } else if (data?.user) {
      onAuth(data.user)
    }
  }

  const handleForgot = async () => {
    reset()
    if (!validateEmail(email)) return setError('Please enter your email address.')

    setLoading(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/?auth=reset` }
    )
    setLoading(false)

    if (err) {
      setError(err.message)
    } else {
      setSuccess('Password reset email sent. Check your inbox — it may take a minute.')
    }
  }

  const handleKey = (e) => {
    if (e.key !== 'Enter') return
    if (mode === 'signin') handleSignIn()
    else if (mode === 'signup') handleSignUp()
    else if (mode === 'forgot') handleForgot()
  }

  return (
    <div style={S.overlay} onClick={e=>{if(e.target===e.currentTarget&&onClose)onClose();}}>
      <div style={S.card}>
        {/* Close button — only shown when modal (has onClose) */}
        {onClose && (
          <button onClick={onClose} style={{position:'absolute',top:14,right:16,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',color:'rgba(255,255,255,.4)',borderRadius:8,width:28,height:28,cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'DM Mono',monospace"}}>✕</button>
        )}
        {/* Logo */}
        <div style={{textAlign:'center',marginBottom:24}}>
          <div style={S.logo}>RUBBERBAND<span style={S.logoSpan}>.</span>AI</div>
          <div style={S.sub}>
            {mode==='signin'  && 'Sign in to your account'}
            {mode==='signup'  && 'Create your account — it\'s free to start'}
            {mode==='forgot'  && 'Reset your password'}
            {mode==='verify'  && 'Check your email'}
          </div>
        </div>

        {/* Error / Success */}
        {error   && <div style={S.error}>⚠ {error}</div>}
        {success && <div style={S.success}>✓ {success}</div>}

        {/* Verify screen */}
        {mode==='verify' && (
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:40,marginBottom:12}}>📧</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:16,marginBottom:8}}>Verify your email</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,.5)',marginBottom:20,lineHeight:1.7}}>
              We sent a confirmation link to <b style={{color:'#fff'}}>{email}</b>.<br/>
              Click the link in that email to activate your account.
            </div>
            <button style={S.btn} onClick={()=>setMode('signin')}>Back to Sign In</button>
            <div style={{fontSize:11,color:'rgba(255,255,255,.3)',marginTop:12}}>
              Didn't receive it? Check spam or{' '}
              <span style={S.link} onClick={()=>{setMode('signup');reset();}}>try again</span>
            </div>
          </div>
        )}

        {/* Sign In */}
        {mode==='signin' && (
          <div>
            <div style={{marginBottom:14}}>
              <label style={S.label}>Email</label>
              <input
                style={{...S.input,...(focused==='email'?S.inputFocus:{})}}
                type="email" placeholder="you@email.com"
                value={email} autoComplete="email"
                onChange={e=>{setEmail(e.target.value);reset();}}
                onFocus={()=>setFocused('email')} onBlur={()=>setFocused('')}
                onKeyDown={handleKey}
              />
            </div>
            <div style={{marginBottom:18}}>
              <label style={S.label}>Password</label>
              <div style={{position:'relative'}}>
                <input
                  style={{...S.input,...(focused==='pw'?S.inputFocus:{}),paddingRight:42}}
                  type={showPw?'text':'password'} placeholder="••••••••"
                  value={password} autoComplete="current-password"
                  onChange={e=>{setPassword(e.target.value);reset();}}
                  onFocus={()=>setFocused('pw')} onBlur={()=>setFocused('')}
                  onKeyDown={handleKey}
                />
                <button onClick={()=>setShowPw(p=>!p)}
                  style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',
                    background:'none',border:'none',color:'rgba(255,255,255,.4)',cursor:'pointer',fontSize:12,padding:4}}>
                  {showPw?'Hide':'Show'}
                </button>
              </div>
              <div style={{textAlign:'right',marginTop:5}}>
                <span style={{...S.link,fontSize:10,fontWeight:400}} onClick={()=>{setMode('forgot');reset();}}>
                  Forgot password?
                </span>
              </div>
            </div>
            <button style={{...S.btn,opacity:loading?.8:1}} onClick={handleSignIn} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
            <div style={S.divider}><div style={S.dividerLine}/><span>or</span><div style={S.dividerLine}/></div>
            <button style={S.btnSecondary} onClick={()=>{setMode('signup');reset();}}>
              Create a free account
            </button>
          </div>
        )}

        {/* Sign Up */}
        {mode==='signup' && (
          <div>
            <div style={{marginBottom:14}}>
              <label style={S.label}>Email</label>
              <input
                style={{...S.input,...(focused==='email'?S.inputFocus:{})}}
                type="email" placeholder="you@email.com"
                value={email} autoComplete="email"
                onChange={e=>{setEmail(e.target.value);reset();}}
                onFocus={()=>setFocused('email')} onBlur={()=>setFocused('')}
                onKeyDown={handleKey}
              />
            </div>
            <div style={{marginBottom:14}}>
              <label style={S.label}>Password</label>
              <div style={{position:'relative'}}>
                <input
                  style={{...S.input,...(focused==='pw'?S.inputFocus:{}),paddingRight:42}}
                  type={showPw?'text':'password'} placeholder="Min. 8 chars, uppercase + number"
                  value={password} autoComplete="new-password"
                  onChange={e=>{setPassword(e.target.value);reset();}}
                  onFocus={()=>setFocused('pw')} onBlur={()=>setFocused('')}
                  onKeyDown={handleKey}
                />
                <button onClick={()=>setShowPw(p=>!p)}
                  style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',
                    background:'none',border:'none',color:'rgba(255,255,255,.4)',cursor:'pointer',fontSize:12,padding:4}}>
                  {showPw?'Hide':'Show'}
                </button>
              </div>
              <PasswordStrength pw={password}/>
            </div>
            <div style={{marginBottom:18}}>
              <label style={S.label}>Confirm Password</label>
              <input
                style={{...S.input,...(focused==='cpw'?S.inputFocus:{}),...(confirmPw&&confirmPw!==password?{borderColor:'rgba(255,77,106,.4)'}:{})}}
                type="password" placeholder="Re-enter password"
                value={confirmPw} autoComplete="new-password"
                onChange={e=>{setConfirmPw(e.target.value);reset();}}
                onFocus={()=>setFocused('cpw')} onBlur={()=>setFocused('')}
                onKeyDown={handleKey}
              />
              {confirmPw && confirmPw===password && (
                <div style={{fontSize:9,color:'#00e87a',marginTop:3,fontFamily:"'DM Mono',monospace"}}>✓ Passwords match</div>
              )}
            </div>
            <button style={{...S.btn,opacity:loading?.8:1}} onClick={handleSignUp} disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account →'}
            </button>
            <div style={S.divider}><div style={S.dividerLine}/><span>or</span><div style={S.dividerLine}/></div>
            <button style={S.btnSecondary} onClick={()=>{setMode('signin');reset();}}>
              Already have an account? Sign in
            </button>
          </div>
        )}

        {/* Forgot Password */}
        {mode==='forgot' && (
          <div>
            <div style={{marginBottom:18}}>
              <label style={S.label}>Email address</label>
              <input
                style={{...S.input,...(focused==='email'?S.inputFocus:{})}}
                type="email" placeholder="you@email.com"
                value={email} autoComplete="email"
                onChange={e=>{setEmail(e.target.value);reset();}}
                onFocus={()=>setFocused('email')} onBlur={()=>setFocused('')}
                onKeyDown={handleKey}
              />
            </div>
            <button style={{...S.btn,opacity:loading?.8:1}} onClick={handleForgot} disabled={loading}>
              {loading ? 'Sending…' : 'Send Reset Link →'}
            </button>
            <button style={S.btnSecondary} onClick={()=>{setMode('signin');reset();}}>
              ← Back to Sign In
            </button>
          </div>
        )}

        {/* Security badges */}
        <div style={S.secBadge}>
          <span>🔒</span><span>256-bit encryption</span>
          <span style={{margin:'0 4px'}}>·</span>
          <span>🛡</span><span>Powered by Supabase</span>
          <span style={{margin:'0 4px'}}>·</span>
          <span>✉</span><span>Email verified</span>
        </div>

        {/* Footer */}
        <div style={S.footer}>
          By creating an account you agree to our{' '}
          <span style={S.link}>Terms of Service</span>
          {' '}and{' '}
          <span style={S.link}>Privacy Policy</span>
        </div>
      </div>
    </div>
  )
}
