/**
 * Smart Trigger Engine
 * Calculates which customers need follow-up based on purchase date
 */

const TRIGGER_RULES = [
  {
    type: 'feedback',
    label: 'Feedback & Review',
    icon: '⭐',
    days: 15,
    color: '#10b981',
    description: 'Collect feedback 15 days after purchase'
  },
  {
    type: 'service_reminder',
    label: 'Service Due',
    icon: '🔧',
    months: 6,
    color: '#f59e0b',
    description: 'Service reminder for products purchased 6+ months ago'
  },
  {
    type: 'upsell',
    label: 'Accessories Upsell',
    icon: '🛍️',
    months: 3,
    color: '#8b5cf6',
    description: 'Suggest accessories for products purchased 3+ months ago'
  },
  {
    type: 'warranty_expiry',
    label: 'Warranty Expiring',
    icon: '🛡️',
    months: 11,
    color: '#ef4444',
    description: 'Warranty expiring for products purchased 11+ months ago'
  },
  {
    type: 'upgrade',
    label: 'Upgrade Suggestion',
    icon: '🚀',
    months: 12,
    color: '#06b6d4',
    description: 'Suggest upgrade for products purchased 12+ months ago'
  },
  {
    type: 'reactivation',
    label: 'Reactivation',
    icon: '👋',
    months: 18,
    color: '#6366f1',
    description: 'Re-engage customers after 1.5 years'
  },
  {
    type: 'vip_offer',
    label: 'VIP Offer',
    icon: '💎',
    months: 9,
    color: '#d946ef',
    description: 'Exclusive reward for loyal customers'
  },
  {
    type: 'festival',
    label: 'Festival Special',
    icon: '🎉',
    months: 0,
    color: '#f97316',
    description: 'Seasonal/Festival greetings and offers'
  },
  {
    type: 'service_due',
    label: 'Service Due',
    icon: '🛠️',
    months: 10,
    color: '#f59e0b',
    description: 'Urgent service reminder (10 months)'
  }
];

/**
 * Calculate the number of months between two dates
 */
function monthsDiff(dateFrom, dateTo) {
  const from = new Date(dateFrom);
  const to = new Date(dateTo);
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
}

/**
 * Calculate days until a trigger date
 */
function daysUntilTrigger(purchaseDate, rule) {
  const trigger = new Date(purchaseDate);
  if (rule.days) {
    trigger.setDate(trigger.getDate() + rule.days);
  } else {
    trigger.setMonth(trigger.getMonth() + (rule.months || 0));
  }
  const now = new Date();
  const diffTime = trigger.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get urgency level for a customer trigger
 */
function getUrgency(daysRemaining) {
  if (daysRemaining <= 0) return { level: 'overdue', label: 'Overdue', color: '#ef4444', emoji: '🔴' };
  if (daysRemaining <= 7) return { level: 'due_soon', label: 'Due Soon', color: '#f59e0b', emoji: '🟡' };
  if (daysRemaining <= 30) return { level: 'upcoming', label: 'Upcoming', color: '#22c55e', emoji: '🟢' };
  return { level: 'future', label: 'Future', color: '#6b7280', emoji: '⚪' };
}

/**
 * Analyze a single customer and return all applicable triggers
 */
export function analyzeCustomer(customer) {
  const now = new Date();
  const purchaseDate = new Date(customer.purchase_date);
  const monthsSincePurchase = monthsDiff(purchaseDate, now);

  const triggers = [];

  for (const rule of TRIGGER_RULES) {
    const daysRemaining = daysUntilTrigger(customer.purchase_date, rule);
    const urgency = getUrgency(daysRemaining);

    // Include triggers that are overdue, due soon, or upcoming (within 30 days)
    if (daysRemaining <= 30) {
      triggers.push({
        ...rule,
        daysRemaining,
        urgency,
        monthsSincePurchase,
        isActive: true
      });
    }
  }

  // Sort by urgency (overdue first)
  triggers.sort((a, b) => a.daysRemaining - b.daysRemaining);

  return triggers;
}

/**
 * Batch analyze all customers and group by trigger type
 */
export function analyzeAllCustomers(customers) {
  const results = {
    feedback: [],
    service_reminder: [],
    upsell: [],
    warranty_expiry: [],
    upgrade: [],
    reactivation: [],
    vip_offer: [],
    festival: [],
    service_due: [],
    all: []
  };

  for (const customer of customers) {
    const triggers = analyzeCustomer(customer);
    for (const trigger of triggers) {
      const entry = { customer, trigger };
      results[trigger.type].push(entry);
      results.all.push(entry);
    }
  }

  // Sort each group by urgency
  for (const key of Object.keys(results)) {
    results[key].sort((a, b) => a.trigger.daysRemaining - b.trigger.daysRemaining);
  }

  return results;
}

/**
 * Get dashboard stats from trigger analysis
 */
export function getDashboardStats(triggerResults) {
  return {
    totalOverdue: triggerResults.all.filter(r => r.trigger.urgency.level === 'overdue').length,
    totalDueSoon: triggerResults.all.filter(r => r.trigger.urgency.level === 'due_soon').length,
    totalUpcoming: triggerResults.all.filter(r => r.trigger.urgency.level === 'upcoming').length,
    serviceCount: triggerResults.service_reminder.length,
    upsellCount: triggerResults.upsell.length,
    warrantyCount: triggerResults.warranty_expiry.length,
    upgradeCount: triggerResults.upgrade.length,
    feedbackCount: triggerResults.feedback.length,
    reactivationCount: triggerResults.reactivation.length,
    vipCount: triggerResults.vip_offer.length,
    total: triggerResults.all.length
  };
}

export { TRIGGER_RULES, monthsDiff, daysUntilTrigger, getUrgency };
