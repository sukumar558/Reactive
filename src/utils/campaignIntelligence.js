/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  RE-ACTIVATE AI: PROFESSIONAL CRM TRIGGER ENGINE (25 TYPES)  ║
 * ║  One Customer = One Best Campaign • Anti-Spam • WPS         ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { generateMessage } from './messageTemplates';
import { detectProduct } from './productIntelligence';


export const CAMPAIGNS = [
  // --- PRIORITY 1-5: CRITICAL RETENTION ---
  { type: 'birthday_today', label: 'Birthday Wish', icon: '🎂', priority: 1, color: '#ec4899', emotion: '💝 Emotional', qualify: (m) => m.is_birthday },
  { type: 'win_back_180d', label: 'Win-Back Offer', icon: '🔄', priority: 2, color: '#4f46e5', emotion: '⏳ Scarcity', qualify: (m) => m.inactive_days >= 180 },
  { type: 'complaint_recovery', label: 'Trust Recovery', icon: '🩹', priority: 3, color: '#dc2626', emotion: '🙏 Empathy', qualify: (m) => m.complaint_count >= 1 },
  { type: 'warranty_expiry', label: 'Warranty End', icon: '🛡️', priority: 4, color: '#ef4444', emotion: '⚠️ Protection', qualify: (m) => m.days_to_warranty_expiry <= 30 && m.days_to_warranty_expiry > 0 },
  { type: 'vip_milestone', label: 'VIP Recognition', icon: '💎', priority: 5, color: '#8b5cf6', emotion: '👑 Status', qualify: (m, t) => m.total_spend >= (t?.spend_p95 || 150000) },

  // --- PRIORITY 6-10: URGENT SERVICE & FEEDBACK ---
  { type: 'service_due', label: 'Service Reminder', icon: '🔧', priority: 6, color: '#f59e0b', emotion: '⏰ Urgent', qualify: (m) => m.is_due_for_service && m.inactive_days < 180 },
  { type: 'satisfaction_check', label: '7-Day Feedback', icon: '⭐', priority: 7, color: '#10b981', emotion: '🤝 Relationship', qualify: (m) => m.days_since_last_purchase >= 7 && m.days_since_last_purchase <= 10 },
  { type: 'upgrade_opportunity', label: 'Tech Upgrade', icon: '🚀', priority: 8, color: '#06b6d4', emotion: '🌟 Sales', qualify: (m) => m.product_age_months >= 24 && m.total_spend > 20000 },
  { type: 'dormancy_90d', label: '90-Day Re-entry', icon: '👋', priority: 9, color: '#6366f1', emotion: '🔄 Value', qualify: (m) => m.inactive_days >= 90 && m.inactive_days < 180 },
  { type: 'bulk_loyalty', label: 'Bulk Buyer Reward', icon: '📦', priority: 10, color: '#14b8a6', emotion: '🏆 Status', qualify: (m, t) => m.purchase_count >= (t?.purchase_p90 || 5) },

  // --- PRIORITY 11-25: NUDGES & GROWTH ---
  { type: 'first_repeat_nudge', label: 'Second Order Nudge', icon: '🔁', priority: 11, color: '#22c55e', emotion: '🎁 Reward', qualify: (m) => m.purchase_count === 1 && m.days_since_last_purchase >= 30 && m.days_since_last_purchase < 90 },
  { type: 'accessory_upsell', label: 'Add-on Nudge', icon: '🛍️', priority: 12, color: '#3b82f6', emotion: '🔍 Discovery', qualify: (m) => m.days_since_last_purchase <= 14 },
  { type: 'high_value_dormant', label: 'HV Dormant', icon: '💤', priority: 13, color: '#f97316', emotion: '😟 Loss Aversion', qualify: (m, t) => m.total_spend >= (t?.spend_p75 || 60000) && m.inactive_days >= 60 },
  { type: 'referral_request', label: 'Referral Program', icon: '🤝', priority: 14, color: '#059669', emotion: '🎁 Reward', qualify: (m) => m.purchase_count >= 2 && m.loyalty_score >= 80 },
  { type: 'festival_special', label: 'Festival Offer', icon: '🎉', priority: 15, color: '#ea580c', emotion: '🪔 Belonging', qualify: (m) => m.is_festive_season },
  { type: 'fast_buyer_reward', label: 'Fast Buyer', icon: '⚡', priority: 16, color: '#eab308', emotion: '🎯 Recognition', qualify: (m) => m.purchase_count >= 2 && m.days_since_last_purchase <= 20 },
  { type: 'category_expert', label: 'Category Loyal', icon: '🏅', priority: 17, color: '#f43f5e', emotion: '❤️ Status', qualify: (m) => m.single_category && m.purchase_count >= 2 },
  { type: 'seasonal_shopper', label: 'Seasonal Match', icon: '📅', priority: 18, color: '#84cc16', emotion: '🕐 Timing', qualify: (m) => m.is_seasonal_buyer },
  { type: 'budget_smart', label: 'Budget Deals', icon: '💸', priority: 19, color: '#d97706', emotion: '🏷️ Savings', qualify: (m, t) => m.avg_order_value <= (t?.aov_p25 || 5000) },
  { type: 'premium_taste', label: 'Luxury Range', icon: '✨', priority: 20, color: '#7c3aed', emotion: '✨ Status', qualify: (m, t) => m.avg_order_value >= (t?.aov_p75 || 25000) },
  { type: 'no_response_last', label: 'Silence Breaker', icon: '📭', priority: 21, color: '#94a3b8', emotion: '🔔 Gentle Nudge', qualify: (m) => m.messages_sent > 0 && m.messages_responded === 0 },
  { type: 'hot_lead_nudge', label: 'Hot Prospect', icon: '🔥', priority: 22, color: '#dc2626', emotion: '⏳ Urgency', qualify: (m) => m.visit_frequency >= 3 && m.purchase_count === 0 },
  { type: 'last_visit_touch', label: 'Recent Visit', icon: '🏪', priority: 23, color: '#4b5563', emotion: '👋 Recognition', qualify: (m) => m.days_since_last_visit <= 3 && m.purchase_count > 0 },
  { type: 'abandoned_cart', label: 'Nearly Yours', icon: '🛒', priority: 24, color: '#f87171', emotion: '🛒 Reminder', qualify: (m) => m.has_abandoned_cart },
  { type: 'general_news', label: 'New Arrivals', icon: '✨', priority: 25, color: '#9ca3af', emotion: '🆕 Info', qualify: (m) => true }
];

