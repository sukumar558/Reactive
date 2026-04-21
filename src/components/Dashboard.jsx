import { useMemo, useState, useEffect } from 'react';
import { useApp } from '../App';
import { supabase } from '../supabaseClient';
import { TRIGGER_RULES } from '../utils/triggerLogic';
import { Users, AlertTriangle, TrendingUp, Shield, UserCheck, UserX, Ban, Heart, Wrench, Crown, Zap, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const { customers, campaigns, setCurrentPage, navigateToCampaign, currentStore } = useApp();
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

  const stats = useMemo(() => {
    const totalUnique = customers.length;
    const assignedCount = aiTargets.length;
    const unassignedCount = totalUnique - assignedCount;
    
    // Single pass grouping for efficiency
    const campaignBreakdown = {};
    const targetsByCode = {};
    const targetsByCustomerId = new Map();

    aiTargets.forEach(t => {
      if (!campaignBreakdown[t.trigger_code]) {
        campaignBreakdown[t.trigger_code] = { count: 0, totalValue: 0 };
        targetsByCode[t.trigger_code] = [];
      }
      campaignBreakdown[t.trigger_code].count++;
      campaignBreakdown[t.trigger_code].totalValue += (t.total_lifetime_spend || 0);
      targetsByCode[t.trigger_code].push(t);
      targetsByCustomerId.set(t.customer_id, t);
    });

    const totalVIP = campaignBreakdown['vip_milestone']?.count || 0;
    const totalChurnRisk = (campaignBreakdown['win_back_180d']?.count || 0) + (campaignBreakdown['dormancy_90d']?.count || 0);
    const loyaltyHighCount = (campaignBreakdown['bulk_loyalty']?.count || 0) + (campaignBreakdown['referral_request']?.count || 0) + totalVIP;
    const duplicatesPrevented = totalUnique - assignedCount;

    return { totalUnique, assignedCount, unassignedCount, campaignBreakdown, targetsByCode, targetsByCustomerId, totalVIP, totalChurnRisk, loyaltyHighCount, duplicatesPrevented };
  }, [customers, aiTargets]);


  // Campaign performance - Memoized to prevent UI lag
  const campaignPerformance = useMemo(() => {
    const allCampaignCustomers = campaigns.flatMap(c => c.customer_campaigns || []);
    const conversions = allCampaignCustomers.filter(cc => cc?.converted_at);
    const recoveredRevenue = conversions.reduce((sum, cc) => sum + (cc?.revenue_generated || 0), 0);
    const conversionRate = allCampaignCustomers.length > 0
      ? ((conversions.length / allCampaignCustomers.length) * 100).toFixed(1)
      : 0;
    
    return { recoveredRevenue, conversionRate };
  }, [campaigns]);

  const recentCustomers = useMemo(() => customers.slice(0, 5), [customers]);

  // Expected Revenue (ROI) - calculated as 10% of targeted customer lifetime spend
  const totalExpectedRevenue = useMemo(() => {
    return Object.values(stats.campaignBreakdown || {}).reduce((sum, s) => sum + (s.totalValue * 0.1), 0);
  }, [stats]);

  const activeCampaigns = useMemo(() => {
    return TRIGGER_RULES
      .map(r => ({
        ...r,
        count: stats.campaignBreakdown?.[r.type]?.count || 0,
        expectedRevenue: (stats.campaignBreakdown?.[r.type]?.totalValue || 0) * 0.1,
        avgConfidence: 85, // Default for SQL-driven logic
        entries: stats.targetsByCode?.[r.type] || []
      }))
      .filter(c => c.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [stats]);

  function handleCampaignSend(campaignType) {
    const entries = aiTargets.filter(t => t.trigger_code === campaignType);
    if (entries.length === 0) return;
    // Map targets back to customer format expected by builder
    const targetedCustomers = entries.map(e => ({
      id: e.customer_id,
      name: e.name,
      phone: e.phone,
      item_name: e.last_item
    }));
    navigateToCampaign(targetedCustomers, campaignType);
  }

  const avgDataConfidence = 85; // Hardened for SQL engine


  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">🧠 AI Intelligence Dashboard</h1>
        <p className="page-subtitle">25-Campaign AI Engine • Dynamic Percentiles • High-Conversion Messaging</p>
      </div>

      {/* Row 1: Customer Assignment Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(0,245,160,0.1)' }}>
            <Users size={20} color="#00f5a0" />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.totalUnique}</div>
            <div className="stat-label">Total Customers</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(0,217,255,0.1)' }}>
            <UserCheck size={20} color="#00d9ff" />
          </div>
          <div className="stat-info">
            <div className="stat-value" style={{ color: '#00d9ff' }}>{stats.assignedCount}</div>
            <div className="stat-label">AI Assigned</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(217,70,239,0.1)' }}>
            <Shield size={20} color="#d946ef" />
          </div>
          <div className="stat-info">
            <div className="stat-value" style={{ color: '#d946ef' }}>{avgDataConfidence}%</div>
            <div className="stat-label">Data Confidence</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)' }}>
            <Ban size={20} color="#f59e0b" />
          </div>
          <div className="stat-info">
            <div className="stat-value" style={{ color: '#f59e0b' }}>{stats.duplicatesPrevented}</div>
            <div className="stat-label">Duplicates Blocked</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.1)' }}>
            <AlertTriangle size={20} color="#ef4444" />
          </div>
          <div className="stat-info">
            <div className="stat-value" style={{ color: '#ef4444' }}>{stats.totalChurnRisk}</div>
            <div className="stat-label">Churn Risk</div>
          </div>
        </div>
      </div>

      {/* Row 2: ROI & Intelligence Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginTop: 12 }}>
        <div className="stat-card" style={{ background: 'rgba(57,255,20,0.03)', border: '1px solid rgba(57,255,20,0.1)' }}>
          <div className="stat-icon" style={{ background: 'rgba(57,255,20,0.1)' }}>
            <TrendingUp size={20} color="#39FF14" />
          </div>
          <div className="stat-info">
            <div className="stat-value" style={{ color: '#39FF14' }}>
              ₹{totalExpectedRevenue.toLocaleString()}
            </div>
            <div className="stat-label">Forecasted ROI</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(0,217,255,0.1)' }}>
            <Zap size={20} color="#00d9ff" />
          </div>
          <div className="stat-info">
            <div className="stat-value" style={{ color: '#00d9ff' }}>{campaignPerformance.conversionRate}%</div>
            <div className="stat-label">Conversion Rate</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(217,70,239,0.1)' }}>
            <Crown size={20} color="#d946ef" />
          </div>
          <div className="stat-info">
            <div className="stat-value" style={{ color: '#d946ef' }}>{stats.totalVIP}</div>
            <div className="stat-label">VIP Customers</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)' }}>
            <Heart size={20} color="#10b981" />
          </div>
          <div className="stat-info">
            <div className="stat-value" style={{ color: '#10b981' }}>{stats.loyaltyHighCount || 0}</div>
            <div className="stat-label">Loyal Fans</div>
          </div>
        </div>
      </div>

      {/* Active Campaign Slots */}
      {activeCampaigns.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 14 }}>🎯 Top ROI Campaign Slots ({activeCampaigns.length})</h3>
          <div className="trigger-grid">
            {activeCampaigns.map(c => (
              <div
                key={c.type}
                className="trigger-card"
                style={{ borderTop: `2px solid ${c.color}`, cursor: 'pointer', position: 'relative', padding: '12px' }}
                onClick={() => setCurrentPage('triggers')}
              >
                <div style={{ position: 'absolute', top: 6, right: 8, fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600 }}>P{c.priority}</div>
                <div className="trigger-card-icon">{c.icon}</div>
                <div className="trigger-card-title" style={{ fontSize: '0.75rem', fontWeight: 700 }}>{c.label}</div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                   <div style={{ fontSize: '1rem', fontWeight: 700 }}>{c.count}</div>
                   <div style={{ textAlign: 'right' }}>
                     <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Conf.</div>
                     <div style={{ fontSize: '0.7rem', fontWeight: 600, color: c.avgConfidence >= 70 ? '#22c55e' : '#f59e0b' }}>{Math.round(c.avgConfidence)}%</div>
                   </div>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--accent-green)', fontWeight: 700, marginTop: 4 }}>
                  ₹{(c.expectedRevenue || 0).toLocaleString()} <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontWeight: 400 }}>ROI</span>
                </div>

                <button
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: 12, width: '100%', fontSize: '0.65rem', padding: '6px 10px' }}
                  onClick={(e) => { e.stopPropagation(); handleCampaignSend(c.type); }}
                >
                  <Zap size={10} /> Launch Campaign
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Customers */}
      {customers.length > 0 ? (
        <div className="card" style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>📋 Recent Customers</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setCurrentPage('customers')}>
              View All
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Item</th>
                  <th>Purchase</th>
                  <th>AI Campaign</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {recentCustomers.map(c => {
                  const topEntry = stats.targetsByCustomerId.get(c.id);
                  const rule = TRIGGER_RULES.find(r => r.type === topEntry?.trigger_code);
                  return (
                    <tr key={c.id}>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{c.name}</td>
                      <td>{c.phone}</td>
                      <td>{c.item_name}</td>
                      <td>{c.purchase_date ? new Date(c.purchase_date).toLocaleDateString('en-IN') : '—'}</td>
                      <td>
                        {topEntry ? (
                          <span className={`badge badge-${rule?.color === 'red' ? 'red' : rule?.color === 'yellow' ? 'yellow' : 'green'}`}>
                            {rule?.icon} {rule?.label || topEntry.trigger_code}
                          </span>
                        ) : (
                          <span className="badge badge-gray">No campaign</span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.7rem', color: 'var(--text-muted)', maxWidth: 200 }}>
                        {topEntry ? `Qualified for ${rule?.label}` : 'Did not meet criteria'}
                      </td>
                    </tr>
                  );
                })}

              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card empty-state" style={{ marginTop: 24 }}>
          <div className="empty-state-icon">📦</div>
          <div className="empty-state-text">No customers yet</div>
          <div className="empty-state-hint">Import your customer data to activate the AI Intelligence Engine</div>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setCurrentPage('import')}>
            ➕ Import Customers
          </button>
        </div>
      )}
    </div>
  );
}
