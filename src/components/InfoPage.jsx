export default function InfoPage({ title, subtitle, content, onBack }) {
  return (
    <div className="landing-page animate-in">
      <header className="landing-hero" style={{ paddingBottom: '20px' }}>
         <button onClick={onBack} className="btn btn-secondary btn-sm" style={{ marginBottom: '40px' }}>
           ← Back to Home
         </button>
         <h1 className="hero-title" style={{ fontSize: '3rem' }}>{title}</h1>
         {subtitle && <p className="hero-subtitle">{subtitle}</p>}
      </header>
      
      <div className="card-glass" style={{ 
        margin: '20px auto 80px', 
        padding: '40px', 
        maxWidth: '800px', 
        lineHeight: '1.8',
        fontSize: '1.05rem',
        color: 'var(--text-secondary)'
      }}>
        {content}
      </div>

      <footer className="landing-footer">
        <p>&copy; 2026 ReActivate AI. Built for Smart Bharat.</p>
      </footer>
    </div>
  );
}
