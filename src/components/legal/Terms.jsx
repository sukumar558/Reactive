export default function Terms({ onBack }) {
  return (
    <div className="landing-page animate-in">
      <header className="landing-hero" style={{ paddingBottom: '20px' }}>
         <button onClick={onBack} className="btn btn-secondary btn-sm" style={{ marginBottom: '40px' }}>
           ← Back to Home
         </button>
         <h1 className="hero-title" style={{ fontSize: '3rem' }}>Terms & <span className="text-accent">Conditions</span></h1>
         <p className="hero-subtitle">Last Updated: April 2026</p>
      </header>
      
      <div className="card-glass" style={{ 
        margin: '20px auto 80px', 
        padding: '40px', 
        maxWidth: '800px', 
        lineHeight: '1.8',
        fontSize: '0.95rem',
        color: 'var(--text-secondary)'
      }}>
        <h3>1. Agreement to Terms</h3>
        <p>By accessing ReActivate AI, you agree to be bound by these Terms and Conditions. Our platform is designed to help shop owners manage customer follow-ups via WhatsApp.</p>
        
        <h3 style={{ marginTop: '24px' }}>2. Data Privacy & Supabase</h3>
        <p>We use Supabase for secure data storage. You retain all ownership of the customer data you upload. We do not sell or share your customer data with third parties.</p>

        <h3 style={{ marginTop: '24px' }}>3. WhatsApp Usage</h3>
        <p>ReActivate AI provides deep links to WhatsApp. You are responsible for complying with WhatsApp's Business Policy and Anti-Spam guidelines. We do not guarantee delivery if your account is flagged by Meta for spamming.</p>

        <h3 style={{ marginTop: '24px' }}>4. Service Limits</h3>
        <p>Free accounts are limited to identifying follow-up opportunities. Premium features (automated sequencing, advanced analytics) are subject to subscription plans as defined in your profile.</p>

        <h3 style={{ marginTop: '24px' }}>5. Limitation of Liability</h3>
        <p>ReActivate AI is provided "as is". We are not liable for any business losses resulting from the use of our smart trigger engine or message templates.</p>
      </div>

      <footer className="landing-footer">
        <p>&copy; 2026 ReActivate AI. Built for Smart Retail.</p>
      </footer>
    </div>
  );
}
