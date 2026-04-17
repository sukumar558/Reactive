import { useState, useCallback, useRef, useEffect } from "react";
import { useApp } from "../App";
import { supabase } from "../supabaseClient";
import { detectCategory } from "../utils/csvParser";
import { parseFile, detectMapping, deduplicateRows, parseDate, fetchRemoteData, parsePastedData } from "../utils/importParser";
import {
  Upload, FileText, Download, Plus, X, Folder, CheckCircle2,
  AlertCircle, Link, Copy, FileSpreadsheet, RefreshCw,
  Settings, Trash2, Pause, Play, Globe, Loader2
} from 'lucide-react';

const REQUIRED_FIELDS = ["name", "phone", "item", "purchase_date", "category", "payment_mode"];
const FIELD_COLORS = {
  name: "#00f5a0",
  phone: "#00d9ff",
  item: "#f59e0b",
  purchase_date: "#ec4899",
  category: "#7c3aed",
  payment_mode: "#10b981"
};

const CHUNK_SIZE = 2000; // Optimal chunk size for Supabase batching

export default function CustomerImport() {
  const { session, loadCustomers, addToast } = useApp();
  const [stage, setStage] = useState("sources"); // sources | upload | preview | result | processing
  const [activeTab, setActiveTab] = useState("file");

  const [sources, setSources] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [importStats, setImportStats] = useState({ total: 0, imported: 0, skipped: 0, duplicates: 0, invalid: 0 });
  const [rejectedRows, setRejectedRows] = useState([]);

  const [importing, setImporting] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [remoteUrl, setRemoteUrl] = useState("");
  const [sourceName, setSourceName] = useState("");

  const fileRef = useRef();

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    const { data, error } = await supabase.from('data_sources').select('*').order('created_at', { ascending: false });
    if (!error) setSources(data);
  };

  const handleDataLoad = async (data, existingMapping = null) => {
    try {
      setProcessing(true);
      addToast(`Analyzing ${data.length} rows...`, "info");

      // 1. Initial cleaning: remove completely empty rows
      // We do this in a way that doesn't freeze the UI
      const nonEmpty = data.filter(row => row && Object.values(row).some(v => v !== null && v !== undefined && v !== ""));

      // 2. Initial deduplication (exact row hash)
      const uniqueData = deduplicateRows(nonEmpty);
      const detected = existingMapping || detectMapping(uniqueData.slice(0, 500)); // Detect based on sample

      setRawRows(uniqueData);
      setMapping(detected);
      setStage("preview");

      const duplicateCount = nonEmpty.length - uniqueData.length;
      if (duplicateCount > 0) {
        addToast(`${duplicateCount} exact duplicates removed`, 'info');
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const connectSource = async () => {
    if (!remoteUrl || !sourceName) return addToast("Please fill all fields", "error");
    const { data: userData } = await supabase.auth.getUser();
    const type = remoteUrl.includes("docs.google.com") ? "google_sheets" : "direct_url";

    try {
      setProcessing(true);
      const data = await fetchRemoteData(remoteUrl);
      const detected = detectMapping(data.slice(0, 100));

      const { error } = await supabase.from('data_sources').insert({
        user_id: userData.user.id,
        source_name: sourceName,
        source_type: type,
        source_url: remoteUrl,
        mapping: detected,
        status: 'active'
      });

      if (error) throw error;
      handleDataLoad(data, detected);
      loadSources();
      setRemoteUrl("");
      setSourceName("");
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setProcessing(false);
    }
  };

  const syncNow = async (source) => {
    try {
      setProcessing(true);
      addToast(`Pulling latest data from ${source.source_name}...`, "info");
      const data = await fetchRemoteData(source.source_url);

      setRawRows(data);
      setMapping(source.mapping);
      setStage("preview");
      addToast("Data fetched. Please confirm the mapping to start syncing.", "success");
    } catch (err) {
      addToast(`Sync failed: ${err.message}`, "error");
    } finally {
      setProcessing(false);
    }
  };

  const runImport = async () => {
    try {
      setImporting(true);
      setProgress(0);
      setStage("processing");

      const { data: userData } = await supabase.auth.getUser();
      const valid = [];
      const rejected = [];
      const seen = new Set();
      let duplicates = 0;

      rawRows.forEach((row, i) => {
        // High-Speed Field Mapping
        const payload = {};
        Object.entries(mapping).forEach(([col, field]) => {
          if (field) payload[field] = (row[col] || "").toString().trim();
        });

        const d = parseDate(payload.purchase_date);
        const phone = (payload.phone || "").toString().replace(/\D/g, '');

        // Validation: Phone length check
        if (!phone || phone.length < 10) {
          rejected.push({ raw: row, reason: "Invalid Phone (min 10 digits)", rowIndex: i + 1 });
          return;
        }

        const uniqueKey =
          phone?.toString().replace(/\D/g, '') ||
          `${payload.name?.trim()}_${i}`;

        // Validation: Unique Key length check
        if (!uniqueKey || uniqueKey.length < 3) {
          rejected.push({ raw: row, reason: "Malformed Identity Key", rowIndex: i + 1 });
          return;
        }

        if (d && d.getFullYear() >= 2024 && payload.name) {
          if (seen.has(uniqueKey)) {
            duplicates++;
            return;
          }
          seen.add(uniqueKey);

          valid.push({
            user_id: userData.user.id,
            name: payload.name,
            phone: phone,
            item: payload.item || '',
            purchase_date: d.toISOString(),
            category: payload.category || detectCategory(payload.item || ''),
            payment_mode: payload.payment_mode || "Universal Ingestion",
          });
        } else {
          rejected.push({ raw: row, reason: "Invalid Date or Missing Info", rowIndex: i + 1 });
        }
      });

      if (valid.length === 0) {
        addToast("No valid rows found to import", "error");
        setStage("preview");
        return;
      }

      let successCount = 0;
      const totalChunks = Math.ceil(valid.length / CHUNK_SIZE);

      for (let i = 0; i < valid.length; i += CHUNK_SIZE) {
        const chunk = valid.slice(i, i + CHUNK_SIZE);
        const { data: inserted, error } = await supabase.from('customers').upsert(chunk, {
          onConflict: 'phone,item,purchase_date',
          ignoreDuplicates: true
        }).select('id');

        if (!error) successCount += (inserted?.length || 0);

        const currentChunkIndex = Math.floor(i / CHUNK_SIZE) + 1;
        setProgress(Math.round((currentChunkIndex / totalChunks) * 100));
      }

      setImportStats({
        total: rawRows.length,
        imported: successCount,
        skipped: rawRows.length - successCount,
        duplicates: duplicates + (valid.length - successCount),
        invalid: rejected.length
      });

      setRejectedRows(rejected);
      setStage("result");
      addToast(`${successCount} records imported successfully`, "success");
      loadCustomers();
    } catch (error) {
      console.error(error);
      addToast("Import failed. Check console for details.", "error");
    } finally {
      setProgress(100);
      setImporting(false);
    }
  };

  const reset = () => {
    setStage("sources");
    setRawRows([]);
    setMapping({});
    setImportStats({ total: 0, imported: 0, skipped: 0, duplicates: 0, invalid: 0 });
    setPastedText("");
    setRemoteUrl("");
    setSourceName("");
    if (fileRef.current) fileRef.current.value = "";
  };

  // ── Rendering ────────────────────────────────────────────────────────────

  if (stage === "processing") {
    return (
      <div className="card animate-in" style={{ textAlign: 'center', padding: '60px 20px', maxWidth: 600, margin: '40px auto' }}>
        <Loader2 className="animate-spin text-primary" size={48} style={{ margin: '0 auto 24px' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 8 }}>Ingesting Data...</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>Processing {rawRows.length} records. Please do not close this window.</p>

        <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'var(--primary-color)', transition: 'width 0.3s ease' }} />
        </div>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-color)' }}>{progress}% Complete</div>
      </div>
    );
  }

  if (stage === "sources") {
    return (
      <div className="animate-in">
        <div className="page-header">
          <h1 className="page-title">Enterprise Data Ingestion</h1>
          <p className="page-subtitle">Optimized for high-volume 100K+ record syncs.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 24 }}>
          <div className="card">
            <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <RefreshCw size={20} className="text-primary" /> Connected Sources
            </h3>

            {sources.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.5 }}>
                <Globe size={48} style={{ margin: '0 auto 16px' }} />
                <p>No active connections found.</p>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Source</th>
                      <th>Type</th>
                      <th>Last Sync</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sources.map(s => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 700 }}>{s.source_name}</td>
                        <td><span className="badge">{s.source_type.replace('_', ' ')}</span></td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {s.last_sync_at ? new Date(s.last_sync_at).toLocaleString() : 'Never'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn btn-icon" onClick={() => syncNow(s)} disabled={processing}>
                            <RefreshCw size={14} className={processing ? 'animate-spin' : ''} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <h3>New Sync Source</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 20 }}>Connect Google Sheets or OneDrive.</p>

            <input className="input" placeholder="Connection Name" style={{ marginBottom: 12 }} value={sourceName} onChange={e => setSourceName(e.target.value)} />
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <input className="input" style={{ paddingLeft: 36 }} placeholder="Public Shareable URL" value={remoteUrl} onChange={e => setRemoteUrl(e.target.value)} />
              <Link size={14} style={{ position: 'absolute', left: 12, top: 12, opacity: 0.5 }} />
            </div>

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={connectSource} disabled={processing}>
              {processing ? 'Connecting...' : 'Connect Source'}
            </button>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '24px 0' }} />

            <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setActiveTab('file')} disabled={processing}>
              <Upload size={14} /> One-time Upload
            </button>

            {activeTab === 'file' && (
              <div className="animate-in" style={{ marginTop: 12 }}>
                <input ref={fileRef} type="file" accept=".csv, .xlsx, .xls" style={{ display: "none" }}
                  onChange={(e) => e.target.files[0] && parseFile(e.target.files[0]).then(handleDataLoad)} />
                <button className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={() => fileRef.current?.click()}>Choose File</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (stage === "preview") {
    const headers = Object.keys(rawRows[0] || {});
    return (
      <div className="animate-in">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h3>Data Mapping & Preview</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{rawRows.length} total rows detected.</p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" onClick={reset}>Cancel</button>
              <button className="btn btn-primary" onClick={runImport}>Start Ingestion</button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
            {headers.slice(0, 10).map(h => (
              <div key={h} style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: mapping[h] ? '1px solid var(--primary-color)' : '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: 4 }}>{h}</div>
                <select className="input input-sm" value={mapping[h] || ""} onChange={e => setMapping(m => ({ ...m, [h]: e.target.value }))}>
                  <option value="">— Ignore —</option>
                  {REQUIRED_FIELDS.map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="table-container" style={{ maxHeight: 300 }}>
            <table>
              <thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>{rawRows.slice(0, 10).map((r, i) => <tr key={i}>{headers.map(h => <td key={h}>{r[h]}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (stage === "result") {
    return (
      <div className="card animate-in" style={{ textAlign: 'center', maxWidth: 600, margin: '40px auto' }}>
        <CheckCircle2 size={64} color="#00f5a0" style={{ margin: '0 auto 24px' }} />
        <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Ingestion Complete</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 40 }}>We've processed {importStats.total} records.</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 40 }}>
          <div className="card" style={{ background: 'rgba(0, 245, 160, 0.05)', borderColor: '#00f5a0' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#00f5a0' }}>{importStats.imported}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>IMPORTED</div>
          </div>
          <div className="card" style={{ background: 'rgba(245, 158, 11, 0.05)', borderColor: '#f59e0b' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b' }}>{importStats.duplicates}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>DUPLICATES</div>
          </div>
          <div className="card" style={{ background: 'rgba(239, 68, 68, 0.05)', borderColor: '#ef4444' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444' }}>{importStats.invalid}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>REJECTED</div>
          </div>
        </div>

        <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={reset}>Return to Dashboard</button>
      </div>
    );
  }
}
