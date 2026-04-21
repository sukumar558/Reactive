import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Mail, Phone, Lock, Store, User, ArrowRight, Smartphone, CheckCircle2 } from 'lucide-react';

export default function AuthPage({ addToast }) {
  const [method, setMethod] = useState('phone'); // 'phone' | 'email'
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup' (only for email)

  // Phone State
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState('auth'); // 'auth' | 'otp' | 'profile'

  // Email State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  // Profile fields (Step 4 — only for new users)
  const [name, setName] = useState('');
  const [shopName, setShopName] = useState('');
  const [businessType, setBusinessType] = useState('');

  // Format phone for Supabase (E.164)
  function getFullPhone() {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('91') && cleaned.length === 12) return '+' + cleaned;
    if (cleaned.length === 10) return '+91' + cleaned;
    return '+91' + cleaned;
  }

  useEffect(() => {
    if (timer <= 0) {
      setCanResend(true);
      return;
    }
    setCanResend(false);
    const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    if (step === 'otp' && inputRefs.current[0]) {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  // ─── Email Auth Logic ───
  async function handleEmailAuth(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (authMode === 'signup') {
        if (!name.trim()) throw new Error('Please enter your name');

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name
            }
          }
        });
        if (error) throw error;

        // If confirmation is required (default in Supabase), show verify screen
        if (data?.user && !data.session) {
          setStep('verify');
        } else if (data?.user) {
          addToast('Welcome! Account created successfully.', 'success');
          await checkProfile(data.user);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        await checkProfile(data.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResendVerification() {
    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });
    if (error) {
      addToast(error.message, 'error');
    } else {
      addToast('Verification email resent! 📧', 'success');
      setTimer(60);
    }
    setLoading(false);
  }

  // ─── Step 1: Send OTP ───
  async function handleSendOtp(e) {
    if (e) e.preventDefault();
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithOtp({
      phone: getFullPhone(),
    });

    if (error) {
      setError(error.message);
    } else {
      setStep('otp');
      setTimer(30);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      addToast?.('OTP sent to your phone 📲', 'success');
    }
    setLoading(false);
  }

  // ─── Step 2: Verify OTP ───
  async function handleVerifyOtp() {
    const otpString = otp.join('');
    if (otpString.length !== 6) return;

    setLoading(true);
    setError('');

    const { data, error } = await supabase.auth.verifyOtp({
      phone: getFullPhone(),
      token: otpString,
      type: 'sms',
    });

    if (error) {
      setError(error.message);
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } else {
      await checkProfile(data.user);
    }
    setLoading(false);
  }

  async function checkProfile(user) {
    if (!user) return;
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, shop_name')
      .eq('id', user.id)
      .single();

    if (profile && profile.shop_name) {
      addToast?.('Welcome back! 🎉', 'success');
    } else {
      setStep('profile');
    }
  }

  // ─── Step 4: Save Profile ───
  async function handleSaveProfile(e) {
    e.preventDefault();
    if (!name.trim() || !shopName.trim()) {
      setError('Name and Shop Name are required');
      return;
    }
    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        owner_name: name,
        shop_name: shopName,
        plan: 'free',
      });

    if (error) {
      setError(error.message);
    } else {
      addToast?.('Welcome to ReActivate AI! 🚀', 'success');
    }
    setLoading(false);
  }

  // ─── OTP Input Handlers ───
  function handleOtpChange(index, value) {
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (value && index === 5 && newOtp.join('').length === 6) {
      setTimeout(() => handleVerifyOtp(), 200);
    }
  }

  function handleOtpKeyDown(index, e) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  if (step === 'profile') {
    return (
      <div className="auth-page">
        <div className="auth-card animate-in">
          <div className="auth-logo">
            <div className="icon-badge" style={{ margin: '0 auto 16px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <CheckCircle2 size={32} />
            </div>
            <h1>👋 Almost There!</h1>
            <p>Tell us a bit about your business</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form className="auth-form" onSubmit={handleSaveProfile}>
            <div className="input-group">
              <label><User size={14} style={{ marginRight: 6 }} /> Your Name</label>
              <input className="input" type="text" placeholder="e.g. Rajesh Kumar" value={name} onChange={e => setName(e.target.value)} required autoFocus />
            </div>

            <div className="input-group">
              <label><Store size={14} style={{ marginRight: 6 }} /> Shop Name</label>
              <input className="input" type="text" placeholder="e.g. Sharma Electronics" value={shopName} onChange={e => setShopName(e.target.value)} required />
            </div>

            <div className="input-group">
              <label>Business Type</label>
              <select className="input" value={businessType} onChange={e => setBusinessType(e.target.value)}>
                <option value="">Select your business</option>
                <option value="Mobile & Electronics">Mobile & Electronics</option>
                <option value="Fashion & Clothing">Fashion & Clothing</option>
                <option value="Grocery & FMCG">Grocery & FMCG</option>
                <option value="Jewellery">Jewellery</option>
                <option value="General">Other / General</option>
              </select>
            </div>

            <button className="btn btn-primary btn-lg shine-effect" type="submit" disabled={loading} style={{ width: '100%', marginTop: 10 }}>
              {loading ? 'Saving...' : 'Get Started 🚀'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="auth-page">
        <div className="auth-card animate-in" style={{ textAlign: 'center' }}>
          <div className="auth-logo">
            <div className="icon-badge" style={{ margin: '0 auto 16px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Mail size={32} />
            </div>
            <h1>📧 Verify Email</h1>
            <p>We've sent a link to <br /><span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{email}</span></p>
          </div>

          <p style={{ marginTop: 24, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Please click the link in your email to verify your account and start your smart CRM.
          </p>

          <div style={{ marginTop: 32 }}>
            <button
              className="btn btn-primary btn-lg shine-effect"
              onClick={handleResendVerification}
              disabled={loading || !canResend}
              style={{ width: '100%' }}
            >
              {loading ? 'Sending...' : (canResend ? 'Resend Verification' : `Resend in ${timer}s`)}
            </button>
          </div>

          <button className="btn-link" style={{ marginTop: 20, width: '100%' }} onClick={() => { setStep('auth'); setAuthMode('login'); }}>
            ← Back to Login
          </button>

          <p style={{ marginTop: 24, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Didn't receive email? Check your spam folder.
          </p>
        </div>
      </div>
    );
  }

  if (step === 'otp') {
    return (
      <div className="auth-page">
        <div className="auth-card animate-in">
          <div className="auth-logo">
            <div className="icon-badge" style={{ margin: '0 auto 16px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Smartphone size={32} />
            </div>
            <h1>📲 Enter OTP</h1>
            <p>Sent to <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>+91 {phone}</span></p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <div className="auth-form">
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', margin: '20px 0 24px' }}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => inputRefs.current[i] = el}
                  className="input"
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  style={{ width: '46px', height: '54px', textAlign: 'center', fontSize: '1.4rem', fontWeight: 700, padding: '0', borderRadius: '12px' }}
                />
              ))}
            </div>

            <button className="btn btn-primary btn-lg shine-effect" onClick={handleVerifyOtp} disabled={loading || otp.join('').length !== 6} style={{ width: '100%' }}>
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              {!canResend ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Resend in {timer}s</p>
              ) : (
                <button className="btn-link" onClick={handleSendOtp}>Resend OTP</button>
              )}
            </div>
            <button className="btn-link" style={{ width: '100%', marginTop: 12 }} onClick={() => setStep('auth')}>← Back</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card animate-in">
        <div className="auth-logo">
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>⚡ ReActivate AI</h1>
          <p>Login to your Smart CRM</p>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab ${method === 'phone' ? 'active' : ''}`} onClick={() => { setMethod('phone'); setError(''); }}>
            <Phone size={16} /> Phone
          </button>
          <button className={`auth-tab ${method === 'email' ? 'active' : ''}`} onClick={() => { setMethod('email'); setError(''); }}>
            <Mail size={16} /> Email
          </button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {method === 'phone' ? (
          <form className="auth-form" onSubmit={handleSendOtp}>
            <div className="input-group">
              <label>Phone Number</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span className="phone-prefix">🇮🇳 +91</span>
                <input className="input" type="tel" placeholder="98765 43210" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} required autoFocus />
              </div>
            </div>
            <button className="btn btn-primary btn-lg shine-effect" type="submit" disabled={loading || phone.length < 10} style={{ width: '100%', marginTop: 8 }}>
              {loading ? 'Sending...' : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>Get OTP <ArrowRight size={18} /></span>}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleEmailAuth}>
            {authMode === 'signup' && (
              <div className="input-group">
                <label>Full Name</label>
                <input className="input" type="text" placeholder="e.g. Rahul Sharma" value={name} onChange={e => setName(e.target.value)} required />
              </div>
            )}
            <div className="input-group">
              <label>Email Address</label>
              <input className="input" type="email" placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input className="input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button className="btn btn-primary btn-lg shine-effect" type="submit" disabled={loading} style={{ width: '100%', marginTop: 8 }}>
              {loading ? 'Processing...' : (authMode === 'login' ? 'Login' : 'Create Account')}
            </button>
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}
              <button type="button" className="btn-link" style={{ marginLeft: 6 }} onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}>
                {authMode === 'login' ? 'Sign Up' : 'Login'}
              </button>
            </p>
          </form>
        )}

        <p className="auth-footer">
          By continuing, you agree to our Terms of Service.
        </p>
      </div>
    </div>
  );
}
