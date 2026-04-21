/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  RE-ACTIVATE AI: PRODUCT DETECTION MASTER DATABASE          ║
 * ║  Messy Name Cleaning • Auto-Categorization • CRM Readiness  ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

export const MAIN_CATEGORIES = [
  'Mobile', 'Laptop', 'TV', 'AC', 'Refrigerator', 'Washing Machine', 
  'Water Purifier', 'Tablet', 'Printer', 'Audio', 'Accessory', 
  'Kitchen Appliance', 'Home Appliance', 'Gaming', 'Camera', 
  'Smartwatch', 'Router', 'Power Backup'
];

export const BRANDS = [
  'Apple', 'Samsung', 'LG', 'Sony', 'MI', 'Redmi', 'OnePlus', 'Oppo', 'Vivo', 
  'Realme', 'HP', 'Dell', 'Lenovo', 'Asus', 'Acer', 'Boat', 'JBL', 'Voltas', 
  'Daikin', 'Whirlpool', 'Panasonic', 'Canon', 'Epson', 'Bosch', 'Haier',
  'Philips', 'Bajaj', 'Havells', 'Kent', 'Aquaguard'
];

const CLEANING_RULES = {
  'mob': 'Mobile',
  'cell': 'Mobile',
  'iphone': 'iPhone',
  'led': 'TV',
  'tv': 'TV',
  'wm': 'Washing Machine',
  'wash': 'Washing Machine',
  'frdge': 'Fridge',
  'fridge': 'Refrigerator',
  'ref': 'Refrigerator',
  'lap': 'Laptop',
  'laptop': 'Laptop',
  'earpod': 'Earbuds',
  'bud': 'Earbuds',
  'ac': 'Air Conditioner',
  'puri': 'Water Purifier',
  'neckband': 'Bluetooth Neckband',
  'sam': 'Samsung',
  'blue': 'Bluetooth',
  'tab': 'Tablet'
};

const CATEGORY_DEFAULTS = {
  'Mobile': {
    warranty: 12, upgrade: 24, 
    tags: ['upgrade', 'accessory', 'new arrivals'],
    cross_sell: ['Cover', 'Screen Guard', 'Charger', 'AirPods', 'Power Bank']
  },
  'Laptop': {
    warranty: 12, upgrade: 36,
    tags: ['upgrade', 'accessory', 'work'],
    cross_sell: ['Mouse', 'Laptop Bag', 'Keyboard', 'Monitor', 'Cooling Pad']
  },
  'TV': {
    warranty: 24, upgrade: 60,
    tags: ['festival', 'upgrade', 'entertainment'],
    cross_sell: ['Wall Mount', 'Soundbar', 'Home Theater', 'Stabilizer']
  },
  'AC': {
    warranty: 12, upgrade: 60, service_cycle: 6, serviceable: true,
    tags: ['service', 'seasonal', 'comfort'],
    cross_sell: ['Stabilizer', 'AMC Plan', 'Service Kit']
  },
  'Refrigerator': {
    warranty: 12, upgrade: 84,
    tags: ['festival', 'home'],
    cross_sell: ['Stabilizer', 'Fridge Stand', 'Cleaner']
  },
  'Washing Machine': {
    warranty: 24, upgrade: 60, service_cycle: 12, serviceable: true,
    tags: ['service', 'laundry'],
    cross_sell: ['Cover', 'Descaler', 'Inlet Pipe']
  },
  'Audio': {
    warranty: 6, upgrade: 18,
    tags: ['fast buyer', 'new arrivals', 'music'],
    cross_sell: ['Case', 'Charging Cable']
  },
  'Water Purifier': {
    warranty: 12, upgrade: 48, service_cycle: 6, serviceable: true,
    tags: ['service', 'health'],
    cross_sell: ['Filter Set', 'Pre-filter', 'AMC']
  },
  'Smartwatch': {
    warranty: 12, upgrade: 24,
    tags: ['fitness', 'tech'],
    cross_sell: ['Strap', 'Charging Dock']
  },
  'Accessory': {
    warranty: 6, upgrade: 12,
    tags: ['second order nudge', 'essentials'],
    cross_sell: ['Extended Warranty']
  },
  'Default': {
    warranty: 12, upgrade: 36,
    tags: ['general'],
    cross_sell: ['Protection Plan']
  }
};

/**
 * Main Detection Engine
 */
