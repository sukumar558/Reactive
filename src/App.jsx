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
import ErrorBoundary from './components/ErrorBoundary';

import LandingPage from './components/LandingPage';
import InfoPage from './components/InfoPage';
import Terms from './components/legal/Terms';
import Integrations from './components/Integrations';
import PublicIntegrations from './components/PublicIntegrations';

// Context for global state
export const AppContext = createContext();

export function useApp() {
  return useContext(AppContext);
}

const aboutContent = (
  <>
    <p>Wrappers was born from a simple observation: <b>Local shop owners are losing customers simply because they forget to follow up.</b></p>
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
  const [dataLoading, setDataLoading] = useState(false);
  const [globalError, setGlobalError] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [customers, setCustomers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [profile, setProfile] = useState(null);
  const [stores, setStores] = useState([]);
  const [currentStore, setCurrentStore] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [unauthView, setUnauthView] = useState('landing');


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
    async function initData() {
      if (session) {
        setDataLoading(true);
        setGlobalError(null);
        try {
          await Promise.all([
            loadProfile(),
            loadCustomers(),
            loadStores()
          ]);
          
          // Load campaigns separately to avoid blocking the main view
          loadCampaigns();
        } catch (err) {
          console.error('Fatal data load error:', err);
          setGlobalError(err.message || 'Failed to connect to the database');
        } finally {
          setDataLoading(false);
        }
      }
    }
    initData();
  }, [session]);

  async function loadCustomers() {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(2000);

      if (error) throw error;
      if (data) setCustomers(data);
    } catch (err) {
      console.error('Error loading customers:', err);
    }
  }

  async function loadCampaigns() {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*, customer_campaigns(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setCampaigns(data);
    } catch (err) {
      console.error('Error loading campaigns:', err);
    }
  }

  async function loadProfile() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session?.user?.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is 'no rows found'
        throw error;
      }

      if (data) {
        setProfile(data);
      } else if (session?.user) {
        // Auto-create profile if missing
        console.log('Profile missing. Creating default profile...');
        const newProfile = {
          id: session.user.id,
          shop_name: session.user.email?.split('@')[0] || 'My Shop',
          owner_name: 'Shop Owner',
          plan: 'free'
        };
        const { data: created, error: createError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single();
        
        if (createError) {
          console.error('Error creating profile:', createError);
          // If insert fails (maybe ra_profiles issue), don't crash, just proceed
        } else if (created) {
          setProfile(created);
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      throw err; // Profile is critical
    }
  }

  async function loadStores() {
    try {
      const { data, error } = await supabase.from('stores').select('*');
      if (error) throw error;
      setStores(data || []);
      if (data && data.length > 0 && !currentStore) {
        setCurrentStore(data[0]);
      }
    } catch (err) {
      console.error('Error loading stores:', err);
    }
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
        <p style={{ color: 'var(--text-muted)' }}>Loading Wrappers...</p>
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
    if (unauthView === 'integrations') {
      return <PublicIntegrations onBack={() => setUnauthView('landing')} />;
    }
    return (
      <LandingPage 
        onGetStarted={() => setUnauthView('auth')} 
        onNavigate={(view) => setUnauthView(view)} 
      />
    );
  }

  if (globalError) {
    return (
      <div className="error-page">
        <div className="card" style={{ maxWidth: 400, textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>⚠️</div>
          <h2 style={{ marginBottom: 12 }}>Connection Error</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>{globalError}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            🔄 Retry Connection
          </button>
          <button 
            className="btn btn-secondary" 
            style={{ marginTop: 12, width: '100%' }}
            onClick={() => supabase.auth.signOut()}
          >
            Log Out
          </button>
        </div>
      </div>
    );
  }

  if (dataLoading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
        <p style={{ color: 'var(--text-muted)' }}>Synchronizing your data...</p>
      </div>
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
    stores,
    currentStore,
    setCurrentStore,
    selectedCustomers,
    selectedTrigger,
    setSelectedCustomers,
    setSelectedTrigger,
    loadCustomers,
    loadCampaigns,
    loadProfile,
    loadStores,
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
          <ErrorBoundary key={currentPage}>
            {pages[currentPage] || <Dashboard />}
          </ErrorBoundary>
        </main>
        <ToastContainer toasts={toasts} />
      </div>
    </AppContext.Provider>
  );
}

export default App;
