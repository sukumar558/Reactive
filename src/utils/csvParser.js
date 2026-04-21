import Papa from 'papaparse';
import { detectProduct } from './productIntelligence';

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
        if (h.includes('item') || h.includes('product') || h.includes('saman')) return 'item_name';
        if (h.includes('date') || h.includes('purchase') || h.includes('tarikh')) return 'purchase_date';
        if (h.includes('note') || h.includes('remark')) return 'notes';
        return h;
      },
      complete: (results) => {
        const customers = results.data
          .filter(row => row.name && row.phone)
          .map(row => {
            const rawItem = row.item_name?.trim() || 'General';
            const productInfo = detectProduct(rawItem);
            const parsedDate = parseDate(row.purchase_date);
            
            return {
              name: row.name?.trim() || '',
              phone: row.phone?.toString().trim() || '',
              item_name: productInfo?.clean_product_name || rawItem,
              raw_item_name: rawItem,
              purchase_date: parsedDate || null,
              notes: row.notes?.trim() || '',
              category: productInfo?.main_category || 'General',
              brand: productInfo?.brand || 'Generic',
              price_segment: productInfo?.price_segment || 'Mid Range',
              campaign_tags: productInfo?.campaign_tags || [],
              confidence_score: productInfo?.confidence_score || 0,
              needs_review: productInfo?.needs_review || false,
              upgrade_cycle_months: productInfo?.upgrade_cycle_months || 36
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
 * Generate sample CSV content for download with MESSY data
 */
export function generateSampleCSV() {
  const headers = 'Name,Phone,Item,Date';
  const rows = [
    'Ravi Kumar,9876543210,sam tv 43,2025-03-15',
    'Amit Sharma,9876543211,iphone12,2024-04-20',
    'Priya Patel,9876543212,voltas 1.5 ac,2025-06-10',
    'Suresh Yadav,9876543213,boat neckband,2025-07-05',
    'Neha Gupta,9876543214,hp i5 lap,2024-12-25',
  ];
  
  return headers + '\n' + rows.join('\n');
}

