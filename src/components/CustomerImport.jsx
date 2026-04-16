import { useState, useRef } from 'react';
import { useApp } from '../App';
import { supabase } from '../supabaseClient';
import { parseCSV, generateSampleCSV, detectCategory } from '../utils/csvParser';
import { Upload, FileText, Download, Plus, X } from 'lucide-react';

export default function CustomerImport() {
  const { session, loadCustomers, addToast, setCurrentPage } = useApp();
  const [dragOver, setDragOver] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [importing, setImporting] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualForm, setManualForm] = useState({ name: '', phone: '', item: '', purchase_date: '', notes: '' });
  const fileRef = useRef();

  async function handleFile(file) {
    if (!file) return;
    try {
      const result = await parseCSV(file);
      setParsedData(result);
      addToast(`Parsed ${result.validRows} of ${result.totalRows} rows`, 'success');
    } catch (err) {
      addToast('Error parsing CSV: ' + err.message, 'error');
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleFileInput(e) {
    const file = e.target.files[0];
    if (file) handleFile(file);
  }

  async function handleImport() {
    if (!parsedData?.customers.length) return;
    setImporting(true);

    const rows = parsedData.customers.map(c => ({
      ...c,
      user_id: session.user.id,
    }));

    const { error } = await supabase.from('ra_customers').insert(rows);

    if (error) {
      addToast('Import failed: ' + error.message, 'error');
    } else {
      addToast(`✅ ${rows.length} customers imported!`, 'success');
      setParsedData(null);
      loadCustomers();
    }

    setImporting(false);
  }

  async function handleManualAdd(e) {
    e.preventDefault();
    const { error } = await supabase.from('ra_customers').insert({
      ...manualForm,
      category: detectCategory(manualForm.item),
      user_id: session.user.id,
    });

    if (error) {
      addToast('Error: ' + error.message, 'error');
    } else {
      addToast(`✅ ${manualForm.name} added!`, 'success');
      setManualForm({ name: '', phone: '', item: '', purchase_date: '', notes: '' });
      loadCustomers();
    }
  }

  function downloadSample() {
    const csv = generateSampleCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_customers.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">Import Customers</h1>
        <p className="page-subtitle">Add your customers via CSV upload or manual entry</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button className="btn btn-secondary" onClick={downloadSample}>
          <Download size={16} /> Download Sample CSV
        </button>
        <button className="btn btn-primary" onClick={() => setShowManual(!showManual)}>
          <Plus size={16} /> {showManual ? 'Hide Form' : 'Add Manually'}
        </button>
      </div>

      {/* Manual Entry Form */}
      {showManual && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>➕ Add Single Customer</h3>
          <form onSubmit={handleManualAdd} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="input-group">
              <label>Customer Name *</label>
              <input className="input" placeholder="e.g. Ravi Kumar" required
                value={manualForm.name} onChange={e => setManualForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="input-group">
              <label>Phone Number *</label>
              <input className="input" placeholder="e.g. 9876543210" required
                value={manualForm.phone} onChange={e => setManualForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="input-group">
              <label>Product/Item *</label>
              <input className="input" placeholder="e.g. Split AC 1.5 Ton" required
                value={manualForm.item} onChange={e => setManualForm(p => ({ ...p, item: e.target.value }))} />
            </div>
            <div className="input-group">
              <label>Purchase Date *</label>
              <input className="input" type="date" required
                value={manualForm.purchase_date} onChange={e => setManualForm(p => ({ ...p, purchase_date: e.target.value }))} />
            </div>
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label>Notes (optional)</label>
              <input className="input" placeholder="Any additional notes..."
                value={manualForm.notes} onChange={e => setManualForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <button className="btn btn-primary" type="submit">✅ Add Customer</button>
            </div>
          </form>
        </div>
      )}

      {/* CSV Upload Zone */}
      {!parsedData && (
        <div
          className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" accept=".csv" hidden onChange={handleFileInput} />
          <div className="upload-zone-icon">📄</div>
          <div className="upload-zone-text">Drag & drop your CSV file here</div>
          <div className="upload-zone-hint">or click to browse • Supports: Name, Phone, Item, Purchase Date columns</div>
        </div>
      )}

      {/* CSV Preview */}
      {parsedData && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
                <FileText size={18} style={{ verticalAlign: -3, marginRight: 8 }} />
                Preview: {parsedData.validRows} customers found
              </h3>
              {parsedData.totalRows !== parsedData.validRows && (
                <p style={{ fontSize: '0.78rem', color: 'var(--accent-orange)', marginTop: 4 }}>
                  ⚠️ {parsedData.totalRows - parsedData.validRows} rows skipped (missing name or phone)
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setParsedData(null)}>
                <X size={14} /> Cancel
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleImport} disabled={importing}>
                {importing ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Importing...</> : <><Upload size={14} /> Import All</>}
              </button>
            </div>
          </div>

          <div className="table-container" style={{ maxHeight: 400, overflow: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Item</th>
                  <th>Purchase Date</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {parsedData.customers.slice(0, 50).map((c, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{c.name}</td>
                    <td>{c.phone}</td>
                    <td>{c.item}</td>
                    <td>{c.purchase_date}</td>
                    <td><span className="badge badge-blue">{c.category}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {parsedData.customers.length > 50 && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 12, fontSize: '0.82rem' }}>
              Showing first 50 of {parsedData.customers.length} rows
            </p>
          )}
        </div>
      )}
    </div>
  );
}
