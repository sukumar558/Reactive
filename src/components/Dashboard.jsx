import { useApp } from '../App';
import { analyzeAllCustomers, getDashboardStats } from '../utils/triggerLogic';
import { Users, AlertTriangle, TrendingUp, MessageSquare } from 'lucide-react';

export default function Dashboard() {
  const { customers, campaigns, setCurrentPage, navigateToCampaign, profile } = useApp();
  const triggerResults = analyzeAllCustomers(customers);
  const stats = getDashboardStats(triggerResults);

  // Calculate real performance stats from campaigns
  const allCampaignCustomers = campaigns.flatMap(c => c.ra_campaign_customers || []);
  const conversions = allCampaignCustomers.filter(cc => cc.is_converted);
  
  // New Formula: Revenue = conversions * avg_order_value
  const aov = profile?.avg_order_value || 1000;
  const recoveredRevenue = conversions.length * aov;
  
  const conversionRate = allCampaignCustomers.length > 0 
    ? ((conversions.length / allCampaignCustomers.length) * 100).toFixed(1)
    : 0;

  const recentCustomers = customers.slice(0, 5);

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back! Here's your customer engagement overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(0,245,160,0.1)' }}>
            <Users size={22} color="#00f5a0" />
          </div>
          <div className="stat-info">
            <div className="stat-value">{customers.length}</div>
            <div className="stat-label">Total Customers</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.1)' }}>
            <AlertTriangle size={22} color="#ef4444" />
          </div>
          <div className="stat-info">
            <div className="stat-value" style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', WebkitBackgroundClip: 'text' }}>
              {stats.totalOverdue}
            </div>
            <div className="stat-label">Action Needed</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(57,255,20,0.1)' }}>
            <div style={{ color: '#39FF14', fontWeight: 800, fontSize: '0.8rem' }}>₹</div>
          </div>
          <div className="stat-info">
            <div className="stat-value" style={{ color: '#39FF14' }}>
              ₹{recoveredRevenue.toLocaleString()}
            </div>
            <div className="stat-label">Recovered Revenue</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-value" style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', WebkitBackgroundClip: 'text' }}>
              {conversionRate}%
            </div>
            <div className="stat-label">Conversion Rate</div>
          </div>
          <div className="stat-icon" style={{ background: 'rgba(0,217,255,0.1)' }}>
            <TrendingUp size={22} color="#00d9ff" />
          </div>
        </div>
      </div>

      {/* Quick Action Trigger Cards */}
      <div style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 14 }}>🎯 Smart Opportunities</h3>
        <div className="trigger-grid">
          <div className="trigger-card" onClick={() => setCurrentPage('triggers')}
            style={{ borderTop: '2px solid #f59e0b' }}>
            <div className="trigger-card-icon">🔧</div>
            <div className="trigger-card-title">Service Due</div>
            <div className="trigger-card-desc">Customers needing service</div>
            <div className="trigger-card-count">{stats.serviceCount}</div>
          </div>

          <div className="trigger-card" onClick={() => setCurrentPage('triggers')}
            style={{ borderTop: '2px solid #06b6d4' }}>
            <div className="trigger-card-icon">🚀</div>
            <div className="trigger-card-title">Upgrade Ready</div>
            <div className="trigger-card-desc">1+ year old products</div>
            <div className="trigger-card-count">{stats.upgradeCount}</div>
          </div>

          <div className="trigger-card" onClick={() => setCurrentPage('triggers')}
            style={{ borderTop: '2px solid #8b5cf6' }}>
            <div className="trigger-card-icon">🛍️</div>
            <div className="trigger-card-title">Upsell</div>
            <div className="trigger-card-desc">Accessories opportunity</div>
            <div className="trigger-card-count">{stats.upsellCount}</div>
          </div>

          <div className="trigger-card" onClick={() => setCurrentPage('triggers')}
            style={{ borderTop: '2px solid #ef4444' }}>
            <div className="trigger-card-icon">🛡️</div>
            <div className="trigger-card-title">Warranty Expiry</div>
            <div className="trigger-card-desc">Extended warranty opportunity</div>
            <div className="trigger-card-count">{stats.warrantyCount}</div>
          </div>

          <div className="trigger-card" onClick={() => setCurrentPage('triggers')}
            style={{ borderTop: '2px solid #10b981' }}>
            <div className="trigger-card-icon">⭐</div>
            <div className="trigger-card-title">Feedback</div>
            <div className="trigger-card-desc">15-day review requests</div>
            <div className="trigger-card-count">{stats.feedbackCount}</div>
          </div>

          <div className="trigger-card" onClick={() => setCurrentPage('triggers')}
            style={{ borderTop: '2px solid #6366f1' }}>
            <div className="trigger-card-icon">👋</div>
            <div className="trigger-card-title">Reactivation</div>
            <div className="trigger-card-desc">Inactive for 1.5 years</div>
            <div className="trigger-card-count">{stats.reactivationCount}</div>
          </div>

          <div className="trigger-card" onClick={() => setCurrentPage('triggers')}
            style={{ borderTop: '2px solid #d946ef' }}>
            <div className="trigger-card-icon">💎</div>
            <div className="trigger-card-title">VIP Offer</div>
            <div className="trigger-card-desc">High value rewards</div>
            <div className="trigger-card-count">{stats.vipCount}</div>
          </div>
        </div>
      </div>

      {/* Recent Customers */}
      {customers.length > 0 ? (
        <div className="card">
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
                  <th>Purchase Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentCustomers.map(c => {
                  const triggers = analyzeAllCustomers([c]);
                  const topTrigger = triggers.all[0];
                  return (
                    <tr key={c.id}>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{c.name}</td>
                      <td>{c.phone}</td>
                      <td>{c.item}</td>
                      <td>{new Date(c.purchase_date).toLocaleDateString('en-IN')}</td>
                      <td>
                        {topTrigger ? (
                          <span className={`badge badge-${topTrigger.trigger.urgency.level === 'overdue' ? 'red' : topTrigger.trigger.urgency.level === 'due_soon' ? 'yellow' : 'green'}`}>
                            {topTrigger.trigger.urgency.emoji} {topTrigger.trigger.label}
                          </span>
                        ) : (
                          <span className="badge badge-gray">No action</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card empty-state">
          <div className="empty-state-icon">📦</div>
          <div className="empty-state-text">No customers yet</div>
          <div className="empty-state-hint">Import your customer data to get started</div>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setCurrentPage('import')}>
            ➕ Import Customers
          </button>
        </div>
      )}
    </div>
  );
}
