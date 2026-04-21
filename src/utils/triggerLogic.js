/**
 * TRIGGER_RULES — Static campaign metadata lookup table.
 * 
 * All campaign LOGIC now lives in the SQL view `active_campaign_targets`.
 * This file only provides UI metadata (label, icon, color, priority)
 * used by Dashboard, TriggerEngine, and CustomerList for display.
 */

export const TRIGGER_RULES = [
  // --- PRIORITY 1-5: CRITICAL RETENTION ---
  { type: 'birthday_today', label: 'Birthday Wish', icon: '🎂', priority: 1, color: '#ec4899', description: 'Send heartfelt birthday greetings' },
  { type: 'win_back_180d', label: 'Win-Back Offer', icon: '🔄', priority: 2, color: '#4f46e5', description: 'Re-engage long-dormant low-spend customers' },
  { type: 'complaint_recovery', label: 'Trust Recovery', icon: '🩹', priority: 3, color: '#dc2626', description: 'Recover trust after complaints' },
  { type: 'warranty_expiry', label: 'Warranty End', icon: '🛡️', priority: 4, color: '#ef4444', description: 'Alert before warranty expires' },
  { type: 'vip_milestone', label: 'VIP Recognition', icon: '💎', priority: 5, color: '#8b5cf6', description: 'Reward top spenders (₹80K+)' },

  // --- PRIORITY 6-10: SERVICE & RETENTION ---
  { type: 'service_due', label: 'Service Reminder', icon: '🔧', priority: 6, color: '#f59e0b', description: 'Prompt service for mid-spend 1-2yr customers' },
  { type: 'satisfaction_check', label: '7-Day Feedback', icon: '⭐', priority: 7, color: '#10b981', description: 'Check satisfaction 7-10 days post-purchase' },
  { type: 'upgrade_opportunity', label: 'Tech Upgrade', icon: '🚀', priority: 8, color: '#06b6d4', description: 'Upgrade offer for 2+yr mid-high spenders' },
  { type: 'dormancy_90d', label: '90-Day Re-entry', icon: '👋', priority: 9, color: '#6366f1', description: 'Re-engage 90-365 day dormant customers' },
  { type: 'bulk_loyalty', label: 'Bulk Buyer Reward', icon: '📦', priority: 10, color: '#14b8a6', description: 'Reward customers with 5+ purchases' },

  // --- PRIORITY 11-25: GROWTH & NUDGES ---
  { type: 'first_repeat_nudge', label: 'Second Order Nudge', icon: '🔁', priority: 11, color: '#22c55e', description: 'Nudge single-purchase low-spend customers' },
  { type: 'accessory_upsell', label: 'Add-on Nudge', icon: '🛍️', priority: 12, color: '#3b82f6', description: 'Cross-sell accessories within 14 days' },
  { type: 'high_value_dormant', label: 'HV Dormant', icon: '💤', priority: 13, color: '#f97316', description: 'Re-engage high-value 1-2yr dormant customers' },
  { type: 'referral_request', label: 'Referral Program', icon: '🤝', priority: 14, color: '#059669', description: 'Ask loyal customers for referrals' },
  { type: 'festival_special', label: 'Festival Offer', icon: '🎉', priority: 15, color: '#ea580c', description: 'Festive season offers (Oct/Nov)' },
  { type: 'fast_buyer_reward', label: 'Fast Buyer', icon: '⚡', priority: 16, color: '#eab308', description: 'Reward quick repeat buyers' },
  { type: 'category_expert', label: 'Category Loyal', icon: '🏅', priority: 17, color: '#f43f5e', description: 'Engage category-loyal customers' },
  { type: 'seasonal_shopper', label: 'Seasonal Match', icon: '📅', priority: 18, color: '#84cc16', description: 'Target seasonal buying patterns' },
  { type: 'budget_smart', label: 'Budget Deals', icon: '💸', priority: 19, color: '#d97706', description: 'Budget-friendly deals for low spenders' },
  { type: 'premium_taste', label: 'Luxury Range', icon: '✨', priority: 20, color: '#7c3aed', description: 'Premium offerings for high-AOV customers' },
  { type: 'no_response_last', label: 'Silence Breaker', icon: '📭', priority: 21, color: '#94a3b8', description: 'Gentle nudge for non-responders' },
  { type: 'hot_lead_nudge', label: 'Hot Prospect', icon: '🔥', priority: 22, color: '#dc2626', description: 'Convert frequent visitors into buyers' },
  { type: 'last_visit_touch', label: 'Recent Visit', icon: '🏪', priority: 23, color: '#4b5563', description: 'Follow up after recent visit' },
  { type: 'abandoned_cart', label: 'Nearly Yours', icon: '🛒', priority: 24, color: '#f87171', description: 'Recover abandoned carts' },
  { type: 'general_news', label: 'New Arrivals', icon: '✨', priority: 25, color: '#9ca3af', description: 'General updates and new products' }
];

/**
 * Quick lookup helper — find a rule by its trigger code
 */
export function findRule(triggerCode) {
  return TRIGGER_RULES.find(r => r.type === triggerCode) || null;
}
