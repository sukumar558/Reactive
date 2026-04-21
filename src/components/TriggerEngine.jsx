import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../App';
import { supabase } from '../supabaseClient';
import { TRIGGER_RULES } from '../utils/triggerLogic';
import { Zap, Users, Send, Search, Filter, ArrowRight } from 'lucide-react';

export default function TriggerEngine() {
  const { customers, navigateToCampaign, addToast, currentStore } = useApp();
  const [selectedType, setSelectedType] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [aiTargets, setAiTargets] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchAiTargets() {
      if (!currentStore) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('active_campaign_targets')
          .select('*')
          .eq('store_id', currentStore.id);
        
        if (error) throw error;
        setAiTargets(data || []);
      } catch (err) {
        console.error('Error fetching AI targets:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAiTargets();
  }, [currentStore]);

  // Build campaign cards data using TRIGGER_RULES + Database Counts
  const campaignCards = useMemo(() => {
    const breakdown = {};
    aiTargets.forEach(t => {
      if (!breakdown[t.trigger_code]) breakdown[t.trigger_code] = [];
      breakdown[t.trigger_code].push(t);
    });

    return TRIGGER_RULES.map(c => {
      const entries = breakdown[c.type] || [];
      const totalValue = entries.reduce((sum, e) => sum + (e.total_lifetime_spend || 0), 0);
      return {
        ...c,
        count: entries.length,
        entries,
        expectedRevenue: totalValue * 0.1,
        avgConfidence: 85,
        matchedReason: entries.length > 0 ? `Qualified for ${c.label}` : c.description
      };
    });
  }, [aiTargets]);

  // Selected campaign entries
  const selectedEntries = useMemo(() => {
    if (!selectedType) return [];
    const entries = aiTargets.filter(t => t.trigger_code === selectedType);
    if (!searchQuery) return entries;
    const q = searchQuery.toLowerCase();
    return entries.filter(e =>
      e.name?.toLowerCase().includes(q) ||
      e.phone?.includes(q) ||
      e.last_item?.toLowerCase().includes(q)
    );
  }, [selectedType, aiTargets, searchQuery]);

  const selectedCampaign = TRIGGER_RULES.find(c => c.type === selectedType);

  function handleSendCampaign(type) {
    const entries = aiTargets.filter(t => t.trigger_code === type);
    if (entries.length === 0) {
      addToast('No customers in this campaign', 'error');
      return;
    }
    const targetedCustomers = entries.map(e => ({
      id: e.customer_id,
      name: e.name,
      phone: e.phone,
      item_name: e.last_item
    }));
    navigateToCampaign(targetedCustomers, type);
  }

  // Filter campaigns
  const filteredCampaigns = useMemo(() => {
    let list = campaignCards;
    if (filterPriority === 'active') list = list.filter(c => c.count > 0);
    if (filterPriority === 'high') list = list.filter(c => c.priority <= 10);
    if (filterPriority === 'medium') list = list.filter(c => c.priority > 10 && c.priority <= 20);
    if (filterPriority === 'low') list = list.filter(c => c.priority > 20);
    return list;
  }, [campaignCards, filterPriority]);

  const meta = useMemo(() => {
    const totalUnique = customers.length;
    const assignedCount = aiTargets.length;
    const totalVIP = aiTargets.filter(t => t.trigger_code === 'vip_milestone').length;
    const totalChurnRisk = aiTargets.filter(t => t.trigger_code === 'win_back_180d' || t.trigger_code === 'dormancy_90d').length;
    
    return {
      totalUnique,
      assignedCount,
      unassignedCount: totalUnique - assignedCount,
      totalVIP,
      totalChurnRisk
    };
  }, [customers, aiTargets]);



  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">🧠 AI Campaign Intelligence</h1>
        <p className="page-subtitle">25 Campaigns • Dynamic Thresholds • Percentile Analytics</p>
      </div>

      {/* Exclusive Mode Stats Bar */}
      <div className="card" style={{ padding: '14px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-green)', fontWeight: 700 }}>🔒 EXCLUSIVE MODE</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Percentile-Based Thresholds Active</span>
          </div>
          <div style={{ display: 'flex', gap: 20, fontSize: '0.75rem', marginLeft: 'auto' }}>
            <span>👥 Total: <b>{meta.totalUnique || 0}</b></span>
            <span style={{ color: '#00d9ff' }}>✅ Assigned: <b>{meta.assignedCount || 0}</b></span>
            <span style={{ color: '#6b7280' }}>⬜ Unassigned: <b>{meta.unassignedCount || 0}</b></span>
            <span style={{ color: '#d946ef' }}>👑 VIP: <b>{meta.totalVIP || 0}</b></span>
            <span style={{ color: '#ef4444' }}>⚠️ Churn: <b>{meta.totalChurnRisk || 0}</b></span>
          </div>
        </div>
      </div>



      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { value: 'all', label: 'All (25)' },
          { value: 'active', label: '🟢 Active' },
          { value: 'high', label: '🔴 P1-P10' },
          { value: 'medium', label: '🟡 P11-P20' },
          { value: 'low', label: '⚪ P21-P25' }
        ].map(f => (
          <button
            key={f.value}
            className={`btn btn-sm ${filterPriority === f.value ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.7rem', padding: '4px 12px' }}
            onClick={() => setFilterPriority(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Campaign Grid */}
      <div className="trigger-grid">
        {filteredCampaigns.map(c => (
          <div
            key={c.type}
            className={`trigger-card ${selectedType === c.type ? 'active' : ''}`}
            style={{ borderTop: `2px solid ${c.color}`, cursor: 'pointer', position: 'relative', padding: '12px' }}
            onClick={() => setSelectedType(selectedType === c.type ? null : c.type)}
          >
            <div style={{
              position: 'absolute', top: 4, right: 6,
              fontSize: '0.55rem', fontWeight: 700,
              color: c.priority <= 10 ? '#ef4444' : c.priority <= 20 ? '#f59e0b' : '#6b7280',
              background: c.priority <= 10 ? 'rgba(239,68,68,0.1)' : c.priority <= 20 ? 'rgba(245,158,11,0.1)' : 'rgba(107,114,128,0.1)',
              padding: '1px 5px', borderRadius: 4
            }}>
              P{c.priority}
            </div>
            <div className="trigger-card-icon">{c.icon}</div>
            <div className="trigger-card-title" style={{ fontSize: '0.75rem', fontWeight: 700 }}>{c.label}</div>
            
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4, minHeight: '1.6em', lineHeight: 1.2 }}>
              {c.matchedReason}
            </div>

            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Exp. Revenue</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-green)' }}>
                  ₹{c.expectedRevenue.toLocaleString()}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Confidence</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: c.avgConfidence >= 70 ? '#22c55e' : '#f59e0b' }}>
                  {Math.round(c.avgConfidence)}%
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
              <div className="trigger-card-count" style={{ color: c.count > 0 ? c.color : 'var(--text-muted)', fontSize: '1rem', margin: 0 }}>
                {c.count}
              </div>
              <button
                className="btn btn-primary btn-sm"
                style={{ flex: 1, fontSize: '0.6rem', padding: '4px 8px', opacity: c.count > 0 ? 1 : 0.4 }}
                disabled={c.count === 0}
                onClick={(e) => { e.stopPropagation(); handleSendCampaign(c.type); }}
              >
                <Send size={10} /> Send
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Campaign Detail */}
      {selectedType && selectedCampaign && (
        <div className="card" style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
                {selectedCampaign.icon} {selectedCampaign.label}
                <span style={{
                  fontSize: '0.65rem', marginLeft: 8, padding: '2px 8px',
                  background: `${selectedCampaign.color}20`, color: selectedCampaign.color,
                  borderRadius: 6, fontWeight: 600
                }}>
                  P{selectedCampaign.priority} • {selectedCampaign.emotion}
                </span>
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                {selectedCampaign.description}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 8, top: 8, color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: 28, fontSize: '0.75rem', height: 32 }}
                />
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleSendCampaign(selectedType)}
                disabled={selectedEntries.length === 0}
              >
                <Send size={14} /> Send Campaign ({selectedEntries.length})
              </button>
            </div>
          </div>

          {selectedEntries.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Item</th>
                    <th>Spend</th>
                    <th>Score</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedEntries.slice(0, 50).map((entry, i) => (
                    <tr key={entry.customer?.id || i}>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                        {entry.customer?.name || 'Unknown'}
                        {entry.metrics?.customer_tier !== 'standard' && (
                          <span style={{
                            fontSize: '0.55rem', marginLeft: 6, padding: '1px 5px',
                            borderRadius: 4, fontWeight: 600,
                            background: entry.metrics?.customer_tier === 'platinum' ? 'rgba(217,70,239,0.15)' :
                              entry.metrics?.customer_tier === 'gold' ? 'rgba(245,158,11,0.15)' : 'rgba(107,114,128,0.15)',
                            color: entry.metrics?.customer_tier === 'platinum' ? '#d946ef' :
                              entry.metrics?.customer_tier === 'gold' ? '#f59e0b' : '#94a3b8'
                          }}>
                            {entry.metrics?.customer_tier?.toUpperCase()}
                          </span>
                        )}
                      </td>
                      <td>{entry.customer?.phone || '—'}</td>
                      <td>{entry.customer?.item_name || '—'}</td>
                      <td>₹{(entry.metrics?.total_spend || 0).toLocaleString()}</td>
                      <td>
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 600,
                          color: entry.metrics?.expected_conversion_score >= 60 ? '#22c55e' :
                            entry.metrics?.expected_conversion_score >= 40 ? '#f59e0b' : '#ef4444'
                        }}>
                          {entry.metrics?.expected_conversion_score || 0}%
                        </span>
                      </td>
                      <td style={{ fontSize: '0.7rem', color: 'var(--text-muted)', maxWidth: 250 }}>
                        {entry.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {selectedEntries.length > 50 && (
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
                  Showing 50 of {selectedEntries.length} customers
                </p>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
              No customers qualify for this campaign
            </div>
          )}
        </div>
      )}
    </div>
  );
}