export function computeCustomerMetrics(customer) {
  const now = new Date();
  const purchaseDate = customer.purchase_date ? new Date(customer.purchase_date) : null;
  const serviceDate = customer.last_service_date ? new Date(customer.last_service_date) : null;
  const dob = customer.date_of_birth ? new Date(customer.date_of_birth) : null;
  const warrantyEnd = customer.warranty_end_date ? new Date(customer.warranty_end_date) : null;

  const days_since_last_purchase = purchaseDate ? Math.floor((now - purchaseDate) / 86400000) : null;
  const days_since_last_service = serviceDate ? Math.floor((now - serviceDate) / 86400000) : (days_since_last_purchase || 0);
  const days_to_warranty_expiry = warrantyEnd ? Math.ceil((warrantyEnd - now) / 86400000) : null;
  const product_age_months = purchaseDate ? (now.getFullYear() - purchaseDate.getFullYear()) * 12 + (now.getMonth() - purchaseDate.getMonth()) : 0;
  
  const productInfo = detectProduct(customer.item_name || '');
  const service_interval = productInfo?.service_cycle_months ? productInfo.service_cycle_months * 30 : (productInfo?.service_cycle_months === 0 ? null : 180);
  const is_due_for_service = service_interval !== null && days_since_last_service >= service_interval;


  const total_spend = customer.total_spend || 0;
  const purchase_count = customer.purchase_count || 1;
  const complaint_count = customer.complaint_count || 0;

  let urgency_score = 0;
  if (is_due_for_service) urgency_score += 50;
  if (days_to_warranty_expiry !== null && days_to_warranty_expiry <= 30) urgency_score += 30;
  if (days_since_last_purchase !== null && days_since_last_purchase >= 180) urgency_score += 20;


  return {
    ...customer,
    days_since_last_purchase: days_since_last_purchase ?? 0,
    days_since_last_service,
    service_interval,
    is_due_for_service,
    days_to_warranty_expiry,
    product_age_months,
    total_spend,
    purchase_count,
    avg_order_value: purchase_count > 0 ? total_spend / purchase_count : 0,
    inactive_days: days_since_last_purchase ?? 0,
    urgency_score: Math.min(100, urgency_score),
    loyalty_score: Math.min(100, (purchase_count * 15) + (total_spend / 1000) - (complaint_count * 20)),
    is_birthday: dob ? (dob.getDate() === now.getDate() && dob.getMonth() === now.getMonth()) : false,
    is_festive_season: [9, 10, 2].includes(now.getMonth()),
    is_seasonal_buyer: purchaseDate && purchaseDate.getMonth() === now.getMonth() && product_age_months >= 11,
    single_category: true, // Placeholder for real logic
    messages_sent: customer.messages_sent || 0,
    messages_responded: customer.messages_responded || 0,
    visit_frequency: customer.visit_frequency || 0,
    days_since_last_visit: customer.last_visit_date ? Math.floor((now - new Date(customer.last_visit_date)) / 86400000) : 999,
    has_abandoned_cart: false,
    confidence: customer.phone ? 90 : 30,
    expected_conversion_score: Math.min(100, 50 + (purchase_count * 5) - ((days_since_last_purchase || 0) / 10))
  };
}

