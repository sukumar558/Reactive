import { useState } from 'react';
import {
  Zap,
  Users,
  TrendingUp,
  ShieldCheck,
  MessageSquare,
  BarChart3,
  ArrowRight,
  ChevronDown,
  Check,
  Smartphone,
  Layout,
  Clock,
  CheckCircle2,
  HelpCircle,
  FileSpreadsheet,
  Send
} from 'lucide-react';

export default function LandingPage({ onGetStarted, onNavigate }) {
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    { q: "Does it work with Excel?", a: "Yes! Wrappers is built to handle Excel (.xlsx, .xls) and CSV files. Just upload your existing customer sheet and we'll map the fields automatically." },
    { q: "Can I send messages in Hindi?", a: "Absolutely. We provide ready-made templates in both Hindi and English (Hinglish), and you can fully customize them to match your shop's voice." },
    { q: "Can I approve before sending?", a: "Yes, you have full control. You can set campaigns to 'Draft' mode, review each message individually, and only send when you're ready." },
    { q: "Does it work on WhatsApp?", a: "Yes, Wrappers uses the official Meta WhatsApp Business API, ensuring your messages are delivered reliably and your account remains safe." },
    { q: "Can I use it without CRM experience?", a: "Definitely. Wrappers is designed specifically for shop owners. If you can use a smartphone, you can use Wrappers. No complex training required." }
  ];

  return (
    <div className="landing-page-wrapper">
      <div className="landing-container">
        {/* 1) Header */}
        <header className="landing-header">
          <div className="landing-logo">
            <span className="logo-text">⚡ ReActivateAI</span>
          </div>
          <nav style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
            <div className="desktop-nav" style={{ display: 'flex', gap: '24px' }}>
              <a onClick={() => onNavigate('about')} className="footer-link">Product</a>
              <a href="#how-it-works" className="footer-link">How it Works</a>
              <a href="#pricing" className="footer-link">Pricing</a>
              <a onClick={() => onNavigate('about')} className="footer-link">Case Study</a>
              <a href="#faq" className="footer-link">FAQ</a>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-secondary btn-sm" onClick={onGetStarted}>Login</button>
              <button className="btn btn-primary btn-sm" onClick={onGetStarted}>Start Free Trial</button>
            </div>
          </nav>
        </header>

        {/* 2) Hero Section */}
        <section className="landing-hero">
          <div className="hero-content reveal">
            <div className="hero-badge pulsing">
              <Zap size={14} />
              <span>Built for Electronics Retailers</span>
            </div>
            <h1 className="hero-title">
              Turn old customer data into <span>repeat sales</span> automatically.
            </h1>
            <p className="hero-description reveal delay-1">
              Upload Excel or Google Sheets, and Wrappers will decide who gets upgrade, exchange, warranty, or win-back messages.
            </p>
            <div className="hero-actions reveal delay-2">
              <button className="btn btn-primary btn-lg" onClick={onGetStarted}>
                Start Free Trial <ArrowRight size={20} style={{ marginLeft: '12px' }} />
              </button>
              <button className="btn btn-secondary btn-lg" onClick={() => onNavigate('about')}>
                See Demo
              </button>
            </div>
          </div>

          <div className="hero-image-container">
            <div className="hero-glow"></div>
            <img
              src="/hero-guy.png"
              alt="Sukumar Tantuvay — Solo Founder"
              className="hero-image-main"
            />
            <div className="hero-founder-tag reveal delay-3">
              (Solo Founder - Sukumar Tantuvay)
            </div>
          </div>
        </section>

        {/* 3) Social Proof Strip */}
        <section className="trust-bar reveal">
          <p className="trust-title">Built for mobile, laptop, TV, appliance, and electronics retailers</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '48px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} className="text-accent" />
              <span className="text-secondary">10-minute setup</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} className="text-accent" />
              <span className="text-secondary">Works with Excel & Sheets</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} className="text-accent" />
              <span className="text-secondary">WhatsApp + SMS support</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} className="text-accent" />
              <span className="text-secondary">Made for Indian shops</span>
            </div>
          </div>
        </section>

        {/* 4) Problem Section */}
        <section className="features-section reveal">
          <div className="problem-grid">
            <div className="problem-text">
              <span className="problem-tag">The Revenue Gap</span>
              <h2>Your data is already there. Your revenue is not.</h2>
              <p className="text-secondary" style={{ fontSize: '1.2rem', marginTop: '20px' }}>
                Most electronics shops already have customer names, numbers, models sold, and purchase dates—but that data is sitting idle in sheets.
              </p>
              <p className="text-secondary" style={{ fontSize: '1.2rem', marginTop: '16px' }}>
                Manual follow-ups are slow, inconsistent, and easy to forget. While you're busy running the shop, your old customers are forgetting you.
              </p>
            </div>
            <div className="card-glass" style={{ padding: '40px', borderRadius: '32px', textAlign: 'center' }}>
              <TrendingUp size={64} style={{ color: 'var(--accent-red)', marginBottom: '24px' }} />
              <h3 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>Stop the Leaks</h3>
              <p className="text-muted">Don't let 70% of your customers buy their next gadget from a competitor just because you didn't say hello.</p>
            </div>
          </div>
        </section>

        {/* 5) Solution Section */}
        <section id="how-it-works" className="features-section reveal" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '40px', padding: '100px 40px' }}>
          <div className="section-header">
            <h2>Wrappers turns customer records into campaigns.</h2>
            <p className="text-secondary">
              Upload your customer sheet once, and Wrappers automatically segments buyers by product, purchase date, and status.
            </p>
          </div>
          <div className="steps-flow">
            <div className="step-item">
              <div className="step-icon-circle"><FileSpreadsheet size={32} /></div>
              <h3 style={{ fontSize: '1.2rem' }}>1. Upload Data</h3>
              <p className="text-muted">Drag and drop your Excel or connect Google Sheets.</p>
            </div>
            <div className="step-item">
              <div className="step-icon-circle"><Layout size={32} /></div>
              <h3 style={{ fontSize: '1.2rem' }}>2. Auto-Segment</h3>
              <p className="text-muted">AI groups customers by product type and age.</p>
            </div>
            <div className="step-item">
              <div className="step-icon-circle"><Send size={32} /></div>
              <h3 style={{ fontSize: '1.2rem' }}>3. Send Message</h3>
              <p className="text-muted">Deliver the right offer at the perfect moment.</p>
            </div>
          </div>
        </section>

        {/* 6) Features Section */}
        <section className="features-section reveal">
          <div className="section-header">
            <h2>Everything needed to revive old customers.</h2>
            <p className="text-secondary">A clean, specialized toolkit built for the electronics retail workflow.</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon"><Layout size={24} /></div>
              <h3>Smart Segmentation</h3>
              <p className="text-muted">Group customers by product type, brand, age, and spend tier with zero manual work.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><Zap size={24} /></div>
              <h3>Trigger Automation</h3>
              <p className="text-muted">Automatic alerts for warranty expiry, upgrade eligibility, and 90-day win-back nudge.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><MessageSquare size={24} /></div>
              <h3>Campaign Templates</h3>
              <p className="text-muted">Ready-made, high-conversion Hinglish drafts for every electronics occasion.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><ShieldCheck size={24} /></div>
              <h3>Approval Control</h3>
              <p className="text-muted">Set it to autopilot or review every message yourself before it goes out.</p>
            </div>
          </div>
        </section>

        {/* 7) Trigger Demo Section */}
        <section className="reveal" style={{ padding: '100px 0' }}>
          <div className="section-header">
            <h2>Prebuilt triggers for electronics retailers.</h2>
            <p className="text-secondary">The system knows what to send and when. You just approve.</p>
          </div>
          <div className="product-preview" style={{ marginTop: '40px' }}>
            <div className="preview-nav">
              <div className="nav-dot" style={{ background: '#ff5f56' }}></div>
              <div className="nav-dot" style={{ background: '#ffbd2e' }}></div>
              <div className="nav-dot" style={{ background: '#27c93f' }}></div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '12px' }}>Wrappers Campaign Intelligence</span>
            </div>
            <div className="preview-content">
              <img src="/dashboard-mockup.png" alt="Wrappers Dashboard Mockup" />
            </div>
          </div>
        </section>

        {/* 8) How it Works (Setup) */}
        <section className="features-section reveal">
          <div className="section-header">
            <h2>Setup in minutes, not weeks.</h2>
            <p className="text-secondary">No complex CRM training required. Designed for busy shop owners.</p>
          </div>
          <div className="features-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="feature-card" style={{ padding: '24px', alignItems: 'center', textAlign: 'center' }}>
              <div className="step-number" style={{ marginBottom: '16px' }}>1</div>
              <h4 style={{ fontSize: '1rem' }}>Upload Sheet</h4>
            </div>
            <div className="feature-card" style={{ padding: '24px', alignItems: 'center', textAlign: 'center' }}>
              <div className="step-number" style={{ marginBottom: '16px' }}>2</div>
              <h4 style={{ fontSize: '1rem' }}>Map Fields</h4>
            </div>
            <div className="feature-card" style={{ padding: '24px', alignItems: 'center', textAlign: 'center' }}>
              <div className="step-number" style={{ marginBottom: '16px' }}>3</div>
              <h4 style={{ fontSize: '1rem' }}>Select Rules</h4>
            </div>
            <div className="feature-card" style={{ padding: '24px', alignItems: 'center', textAlign: 'center' }}>
              <div className="step-number" style={{ marginBottom: '16px' }}>4</div>
              <h4 style={{ fontSize: '1rem' }}>Review & Send</h4>
            </div>
          </div>
        </section>

        {/* 9) Pricing Section */}
        <section id="pricing" className="features-section reveal">
          <div className="section-header">
            <h2>Simple pricing for shop owners.</h2>
            <p className="text-secondary">No hidden fees. Scale as your repeat business grows.</p>
          </div>
          <div className="pricing-grid">
            <div className="pricing-card">
              <h3>Starter</h3>
              <div className="pricing-price">₹1,999<span>/mo</span></div>
              <ul className="pricing-features">
                <li><Check size={16} /> Up to 1,000 Customers</li>
                <li><Check size={16} /> 5 Smart Triggers</li>
                <li><Check size={16} /> Basic Reports</li>
                <li><Check size={16} /> Email Support</li>
              </ul>
              <button className="btn btn-secondary" style={{ width: '100%' }} onClick={onGetStarted}>Get Started</button>
            </div>
            <div className="pricing-card popular">
              <div className="popular-badge">Most Popular</div>
              <h3>Growth</h3>
              <div className="pricing-price">₹4,999<span>/mo</span></div>
              <ul className="pricing-features">
                <li><Check size={16} /> Up to 5,000 Customers</li>
                <li><Check size={16} /> All 25 Smart Triggers</li>
                <li><Check size={16} /> Advanced ROI Dashboard</li>
                <li><Check size={16} /> Priority Support</li>
              </ul>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={onGetStarted}>Start Free Trial</button>
            </div>
            <div className="pricing-card">
              <h3>Pro</h3>
              <div className="pricing-price">₹9,999<span>/mo</span></div>
              <ul className="pricing-features">
                <li><Check size={16} /> Unlimited Customers</li>
                <li><Check size={16} /> Custom Trigger Logic</li>
                <li><Check size={16} /> Multi-shop Support</li>
                <li><Check size={16} /> Dedicated Manager</li>
              </ul>
              <button className="btn btn-secondary" style={{ width: '100%' }} onClick={onGetStarted}>Contact Sales</button>
            </div>
          </div>
          <p className="text-muted" style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.8rem' }}>
            * WhatsApp/SMS usage is billed separately based on volume.
          </p>
        </section>

        {/* 10) ROI Section */}
        <section className="features-section reveal">
          <div className="section-header">
            <h2>More repeat customers, less manual follow-up.</h2>
            <p className="text-secondary">Wrappers pays for itself within the first few campaigns.</p>
          </div>
          <div className="roi-grid">
            <div className="roi-card">
              <div className="roi-stat">30%</div>
              <div className="roi-label">Revive Dormant</div>
              <div className="roi-desc">Average increase in return rates from old customers.</div>
            </div>
            <div className="roi-card">
              <div className="roi-stat">₹1.2L</div>
              <div className="roi-label">Avg. Recovered</div>
              <div className="roi-desc">Monthly revenue reclaimed by pilot retailers.</div>
            </div>
            <div className="roi-card">
              <div className="roi-stat">12h</div>
              <div className="roi-label">Staff Time Saved</div>
              <div className="roi-desc">Hours saved every week on manual customer calls.</div>
            </div>
          </div>
        </section>

        {/* 11) Testimonials */}
        <section className="features-section reveal">
          <div className="section-header">
            <h2>Trusted by electronics shops that want repeat sales.</h2>
          </div>
          <div className="features-grid">
            <div className="card-glass" style={{ padding: '32px' }}>
              <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                "Setup was simple and follow-up became automatic. I don't have to worry about who to message anymore."
              </p>
              <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="sidebar-avatar" style={{ width: '32px', height: '32px' }}>R</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Rajesh Kumar</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>RK Mobiles & Electronics</div>
                </div>
              </div>
            </div>
            <div className="card-glass" style={{ padding: '32px' }}>
              <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                "Old customers started coming back after warranty reminders. It’s like having an extra sales person."
              </p>
              <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="sidebar-avatar" style={{ width: '32px', height: '32px' }}>A</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Amit Shah</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Digital Vision Plaza</div>
                </div>
              </div>
            </div>
            <div className="card-glass" style={{ padding: '32px' }}>
              <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                "The ROI dashboard is great. I can see exactly how much money each WhatsApp nudge brings in."
              </p>
              <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="sidebar-avatar" style={{ width: '32px', height: '32px' }}>S</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Sanjay Gupta</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gupta Electronics</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 12) FAQ Section */}
        <section id="faq" className="features-section reveal">
          <div className="section-header">
            <h2>Frequently Asked Questions</h2>
          </div>
          <div className="faq-grid">
            {faqs.map((faq, i) => (
              <div key={i} className="faq-item" onClick={() => toggleFaq(i)}>
                <div className="faq-question">
                  {faq.q}
                  <ChevronDown size={20} style={{
                    transform: activeFaq === i ? 'rotate(180deg)' : 'rotate(0)',
                    transition: '0.3s'
                  }} />
                </div>
                {activeFaq === i && (
                  <div className="faq-answer animate-in">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 13) Final CTA Section */}
        <section className="reveal" style={{ padding: '100px 0', textAlign: 'center' }}>
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(0, 245, 160, 0.1) 0%, rgba(0, 217, 255, 0.1) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '80px 40px',
            borderRadius: '40px'
          }}>
            <h2 style={{ fontSize: '3.5rem', marginBottom: '24px' }}>Turn your customer list into repeat revenue.</h2>
            <p className="text-secondary" style={{ fontSize: '1.25rem', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}>
              No complex setup. Upload your data and begin your 14-day free trial today.
            </p>
            <button className="btn btn-primary btn-lg" onClick={onGetStarted}>
              Start Free Trial <ArrowRight size={24} style={{ marginLeft: '12px' }} />
            </button>
            <p className="text-muted" style={{ marginTop: '24px', fontSize: '0.9rem' }}>
              Built for Indian Electronics Retailers • Official Meta API
            </p>
          </div>
        </section>

        {/* 14) Footer */}
        <footer className="landing-footer">
          <div className="footer-grid">
            <div className="footer-brand">
              <span className="logo-text">⚡ Wrappers</span>
              <p className="text-muted" style={{ maxWidth: '280px' }}>
                The intelligent CRM helping local electronics retailers reclaim their revenue through smart automation.
              </p>
            </div>
            <div className="footer-col">
              <h4>Product</h4>
              <ul>
                <li><a onClick={() => onNavigate('about')} className="footer-link">Features</a></li>
                <li><a href="#pricing" className="footer-link">Pricing</a></li>
                <li><a onClick={() => onNavigate('integrations')} className="footer-link">Integrations</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Resources</h4>
              <ul>
                <li><a onClick={() => onNavigate('about')} className="footer-link">About Us</a></li>
                <li><a onClick={() => onNavigate('vision')} className="footer-link">Our Vision</a></li>
                <li><a className="footer-link">WhatsApp Support</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Legal</h4>
              <ul>
                <li><a onClick={() => onNavigate('terms')} className="footer-link">Privacy Policy</a></li>
                <li><a onClick={() => onNavigate('terms')} className="footer-link">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 Wrappers — Built for Smart Electronics Retailers.</p>
            <div style={{ display: 'flex', gap: '20px' }}>
              <span className="text-muted">English (India)</span>
              <span className="text-muted">Stable v1.05</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
