import { useState, useMemo } from 'react';
import { useApp } from '../App';
import { supabase } from '../supabaseClient';
import { generateMessage, getWhatsAppLink } from '../utils/messageTemplates';
import { TRIGGER_RULES } from '../utils/triggerLogic';
import { Send, Check, X, Edit, RefreshCw, ExternalLink, Zap } from 'lucide-react';

export default function CampaignBuilder() {
  const {
    session, selectedCustomers, selectedTrigger, setSelectedCustomers,
    loadCampaigns, loadCustomers, addToast, setCurrentPage, customers, profile
  } = useApp();

  const [step, setStep] = useState(1); // 1: select, 2: preview, 3: done
  const [triggerType, setTriggerType] = useState(selectedTrigger || 'service_reminder');
  const [messages, setMessages] = useState([]);
  const [campaignTitle, setCampaignTitle] = useState('');
  const [sending, setSending] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);

  const [localSelected, setLocalSelected] = useState([]);

  // Sync with global selections
  useEffect(() => {
    if (selectedCustomers.length > 0) {
      setLocalSelected(selectedCustomers.map(c => c.id));
    }
  }, [selectedCustomers]);

  const activeCustomers = useMemo(() => {
    let list;
    if (selectedCustomers.length > 0) {
      list = selectedCustomers;
    } else {
      list = customers.filter(c => localSelected.includes(c.id));
    }
    // Deduplicate by customer id
    const seen = new Set();
    return list.filter(c => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
  }, [selectedCustomers, customers, localSelected]);

  function toggleCustomer(id) {
    setLocalSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function generateMessages() {
    const msgs = activeCustomers.map(customer => ({
      customer,
      message: generateMessage(customer, triggerType),
      status: 'pending',
      approved: true,
    }));
    setMessages(msgs);
    if (!campaignTitle) {
      const rule = TRIGGER_RULES.find(r => r.type === triggerType);
      setCampaignTitle(`${rule?.label || 'Campaign'} - ${new Date().toLocaleDateString('en-IN')}`);
    }
    setStep(2);
  }

  function regenerateMessage(idx) {
    setMessages(prev => {
      const updated = [...prev];
      updated[idx] = {
        ...updated[idx],
        message: generateMessage(updated[idx].customer, triggerType),
      };
      return updated;
    });
  }

  function updateMessage(idx, newMsg) {
    setMessages(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], message: newMsg };
      return updated;
    });
    setEditingIdx(null);
  }

  function toggleApproval(idx) {
    setMessages(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], approved: !updated[idx].approved };
      return updated;
    });
  }

  async function handleSend() {
    const approved = messages.filter(m => m.approved);
    if (approved.length === 0) {
      addToast('No messages approved', 'error');
      return;
    }

    setSending(true);

    try {
      // 1. Create campaign in DB
      const { data: campaign, error: campError } = await supabase
        .from('ra_campaigns')
        .insert({
          user_id: session.user.id,
          title: campaignTitle,
          trigger_type: triggerType,
          campaign_type: 'manual',
          message_template: approved[0]?.message?.substring(0, 200),
          status: 'completed',
          total_customers: approved.length,
          sent_count: approved.length,
          sent_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (campError) throw new Error(campError.message);

      // 2. Save campaign customers & history
      const campaignCustomers = approved.map(m => ({
        campaign_id: campaign.id,
        customer_id: m.customer.id,
        personalized_message: m.message,
        status: 'sent',
        sent_at: new Date().toISOString(),
      }));

      await supabase.from('ra_campaign_customers').insert(campaignCustomers);

      const historyRows = approved.map(m => ({
        user_id: session.user.id,
        customer_id: m.customer.id,
        campaign_id: campaign.id,
        message: m.message,
        trigger_type: triggerType,
        sent_at: new Date().toISOString(),
      }));

      await supabase.from('ra_message_history').insert(historyRows);

      // 3. Update customer last contact date
      const customerIds = approved.map(m => m.customer.id);
      await supabase
        .from('ra_customers')
        .update({ last_contact_date: new Date().toISOString() })
        .in('id', customerIds);

      // 4. Send Messages (API vs Manual)
      if (profile?.api_mode_enabled) {
        addToast('🚀 Sending via Official API...', 'info');
        
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-bulk-campaign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'x-campaign-id': campaign.id
          },
          body: JSON.stringify({
            messages: approved.map(m => ({
              phone: m.customer.phone,
              body: m.message
            }))
          })
        });

        if (!response.ok) throw new Error('Failed to send campaign');
        addToast(`✅ API Campaign completed!`, 'success');
      } else {
        // Open WhatsApp links with delay
        for (let i = 0; i < approved.length; i++) {
          const link = getWhatsAppLink(approved[i].customer.phone, approved[i].message);
          setTimeout(() => {
            window.open(link, '_blank');
          }, i * 2000);
        }
        addToast(`🎉 Opening ${approved.length} WhatsApp links...`, 'success');
      }

      setStep(3);
      loadCampaigns();
    } catch (error) {
      addToast('Error sending campaign: ' + error.message, 'error');
    } finally {
      setSending(false);
    }
  }

  const steps = [
    { num: 1, label: 'Select Customers' },
    { num: 2, label: 'Preview & Approve' },
    { num: 3, label: 'Sent!' },
  ];

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">📨 Campaign Builder</h1>
        <p className="page-subtitle">Create, preview, and send personalized WhatsApp messages</p>
      </div>

      {/* Step Indicator */}
      <div className="campaign-steps">
        {steps.map((s, i) => (
          <div key={s.num} style={{ display: 'flex', alignItems: 'center' }}>
            <div className={`campaign-step ${step === s.num ? 'active' : step > s.num ? 'completed' : ''}`}>
              <div className="step-number">{step > s.num ? '✓' : s.num}</div>
              {s.label}
            </div>
            {i < steps.length - 1 && <div className="step-connector" />}
          </div>
        ))}
      </div>

      {/* Step 1: Select Customers */}
      {step === 1 && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="input-group" style={{ flex: 1, minWidth: 200 }}>
              <label>Campaign Name</label>
              <input className="input" placeholder="e.g. AC Service Reminder April" value={campaignTitle}
                onChange={e => setCampaignTitle(e.target.value)} />
            </div>
            <div className="input-group" style={{ minWidth: 200 }}>
              <label>Trigger Type</label>
              <select className="input" value={triggerType} onChange={e => setTriggerType(e.target.value)}>
                {TRIGGER_RULES.map(r => (
                  <option key={r.type} value={r.type}>{r.icon} {r.label}</option>
                ))}
                <option value="custom">📝 Custom</option>
              </select>
            </div>
          </div>

          {activeCustomers.length > 0 ? (
            <>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                <Zap size={14} style={{ verticalAlign: -2 }} /> {activeCustomers.length} customers selected from Smart Triggers
              </p>
              {activeCustomers.slice(0, 10).map(c => (
                <div key={c.id} className="customer-check selected">
                  <input type="checkbox" checked readOnly />
                  <div className="customer-check-info">
                    <div className="customer-check-name">{c.name}</div>
                    <div className="customer-check-detail">{c.item} • {c.phone} • Purchased: {new Date(c.purchase_date).toLocaleDateString('en-IN')}</div>
                  </div>
                </div>
              ))}
              {activeCustomers.length > 10 && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 8 }}>
                  +{activeCustomers.length - 10} more customers
                </p>
              )}
            </>
          ) : (
            <>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                Select customers for this campaign ({localSelected.length} selected)
              </p>
              {customers.map(c => (
                <div
                  key={c.id}
                  className={`customer-check ${localSelected.includes(c.id) ? 'selected' : ''}`}
                  onClick={() => toggleCustomer(c.id)}
                >
                  <input type="checkbox" checked={localSelected.includes(c.id)} readOnly />
                  <div className="customer-check-info">
                    <div className="customer-check-name">{c.name}</div>
                    <div className="customer-check-detail">{c.item} • {c.phone}</div>
                  </div>
                </div>
              ))}
            </>
          )}

          <div style={{ marginTop: 24 }}>
            <button className="btn btn-primary btn-lg" onClick={generateMessages}
              disabled={activeCustomers.length === 0 && localSelected.length === 0}>
              <Zap size={18} /> Generate AI Messages →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Preview & Approve */}
      {step === 2 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Review and approve each message before sending. {messages.filter(m => m.approved).length}/{messages.length} approved.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-primary btn-lg" onClick={handleSend} disabled={sending}>
                {sending ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Sending...</> : (
                  <><Send size={16} /> Send {messages.filter(m => m.approved).length} Messages</>
                )}
              </button>
            </div>
          </div>

          {messages.map((msg, idx) => (
            <div key={`msg-${idx}`} className="card" style={{ marginBottom: 12, opacity: msg.approved ? 1 : 0.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <span style={{ fontWeight: 700 }}>{msg.customer.name}</span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: 10, fontSize: '0.82rem' }}>📱 {msg.customer.phone}</span>
                </div>
                <div className="approval-actions">
                  <button className={`btn btn-sm ${msg.approved ? 'btn-success' : 'btn-secondary'}`} onClick={() => toggleApproval(idx)}>
                    <Check size={14} /> {msg.approved ? 'Approved' : 'Approve'}
                  </button>
                  <button className="btn btn-sm btn-secondary" onClick={() => setEditingIdx(editingIdx === idx ? null : idx)}>
                    <Edit size={14} /> Edit
                  </button>
                  <button className="btn btn-sm btn-secondary" onClick={() => regenerateMessage(idx)} title="Regenerate message">
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>

              {editingIdx === idx ? (
                <div>
                  <textarea className="input" value={msg.message} style={{ minHeight: 100 }}
                    onChange={e => {
                      const val = e.target.value;
                      setMessages(prev => { const u = [...prev]; u[idx] = { ...u[idx], message: val }; return u; });
                    }} />
                  <button className="btn btn-success btn-sm" style={{ marginTop: 8 }} onClick={() => setEditingIdx(null)}>
                    ✓ Done Editing
                  </button>
                </div>
              ) : (
                <div className="message-preview">{msg.message}</div>
              )}

              <a href={getWhatsAppLink(msg.customer.phone, msg.message)} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: '0.78rem', color: 'var(--accent-green)', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, textDecoration: 'none' }}>
                <ExternalLink size={12} /> Preview WhatsApp Link
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Step 3: Complete */}
      {step === 3 && (
        <div className="card empty-state" style={{ padding: 60 }}>
          <div className="empty-state-icon">🎉</div>
          <div className="empty-state-text" style={{ fontSize: '1.2rem' }}>Campaign Sent Successfully!</div>
          <div className="empty-state-hint">WhatsApp tabs are opening for each customer</div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
            <button className="btn btn-primary" onClick={() => { setStep(1); setMessages([]); setSelectedCustomers([]); }}>
              🔄 New Campaign
            </button>
            <button className="btn btn-secondary" onClick={() => setCurrentPage('history')}>
              📋 View History
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
