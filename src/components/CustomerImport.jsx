import { useState, useCallback, useRef, useEffect } from "react";
import { useApp } from "../App";
import { supabase } from "../supabaseClient";

import { parseFile, detectMapping, deduplicateRows, parseDate, normalizePhone, fetchRemoteData, parsePastedData, intelligentScan } from "../utils/importParser";
import {
  Upload, FileText, Download, Plus, X, Folder, CheckCircle2,
  AlertCircle, Link, Copy, FileSpreadsheet, RefreshCw,
  Settings, Trash2, Pause, Play, Globe, Loader2
} from 'lucide-react';

const REQUIRED_FIELDS = ["name", "phone", "item_name", "purchase_date", "email", "city", "brand", "category", "purchase_amount", "warranty_end_date"];
const FIELD_COLORS = {
  name: "#00f5a0",
  phone: "#00d9ff",
  item_name: "#f59e0b",
  purchase_date: "#ec4899",
  email: "#8b5cf6",
  city: "#06b6d4",
  brand: "#f43f5e",
  category: "#84cc16",
  purchase_amount: "#22c55e",
  warranty_end_date: "#ef4444",
  address: "#fb923c",
  dob: "#f472b6"
};

const CHUNK_SIZE = 500; // Smoother UI updates for large imports

export default function CustomerImport() {
  const { session, loadCustomers, addToast, currentStore } = useApp();

  const [stage, setStage] = useState("sources"); // sources | upload | preview | result | processing
  const [activeTab, setActiveTab] = useState("file");

  const [sources, setSources] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [importStats, setImportStats] = useState({ total: 0, newlyImported: 0, existingNewPurchases: 0, duplicates: 0, invalid: 0 });
  const [scanResults, setScanResults] = useState({ valid: [], rejected: [], confidence: 0 });
  const [rejectedRows, setRejectedRows] = useState([]);

  const [importing, setImporting] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [currentMapping, setCurrentMapping] = useState({});
  const [confirmedLowConfidence, setConfirmedLowConfidence] = useState(false);
  const [importStep, setImportStep] = useState(""); // START_IMPORT | FILE_PARSED | etc
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

      // 3. Intelligent Scan (Auto-mapping)
      const scan = intelligentScan(uniqueData);

      setRawRows(uniqueData);
      setScanResults(scan);
      setCurrentMapping(scan.resolvedMapping);
      setStage("preview");
      setConfirmedLowConfidence(false);

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
    const type = remoteUrl.includes("docs.google.com") ? "google_sheets" : "direct_url";

    try {
      setProcessing(true);
      setImportStep("START_CONNECTION");

      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!userData || !userData.user) throw new Error("Unauthorized: Please log in again");
      const userId = userData.user.id;
      if (!userId) throw new Error("Missing required object: user.id");

      const data = await fetchRemoteData(remoteUrl);
      if (!data || data.length === 0) throw new Error("File contains no data");

      setImportStep("SCANNING_MAPPING");
      const detected = detectMapping(data.slice(0, 100));

      const { data: insertedSource, error } = await supabase.from('data_sources').insert({
        user_id: userId,
        source_name: sourceName,
        source_type: type,
        source_url: remoteUrl,
        mapping: detected,
        status: 'active'
      }).select();

      if (error) throw error;
      if (!insertedSource) throw new Error("Failed to create data source");

      setImportStep("IMPORT_FINISHED");
      // Perform scan on the new source data
      const scan = intelligentScan(data);
      setRawRows(data);
      setScanResults(scan);
      setCurrentMapping(scan.resolvedMapping);
      setStage("preview");
      setConfirmedLowConfidence(false);

      loadSources();
      setRemoteUrl("");
      setSourceName("");
    } catch (err) {
      addToast(`Connection failed at ${importStep}: ${err.message}`, "error");
    } finally {
      setProcessing(false);
      setImportStep("");
    }
  };

  const syncNow = async (source) => {
    try {
      setProcessing(true);
      setImportStep("SYNC_START");
      addToast(`Pulling latest data from ${source.source_name}...`, "info");

      if (!source || !source.source_url) throw new Error("Missing required object: source_url");

      const data = await fetchRemoteData(source.source_url);
      if (!data || data.length === 0) throw new Error("Remote file contains no data");

      setImportStep("SCANNING_MAPPING");
      const scan = intelligentScan(data);
      if (!scan) throw new Error("Failed to scan remote data");

      setImportStep("IMPORT_FINISHED");
      setRawRows(data);
      setScanResults(scan);
      setCurrentMapping(scan.resolvedMapping);
      setStage("preview");
      setConfirmedLowConfidence(false);
      addToast("Data synchronized successfully.", "success");
    } catch (err) {
      addToast(`Sync failed at ${importStep}: ${err.message}`, "error");
    } finally {
      setProcessing(false);
      setImportStep("");
    }
  };

  const runImport = async () => {
    try {
      setImporting(true);
      setProgress(0);
      setStage("processing");
      setImportStep("START_IMPORT");

      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!userData || !userData.user) throw new Error("Unauthorized: Please log in again");

      const userId = userData.user.id;
      if (!userId) throw new Error("Missing required object: user.id");

      setImportStep("MATCHING_RECORDS");
      const { data: existingRecords, error: fetchError } = await supabase
        .from('customers')
        .select('phone, name, purchase_date')
        .eq('user_id', userId);

      if (fetchError) throw fetchError;
      if (!existingRecords) throw new Error("Failed to fetch existing records");

      // 2. Build lookup maps for fast matching
      const phoneMap = new Map();
      const nameMap = new Map();

      existingRecords.forEach(rec => {
        const phone = normalizePhone(rec.phone);
        const name = rec.name ? rec.name.trim().toLowerCase() : null;
        const date = rec.purchase_date;

        if (phone) {
          if (!phoneMap.has(phone)) phoneMap.set(phone, new Set());
          phoneMap.get(phone).add(date);
        }
        if (name) {
          if (!nameMap.has(name)) nameMap.set(name, new Set());
          nameMap.get(name).add(date);
        }
      });

      setImportStep("FILE_PARSING");
      const valid = [];
      const stats = { newlyImported: 0, existingNewPurchases: 0, duplicates: 0 };
      const batchSeen = new Set();

      scanResults.valid.forEach((found) => {
        const isoDate = found.purchase_date;
        const phone = normalizePhone(found.phone);
        const normalizedName = (found.name || '').trim().toLowerCase();

        const batchKey = `${phone || normalizedName}_${isoDate}`;
        if (batchSeen.has(batchKey)) {
          stats.duplicates++;
          return;
        }
        batchSeen.add(batchKey);

        let isDuplicate = false;
        let isExistingCustomer = false;

        if (phone && phone.length >= 10) {
          if (phoneMap.has(phone)) {
            isExistingCustomer = true;
            if (phoneMap.get(phone).has(isoDate)) isDuplicate = true;
          }
        } else if (normalizedName) {
          if (nameMap.has(normalizedName)) {
            isExistingCustomer = true;
            if (nameMap.get(normalizedName).has(isoDate)) isDuplicate = true;
          }
        }

        if (isDuplicate) {
          stats.duplicates++;
          return;
        }

        let paymentMode = "Auto-Scan Import";
        if (isExistingCustomer) {
          stats.existingNewPurchases++;
          paymentMode = "Existing Customer - New Purchase";
        } else {
          stats.newlyImported++;
        }

        valid.push({
          user_id: userId,
          name: found.name || null,
          phone: phone || null,
          item_name: found.item_name || null,
          clean_item_name: found.clean_item_name || found.item_name || null,
          raw_item_name: found.raw_item_name || found.item_name || null,
          purchase_date: isoDate || null,
          email: found.email || null,
          city: found.city || null,
          address: found.address || null,
          brand: found.brand || null,
          category: found.category || null,
          price_segment: found.price_segment || null,
          campaign_tags: found.campaign_tags || [],
          confidence_score: found.confidence_score || null,
          needs_review: found.needs_review || false,
          upgrade_cycle_months: found.upgrade_cycle_months || null,
          purchase_amount: found.purchase_amount || null,
          warranty_end_date: found.warranty_end_date || null,
          dob: found.dob || null,
          source: sourceName || 'manual_upload'
        });

      });

      const rejected = [...scanResults.rejected];

      if (valid.length === 0) {
        setImportStep("IMPORT_FINISHED");
        addToast("No new records to import", "info");
        setImportStats({
          total: rawRows.length,
          newlyImported: 0,
          existingNewPurchases: 0,
          duplicates: stats.duplicates,
          invalid: rejected.length
        });
        setRejectedRows(rejected);
        setStage("result");
        return;
      }

      setImportStep("BATCH_CREATED");
      let finalImportedCount = 0;
      const totalChunks = Math.ceil(valid.length / CHUNK_SIZE);

      for (let i = 0; i < valid.length; i += CHUNK_SIZE) {
        const chunk = valid.slice(i, i + CHUNK_SIZE);

        const { data, error } = await supabase
          .rpc('process_customer_import', {
            p_user_id: userId,
            p_store_id: currentStore?.id,
            p_customers: chunk
          });

        if (error) throw error;

        finalImportedCount += (data.success_count || 0);
        setImportStep(`ROWS_INSERTED (${finalImportedCount})`);
        const currentChunkIndex = Math.floor(i / CHUNK_SIZE) + 1;
        setProgress(Math.round((currentChunkIndex / totalChunks) * 100));
      }


      setImportStep("IMPORT_FINISHED");
      setImportStats({
        total: rawRows.length,
        newlyImported: stats.newlyImported,
        existingNewPurchases: stats.existingNewPurchases,
        duplicates: stats.duplicates,
        invalid: rejected.length
      });

      setRejectedRows(rejected);
      setStage("result");
      addToast(`Import complete: ${finalImportedCount} records added.`, "success");
      loadCustomers();
    } catch (error) {
      console.error("Import Crash Prevented:", error);
      addToast(`Error at ${importStep}: ${error.message || "Unknown error"}`, "error");
      setStage("preview"); // Go back to preview instead of breaking
    } finally {
      setImporting(false);
      setImportStep("");
    }
  };

  const reset = () => {
    setStage("sources");
    setRawRows([]);
    setScanResults({ valid: [], rejected: [], confidence: 0 });
    setImportStats({ total: 0, newlyImported: 0, existingNewPurchases: 0, duplicates: 0, invalid: 0 });
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
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 8 }}>{importStep || "Ingesting Data..."}</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>Processing {rawRows.length} records. Please do not close this window.</p>

        <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'var(--primary-color)', transition: 'width 0.3s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700 }}>
          <span style={{ color: 'var(--primary-color)' }}>{progress}% Complete</span>
          <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.65rem' }}>Current Step: {importStep}</span>
        </div>
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
    return (
      <div className="animate-in">
        <div className="page-header">
          <h1 className="page-title">Auto Scan Results</h1>
          <p className="page-subtitle">We've intelligently analyzed your file structure.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <div className="card" style={{ padding: '20px', position: 'relative' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>OVERALL CONFIDENCE</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: scanResults.confidence > 80 ? '#00f5a0' : '#f59e0b' }}>
              {scanResults.confidence}%
            </div>
            {scanResults.confidence < 80 && !confirmedLowConfidence && (
              <div style={{ position: 'absolute', top: 12, right: 12 }}>
                <AlertCircle size={16} color="#f59e0b" />
              </div>
            )}
          </div>
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>TOTAL ROWS</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{rawRows.length}</div>
          </div>
          <div className="card" style={{ padding: '20px', borderLeft: '4px solid #00f5a0' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>VALID ROWS</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#00f5a0' }}>{scanResults.valid.length}</div>
          </div>
          <div className="card" style={{ padding: '20px', borderLeft: '4px solid #ef4444' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>REJECTED ROWS</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444' }}>{scanResults.rejected.length}</div>
          </div>
        </div>

        {scanResults.confidence < 80 && !confirmedLowConfidence && (
          <div className="card" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: '#f59e0b', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ color: '#f59e0b', margin: 0 }}>Low Detection Confidence</h4>
              <p style={{ fontSize: '0.8rem', opacity: 0.8, margin: '4px 0 0 0' }}>The system is unsure about some columns. Please verify the mapping below.</p>
            </div>
            <button className="btn btn-secondary btn-sm" style={{ borderColor: '#f59e0b', color: '#f59e0b' }} onClick={() => setConfirmedLowConfidence(true)}>
              I've Verified This
            </button>
          </div>
        )}

        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3>Extracted Data Preview</h3>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Scroll to verify data extraction accuracy.</p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" onClick={() => {
                const newMapping = { ...currentMapping };
                const nameKey = Object.keys(newMapping).find(k => newMapping[k] === 'name');
                const itemKey = Object.keys(newMapping).find(k => newMapping[k] === 'item');
                if (nameKey && itemKey) {
                  newMapping[nameKey] = 'item';
                  newMapping[itemKey] = 'name';
                  const scan = intelligentScan(rawRows, newMapping);
                  setScanResults(scan);
                  setCurrentMapping(newMapping);
                  addToast("Swapped Name and Item columns", "info");
                }
              }}>
                <RefreshCw size={14} /> Swap Name/Item
              </button>
              <button className="btn btn-secondary" onClick={reset}>Discard</button>
              <button
                className="btn btn-primary"
                onClick={runImport}
                disabled={scanResults.confidence < 80 && !confirmedLowConfidence}
              >
                Confirm & Ingest
              </button>
            </div>
          </div>

          <div className="table-container" style={{ maxHeight: 400 }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 60 }}>Row</th>
                  <th>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span>Customer Name</span>
                      <span style={{ fontSize: '0.6rem', color: scanResults.fieldConfidence?.name > 80 ? '#00f5a0' : '#f59e0b' }}>
                        {scanResults.fieldConfidence?.name || 0}% Confidence
                      </span>
                    </div>
                  </th>
                  <th>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span>Phone Number</span>
                      <span style={{ fontSize: '0.6rem', color: scanResults.fieldConfidence?.phone > 80 ? '#00f5a0' : '#f59e0b' }}>
                        {scanResults.fieldConfidence?.phone || 0}% Confidence
                      </span>
                    </div>
                  </th>
                  <th>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span>Item / Product</span>
                      <span style={{ fontSize: '0.6rem', color: scanResults.fieldConfidence?.item_name > 80 ? '#00f5a0' : '#f59e0b' }}>
                        {scanResults.fieldConfidence?.item_name || 0}% Confidence
                      </span>
                    </div>
                  </th>
                  <th>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span>Purchase Date</span>
                      <span style={{ fontSize: '0.6rem', color: scanResults.fieldConfidence?.purchase_date > 80 ? '#00f5a0' : '#f59e0b' }}>
                        {scanResults.fieldConfidence?.purchase_date || 0}% Confidence
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {scanResults.valid.slice(0, 20).map((row, i) => (
                  <tr key={i}>
                    <td style={{ opacity: 0.5, fontSize: '0.8rem' }}>#{row.rowIndex}</td>
                    <td style={{ fontWeight: 600 }}>{row.name}</td>
                    <td>{row.phone}</td>
                    <td><span className="badge">{row.item_name}</span></td>
                    <td>{row.purchase_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {scanResults.rejected.length > 0 && (
          <div className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
            <h3 style={{ color: '#ef4444', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={20} /> Rejected Rows ({scanResults.rejected.length})
            </h3>
            <div className="table-container" style={{ maxHeight: 200 }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>Row</th>
                    <th>Reason</th>
                    <th>Raw Content Sample</th>
                  </tr>
                </thead>
                <tbody>
                  {scanResults.rejected.slice(0, 50).map((row, i) => (
                    <tr key={i}>
                      <td style={{ opacity: 0.5 }}>#{row.rowIndex}</td>
                      <td style={{ color: '#ef4444', fontSize: '0.8rem' }}>{row.reason}</td>
                      <td style={{ fontSize: '0.7rem', opacity: 0.6, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {JSON.stringify(row.raw)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (stage === "result") {
    return (
      <div className="card animate-in" style={{ textAlign: 'center', maxWidth: 600, margin: '40px auto' }}>
        <CheckCircle2 size={64} color="#00f5a0" style={{ margin: '0 auto 24px' }} />
        <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Ingestion Complete</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 40 }}>We've processed {importStats.total} records.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 40 }}>
          <div className="card" style={{ background: 'rgba(0, 245, 160, 0.05)', borderColor: '#00f5a0', padding: '16px 8px' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#00f5a0' }}>{importStats.newlyImported}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>NEW CUSTOMERS</div>
          </div>
          <div className="card" style={{ background: 'rgba(124, 58, 237, 0.05)', borderColor: '#7c3aed', padding: '16px 8px' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#7c3aed' }}>{importStats.existingNewPurchases}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>NEW PURCHASES</div>
          </div>
          <div className="card" style={{ background: 'rgba(245, 158, 11, 0.05)', borderColor: '#f59e0b', padding: '16px 8px' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f59e0b' }}>{importStats.duplicates}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>DUPLICATES</div>
          </div>
          <div className="card" style={{ background: 'rgba(239, 68, 68, 0.05)', borderColor: '#ef4444', padding: '16px 8px' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ef4444' }}>{importStats.invalid}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>REJECTED</div>
          </div>
        </div>

        <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={reset}>Return to Dashboard</button>
      </div>
    );
  }
}
