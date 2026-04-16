import { useState } from 'react';

export default function LandingPage({ onGetStarted, onNavigate }) {
  const [customers, setCustomers] = useState('');
  const [aov, setAov] = useState('');
  const [result, setResult] = useState(null);

  const calculate = () => {
    if (!customers || !aov) return;
    const revenue = Math.round(customers * 0.25 * aov);
    const count = Math.round(customers * 0.25);
    setResult({ revenue, count });
  };

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="landing-hero animate-in">
        <div className="landing-badge">🔥 Business Growth Tool</div>
        <h1 className="hero-title">Purane Customers se <br/><span className="text-accent">30% zyada sale</span></h1>
        <p className="hero-subtitle">AI WhatsApp follow-up se automatic revenue badhao</p>
        <button className="btn btn-primary btn-lg shine-effect" onClick={onGetStarted}>
          Start Free Trial Now 🚀
        </button>
      </section>

      {/* Stats Section */}
      <section className="landing-stats animate-in" style={{ animationDelay: '0.1s' }}>
        <div className="card-glass stat-box">
          <h2 className="section-title">Aaj ka Recovered Revenue</h2>
          <h1 className="stat-value">₹12,540</h1>
          
          <div className="demo-history">
             <div className="history-item card-glass">
                <div className="history-avatar">R</div>
                <div className="history-info">
                  <div className="history-name"><b>Ramesh</b> (Regular Customer)</div>
                  <div className="history-desc">20 din baad auto message bheja</div>
                </div>
                <div className="badge badge-green">Converted</div>
             </div>
          </div>
        </div>
      </section>

      {/* Calculator Section */}
      <section className="landing-calc animate-in" style={{ animationDelay: '0.2s' }}>
        <div className="card calc-card">
          <h2 className="section-title">Calculate Your Extra Revenue</h2>
          <div className="input-grid">
            <div className="input-group">
              <label>Monthly Customers</label>
              <input 
                type="number" 
                className="input" 
                placeholder="e.g. 500" 
                value={customers}
                onChange={(e) => setCustomers(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Avg Order Value ₹</label>
              <input 
                type="number" 
                className="input" 
                placeholder="e.g. 2000" 
                value={aov}
                onChange={(e) => setAov(e.target.value)}
              />
            </div>
          </div>
          <button className="btn btn-primary calculator-btn" onClick={calculate}>
            Calculate Potential Profit 💰
          </button>

          {result && (
            <div className="calc-result animate-in">
              <div className="divider"></div>
              <h1 className="result-value">₹{result.revenue.toLocaleString()} <span style={{ fontSize: '1rem', fontWeight: 500 }}>extra / month</span></h1>
              <p className="result-desc">{result.count} customers wapas aa sakte hain</p>
              
              <div className="preview-container">
                <p className="preview-label">Sample Automatic Follow-up:</p>
                <div className="message-preview">
                  “Sir aapka last purchase 20 din pehle tha — 10% discount ready hai hamare naye items par! Visit today.”
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Simplified Benefits Section */}
      <section className="landing-features animate-in" style={{ animationDelay: '0.3s' }}>
        <h2 className="section-title">Shop Owners ke liye Best kyun hai?</h2>
        <div className="features-grid">
          <div className="card feature-card">
            <div className="feature-icon">✨</div>
            <h3>Automatic Follow-ups</h3>
            <p>Aapko yaad rakhne ki zaroorat nahi. AI khud analysis karke message draft karta hai.</p>
          </div>
          <div className="card feature-card">
            <div className="feature-icon">💰</div>
            <h3>Real Growth Tracking</h3>
            <p>Dekho kitna Paisa wapas aaya. Dashboard par live ROI analytics milega.</p>
          </div>
          <div className="card feature-card">
            <div className="feature-icon">📱</div>
            <h3>Official API Support</h3>
            <p>Manual link ya official WhatsApp API—jo aapko suit kare use karke bulk messages bhejo.</p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="landing-proof animate-in" style={{ animationDelay: '0.4s' }}>
        <div className="card-glass testimonial-card">
            <div className="stars">⭐⭐⭐⭐⭐</div>
            <h2>100+ Shop Owners use kar rahe hain</h2>
            <p className="quote">“ReActivate se mera repeat sale 2x ho gaya. Pehle manual follow-up bhool jata tha, ab auto hota hai!”</p>
            <p className="author">— Sharma Mobile, Delhi</p>
        </div>
      </section>

      <footer className="landing-footer">
         <div className="footer-links" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
            <a onClick={() => onNavigate('about')} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}>About Us</a>
            <a onClick={() => onNavigate('vision')} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}>Our Vision</a>
            <a onClick={() => onNavigate('terms')} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}>Terms</a>
         </div>
         <p>&copy; 2026 ReActivate AI. Built for Smart Bharat.</p>
      </footer>
    </div>
  );
}
