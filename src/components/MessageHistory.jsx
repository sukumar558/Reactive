import { useState, useEffect } from 'react';
import { useApp } from '../App';
import { supabase } from '../supabaseClient';
import { getWhatsAppLink } from '../utils/messageTemplates';
import { Clock, ExternalLink, RotateCcw, Trash2 } from 'lucide-react';

export default function MessageHistory() {
  const { session, campaigns, loadCampaigns, addToast } = useApp();
  const [expandedId, setExpandedId] = useState(null);
  const [campaignDetails, setCampaignDetails] = useState({});

  async function loadCampaignCustomers(campaignId) {
    if (campaignDetails[campaignId]) {
      setExpandedId(expandedId === campaignId ? null : campaignId);
      return;
    }

    const { data, error } = await supabase
      .from('ra_campaign_customers')
      .select('*, ra_customers(*)')
      .eq('campaign_id', campaignId);

    if (!error && data) {
      setCampaignDetails(prev => ({ ...prev, [campaignId]: data }));
      setExpandedId(campaignId);
    }
  }

  async function deleteCampaign(id) {
    if (!confirm('Delete this campaign? This cannot be undone.')) return;
    const { error } = await supabase.from('ra_campaigns').delete().eq('id', id);
    if (error) {
      addToast('Delete failed: ' + error.message, 'error');
    } else {
      addToast('Campaign deleted', 'info');
      loadCampaigns();
    }
  }

  function resendMessage(phone, message) {
    const link = getWhatsAppLink(phone, message);
    window.open(link, '_blank');
    addToast('WhatsApp opened for resend', 'success');
  }

  async function markConverted(id, campaignId) {
    const value = prompt("Enter Sale Value (₹):", "1000");
    if (!value) return;
    
    const { error } = await supabase
      .from('ra_campaign_customers')
      .update({ 
        is_converted: true, 
        sale_value: parseFloat(value) 
      })
      .eq('id', id);

    if (error) {
      addToast('Update failed: ' + error.message, 'error');
    } else {
      addToast('🎉 Sale tracked!', 'success');
      // Update local UI state
      setCampaignDetails(prev => {
        const details = [...(prev[campaignId] || [])];
        const idx = details.findIndex(cc => cc.id === id);
        if (idx !== -1) details[idx] = { ...details[idx], is_converted: true, sale_value: parseFloat(value) };
        return { ...prev, [campaignId]: details };
      });
    }
  }

  const triggerLabels = {
    service_reminder: '🔧 Service',
    service_due: '🛠️ Service Due',
    upgrade: '🚀 Upgrade',
    upsell: '🛍️ Upsell',
    warranty_expiry: '🛡️ Warranty',
    reactivation: '👋 Reactivation',
    vip_offer: '💎 VIP Offer',
    festival: '🎉 Festival',
    custom: '📝 Custom',
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">📋 Message History</h1>
        <p className="page-subtitle">{campaigns.length} campaigns sent</p>
      </div>

      {campaigns.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {campaigns.map(campaign => (
            <div key={campaign.id} className="card" style={{ cursor: 'pointer' }}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={() => loadCampaignCustomers(campaign.id)}
              >
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>{campaign.title}</h3>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="badge badge-blue">{triggerLabels[campaign.trigger_type] || campaign.trigger_type}</span>
                    <span className={`badge ${campaign.status === 'completed' ? 'badge-green' : 'badge-yellow'}`}>
                      {campaign.status}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} />
                      {campaign.sent_at ? new Date(campaign.sent_at).toLocaleString('en-IN') : 'Not sent'}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      📤 {campaign.sent_count}/{campaign.total_customers} sent
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-icon btn-danger" onClick={(e) => { e.stopPropagation(); deleteCampaign(campaign.id); }}>
                    <Trash2 size={14} />
                  </button>
                  <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>
                    {expandedId === campaign.id ? '▼' : '▶'}
                  </span>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === campaign.id && campaignDetails[campaign.id] && (
                <div style={{ marginTop: 16, borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                  {campaignDetails[campaign.id].map(cc => (
                    <div key={cc.id} style={{
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-glass)',
                      marginBottom: 8,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div>
                          <span style={{ fontWeight: 600 }}>{cc.ra_customers?.name || 'Unknown'}</span>
                          <span style={{ color: 'var(--text-muted)', marginLeft: 10, fontSize: '0.82rem' }}>
                            📱 {cc.ra_customers?.phone}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span className={`badge badge-${
                            cc.status === 'delivered' ? 'green' : 
                            cc.status === 'failed' || cc.status === 'permanent_failed' ? 'red' : 
                            cc.status === 'processing' || cc.status === 'sending' ? 'blue' :
                            cc.status === 'opted_out' ? 'gray' : 'yellow'
                          }`}>
                            {cc.status === 'pending' || cc.status === 'queued' ? '⏳ Queued' : 
                             cc.status === 'processing' || cc.status === 'sending' ? '⚡ Sending' :
                             cc.status === 'delivered' ? '✅ Delivered' :
                             cc.status === 'failed' || cc.status === 'permanent_failed' ? '❌ Failed' :
                             cc.status === 'opted_out' ? '🚫 Opted Out' : cc.status}
                          </span>
                          
                          {cc.is_converted ? (
                            <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              💰 Converted (₹{cc.sale_value})
                            </span>
                          ) : (
                            <button className="btn btn-sm btn-primary" onClick={() => markConverted(cc.id, campaign.id)}>
                              Track Sale
                            </button>
                          )}
                          <button className="btn btn-sm btn-secondary" style={{ padding: '4px 8px' }} 
                            onClick={() => resendMessage(cc.ra_customers?.phone, cc.personalized_message)}>
                            <RotateCcw size={12} />
                          </button>
                        </div>
                      </div>
                      <div className="message-preview" style={{ fontSize: '0.82rem', padding: 14 }}>
                        {cc.personalized_message}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card empty-state">
          <div className="empty-state-icon">📭</div>
          <div className="empty-state-text">No campaigns yet</div>
          <div className="empty-state-hint">Create your first campaign from the Smart Triggers page</div>
        </div>
      )}
    </div>
  );
}
