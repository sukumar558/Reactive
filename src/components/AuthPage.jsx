import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function AuthPage({ addToast }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else addToast?.('Welcome back! 🎉', 'success');
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        // Update profile with shop name
        if (data?.user) {
          await supabase
            .from('ra_profiles')
            .upsert({ 
              id: data.user.id,
              shop_name: shopName, 
              owner_name: email.split('@')[0],
              avg_order_value: 1000,
              automation_active: false,
              api_mode_enabled: false
            });
        }
        addToast?.('Account created! Welcome to ReActivate AI 🚀', 'success');
      }
    }

    setLoading(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-card animate-in">
        <div className="auth-logo">
          <h1>⚡ ReActivate AI</h1>
          <p>WhatsApp CRM for Smart Shop Owners</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="input-group">
              <label>Shop Name</label>
              <input
                className="input"
                type="text"
                placeholder="e.g. Sharma Electronics"
                value={shopName}
                onChange={e => setShopName(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}

          <div className="input-group">
            <label>Email Address</label>
            <input
              className="input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              className="input"
              type="password"
              placeholder="Min 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? (
              <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Please wait...</>
            ) : (
              isLogin ? '🔓 Sign In' : '🚀 Create Account'
            )}
          </button>
        </form>

        <div className="auth-toggle">
          {isLogin ? (
            <>Don't have an account? <a onClick={() => { setIsLogin(false); setError(''); }}>Sign up free</a></>
          ) : (
            <>Already have an account? <a onClick={() => { setIsLogin(true); setError(''); }}>Sign in</a></>
          )}
        </div>
      </div>
    </div>
  );
}
