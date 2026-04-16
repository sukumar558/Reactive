import { useState } from 'react';
import { useApp } from '../App';
import { supabase } from '../supabaseClient';
import { Key, Smartphone, Info, Save, ToggleLeft, ToggleRight, TrendingUp, Zap } from 'lucide-react';

export default function Integrations() {
  const { profile, loadProfile, addToast, session } = useApp();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    whatsapp_cloud_token: '',
    whatsapp_phone_id: '',
    api_mode_enabled: false,
    avg_order_value: 1000,
    automation_active: false
  });

  // Sync state when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        whatsapp_cloud_token: profile.whatsapp_cloud_token || '',
        whatsapp_phone_id: profile.whatsapp_phone_id || '',
        api_mode_enabled: profile.api_mode_enabled || false,
        avg_order_value: profile.avg_order_value || 1000,
        automation_active: profile.automation_active || false
      });
    }
  }, [profile]);

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase
      .from('ra_profiles')
      .update(formData)
      .eq('id', session.user.id);

    if (error) {
       addToast('Update failed: ' + error.message, 'error');
    } else {
       addToast('Integration settings saved!', 'success');
       loadProfile();
    }
    setLoading(false);
  }

  return (
    <div className="animate-in">
       <div className="page-header">
        <h1 className="page-title">🔌 Integrations</h1>
        <p className="page-subtitle">Connect official WhatsApp Business API for automated bulk sending</p>
      </div>

      <div className="card-glass" style={{ maxWidth: '600px', margin: '0 auto', padding: 32 }}>
         <form onSubmit={handleSubmit}>
            <div className="input-group">
               <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                 <Key size={14} /> WhatsApp Cloud API Token
               </label>
               <input 
                 type="password" 
                 className="input" 
                 placeholder="EAAGz..."
                 value={formData.whatsapp_cloud_token}
                 onChange={e => setFormData({...formData, whatsapp_cloud_token: e.target.value})}
               />
               <p className="input-hint" style={{ marginTop: 6, fontSize: '0.75rem', opacity: 0.7 }}>
                 Generate this in your Meta App Dashboard (Permanent Token recommended)
               </p>
            </div>

            <div className="input-group" style={{ marginTop: 24 }}>
               <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                 <Smartphone size={14} /> Phone Number ID
               </label>
               <input 
                 type="text" 
                 className="input" 
                 placeholder="123456789..."
                 value={formData.whatsapp_phone_id}
                 onChange={e => setFormData({...formData, whatsapp_phone_id: e.target.value})}
               />
               <p className="input-hint" style={{ marginTop: 6, fontSize: '0.75rem', opacity: 0.7 }}>
                 Available in your Meta WhatsApp Configuration page
               </p>
            </div>

            <div className="input-group" style={{ marginTop: 24 }}>
               <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                 <TrendingUp size={14} /> Avg. Order Value (₹)
               </label>
               <input 
                 type="number" 
                 className="input" 
                 placeholder="1000"
                 value={formData.avg_order_value}
                 onChange={e => setFormData({...formData, avg_order_value: e.target.value})}
               />
               <p className="input-hint" style={{ marginTop: 6, fontSize: '0.75rem', opacity: 0.7 }}>
                 Used for revenue calculation: Revenue = Conversions × AOV
               </p>
            </div>

            <div className="input-group" style={{ marginTop: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)' }}>
               <div>
                  <label style={{ marginBottom: 4, display: 'block', fontWeight: 600 }}>Enable API Sending Mode</label>
                  <p className="input-hint" style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                    Automate campaigns via official API (Bypasses deep links)
                  </p>
               </div>
               <div 
                 onClick={() => setFormData({...formData, api_mode_enabled: !formData.api_mode_enabled})}
                 style={{ cursor: 'pointer', color: formData.api_mode_enabled ? 'var(--accent-green)' : 'var(--text-muted)' }}
               >
                 {formData.api_mode_enabled ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
               </div>
            </div>

            <div className="input-group" style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
               <div>
                  <label style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                    <Zap size={16} color="#10b981" /> Daily Automation (9 AM)
                  </label>
                  <p className="input-hint" style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                     Automatically send milestone messages every day.
                  </p>
               </div>
               <div 
                 onClick={() => setFormData({...formData, automation_active: !formData.automation_active})}
                 style={{ cursor: 'pointer', color: formData.automation_active ? 'var(--accent-green)' : 'var(--text-muted)' }}
               >
                 {formData.automation_active ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
               </div>
            </div>

            <div style={{ marginTop: 40 }}>
               <button type="submit" className="btn btn-primary btn-lg shine-effect" style={{ width: '100%' }} disabled={loading}>
                  {loading ? 'Saving...' : <><Save size={18} style={{ marginRight: 8 }} /> Save Credentials</>}
               </button>
            </div>
         </form>
      </div>

      <div className="card-glass" style={{ maxWidth: '600px', margin: '20px auto', padding: 24 }}>
         <h4 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem', marginBottom: 12 }}>
            <Info size={16} className="text-accent" /> Setup Instructions
         </h4>
         <ol style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', paddingLeft: 20, lineHeight: 1.8 }}>
            <li>Go to <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)' }}>Meta Developers Portal</a>.</li>
            <li>Create a new <b>Business App</b>.</li>
            <li>Add the <b>WhatsApp</b> product to your application.</li>
            <li>Under API Setup, copy your <b>Phone Number ID</b>.</li>
            <li>Create a <b>System User</b> under Business Settings to get a <b>Permanent Token</b>.</li>
            <li>Paste credentials here and toggle on <b>API Mode</b>!</li>
         </ol>
      </div>
    </div>
  );
}
