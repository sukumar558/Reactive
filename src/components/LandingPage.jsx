import { useState } from 'react';
import { 
  Zap, 
  Users, 
  TrendingUp, 
  ShieldCheck, 
  MessageSquare, 
  BarChart3, 
  ArrowRight,
  Calculator
} from 'lucide-react';

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
    <div className="landing-page-wrapper">
      <div className="landing-container">
        {/* Navigation Header */}
        <header className="landing-header">
          <div className="landing-logo">
            <span className="logo-text">⚡ ReActivate AI</span>
          </div>
          <nav style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
            <a onClick={() => onNavigate('about')} style={{ cursor: 'pointer' }} className="footer-link">About</a>
            <a onClick={() => onNavigate('vision')} style={{ cursor: 'pointer' }} className="footer-link">Vision</a>
            <button className="btn btn-secondary btn-sm" onClick={onGetStarted}>Sign In</button>
            <button className="btn btn-primary btn-sm" onClick={onGetStarted}>Get Started</button>
          </nav>
        </header>

        {/* Hero Section */}
        <section className="landing-hero">
          <div className="hero-content reveal">
            <div className="hero-badge pulsing">
              <Zap size={14} />
              <span>Next-Gen WhatsApp CRM</span>
            </div>
            <h1 className="hero-title">
              Turn One-Time Shoppers into <span>Repeat Customers.</span>
            </h1>
            <p className="hero-description reveal delay-1">
              ReActivate AI automatically identifies which customers are due for a visit and sends personalized WhatsApp reminders that drive 30% more repeat sales.
            </p>
            <div className="hero-actions reveal delay-2">
              <button 
                className="btn btn-primary btn-lg" 
                style={{ height: '56px', padding: '0 32px', fontSize: '1.1rem' }}
                onClick={onGetStarted}
              >
                Start Boosting Revenue <ArrowRight size={20} style={{ marginLeft: '12px' }} />
              </button>
            </div>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} className="text-accent" />
                <span className="text-muted" style={{ fontSize: '0.9rem' }}>Official Meta API</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} className="text-accent" />
                <span className="text-muted" style={{ fontSize: '0.9rem' }}>Zero Setup Required</span>
              </div>
            </div>
          </div>

          <div className="hero-image-container">
            <div className="hero-glow"></div>
            <img 
              src="/hero-guy.png" 
              alt="Sukumar Tantuvay — Solo Founder of ReActivate AI" 
              className="hero-image-main"
            />
            <div className="hero-founder-tag reveal delay-3">
              (Solo Founder- Sukumar Tantuvay)
            </div>
          </div>
        </section>

        {/* Logo Wall Section */}
        <section className="logo-wall reveal">
          <div className="logo-wall-track">
            <span>Ramesh Mobiles</span>
            <span>Digital Plaza</span>
            <span>The Gadget Store</span>
            <span>Classic Wear</span>
            <span>Apex Electronics</span>
            <span>Smart Tech</span>
            <span>Urban Style</span>
            <span>Future Electronics</span>
            {/* Duplicated for smooth loop */}
            <span>Ramesh Mobiles</span>
            <span>Digital Plaza</span>
            <span>The Gadget Store</span>
            <span>Classic Wear</span>
            <span>Apex Electronics</span>
            <span>Smart Tech</span>
            <span>Urban Style</span>
            <span>Future Electronics</span>
          </div>
        </section>

        {/* How it Works Section */}
        <section className="features-section reveal" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '40px', padding: '100px 40px' }}>
          <div className="section-header">
            <h2 style={{ fontSize: '3rem' }}>How it Works</h2>
            <p className="text-secondary" style={{ fontSize: '1.2rem' }}>
              Three simple steps to automate your growth and recover lost sales.
            </p>
          </div>
          <div className="step-grid">
            <div className="step-card reveal delay-1">
              <div className="step-number">1</div>
              <h3>Sync Data</h3>
              <p className="text-secondary">Securely connect your sales data. Our AI automatically scans for customers who are due for a visit.</p>
            </div>
            <div className="step-card reveal delay-2">
              <div className="step-number">2</div>
              <h3>Review Drafts</h3>
              <p className="text-secondary">We generate personalized WhatsApp messages for each customer. You have full control to edit or approve.</p>
            </div>
            <div className="step-card reveal delay-3">
              <div className="step-number">3</div>
              <h3>Send & Grow</h3>
              <p className="text-secondary">Send messages with one click via our official Meta API integration. Watch your repeat sales skyrocket.</p>
            </div>
          </div>
        </section>

        {/* Calculator Section */}
        <section className="features-section reveal" style={{ padding: '120px 0' }}>
          <div className="section-header">
            <h2>See your potential growth</h2>
            <p className="text-secondary" style={{ fontSize: '1.1rem' }}>
              Most retailers see a 25-30% return rate on automated follow-ups. Calculate what that means for your shop.
            </p>
          </div>

          <div className="card" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div className="input-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Users size={16} /> Monthly Customers
                </label>
                <input
                  type="number"
                  className="input"
                  placeholder="e.g. 500"
                  value={customers}
                  onChange={(e) => setCustomers(e.target.value)}
                  style={{ height: '50px' }}
                />
              </div>
              <div className="input-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <TrendingUp size={16} /> Avg Order Value (₹)
                </label>
                <input
                  type="number"
                  className="input"
                  placeholder="e.g. 2000"
                  value={aov}
                  onChange={(e) => setAov(e.target.value)}
                  style={{ height: '50px' }}
                />
              </div>
            </div>
            <button className="btn btn-primary btn-lg" onClick={calculate} style={{ width: '100%', marginTop: '32px' }}>
              <Calculator size={20} style={{ marginRight: '10px' }} /> Analyze Revenue Potential
            </button>

            {result && (
              <div className="animate-in" style={{ marginTop: '40px', textAlign: 'center' }}>
                <p className="text-muted" style={{ textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.8rem' }}>
                  Estimated Monthly Recovery
                </p>
                <h1 style={{ fontSize: '4rem', fontWeight: 900, margin: '10px 0' }} className="text-accent">
                  ₹{result.revenue.toLocaleString()}
                </h1>
                <p className="text-secondary" style={{ fontSize: '1.1rem' }}>
                  Bringing back <b className="text-accent">{result.count} customers</b> who would have otherwise forgotten you.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Feature Grid */}
        <section className="features-section reveal">
          <div className="section-header">
            <h2>Everything you need for Smart Retail</h2>
            <p className="text-secondary" style={{ fontSize: '1.1rem' }}>
              Stop losing customers to the giants. Level the playing field with professional-grade automation.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card reveal delay-1">
              <div className="feature-icon"><Zap size={24} /></div>
              <h3>Automated Follow-ups</h3>
              <p className="text-secondary">AI identifies customers who haven't visited in 30, 60, or 90 days and drafts the perfect nudge.</p>
            </div>
            <div className="feature-card reveal delay-2">
              <div className="feature-icon"><BarChart3 size={24} /></div>
              <h3>Real Growth Tracking</h3>
              <p className="text-secondary">Monitor your recovered revenue in real-time. See exactly how much each campaign earns you.</p>
            </div>
            <div className="feature-card reveal delay-3">
              <div className="feature-icon"><MessageSquare size={24} /></div>
              <h3>Official Meta API</h3>
              <p className="text-secondary">Send hundreds of messages safely and reliably using the official WhatsApp Business Cloud API.</p>
            </div>
            <div className="feature-card reveal delay-1">
              <div className="feature-icon"><ShieldCheck size={24} /></div>
              <h3>Secure & Compliant</h3>
              <p className="text-secondary">Fully compliant with WhatsApp terms of service. Your account is safe and your data is encrypted.</p>
            </div>
            <div className="feature-card reveal delay-2">
              <div className="feature-icon"><Users size={24} /></div>
              <h3>Smart Segmentation</h3>
              <p className="text-secondary">Categorize customers by purchase history and frequency to send laser-targeted messages.</p>
            </div>
            <div className="feature-card reveal delay-3">
              <div className="feature-icon"><TrendingUp size={24} /></div>
              <h3>ROI Dashboard</h3>
              <p className="text-secondary">A clear view of your return on investment. See every rupee earned through our automation.</p>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="reveal" style={{ padding: '100px 0', textAlign: 'center' }}>
          <div className="card" style={{ 
            background: 'linear-gradient(135deg, rgba(0, 245, 160, 0.1) 0%, rgba(0, 217, 255, 0.1) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '80px 40px',
            borderRadius: '40px'
          }}>
            <h2 style={{ fontSize: '3.5rem', marginBottom: '24px' }}>Ready to reclaim your revenue?</h2>
            <p className="text-secondary" style={{ fontSize: '1.25rem', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}>
              Join 200+ retailers who are already using ReActivate AI to grow their business. Zero setup fee, cancel anytime.
            </p>
            <button 
              className="btn btn-primary btn-lg" 
              onClick={onGetStarted}
              style={{ padding: '20px 48px', fontSize: '1.2rem' }}
              aria-label="Get Started for Free"
            >
              Get Started for Free <ArrowRight size={24} style={{ marginLeft: '12px' }} aria-hidden="true" />
            </button>
            <p className="text-muted" style={{ marginTop: '24px', fontSize: '0.9rem' }}>
              No credit card required • Official Meta API • 14-day free trial
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="landing-footer">
          <div className="footer-grid">
            <div className="footer-brand">
              <span className="logo-text">⚡ ReActivate AI</span>
              <p className="text-muted" style={{ maxWidth: '280px' }}>
                The intelligent CRM helping local retailers reclaim their customer base through smart automation.
              </p>
            </div>
            <div className="footer-col">
              <h4>Product</h4>
              <ul>
                <li><a onClick={() => onNavigate('about')} className="footer-link" style={{ cursor: 'pointer' }}>Features</a></li>
                <li><a className="footer-link">Pricing</a></li>
                <li><a onClick={() => onNavigate('integrations')} className="footer-link" style={{ cursor: 'pointer' }}>Integrations</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Resources</h4>
              <ul>
                <li><a onClick={() => onNavigate('about')} className="footer-link" style={{ cursor: 'pointer' }}>About Us</a></li>
                <li><a onClick={() => onNavigate('vision')} className="footer-link" style={{ cursor: 'pointer' }}>Our Vision</a></li>
                <li><a className="footer-link">Documentation</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Legal</h4>
              <ul>
                <li><a onClick={() => onNavigate('terms')} className="footer-link" style={{ cursor: 'pointer' }}>Privacy Policy</a></li>
                <li><a onClick={() => onNavigate('terms')} className="footer-link" style={{ cursor: 'pointer' }}>Terms of Service</a></li>
                <li><a className="footer-link">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 ReActivate AI — Built for Smart Retailers.</p>
            <div style={{ display: 'flex', gap: '20px' }}>
              <span className="text-muted">English (UK)</span>
              <span className="text-muted">Stable v1.02</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
