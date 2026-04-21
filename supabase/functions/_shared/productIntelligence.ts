/**
 * SHARED PRODUCT INTELLIGENCE ENGINE (DENO VERSION)
 */

export const BRANDS = [
  'Samsung', 'Apple', 'LG', 'Sony', 'HP', 'Dell', 'Lenovo', 'Asus', 'Acer',
  'Oppo', 'Vivo', 'Realme', 'Xiaomi', 'OnePlus', 'Voltas', 'Daikin', 'Blue Star',
  'Whirlpool', 'Godrej', 'Haier', 'Panasonic', 'Philips', 'Bajaj', 'Havells', 'Kent'
];

export const CATEGORIES = {
  'Mobile': { service_cycle: 0, upgrade_cycle: 24, priority: 1, warranty: 12 },
  'Laptop': { service_cycle: 12, upgrade_cycle: 36, priority: 2, warranty: 12 },
  'TV': { service_cycle: 0, upgrade_cycle: 60, priority: 3, warranty: 12 },
  'AC': { service_cycle: 6, upgrade_cycle: 84, priority: 1, warranty: 12 },
  'Refrigerator': { service_cycle: 12, upgrade_cycle: 120, priority: 4, warranty: 12 },
  'Washing Machine': { service_cycle: 12, upgrade_cycle: 120, priority: 4, warranty: 12 },
  'Water Purifier': { service_cycle: 4, upgrade_cycle: 60, priority: 1, warranty: 12 },
  'Smartwatch': { service_cycle: 0, upgrade_cycle: 24, priority: 5, warranty: 12 },
  'Audio': { service_cycle: 0, upgrade_cycle: 36, priority: 6, warranty: 12 },
  'Printer': { service_cycle: 6, upgrade_cycle: 48, priority: 3, warranty: 12 },
  'Accessory': { service_cycle: 0, upgrade_cycle: 12, priority: 7, warranty: 6 },
  'General': { service_cycle: 6, upgrade_cycle: 36, priority: 10, warranty: 12 }
};

export function detectProduct(itemName: string) {
  const n = itemName.toLowerCase().trim();
  
  let brand = 'Generic';
  for (const b of BRANDS) {
    if (n.includes(b.toLowerCase())) {
      brand = b;
      break;
    }
  }
  if (brand === 'Generic') {
    if (n.includes('sam ') || n.startsWith('sam')) brand = 'Samsung';
    if (n.includes('iphone')) brand = 'Apple';
  }

  let category = 'General';
  if (n.includes('laptop') || n.includes('macbook') || n.includes('pc')) category = 'Laptop';
  else if (n.includes('mobile') || n.includes('phone') || n.includes('iphone')) category = 'Mobile';
  else if (n.includes('tv') || n.includes('led')) category = 'TV';
  else if (n.includes('ac ') || n.includes('ac') && (n.includes('voltas') || n.includes('lg') || n.includes('split'))) category = 'AC';
  else if (n.includes('fridge') || n.includes('refrigerator')) category = 'Refrigerator';
  else if (n.includes('washing') || n.includes('machine') || n.includes('wm ')) category = 'Washing Machine';
  else if (n.includes('purifier') || n.includes('kent') || n.includes('aquaguard')) category = 'Water Purifier';
  else if (n.includes('watch')) category = 'Smartwatch';
  else if (n.includes('printer')) category = 'Printer';
  else if (n.includes('headphone') || n.includes('earbud') || n.includes('audio')) category = 'Audio';
  else if (n.includes('charger') || n.includes('mouse') || n.includes('keyboard')) category = 'Accessory';

  const meta = (CATEGORIES as any)[category] || CATEGORIES.General;

  return {
    brand,
    category,
    service_cycle_months: meta.service_cycle,
    upgrade_cycle_months: meta.upgrade_cycle,
    estimated_warranty_months: meta.warranty
  };
}
