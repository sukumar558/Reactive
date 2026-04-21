import { calculateDatasetThresholds } from '../src/utils/campaignIntelligence.js';

const mockCustomers = [
  { total_spend: 1000, purchase_count: 1, purchase_date: '2023-01-01' },
  { total_spend: 5000, purchase_count: 2, purchase_date: '2023-06-01' },
  { total_spend: 10000, purchase_count: 5, purchase_date: '2023-12-01' },
  { total_spend: 50000, purchase_count: 10, purchase_date: '2024-03-01' },
  { total_spend: 100000, purchase_count: 20, purchase_date: '2024-04-01' },
];

const thresholds = calculateDatasetThresholds(mockCustomers);
console.log('Thresholds:', thresholds);
