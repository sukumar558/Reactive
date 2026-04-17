import Papa from 'papaparse';

/**
 * Parse CSV file and return structured customer data
 */
export function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => {
        // Normalize headers
        const h = header.toLowerCase().trim();
        if (h.includes('name') || h.includes('naam')) return 'name';
        if (h.includes('phone') || h.includes('mobile') || h.includes('number') || h.includes('no')) return 'phone';
        if (h.includes('item') || h.includes('product') || h.includes('saman')) return 'item';
        if (h.includes('date') || h.includes('purchase') || h.includes('tarikh')) return 'purchase_date';
        if (h.includes('note') || h.includes('remark')) return 'notes';
        return h;
      },
      complete: (results) => {
        const customers = results.data
          .filter(row => row.name && row.phone)
          .map(row => {
            const parsedDate = parseDate(row.purchase_date);
            return {
              name: row.name?.trim() || '',
              phone: row.phone?.toString().trim() || '',
              item: row.item?.trim() || 'General',
              purchase_date: parsedDate || null, // Changed from fallback to null
              notes: row.notes?.trim() || '',
              category: detectCategory(row.item || '')
            };
          });

        resolve({
          customers,
          totalRows: results.data.length,
          validRows: customers.length,
          errors: results.errors
        });
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}

/**
 * Try to parse various date formats
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  const str = dateStr.trim();
  
  // Try ISO format (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.substring(0, 10);
  }
  
  // Try DD/MM/YYYY or DD-MM-YYYY
  const match = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Try MM/DD/YYYY
  const match2 = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
  if (match2) {
    const [, month, day, year] = match2;
    return `20${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Fallback: try native Date parsing
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  
  return null;
}

/**
 * Auto-detect product category from item name with focus on CRM Campaign Tags
 */
export function detectCategory(item) {
  const lower = item.toLowerCase();
  
  // CRM Campaign Smart Tags
  if (lower.includes('service') || lower.includes('maintain') || lower.includes('checkup') || lower.includes('repair')) return 'service_due';
  if (lower.includes('new') || lower.includes('latest') || lower.includes('next') || lower.includes('exchange')) return 'upsell';
  if (lower.includes('premium') || lower.includes('high') || lower.includes('gold') || lower.includes('max') || lower.includes('pro')) return 'upgrade';
  if (lower.includes('old') || lower.includes('return') || lower.includes('inactive') || lower.includes('winback')) return 'reactivation';
  if (lower.includes('vip') || lower.includes('exclusive') || lower.includes('offer') || lower.includes('special') || lower.includes('gift')) return 'vip_offer';

  // Product Fallbacks
  if (lower.includes('ac') || lower.includes('cooler')) return 'AC';
  if (lower.includes('fridge')) return 'Fridge';
  if (lower.includes('tv') || lower.includes('led')) return 'TV';
  if (lower.includes('wash')) return 'Washing Machine';
  if (lower.includes('phone') || lower.includes('mobile')) return 'Mobile';
  if (lower.includes('laptop') || lower.includes('pc')) return 'Laptop';
  
  return 'General';
}

/**
 * Generate sample CSV content for download
 */
export function generateSampleCSV() {
  const headers = 'Name,Phone,Item,Purchase Date,Notes';
  const rows = [
    'Ravi Kumar,9876543210,Split AC 1.5 Ton,2025-10-15,Daikin model',
    'Amit Sharma,9876543211,Samsung Fridge,2025-04-20,Double door',
    'Priya Patel,9876543212,iPhone 15,2026-01-10,128GB Black',
    'Suresh Yadav,9876543213,LG Washing Machine,2025-07-05,Front load 7kg',
    'Neha Gupta,9876543214,Sony LED TV 55inch,2025-12-25,Gift purchase',
  ];
  
  return headers + '\n' + rows.join('\n');
}