export function detectProduct(rawItemName) {
  if (!rawItemName) return null;

  const normalized = rawItemName.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const brand = findBrand(normalized);
  const category = findCategory(normalized);
  const cleanName = generateCleanName(brand, category, normalized);
  const segment = detectPriceSegment(normalized, category);
  
  const defaults = CATEGORY_DEFAULTS[category] || CATEGORY_DEFAULTS.Default;
  
  // Calculate confidence
  let confidence = 0;
  if (brand) confidence += 40;
  if (category !== 'Other') confidence += 40;
  if (normalized.length > 5) confidence += 20;

  return {
    raw_item_name: rawItemName,
    clean_product_name: cleanName,
    main_category: category,
    sub_category: deriveSubCategory(normalized, category),
    brand: brand || 'Generic',
    price_segment: segment,
    serviceable: defaults.serviceable ? 'Yes' : 'No',
    estimated_warranty_months: defaults.warranty,
    upgrade_cycle_months: defaults.upgrade,
    service_cycle_months: defaults.service_cycle || null,
    cross_sell_items: defaults.cross_sell || [],
    campaign_tags: [...(defaults.tags || []), ...(segment === 'Premium' || segment === 'Luxury' ? ['VIP', 'luxury'] : [])],
    confidence_score: confidence,
    needs_review: confidence < 70
  };
}

function findBrand(name) {
  for (const brand of BRANDS) {
    if (name.includes(brand.toLowerCase())) return brand;
  }
  // Special cleaning matches
  if (name.includes('sam ') || name.startsWith('sam')) return 'Samsung';
  if (name.includes('iphone')) return 'Apple';
  return null;
}

function findCategory(name) {
  const n = name.toLowerCase();
  // Direct keyword matching
  if (n.includes('laptop') || n.includes('macbook') || n.includes('vivobook') || n.includes('thinkpad')) return 'Laptop';
  if (n.includes('mobile') || n.includes('phone') || n.includes('iphone') || n.includes('galaxy s') || n.includes('pixel')) return 'Mobile';
  if (n.includes('tv') || n.includes('led') || n.includes('television') || n.includes('oled')) return 'TV';
  if (n.includes('ac ') || n.includes('ac') && (n.includes('voltas') || n.includes('lg') || n.includes('split'))) return 'AC';
  if (n.includes('fridge') || n.includes('refrigerator') || n.includes('double door')) return 'Refrigerator';
  if (n.includes('washing') || n.includes('machine') || n.includes('wm ') || n.startsWith('wm ')) return 'Washing Machine';
  if (n.includes('purifier') || n.includes('kent') || n.includes('aquaguard')) return 'Water Purifier';
  if (n.includes('watch')) return 'Smartwatch';
  if (n.includes('printer')) return 'Printer';
  if (n.includes('headphone') || n.includes('earbud') || n.includes('neckband') || n.includes('speaker') || n.includes('audio')) return 'Audio';
  if (n.includes('charger') || n.includes('cable') || n.includes('case') || n.includes('mouse') || n.includes('keyboard')) return 'Accessory';

  
  // Rule based matching
  for (const [key, val] of Object.entries(CLEANING_RULES)) {
    if (name.includes(key)) {
      const target = val.toLowerCase();
      if (target.includes('laptop')) return 'Laptop';
      if (target.includes('mobile')) return 'Mobile';
      if (target.includes('tv')) return 'TV';
      if (target.includes('air conditioner')) return 'AC';
      if (target.includes('refrigerator')) return 'Refrigerator';
      if (target.includes('washing machine')) return 'Washing Machine';
    }
  }

  return 'Other';
}

function generateCleanName(brand, category, normalized) {
  const words = normalized.split(' ');
  const capitalized = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  
  if (brand && category !== 'Other') {
    // Check if name already has brand and category
    let final = capitalized;
    if (!final.toLowerCase().includes(brand.toLowerCase())) final = brand + ' ' + final;
    return final;
  }
  
  return capitalized;
}

function detectPriceSegment(name, category) {
  if (name.includes('pro') || name.includes('max') || name.includes('ultra') || name.includes('iphone') || name.includes('macbook')) return 'Premium';
  if (name.includes('budget') || name.includes('lite') || name.includes('refurbished')) return 'Budget';
  
  // Luxury detection
  if (name.includes('qled') || name.includes('side by side') || name.includes('gaming pc')) return 'Luxury';
  
  return 'Mid Range';
}

function deriveSubCategory(name, main) {
  if (main === 'Mobile') {
    if (name.includes('iphone')) return 'iOS Smartphone';
    return 'Android Smartphone';
  }
  if (main === 'Laptop') {
    if (name.includes('gaming')) return 'Gaming Laptop';
    if (name.includes('macbook')) return 'MacBook';
    return 'Work Laptop';
  }
  if (main === 'TV') {
    if (name.includes('4k') || name.includes('smart')) return 'Smart 4K TV';
    return 'LED TV';
  }
  return main;
}
