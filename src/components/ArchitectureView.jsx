import { Database, Zap, MessageSquare, LineChart, Users, Repeat } from 'lucide-react';
import { useApp } from '../App';

export default function ArchitectureView() {
  const { customers, campaigns } = useApp();

  const steps = [
    { 
      title: 'Customer Data', 
      icon: <Users size={24} />, 
      status: customers.length > 0 ? 'active' : 'pending', 
      desc: 'Syncing shop data',
      detail: `${customers.length} customers in DB`
    },
    { 
      title: 'Supabase DB', 
      icon: <Database size={24} />, 
      status: 'active', 
      desc: 'Real-time hosting',
      detail: 'Connection Live'
    },
    { 
      title: 'AI Engine', 
      icon: <Zap size={24} />, 
      status: 'active', 
      desc: 'Smart triggers',
      detail: 'Hinglish Logic active'
    },
    { 
      title: 'WhatsApp भेजो', 
      icon: <MessageSquare size={24} />, 
      status: campaigns.length > 0 ? 'active' : 'idle', 
      desc: 'Direct interaction',
      detail: `${campaigns.length} campaigns sent`
    },
    { 
      title: 'Track', 
      icon: <Repeat size={24} />, 
      status: 'active', 
      desc: 'Closing the loop',
      detail: 'Conversion tracking on'
    },
    { 
      title: 'Dashboard', 
      icon: <LineChart size={24} />, 
      status: 'active', 
      desc: 'ROI Analysis',
      detail: 'Live Analytics'
    },
  ];

  return (
    <div className="animate-in">
       <div className="page-header">
        <h1 className="page-title">⚙️ System Architecture</h1>
        <p className="page-subtitle">Real-time status of the ReActivate AI lifecycle</p>
      </div>

      <div className="card-glass" style={{ padding: '40px 20px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 20, minWidth: '900px', padding: '20px 0' }}>
          {steps.map((step, idx) => (
            <div key={idx} style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              textAlign: 'center',
              position: 'relative'
            }}>
              <div style={{ 
                width: 64, 
                height: 64, 
                borderRadius: '50%', 
                background: step.status === 'active' ? 'var(--accent-green-glass)' : 'var(--bg-lighter)',
                color: step.status === 'active' ? 'var(--accent-green)' : 'var(--text-muted)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: 16,
                border: step.status === 'active' ? '1px solid var(--accent-green)' : '1px solid var(--border-color)',
                boxShadow: step.status === 'active' ? '0 0 20px rgba(34, 197, 94, 0.2)' : 'none'
              }}>
                 {step.icon}
              </div>
              
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 4 }}>{step.title}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8 }}>{step.desc}</p>
              
              <div style={{ 
                fontSize: '0.7rem', 
                padding: '4px 8px', 
                borderRadius: '12px',
                background: step.status === 'active' ? 'var(--accent-green)' : 'var(--bg-darker)',
                color: step.status === 'active' ? 'white' : 'var(--text-muted)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                {step.status}
              </div>

              <div style={{ marginTop: 12, fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                {step.detail}
              </div>

              {idx < steps.length - 1 && (
                <div style={{ 
                  position: 'absolute', 
                  top: 32, 
                  right: -20, 
                  color: 'var(--border-color)', 
                  fontSize: '1.2rem',
                  fontWeight: 100
                }}>
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card-glass" style={{ padding: 24 }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Zap size={18} className="text-accent" /> AI Engine Logic
          </h4>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Our engine analyzes <b>Purchase Date</b> and <b>Item Category</b> to select the perfect Hinglish template. 
            It automatically calculates warranty expiry, service due dates, and upsell opportunities based on your shop's history.
          </p>
        </div>
        <div className="card-glass" style={{ padding: 24 }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Repeat size={18} className="text-success" /> Tracking Loop
          </h4>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            When a WhatsApp link is generated, we update the customer's <code>last_contact_date</code>. 
            Once they revisit your shop, mark the message as "Converted" in History to populate your ROI Dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
