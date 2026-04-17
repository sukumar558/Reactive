import * as XLSX from "xlsx";
import Papa from "papaparse";

// ─── Detection Heuristics ────────────────────────────────────────────────────

const PHONE_RE = /^\+?1?\s*[-.]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
const DATE_RE = /^(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}|(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{1,2},?\s*\d{2,4}|\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{2,4})$/i;
const NAME_RE = /^[A-Z][a-z]+(\s[A-Z][a-z']+){1,3}$/;

const FIELD_MAP = {
  name: ["name", "full name", "customer", "naam", "नाम", "ग्राहक का नाम", "client", "customer_name"],
  phone: ["phone", "mobile", "contact", "number", "सम्पर्क", "मोबाइल", "फोन", "whatsapp", "contact_no"],
  item: ["item", "product", "purchase", "item purchased", "वस्तु", "सामान", "आइटम", "service", "model", "product name"],
  purchase_date: ["date", "buy date", "purchase date", "tarikh", "tariq", "तारीख", "दिनांक", "created_at", "order date"],
  category: ["category", "type", "segment", "श्रेणी", "वर्ग", "label", "campaign", "trigger_type"],
  payment_mode: ["payment", "payment_mode", "mode", "method", "paid via", "भुगतान", "transaction_mode"]
};

export function scoreColumn(header, values) {
  const h = header.toLowerCase().trim().replace(/[\s_-]+/g, '_');
  const nonEmpty = values.filter((v) => v && v.toString().trim() !== "");
  if (nonEmpty.length === 0) return { field: null, confidence: 0 };
  const n = nonEmpty.length;

  let headerBonus = {};
  Object.entries(FIELD_MAP).forEach(([field, keywords]) => {
    if (keywords.some(k => h.includes(k.replace(/\s+/g, '_')))) {
      headerBonus[field] = 0.6;
    }
  });

  const phoneScore = (nonEmpty.filter((v) => PHONE_RE.test(v.toString().trim())).length / n) + (headerBonus.phone || 0);
  const dateScore = (nonEmpty.filter((v) => DATE_RE.test(v.toString().trim())).length / n) + (headerBonus.purchase_date || 0);
  const nameScore = (nonEmpty.filter((v) => NAME_RE.test(v.toString().trim())).length / n) + (headerBonus.name || 0);

  const shortAlpha = nonEmpty.filter(
    (v) => v.toString().trim().length <= 20 && /^[a-zA-Z\s&\/\-]+$/.test(v.toString().trim())
  ).length;
  const uniqueRatio = new Set(nonEmpty.map((v) => v.toString().trim().toLowerCase())).size / n;
  const categoryScore = (shortAlpha / n > 0.8 && uniqueRatio < 0.5 ? shortAlpha / n : 0) + (headerBonus.category || 0);

  const itemScore =
    (nonEmpty.filter((v) => v.toString().trim().length > 3 && v.toString().trim().length <= 60).length / n > 0.7 &&
    uniqueRatio > 0.4
      ? 0.7
      : 0) + (headerBonus.item || 0);

  const scores = {
    phone: phoneScore,
    purchase_date: dateScore,
    name: nameScore,
    category: categoryScore,
    item: itemScore,
    payment_mode: headerBonus.payment_mode || 0
  };

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best[1] >= 0.4
    ? { field: best[0], confidence: best[1] }
    : { field: null, confidence: 0 };
}

export function detectMapping(rows) {
  if (!rows.length) return {};
  const headers = Object.keys(rows[0]);
  const mapping = {};
  const usedFields = new Set();

  const scoredCols = headers.map((h) => {
    const values = rows.map((r) => r[h] || "");
    const result = scoreColumn(h, values);
    return { header: h, ...result };
  });

  scoredCols
    .sort((a, b) => b.confidence - a.confidence)
    .forEach(({ header, field, confidence }) => {
      if (field && !usedFields.has(field) && confidence >= 0.4) {
        mapping[header] = field;
        usedFields.add(field);
      } else {
        mapping[header] = null;
      }
    });

  return mapping;
}

export function parseDate(rawDate) {
  if (!rawDate || rawDate === "") return null;

  // Excel serial date support (e.g., 45231)
  if (!isNaN(rawDate) && typeof rawDate === 'number') {
    return new Date((rawDate - 25569) * 86400 * 1000);
  }
  
  if (!isNaN(rawDate) && rawDate.toString().length === 5) {
    return new Date((parseFloat(rawDate) - 25569) * 86400 * 1000);
  }

  const d = new Date(rawDate);
  return isNaN(d.getTime()) ? null : d;
}

export function deduplicateRows(data, mapping = null) {
  const seen = new Set();
  return data.filter(row => {
    let id;
    if (mapping) {
      const nameCol = Object.keys(mapping).find(k => mapping[k] === 'name');
      const phoneCol = Object.keys(mapping).find(k => mapping[k] === 'phone');
      const dateCol = Object.keys(mapping).find(k => mapping[k] === 'purchase_date');
      const itemCol = Object.keys(mapping).find(k => mapping[k] === 'item');
      
      const name = nameCol ? (row[nameCol] || '') : '';
      const phone = phoneCol ? (row[phoneCol] || '') : '';
      const date = dateCol ? (row[dateCol] || '') : '';
      const item = itemCol ? (row[itemCol] || '') : '';
      
      // Business Logic: Unique based on Phone + Date + Item
      const cleanPhone = phone.toString().replace(/\D/g, '');
      id = `${cleanPhone}-${date}-${item}`.toLowerCase().trim();
      if (!cleanPhone && !date && !item) id = JSON.stringify(row);
    } else {
      id = JSON.stringify(row);
    }

    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export function parseFile(file) {
  return new Promise((resolve, reject) => {
    const name = file.name.toLowerCase();
    
    if (name.endsWith(".csv")) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: 'greedy',
        complete: ({ data }) => resolve(data),
        error: (err) => reject(err)
      });
    } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false });
        resolve(rows);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    } else {
      reject(new Error("Unsupported file format"));
    }
  });
}

export async function fetchRemoteData(url) {
  let finalUrl = url.trim();
  
  // Google Sheets
  if (finalUrl.includes("docs.google.com/spreadsheets/d/")) {
    const match = finalUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
      const sheetId = match[1];
      finalUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    }
  }

  // OneDrive / Direct Excel links
  // If it's a OneDrive share link, we try to append download=1 or translate it
  if (finalUrl.includes("1drv.ms") || finalUrl.includes("sharepoint.com")) {
    if (!finalUrl.includes("download=1") && !finalUrl.includes("direct=1")) {
      finalUrl += finalUrl.includes("?") ? "&download=1" : "?download=1";
    }
  }

  const response = await fetch(finalUrl);
  if (!response.ok) throw new Error("Connection failed. Ensure the link is public.");

  const blob = await response.blob();
  const file = new File([blob], "data.xlsx", { type: blob.type });
  
  // Use XLSX for everything remote to be safe
  const arrayBuffer = await blob.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);
  const workbook = XLSX.read(data, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });
}

export function parsePastedData(text) {
  return new Promise((resolve) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: ({ data }) => resolve(data)
    });
  });
}
