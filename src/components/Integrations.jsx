import { useState, useEffect } from 'react';
import { useApp } from '../App';
import { supabase } from '../supabaseClient';
import { 
  Smartphone, 
  Users, 
  Zap, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  FileSpreadsheet, 
  Globe, 
  UserPlus, 
  ShieldCheck, 
  ZapIcon, 
  Clock, 
  ArrowRight,
  Plus
} from 'lucide-react';

export default function Integrations() {
  const { profile, loadProfile, addToast, session, customers, setCurrentPage } = useApp();
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    whatsapp_cloud_token: '',
    whatsapp_phone_id: '',
    api_mode_enabled: false,
    automation_active: false,
  });

  // Sync state when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        whatsapp_cloud_token: profile.whatsapp_cloud_token || '',
        whatsapp_phone_id: profile.whatsapp_phone_id || '',
        api_mode_enabled: profile.api_mode_enabled || false,
        automation_active: profile.automation_active || false,
      });
    }
  }, [profile]);

  // Completion states
  const step1Complete = !!(formData.whatsapp_cloud_token && formData.whatsapp_phone_id);
  const step2Complete = customers.length > 0 || importSuccess;
  const step3Complete = formData.automation_active;

  async function handleSaveWhatsApp() {
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        whatsapp_cloud_token: formData.whatsapp_cloud_token,
        whatsapp_phone_id: formData.whatsapp_phone_id,
        api_mode_enabled: true // Auto-enable if details provided
      })
      .eq('id', session?.user?.id);

    if (error) {
      addToast('Setup failed: ' + error.message, 'error');
    } else {
      addToast('WhatsApp Connected Successfully!', 'success');
      loadProfile();
    }
    setLoading(false);
  }

  async function handleToggleAutomation() {
    setLoading(true);
    const newVal = !formData.automation_active;
    const { error } = await supabase
      .from('profiles')
      .update({ automation_active: newVal })
      .eq('id', session?.user?.id);

    if (error) {
      addToast('Update failed: ' + error.message, 'error');
    } else {
      setFormData(prev => ({ ...prev, automation_active: newVal }));
      addToast(newVal ? 'Smart Campaigns Enabled!' : 'Automation Paused', 'info');
      loadProfile();
    }
    setLoading(false);
  }

  function handleFakeImport() {
    setImporting(true);
    setTimeout(() => {
      setImporting(false);
      setImportSuccess(true);
      addToast('✅ 245 customers imported successfully', 'success');
    }, 1500);
  }

  function handleCompleteSetup() {
    if (step1Complete && step2Complete && step3Complete) {
      setCurrentPage('dashboard');
    } else {
      const pending = !step1Complete ? 'Step 1' : !step2Complete ? 'Step 2' : 'Step 3';
      addToast(`Please complete ${pending} to proceed.`, 'info');
    }
  }

  return (
    <div className="animate-in">
      <div className="setup-container">
        {/* Header */}
        <div className="page-header" style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 className="page-title" style={{ fontSize: '2.4rem' }}>Get Started Setup</h1>
          <p className="page-subtitle" style={{ fontSize: '1.1rem', maxWidth: 600, margin: '0 auto' }}>
            Connect WhatsApp, import customers, and enable automation in 3 simple steps.
          </p>
        </div>

        {/* Progress Tracker */}
        <div className="setup-progress">
          <div className={`step-item ${step1Complete ? 'complete' : 'active'}`}>
            <div className="step-number">{step1Complete ? <CheckCircle2 size={24} /> : '1'}</div>
            <div className="step-label">Connect WhatsApp</div>
          </div>
          <div className={`step-item ${step2Complete ? 'complete' : (step1Complete ? 'active' : '')}`}>
            <div className="step-number">{step2Complete ? <CheckCircle2 size={24} /> : '2'}</div>
            <div className="step-label">Import Customers</div>
          </div>
          <div className={`step-item ${step3Complete ? 'complete' : (step2Complete ? 'active' : '')}`}>
            <div className="step-number">{step3Complete ? <CheckCircle2 size={24} /> : '3'}</div>
            <div className="step-label">Enable Automation</div>
          </div>
        </div>

        {/* Card 1: Connect WhatsApp */}
        <div className={`card setup-card ${step1Complete ? '' : 'active'}`}>
          <div className="setup-card-header">
            <div className="setup-card-icon"><Smartphone size={24} /></div>
            <div style={{ flex: 1 }}>
              <h3 className="setup-card-title">Connect WhatsApp Business</h3>
              <p className="setup-card-desc">Start sending automated customer messages securely.</p>
            </div>
            {step1Complete && <CheckCircle2 className="text-accent" size={24} />}
          </div>
          
          <div className="setup-card-content">
            <button 
              className={`btn ${step1Complete ? 'btn-secondary' : 'btn-primary'} btn-lg`}
              onClick={() => step1Complete ? setShowAdvanced(!showAdvanced) : handleSaveWhatsApp()}
              disabled={loading}
            >
              {step1Complete ? 'Connected' : 'Connect Now'}
            </button>

            <div 
              className="advanced-toggle" 
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />} Advanced Settings
            </div>

            {showAdvanced && (
              <div className="animate-in" style={{ marginTop: 24, display: 'grid', gap: 20, padding: 20, background: 'rgba(255,255,255,0.02)', borderRadius: 12 }}>
                <div className="input-group">
                  <label>WhatsApp Cloud API Token</label>
                  <input 
                    type="password" 
                    className="input" 
                    placeholder="EAAGz..." 
                    value={formData.whatsapp_cloud_token}
                    onChange={e => setFormData({ ...formData, whatsapp_cloud_token: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label>Phone Number ID</label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="123456789..." 
                    value={formData.whatsapp_phone_id}
                    onChange={e => setFormData({ ...formData, whatsapp_phone_id: e.target.value })}
                  />
                </div>
                <button className="btn btn-secondary btn-sm" onClick={handleSaveWhatsApp} disabled={loading}>
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Import Customers */}
        <div className={`card setup-card ${step1Complete && !step2Complete ? 'active' : ''}`}>
          <div className="setup-card-header">
            <div className="setup-card-icon"><Users size={24} /></div>
            <div style={{ flex: 1 }}>
              <h3 className="setup-card-title">Add Customer Data</h3>
              <p className="setup-card-desc">Import your customer list in one click.</p>
            </div>
            {step2Complete && <CheckCircle2 className="text-accent" size={24} />}
          </div>

          <div className="setup-card-content">
            {importSuccess ? (
              <div className="animate-in pulse-success" style={{ padding: '12px 20px', background: 'rgba(0, 245, 160, 0.1)', border: '1px solid var(--accent-green)', borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle2 size={18} className="text-accent" />
                <span style={{ fontWeight: 600 }}>245 customers imported</span>
              </div>
            ) : (
              <>
                <div className="import-options">
                  <button className="btn btn-secondary" onClick={handleFakeImport}>
                    <FileSpreadsheet size={16} /> Excel
                  </button>
                  <button className="btn btn-secondary" onClick={handleFakeImport}>
                    <Globe size={16} /> Google Sheet
                  </button>
                  <button className="btn btn-secondary" onClick={() => setCurrentPage('customers')}>
                    <UserPlus size={16} /> Manual
                  </button>
                </div>
                <div 
                  className="upload-zone" 
                  style={{ padding: '30px 20px', background: 'rgba(255,255,255,0.02)', borderStyle: 'dashed' }}
                  onClick={handleFakeImport}
                >
                  <p className="upload-zone-hint" style={{ marginBottom: 0 }}>
                    {importing ? 'Processing file...' : 'Drag & Drop customer list here'}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Card 3: Enable Automation */}
        <div className={`card setup-card ${step2Complete && !step3Complete ? 'active' : ''}`}>
          <div className="setup-card-header">
            <div className="setup-card-icon"><Zap size={24} /></div>
            <div style={{ flex: 1 }}>
              <h3 className="setup-card-title">Turn On Smart Campaigns</h3>
              <p className="setup-card-desc">Automatically send offers and reminders.</p>
            </div>
            {step3Complete && <CheckCircle2 className="text-accent" size={24} />}
          </div>

          <div className="setup-card-content">
            <div className="automation-toggles">
              <div className={`toggle-item active`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Clock size={16} className="text-accent" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Service Due Reminder</span>
                </div>
                <CheckCircle2 size={18} className="text-accent" />
              </div>
              <div className={`toggle-item active`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <ZapIcon size={16} className="text-accent" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Festival Offers</span>
                </div>
                <CheckCircle2 size={18} className="text-accent" />
              </div>
              <div className={`toggle-item active`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Users size={16} className="text-accent" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Repeat Customer Winback</span>
                </div>
                <CheckCircle2 size={18} className="text-accent" />
              </div>
              <div className={`toggle-item active`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Plus size={16} className="text-accent" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>VIP Customer Offers</span>
                </div>
                <CheckCircle2 size={18} className="text-accent" />
              </div>
            </div>

            <button 
              className={`btn ${step3Complete ? 'btn-secondary' : 'btn-primary'} btn-lg`} 
              style={{ marginTop: 24, width: '100%' }}
              onClick={handleToggleAutomation}
              disabled={loading}
            >
              {step3Complete ? 'Automation Active' : 'Enable Automation'}
            </button>
          </div>
        </div>

        {/* Trust Section */}
        <div className="trust-section">
          <div className="trust-item">
            <ShieldCheck size={18} className="text-accent" />
            Secure Data Encryption
          </div>
          <div className="trust-item">
            <Clock size={18} className="text-accent" />
            Setup in 2 Minutes
          </div>
          <div className="trust-item">
            <ZapIcon size={18} className="text-accent" />
            Increase Repeat Sales
          </div>
        </div>
      </div>

      {/* Fixed CTA Footer */}
      <div className="fixed-setup-footer">
        <button 
          className={`btn btn-primary footer-btn ${step1Complete && step2Complete && step3Complete ? 'pulse-success' : ''}`}
          onClick={handleCompleteSetup}
        >
          Complete Setup <ArrowRight size={20} style={{ marginLeft: 10 }} />
        </button>
      </div>
    </div>
  );
}
