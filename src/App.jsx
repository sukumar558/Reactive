import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from './supabaseClient';
import AuthPage from './components/AuthPage';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import CustomerImport from './components/CustomerImport';
import CustomerList from './components/CustomerList';
import TriggerEngine from './components/TriggerEngine';
import CampaignBuilder from './components/CampaignBuilder';
import MessageHistory from './components/MessageHistory';
import ToastContainer from './components/ui/ToastContainer';

import LandingPage from './components/LandingPage';
import InfoPage from './components/InfoPage';
import Terms from './components/legal/Terms';
import Integrations from './components/Integrations';

// Context for global state
export const AppContext = createContext();

export function useApp() {
  return useContext(AppContext);
}

const aboutContent = (
  <>
    <p>ReActivate AI was born from a simple observation: <b>Local shop owners are losing customers simply because they forget to follow up.</b></p>
    <p style={{ marginTop: '16px' }}>While large e-commerce players use advanced CRM tools to bombard customers with notifications, local retailers often rely on memory or paper diaries.</p>
    <p style={{ marginTop: '16px' }}>Our mission is to level the playing field. We provide professional-grade CRM tools that are so simple, a shop owner can master them in 5 minutes. No complex APIs, no expensive software—just smart triggers and WhatsApp.</p>
  </>
);

const visionContent = (
  <>
    <p>We envision a future where every small retailer is a "Smart Retailer".</p>
    <div style={{ marginTop: '16px' }}>
      <b>1. Digital Empowerment:</b> Making AI and Automation accessible to local businesses everywhere.
    </div>
    <div style={{ marginTop: '16px' }}>
      <b>2. Relationship First:</b> Focus on personal follow-ups via WhatsApp, the most trusted communication channel.
    </div>
    <div style={{ marginTop: '16px' }}>
      <b>3. Economic Growth:</b> Helping over 1 million shop owners increase their repeat business by 30% or more.
    </div>
  </>
);

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [customers, setCustomers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [profile, setProfile] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [unauthView, setUnauthView] = useState('landing'); // landing, auth, about, vision, terms

  // Track selected customers for campaign
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [selectedTrigger, setSelectedTrigger] = useState(null);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setCustomers([]);
        setCampaigns([]);
        setProfile(null);
        setUnauthView('landing');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load data when session exists
  useEffect(() => {
    if (session) {
      loadCustomers();
      loadCampaigns();
      loadProfile();
    }
  }, [session]);

  async function loadCustomers() {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setCustomers(data);
  }

  async function loadCampaigns() {
    const { data, error } = await supabase
      .from('ra_campaigns')
      .select('*, ra_campaign_customers(*)')
      .order('created_at', { ascending: false });

    if (!error && data) setCampaigns(data);
  }

  async function loadProfile() {
    const { data, error } = await supabase
      .from('ra_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (!error && data) setProfile(data);
  }

  function addToast(message, type = 'info') {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }

  function navigateToCampaign(customers, trigger) {
    setSelectedCustomers(customers);
    setSelectedTrigger(trigger);
    setCurrentPage('campaign');
  }

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
        <p style={{ color: 'var(--text-muted)' }}>Loading ReActivate AI...</p>
      </div>
    );
  }

  if (!session) {
    if (unauthView === 'auth') {
      return (
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setUnauthView('landing')} 
            className="btn btn-secondary btn-sm"
            style={{ position: 'fixed', top: 20, left: 20, zIndex: 1000 }}
          >
            ← Back to Home
          </button>
          <AuthPage addToast={addToast} />
        </div>
      );
    }
    if (unauthView === 'about') {
      return <InfoPage title="About Us" content={aboutContent} onBack={() => setUnauthView('landing')} />;
    }
    if (unauthView === 'vision') {
      return <InfoPage title="Our Vision" subtitle="Fueling the future of independent retail" content={visionContent} onBack={() => setUnauthView('landing')} />;
    }
    if (unauthView === 'terms') {
      return <Terms onBack={() => setUnauthView('landing')} />;
    }
    return (
      <LandingPage 
        onGetStarted={() => setUnauthView('auth')} 
        onNavigate={(view) => setUnauthView(view)} 
      />
    );
  }


  const pages = {
    dashboard: <Dashboard />,
    import: <CustomerImport />,
    customers: <CustomerList />,
    triggers: <TriggerEngine />,
    campaign: <CampaignBuilder />,
    history: <MessageHistory />,
    integrations: <Integrations />,
  };

  const contextValue = {
    session,
    customers,
    campaigns,
    profile,
    selectedCustomers,
    selectedTrigger,
    setSelectedCustomers,
    setSelectedTrigger,
    loadCustomers,
    loadCampaigns,
    loadProfile,
    addToast,
    setCurrentPage,
    navigateToCampaign,
    currentPage,
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div className="app-layout">
        <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <main className="main-content">
          {pages[currentPage] || <Dashboard />}
        </main>
        <ToastContainer toasts={toasts} />
      </div>
    </AppContext.Provider>
  );
}

export default App;
