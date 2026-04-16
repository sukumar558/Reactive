import { useState, useMemo } from 'react';
import { useApp } from '../App';
import { analyzeAllCustomers, TRIGGER_RULES } from '../utils/triggerLogic';
import { Zap, ArrowRight } from 'lucide-react';

export default function TriggerEngine() {
  const { customers, navigateToCampaign, setCurrentPage, addToast } = useApp();
  const [selectedType, setSelectedType] = useState(null);

  const triggerResults = useMemo(() => analyzeAllCustomers(customers), [customers]);

  const activeResults = selectedType
    ? triggerResults[selectedType] || []
    : triggerResults.all;

  function handleStartCampaign() {
    if (activeResults.length === 0) {
      addToast('No customers to message', 'error');
      return;
    }
    const customerList = activeResults.map(r => r.customer);
    navigateToCampaign(customerList, selectedType || 'service_reminder');
  }

  if (customers.length === 0) {
    return (
      <div className="animate-in">
        <div className="page-header">
          <h1 className="page-title">⚡ Smart Triggers</h1>
          <p className="page-subtitle">Import customers first to see trigger opportunities</p>
        </div>
        <div className="card empty-state">
          <div className="empty-state-icon">⚡</div>
          <div className="empty-state-text">No customer data available</div>
          <div className="empty-state-hint">Import customers to activate the smart trigger engine</div>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setCurrentPage('import')}>
            ➕ Import Customers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">⚡ Smart Triggers</h1>
        <p className="page-subtitle">AI-powered customer engagement opportunities — click a category to filter</p>
      </div>

      {/* Trigger Type Cards */}
      <div className="trigger-grid">
        <div
          className={`trigger-card ${selectedType === null ? 'selected' : ''}`}
          onClick={() => setSelectedType(null)}
          style={{ borderTop: '2px solid var(--accent-green)' }}
        >
          <div className="trigger-card-icon">🎯</div>
          <div className="trigger-card-title">All Triggers</div>
          <div className="trigger-card-desc">Combined view</div>
          <div className="trigger-card-count">{triggerResults.all.length}</div>
        </div>

        {TRIGGER_RULES.map(rule => (
          <div
            key={rule.type}
            className={`trigger-card ${selectedType === rule.type ? 'selected' : ''}`}
            onClick={() => setSelectedType(rule.type)}
            style={{ borderTop: `2px solid ${rule.color}` }}
          >
            <div className="trigger-card-icon">{rule.icon}</div>
            <div className="trigger-card-title">{rule.label}</div>
            <div className="trigger-card-desc">{rule.description}</div>
            <div className="trigger-card-count">{(triggerResults[rule.type] || []).length}</div>
          </div>
        ))}
      </div>

      {/* Filtered Customer List */}
      {activeResults.length > 0 ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
              📋 {activeResults.length} customers need attention
            </h3>
            <button className="btn btn-primary" onClick={handleStartCampaign}>
              <Zap size={16} /> Create Campaign <ArrowRight size={16} />
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Item</th>
                  <th>Purchased</th>
                  <th>Trigger</th>
                  <th>Urgency</th>
                </tr>
              </thead>
              <tbody>
                {activeResults.map((entry, i) => (
                  <tr key={`${entry.customer.id}-${entry.trigger.type}-${i}`}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{entry.customer.name}</td>
                    <td>{entry.customer.phone}</td>
                    <td>{entry.customer.item}</td>
                    <td>{new Date(entry.customer.purchase_date).toLocaleDateString('en-IN')}</td>
                    <td>
                      <span className="badge badge-blue">
                        {entry.trigger.icon} {entry.trigger.label}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${
                        entry.trigger.urgency.level === 'overdue' ? 'red' :
                        entry.trigger.urgency.level === 'due_soon' ? 'yellow' : 'green'
                      }`}>
                        {entry.trigger.urgency.emoji} {entry.trigger.urgency.label}
                        {entry.trigger.daysRemaining <= 0
                          ? ` (${Math.abs(entry.trigger.daysRemaining)}d overdue)`
                          : ` (${entry.trigger.daysRemaining}d left)`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="card empty-state">
          <div className="empty-state-icon">🎉</div>
          <div className="empty-state-text">No pending triggers in this category!</div>
          <div className="empty-state-hint">All customers are up to date</div>
        </div>
      )}
    </div>
  );
}
