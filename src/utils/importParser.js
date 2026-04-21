import * as XLSX from "xlsx";
import Papa from "papaparse";
import { detectProduct } from "./productIntelligence";


// ─── Detection Heuristics ────────────────────────────────────────────────────

const PHONE_RE = /^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/;
const DATE_RE = /^(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}|(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{1,2},?\s*\d{2,4}|\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{2,4})$/i;
const NAME_RE = /^[A-Z][a-z]+(\s[A-Z][a-z']+){1,3}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AMOUNT_RE = /^[\₹\$]?\s?\d[\d,]*\.?\d*$/;

export function normalizePhone(raw) {
  if (!raw) return null;
  // Remove all non-digits
  let clean = raw.toString().replace(/\D/g, '');
  
  // Handle leading 0
  if (clean.startsWith('0')) clean = clean.substring(1);
  
  // Handle leading 91
  if (clean.length === 12 && clean.startsWith('91')) clean = clean.substring(2);
  
  // Validate 10 digits
  if (clean.length === 10 && /^[6789]/.test(clean)) {
    return clean;
  }
  return null;
}

/**
 * 10 Importable Fields — everything else is silently ignored.
 * Each field has an array of known aliases for auto-detection.
 */
const FIELD_MAP = {
  name: ["name", "full name", "customer", "customer name", "customer_name", "naam", "नाम", "ग्राहक का नाम", "client", "client name", "buyer", "buyer name", "owner", "contact person"],
  phone: ["phone", "mobile", "contact", "number", "phone number", "phone_number", "mobile number", "mobile_number", "contact_no", "contact no", "whatsapp", "सम्पर्क", "मोबाइल", "फोन", "cell", "tel", "telephone", "mob"],
  item_name: ["item", "item_name", "item name", "items", "product", "product name", "product_name", "item purchased", "वस्तु", "सामान", "आइटम", "service", "model name", "device"],
  purchase_date: ["date", "buy date", "purchase date", "purchase_date", "bought on", "bought_on", "order date", "order_date", "tarikh", "tariq", "तारीख", "दिनांक", "created_at", "invoice date", "bill date"],
  email: ["email", "email id", "email_id", "mail", "e-mail", "email address", "ईमेल"],
  city: ["city", "town", "district", "state", "शहर", "जगह"],
  address: ["address", "full address", "location", "area", "house", "street", "पता"],
  brand: ["brand", "company", "make", "manufacturer", "brand name", "brand_name", "ब्रांड"],
  category: ["category", "type", "segment", "group", "product type", "product_type", "product category", "श्रेणी"],
  purchase_amount: ["amount", "price", "bill", "total", "cost", "bill amount", "bill_amount", "invoice amount", "purchase amount", "purchase_amount", "total purchase", "total_purchase", "payment", "paid", "कीमत", "राशि", "रकम"],
  warranty_end_date: ["warranty", "warranty date", "warranty end", "warranty_end_date", "warranty expiry", "warranty_expiry", "guarantee", "guarantee date", "warranty_date", "वारंटी"],
  dob: ["dob", "birthday", "birth date", "birth_date", "date of birth", "जन्म तिथि", "जन्मदिन", "anniversary"]
};

// Core 4 required fields for validation
const CORE_FIELDS = ['name', 'phone', 'item_name', 'purchase_date'];
// All 10 importable fields
const ALL_IMPORT_FIELDS = ['name', 'phone', 'item_name', 'purchase_date', 'email', 'city', 'address', 'brand', 'category', 'purchase_amount', 'warranty_end_date', 'dob'];

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
  const emailScore = (nonEmpty.filter((v) => EMAIL_RE.test(v.toString().trim())).length / n) + (headerBonus.email || 0);
  const amountScore = (nonEmpty.filter((v) => AMOUNT_RE.test(v.toString().trim().replace(/,/g, ''))).length / n) + (headerBonus.purchase_amount || 0);

  // Warranty date detection: same as date but with warranty header bonus
  const warrantyDateScore = (nonEmpty.filter((v) => DATE_RE.test(v.toString().trim())).length / n) + (headerBonus.warranty_end_date || 0);
  const dobScore = (nonEmpty.filter((v) => DATE_RE.test(v.toString().trim())).length / n) + (headerBonus.dob || 0);

  const shortAlpha = nonEmpty.filter(
    (v) => v.toString().trim().length <= 20 && /^[a-zA-Z\s&\/\-]+$/.test(v.toString().trim())
  ).length;
  const uniqueRatio = new Set(nonEmpty.map((v) => v.toString().trim().toLowerCase())).size / n;

  // Category: short text, low unique ratio
  const categoryScore = (shortAlpha / n > 0.8 && uniqueRatio < 0.5 ? shortAlpha / n : 0) + (headerBonus.category || 0);

  // Brand: short text, moderate unique ratio
  const brandScore = (shortAlpha / n > 0.6 && uniqueRatio < 0.4 && uniqueRatio > 0.05 ? shortAlpha / n * 0.8 : 0) + (headerBonus.brand || 0);

  // City: short text, low-moderate unique ratio
  const cityScore = (shortAlpha / n > 0.7 && uniqueRatio < 0.6 ? shortAlpha / n * 0.7 : 0) + (headerBonus.city || 0);
  const addressScore = (nonEmpty.filter((v) => v.toString().trim().length > 15).length / n > 0.3 ? 0.4 : 0) + (headerBonus.address || 0);

  const itemNameScore =
    (nonEmpty.filter((v) => v.toString().trim().length > 3 && v.toString().trim().length <= 60).length / n > 0.7 &&
    uniqueRatio > 0.4
      ? 0.7
      : 0) + (headerBonus.item_name || 0);

  // Score all 10 importable fields
  const scores = {
    phone: phoneScore,
    purchase_date: dateScore,
    name: nameScore,
    item_name: itemNameScore,
    email: emailScore,
    city: cityScore,
    address: addressScore,
    brand: brandScore,
    category: categoryScore,
    purchase_amount: amountScore,
    warranty_end_date: warrantyDateScore,
    dob: dobScore
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

  // Handle DD/MM/YYYY specifically for India
  const ddmm = rawDate.toString().match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (ddmm) {
    const day = parseInt(ddmm[1]);
    const month = parseInt(ddmm[2]);
    const year = ddmm[3].length === 2 ? 2000 + parseInt(ddmm[3]) : parseInt(ddmm[3]);
    if (day <= 31 && month <= 12) {
      const d = new Date(year, month - 1, day);
      if (!isNaN(d.getTime())) return d;
    }
  }

  const d = new Date(rawDate);
  return isNaN(d.getTime()) ? null : d;
}

function parseAmount(raw) {
  if (!raw || raw === "") return null;
  const cleaned = raw.toString().replace(/[₹$,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

const PRODUCT_KEYWORDS = [
  'laptop', 'speaker', 'ac', 'ton', 'bluetooth', 'smartphone', 'mobile',
  'macbook', 'iphone', 'samsung', 'asus', 'jbl', 'voltas', 'oppo', 'vivo',
  'sony', 'dell', 'hp', 'lenovo', 'tv', 'fridge', 'refrigerator', 'washing',
  'machine', 'oven', 'watch', 'airpods', 'buds', 'tablet', 'ipad', 'pro', 'max',
  'headphone', 'camera', 'dslr', 'mouse', 'keyboard', 'monitor'
];

const INDIAN_NAME_HINTS = [
  'kumar', 'singh', 'sharma', 'gupta', 'patel', 'reddy', 'nair', 'yadav',
  'verma', 'chowdhury', 'mukherjee', 'dutta', 'das', 'bose', 'khan', 'shaikh',
  'iyer', 'iyengar', 'menon', 'rao', 'joshi', 'kulkarni', 'deshpande'
];

export function intelligentScan(rows, manualMapping = null) {
  if (!rows || rows.length === 0) return { valid: [], rejected: [], confidence: 0, fieldConfidence: {} };

  const headers = Object.keys(rows[0]);
  const sampleRows = rows.slice(0, 100);
  
  // 1. Column-Level Scoring
  const columnScores = headers.map(header => {
    const values = sampleRows.map(r => (r[header] || "").toString().trim()).filter(v => v !== "");
    const n = values.length;
    if (n === 0) return { header, scores: {} };

    let phoneScore = 0;
    let dateScore = 0;
    let nameScore = 0;
    let itemNameScore = 0;
    let emailScore = 0;
    let amountScore = 0;
    let warrantyDateScore = 0;
    let cityScore = 0;
    let brandScore = 0;
    let categoryScore = 0;

    // Check header keywords first for bonus
    const hLower = header.toLowerCase().trim().replace(/[\s_-]+/g, '_');
    const headerBonuses = {};
    Object.entries(FIELD_MAP).forEach(([field, keywords]) => {
      if (keywords.some(k => hLower.includes(k.replace(/\s+/g, '_')))) {
        headerBonuses[field] = 0.4;
      }
    });

    values.forEach(val => {
      // Phone check
      const clean = val.replace(/\D/g, '');
      if (clean.length >= 10 && clean.length <= 13) phoneScore++;

      // Date check
      const d = parseDate(val);
      if (d && d.getFullYear() >= 2020 && d.getFullYear() <= 2030) dateScore++;

      // Email check
      if (EMAIL_RE.test(val)) emailScore++;

      // Amount check
      if (AMOUNT_RE.test(val.replace(/,/g, ''))) amountScore++;

      // Name vs Product logic
      const words = val.split(/\s+/);
      const isAlpha = /^[a-zA-Z\s.]+$/.test(val);
      const hasNumbers = /\d/.test(val);
      const lowerVal = val.toLowerCase();
      
      const hasProductKw = PRODUCT_KEYWORDS.some(kw => lowerVal.includes(kw));
      const hasNameHint = INDIAN_NAME_HINTS.some(hint => lowerVal.includes(hint));

      if (isAlpha && words.length >= 2 && words.length <= 5 && !hasProductKw && !hasNumbers) {
        nameScore += 1;
        if (hasNameHint) nameScore += 0.5;
      }

      if (hasProductKw || hasNumbers || (words.length > 5 && !isAlpha)) {
        itemNameScore += 1;
        if (hasProductKw) itemNameScore += 0.5;
      }

      // City/Brand/Category: short alpha text
      if (isAlpha && val.length <= 20 && words.length <= 3) {
        cityScore += 0.3;
        brandScore += 0.3;
        categoryScore += 0.3;
      }
    });

    return {
      header,
      scores: {
        phone: phoneScore / n + (headerBonuses.phone || 0),
        purchase_date: dateScore / n + (headerBonuses.purchase_date || 0),
        name: nameScore / n + (headerBonuses.name || 0),
        item_name: itemNameScore / n + (headerBonuses.item_name || 0),
        email: emailScore / n + (headerBonuses.email || 0),
        purchase_amount: amountScore / n + (headerBonuses.purchase_amount || 0),
        warranty_end_date: (dateScore / n) * 0.5 + (headerBonuses.warranty_end_date || 0),
        city: cityScore / n + (headerBonuses.city || 0),
        brand: brandScore / n + (headerBonuses.brand || 0),
        category: categoryScore / n + (headerBonuses.category || 0)
      }
    };
  });

  // 2. Resolve Global Mapping — all 10 fields
  const resolvedMapping = manualMapping || {};
  const fieldConfidence = {};

  if (!manualMapping) {
    const usedHeaders = new Set();

    // Prioritize core fields first, then extended
    ALL_IMPORT_FIELDS.forEach(field => {
      const bestCol = columnScores
        .filter(cs => !usedHeaders.has(cs.header))
        .sort((a, b) => (b.scores[field] || 0) - (a.scores[field] || 0))[0];

      if (bestCol && (bestCol.scores[field] || 0) > 0.3) {
        resolvedMapping[bestCol.header] = field;
        fieldConfidence[field] = Math.round(bestCol.scores[field] * 100);
        usedHeaders.add(bestCol.header);
      } else {
        fieldConfidence[field] = 0;
      }
    });
  } else {
    Object.entries(manualMapping).forEach(([header, field]) => {
      if (!field) return;
      const colScore = columnScores.find(cs => cs.header === header);
      if (colScore) {
        fieldConfidence[field] = Math.round((colScore.scores[field] || 0) * 100);
      }
    });
  }

  // 3. Extract Rows using resolved mapping
  const valid = [];
  const rejected = [];

  rows.forEach((row, rowIndex) => {

    const found = {};
    ALL_IMPORT_FIELDS.forEach(f => { found[f] = null; });
    
    // Extract all 10 mapped fields — silently ignore unmapped columns
    Object.entries(resolvedMapping).forEach(([header, field]) => {
      if (!field) return;
      if (!ALL_IMPORT_FIELDS.includes(field)) return;
      const val = (row[header] || "").toString().trim();
      if (!val) return;

      if (field === 'phone') {
        const clean = normalizePhone(val);
        if (clean) found.phone = clean;
      } else if (field === 'purchase_date' || field === 'warranty_end_date') {
        const d = parseDate(val);
        if (d) found[field] = d.toISOString().split('T')[0];
      } else if (field === 'purchase_amount') {
        found.purchase_amount = parseAmount(val);
      } else if (field === 'email') {
        if (EMAIL_RE.test(val)) found.email = val;
      } else {
        found[field] = val;
      }
    });

    // --- AI ENRICHMENT ---
    // If we have an item_name, use the Product Intelligence Engine to enrich the record
    if (found.item_name) {
      const enrichment = detectProduct(found.item_name);
      if (enrichment) {
        // Only overwrite if the CSV didn't have a value or if the value was generic
        if (!found.category || found.category.toLowerCase() === 'general') found.category = enrichment.main_category;
        if (!found.brand || found.brand.toLowerCase() === 'generic') found.brand = enrichment.brand;
        
        // Always store clean name and metadata
        found.clean_item_name = enrichment.clean_product_name;
        found.price_segment = enrichment.price_segment;
        found.campaign_tags = enrichment.campaign_tags;
        
        // Auto-calculate warranty if missing
        if (!found.warranty_end_date && found.purchase_date && enrichment.estimated_warranty_months) {
          const pDate = new Date(found.purchase_date);
          pDate.setMonth(pDate.getMonth() + enrichment.estimated_warranty_months);
          found.warranty_end_date = pDate.toISOString().split('T')[0];
        }
      }
    }

    // Validation: phone required, name OR item_name required, rest optional
    if (!found.phone) {
      rejected.push({ raw: row, reason: 'Phone missing or invalid', rowIndex: rowIndex + 1 });
    } else if (!found.name && !found.item_name) {
      rejected.push({ raw: row, reason: 'Both Name and Item missing', rowIndex: rowIndex + 1 });
    } else {
      valid.push({ ...found, raw: row, rowIndex: rowIndex + 1 });
    }
  });


  const activeFields = Object.values(fieldConfidence).filter(v => v > 0);
  const avgConfidence = activeFields.length > 0 ? activeFields.reduce((a, b) => a + b, 0) / activeFields.length : 0;

  return {
    valid,
    rejected,
    confidence: Math.round(avgConfidence),
    fieldConfidence,
    resolvedMapping
  };
}

export function deduplicateRows(data, mapping = null) {
  const seen = new Set();
  return data.filter(row => {
    let id;
    if (mapping) {
      const nameCol = Object.keys(mapping).find(k => mapping[k] === 'name');
      const phoneCol = Object.keys(mapping).find(k => mapping[k] === 'phone');
      const dateCol = Object.keys(mapping).find(k => mapping[k] === 'purchase_date');
      const itemCol = Object.keys(mapping).find(k => mapping[k] === 'item_name');
      
      const name = nameCol ? (row[nameCol] || '') : '';
      const phone = phoneCol ? (row[phoneCol] || '') : '';
      const date = dateCol ? (row[dateCol] || '') : '';
      const item = itemCol ? (row[itemCol] || '') : '';
      
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
  
  if (finalUrl.includes("docs.google.com/spreadsheets/d/")) {
    const match = finalUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
      const sheetId = match[1];
      finalUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    }
  }

  if (finalUrl.includes("1drv.ms") || finalUrl.includes("sharepoint.com")) {
    if (!finalUrl.includes("download=1") && !finalUrl.includes("direct=1")) {
      finalUrl += finalUrl.includes("?") ? "&download=1" : "?download=1";
    }
  }

  const response = await fetch(finalUrl);
  if (!response.ok) throw new Error("Connection failed. Ensure the link is public.");

  const blob = await response.blob();
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

export { ALL_IMPORT_FIELDS, FIELD_MAP };
