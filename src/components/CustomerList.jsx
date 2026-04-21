import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../App';
import { supabase } from '../supabaseClient';
import { TRIGGER_RULES } from '../utils/triggerLogic';
import { Search, Trash2, Edit, Phone, Filter, Download, Crown } from 'lucide-react';

export default function CustomerList() {
  const { customers, loadCustomers, addToast, currentStore } = useApp();
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [filterTier, setFilterTier] = useState('all');
  const [filterCampaign, setFilterCampaign] = useState('all');
  const [aiTargets, setAiTargets] = useState([]);

  useEffect(() => {
    async function fetchAiTargets() {
      if (!currentStore) return;
      const { data } = await supabase
        .from('active_campaign_targets')
        .select('*')
        .eq('store_id', currentStore.id);
      setAiTargets(data || []);
    }
    fetchAiTargets();
  }, [currentStore]);

  // Pre-compute assignments for all customers using database data
  const enrichedCustomers = useMemo(() => {
    return customers.map(c => {
      const target = aiTargets.find(t => t.customer_id === c.id);
      const rule = TRIGGER_RULES.find(r => r.type === target?.trigger_code);
      
      return {
        ...c,
        item_name: target?.last_item || c.item_name || '—',
        brand: target?.brand || c.brand || '—',
        _campaign: rule || null,
        _reason: target ? `Qualified for ${rule?.label}` : 'Did not meet criteria',
        _metrics: {
          total_spend: target?.total_lifetime_spend || 0,
          purchase_count: target?.purchase_count || 0
        },
        _tier: (target?.total_lifetime_spend > 50000) ? 'platinum' : (target?.total_lifetime_spend > 20000) ? 'gold' : 'standard'
      };
    });
  }, [customers, aiTargets]);


  const filtered = useMemo(() => {
    let list = enrichedCustomers;

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.item_name?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q) ||
        c.address?.toLowerCase().includes(q) ||
        c.brand?.toLowerCase().includes(q)
      );
    }

    // Tier filter
    if (filterTier !== 'all') {
      list = list.filter(c => c._tier === filterTier);
    }

    // Campaign filter
    if (filterCampaign === 'assigned') {
      list = list.filter(c => c._campaign !== null);
    } else if (filterCampaign === 'unassigned') {
      list = list.filter(c => c._campaign === null);
    } else if (filterCampaign !== 'all') {
      list = list.filter(c => c._campaign?.type === filterCampaign);
    }

    return list;
  }, [enrichedCustomers, search, filterTier, filterCampaign]);

  // Get unique campaign types for filter
  const uniqueCampaigns = useMemo(() => {
    const types = new Set();
    aiTargets.forEach(t => { if (t.trigger_code) types.add(t.trigger_code); });
    return [...types];
  }, [aiTargets]);


  async function handleDelete(id, name) {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) {
      addToast('Delete failed: ' + error.message, 'error');
    } else {
      addToast(`${name} deleted`, 'info');
      loadCustomers();
    }
  }

  function startEdit(customer) {
    setEditingId(customer.id);
    setEditForm({
      name: customer.name, phone: customer.phone,
      item_name: customer.item_name, purchase_date: customer.purchase_date,
      brand: customer.brand || '', city: customer.city || '',
      address: customer.address || '', dob: customer.dob || '',
      email: customer.email || '', purchase_amount: customer.purchase_amount || ''
    });
  }

  async function saveEdit() {
    const { error } = await supabase.from('customers').update(editForm).eq('id', editingId);
    if (error) {
      addToast('Update failed: ' + error.message, 'error');
    } else {
      addToast('Customer updated ✅', 'success');
      setEditingId(null);
      loadCustomers();
    }
  }

  const tierColors = {
    platinum: { bg: 'rgba(217,70,239,0.15)', color: '#d946ef', label: '💎 PLATINUM' },
    gold: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', label: '🥇 GOLD' },
    silver: { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8', label: '🥈 SILVER' },
    standard: { bg: 'rgba(107,114,128,0.1)', color: '#6b7280', label: 'STANDARD' }
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">👥 Customers</h1>
        <p className="page-subtitle">{customers.length} total • {filtered.length} shown • AI-assigned campaigns</p>
      </div>

      <div className="toolbar" style={{ flexWrap: 'wrap', gap: 8 }}>
        <div className="search-input" style={{ flex: 1, minWidth: 200 }}>
          <Search size={16} />
          <input
            className="input"
            placeholder="Search name, phone, item, brand, city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input" style={{ width: 140, fontSize: '0.75rem' }} value={filterTier} onChange={e => setFilterTier(e.target.value)}>
          <option value="all">All Tiers</option>
          <option value="platinum">💎 Platinum</option>
          <option value="gold">🥇 Gold</option>
          <option value="silver">🥈 Silver</option>
          <option value="standard">Standard</option>
        </select>
        <select className="input" style={{ width: 160, fontSize: '0.75rem' }} value={filterCampaign} onChange={e => setFilterCampaign(e.target.value)}>
          <option value="all">All Campaigns</option>
          <option value="assigned">✅ Assigned</option>
          <option value="unassigned">⬜ Unassigned</option>
          {uniqueCampaigns.map(t => (
            <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {filtered.length > 0 ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Item</th>
                <th>Brand</th>
                <th>Spend</th>
                <th>Tier</th>
                <th>AI Campaign</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map(c => {
                const isEditing = editingId === c.id;
                const tier = tierColors[c._tier] || tierColors.standard;

                return (
                  <tr key={c.id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                      {isEditing ? (
                        <input className="input" style={{ padding: '4px 8px', fontSize: '0.82rem' }}
                          value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
                      ) : (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {c.name}
                            {c._tier === 'platinum' && <Crown size={12} color="#d946ef" style={{ marginLeft: 4 }} />}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', gap: 8, marginTop: 2 }}>
                            {c.city && <span>📍 {c.city}</span>}
                            {c.address && <span style={{ opacity: 0.7 }}>• {c.address}</span>}
                            {c.dob && <span>🎂 {new Date(c.dob).toLocaleDateString()}</span>}
                          </div>
                        </>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input className="input" style={{ padding: '4px 8px', fontSize: '0.82rem' }}
                          value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} />
                      ) : c.phone}
                    </td>
                    <td>
                      {isEditing ? (
                        <input className="input" style={{ padding: '4px 8px', fontSize: '0.82rem' }}
                          value={editForm.item_name} onChange={e => setEditForm(p => ({ ...p, item_name: e.target.value }))} />
                      ) : c.item_name}
                    </td>
                    <td style={{ fontSize: '0.75rem' }}>{c.brand || '—'}</td>
                    <td style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                      {c._metrics?.total_spend > 0 ? `₹${c._metrics.total_spend.toLocaleString()}` : '—'}
                    </td>
                    <td>
                      <span style={{
                        fontSize: '0.6rem', padding: '2px 6px', borderRadius: 4,
                        background: tier.bg, color: tier.color, fontWeight: 600
                      }}>
                        {tier.label}
                      </span>
                    </td>
                    <td>
                      {c._campaign ? (
                        <div>
                          <span style={{
                            fontSize: '0.7rem', padding: '2px 6px', borderRadius: 4,
                            background: `${c._campaign.color}20`, color: c._campaign.color, fontWeight: 600
                          }}>
                            {c._campaign.icon} {c._campaign.label}
                          </span>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2, maxWidth: 180 }}>
                            {c._reason}
                          </div>
                        </div>
                      ) : (
                        <span className="badge badge-gray">No campaign</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {isEditing ? (
                          <>
                            <button className="btn btn-success btn-sm" onClick={saveEdit}>Save</button>
                            <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <button className="btn btn-icon btn-secondary" title="Edit" onClick={() => startEdit(c)}>
                              <Edit size={14} />
                            </button>
                            <button className="btn btn-icon btn-danger" title="Delete" onClick={() => handleDelete(c.id, c.name)}>
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length > 100 && (
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
              Showing 100 of {filtered.length} customers
            </p>
          )}
        </div>
      ) : (
        <div className="card empty-state">
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-text">{search ? 'No customers match your search' : 'No customers yet'}</div>
          <div className="empty-state-hint">{search ? 'Try a different search term' : 'Import customers to get started'}</div>
        </div>
      )}
    </div>
  );
}