export function assignBestCampaign(customer, thresholds = {}) {
  const metrics = computeCustomerMetrics(customer);
  const globalCooldownDays = 7;

  if (customer.last_message_date) {
    const lastSent = new Date(customer.last_message_date);
    if ((new Date() - lastSent) / 86400000 < globalCooldownDays) return { campaign: null, reason: 'Cooldown', metrics, blocked: 1 };
  }

  // Filter all campaigns the customer qualifies for
  const qualified = CAMPAIGNS.filter(c => c.qualify(metrics, thresholds));

  if (qualified.length === 0) return { campaign: null, reason: 'None', metrics, blocked: 0 };

  // STRICT PRIORITY: Sort by priority ascending (1 is highest)
  qualified.sort((a, b) => a.priority - b.priority);
  const winner = qualified[0];

  
  // Calculate urgency level for UI display
  let urgency = { level: 'upcoming', label: 'Active', color: '#22c55e', emoji: '🟢' };
  if (metrics.urgency_score >= 70) {
    urgency = { level: 'overdue', label: 'High Urgency', color: '#ef4444', emoji: '🔴' };
  } else if (metrics.urgency_score >= 40) {
    urgency = { level: 'due_soon', label: 'Due Soon', color: '#f59e0b', emoji: '🟡' };
  }

  return {
    customer,
    trigger: { ...winner, urgency },
    reason: winner.label,
    metrics,
    personalizedMessage: generateMessage(metrics, winner.type),
    allQualified: qualified.length,
    blocked: qualified.length - 1
  };
}

export function assignAllCustomers(customers) {
  const allMetrics = customers.map(c => computeCustomerMetrics(c));
  const sortedSpend = allMetrics.map(m => m.total_spend).sort((a, b) => a - b);
  const thresholds = {
    spend_p90: sortedSpend[Math.floor(sortedSpend.length * 0.9)] || 100000,
    spend_p75: sortedSpend[Math.floor(sortedSpend.length * 0.75)] || 60000,
    aov_p75: 25000, aov_p25: 5000,
    purchase_p90: 5, inactive_p75: 90
  };

  const allResults = customers.map(c => assignBestCampaign(c, thresholds)).filter(r => r.trigger);
  const totalBlocked = allResults.reduce((sum, r) => sum + (r.blocked || 0), 0);

  const results = { 
    all: allResults, 
    meta: { 
      totalUnique: customers.length, 
      assignedCount: allResults.length, 
      unassignedCount: customers.length - allResults.length,
      duplicatesPrevented: totalBlocked 
    } 
  };
  
  // Grouping for breakdown
  for (const c of CAMPAIGNS) results[c.type] = allResults.filter(r => r.trigger.type === c.type);

  return results;
}

export function getIntelligenceDashboardStats(results) {
  const stats = { 
    totalUnique: results.meta.totalUnique, 
    assignedCount: results.meta.assignedCount, 
    duplicatesPrevented: results.meta.duplicatesPrevented,
    totalChurnRisk: (results.dormancy_90d?.length || 0) + (results.win_back_180d?.length || 0),
    totalVIP: results.vip_milestone?.length || 0,
    totalRecovery: results.complaint_recovery?.length || 0,
    loyaltyHighCount: results.all.filter(r => r.metrics.loyalty_score >= 70).length,
    avgConfidence: results.all.length > 0 ? results.all.reduce((sum, r) => sum + r.metrics.confidence, 0) / results.all.length : 0,
    satisfactionScore: 88, // Placeholder for aggregate feedback
    campaignBreakdown: {} 
  };

  for (const c of CAMPAIGNS) {
    const entries = results[c.type] || [];
    stats.campaignBreakdown[c.type] = {
      count: entries.length, 
      label: c.label, 
      icon: c.icon, 
      color: c.color,
      priority: c.priority,
      avgConfidence: entries.length > 0 ? entries.reduce((sum, e) => sum + e.metrics.confidence, 0) / entries.length : 0,
      expectedRevenue: entries.reduce((sum, e) => sum + (e.metrics.avg_order_value || 1000), 0)
    };
  }
  return stats;
}
