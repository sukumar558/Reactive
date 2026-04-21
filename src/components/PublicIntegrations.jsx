import { Smartphone, Zap, Globe, MessageSquare, Database, ShoppingBag } from 'lucide-react';

export default function PublicIntegrations({ onBack }) {
  const integrations = [
    {
      name: "WhatsApp Cloud API",
      description: "Official Meta-hosted API for reliable high-volume messaging.",
      icon: <Smartphone color="#00f5a0" />,
      features: ["Verified Business Profile", "24/7 Automation", "No SIM required"]
    },
    {
      name: "Google Sheets",
      description: "Real-time sync between your spreadsheets and CRM.",
      icon: <Database color="#00d9ff" />,
      features: ["Auto-sync every 6h", "Column mapping", "Zero manual entry"]
    },
    {
      name: "Shopify",
      description: "Trigger messages based on orders and cart abandonment.",
      icon: <ShoppingBag color="#f59e0b" />,
      features: ["Abandoned cart recovery", "Post-purchase feedback", "Stock alerts"]
    },
    {
      name: "Meta Ads (Lead Gen)",
      description: "Instantly welcome new leads via WhatsApp.",
      icon: <Zap color="#8b5cf6" />,
      features: ["Instant response", "Lead qualification", "CRM auto-entry"]
    }
  ];

  return (
    <div className="landing-page" style={{ padding: '100px 20px', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <button onClick={onBack} className="btn btn-secondary btn-sm" style={{ marginBottom: 40 }}>
          ← Back to Home
        </button>
        
        <div style={{ textAlign: 'center', marginBottom: 80 }}>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: 20, background: 'var(--gradient-main)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Seamless Integrations
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: 700, margin: '0 auto' }}>
            ReActivate AI connects with the tools you already use to automate your customer recovery and engagement.
          </p>
        </div>

        <div className="features-grid">
          {integrations.map((item, i) => (
            <div key={i} className="feature-card animate-in" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="feature-icon" style={{ background: 'rgba(255,255,255,0.05)', width: 60, height: 60, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                {item.icon}
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 12 }}>{item.name}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: 24, lineHeight: 1.6 }}>{item.description}</p>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {item.features.map((f, j) => (
                  <li key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-green)' }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="card-glass" style={{ marginTop: 100, padding: 60, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, background: 'radial-gradient(circle, rgba(0,245,160,0.1) 0%, transparent 70%)' }} />
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 20 }}>Need a Custom Integration?</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>Our API is developer-friendly and supports Webhooks for any platform.</p>
          <button className="btn btn-primary btn-lg shine-effect">View Documentation</button>
        </div>
      </div>
    </div>
  );
}
