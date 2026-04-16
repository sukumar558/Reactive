import { useState } from 'react';
import { useApp } from '../App';
import { supabase } from '../supabaseClient';
import { analyzeCustomer } from '../utils/triggerLogic';
import { Search, Trash2, Edit, Phone } from 'lucide-react';

export default function CustomerList() {
  const { customers, loadCustomers, addToast } = useApp();
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.item.toLowerCase().includes(search.toLowerCase())
  );

  async function handleDelete(id, name) {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    const { error } = await supabase.from('ra_customers').delete().eq('id', id);
    if (error) {
      addToast('Delete failed: ' + error.message, 'error');
    } else {
      addToast(`${name} deleted`, 'info');
      loadCustomers();
    }
  }

  function startEdit(customer) {
    setEditingId(customer.id);
    setEditForm({ name: customer.name, phone: customer.phone, item: customer.item, purchase_date: customer.purchase_date, notes: customer.notes || '' });
  }

  async function saveEdit() {
    const { error } = await supabase.from('ra_customers').update(editForm).eq('id', editingId);
    if (error) {
      addToast('Update failed: ' + error.message, 'error');
    } else {
      addToast('Customer updated ✅', 'success');
      setEditingId(null);
      loadCustomers();
    }
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">Customers</h1>
        <p className="page-subtitle">{customers.length} total customers in your database</p>
      </div>

      <div className="toolbar">
        <div className="search-input">
          <Search size={16} />
          <input
            className="input"
            placeholder="Search by name, phone, or item..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Item</th>
                <th>Category</th>
                <th>Purchase Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const triggers = analyzeCustomer(c);
                const topTrigger = triggers[0];
                const isEditing = editingId === c.id;

                return (
                  <tr key={c.id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                      {isEditing ? (
                        <input className="input" style={{ padding: '4px 8px', fontSize: '0.82rem' }}
                          value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
                      ) : c.name}
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
                          value={editForm.item} onChange={e => setEditForm(p => ({ ...p, item: e.target.value }))} />
                      ) : c.item}
                    </td>
                    <td><span className="badge badge-blue">{c.category}</span></td>
                    <td>
                      {isEditing ? (
                        <input className="input" type="date" style={{ padding: '4px 8px', fontSize: '0.82rem' }}
                          value={editForm.purchase_date} onChange={e => setEditForm(p => ({ ...p, purchase_date: e.target.value }))} />
                      ) : new Date(c.purchase_date).toLocaleDateString('en-IN')}
                    </td>
                    <td>
                      {topTrigger ? (
                        <span className={`badge badge-${topTrigger.urgency.level === 'overdue' ? 'red' : topTrigger.urgency.level === 'due_soon' ? 'yellow' : 'green'}`}>
                          {topTrigger.urgency.emoji} {topTrigger.label}
                        </span>
                      ) : (
                        <span className="badge badge-gray">✓ OK</span>
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
