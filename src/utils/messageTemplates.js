/**
 * AI-Style Message Templates (Hinglish)
 * Personalized message generation without external API
 */

const FEEDBACK_TEMPLATES = [
  `Hello {name}! 👋 It has been 15 days since you purchased your {item}. How is it performing? 😊 Please let us know if you need any assistance, or leave us a review if you are happy with the service!`,
  `Hi {name}! You have been using your {item} for two weeks now. We hope everything is going well! 👍 Could we get a quick piece of feedback? It helps us improve our service for you.`,
  `Hello {name}! 👋 We are checking in to see how your experience with the {item} has been so far. We are always here to help. Please reply to share your feedback or leave a review!`,
];

const SERVICE_TEMPLATES = [
  `Hello {name}! 🙏 It has been {months} months since you purchased your {item} from us. It is now time for a routine service. Book your slot today to keep your {item} running like new! Reply or call us to schedule. 📞`,
  `Hi {name}, how are you? 😊 Your {item} has reached its {months}-month milestone. A professional service will ensure peak performance. Shall we book a maintenance slot for you today? We also offer home service for your convenience! 🏠`,
  `Hello {name}! Your {item} is due for its {months}-month service. Timely maintenance can significantly extend the life of your product! 💪 Special offer: Book this week for a 10% discount. Interested? 🎉`,
];

const UPGRADE_TEMPLATES = [
  `Hi {name}! 🚀 It has been {months} months since you bought your {item}. New models with advanced features have just arrived! We have some great exchange offers available — why not visit the shop to take a look? 😊`,
  `Hello {name}! Your {item} is now {months} months old. We have just launched new models with better performance, lower power consumption, and more features! 🌟 We can offer a great trade-in value for your current {item}. Interested?`,
  `Hi {name}, your {item} is now {months} months old. The latest version offers 40% more efficiency! 📊 Special upgrade offer: Trade in your old device for the new one + easy monthly payments available. Would you like to discuss? 💬`,
];

const UPSELL_TEMPLATES = [
  `Hi {name}! 👋 Enhancing your {item} with the right accessories can make your experience even better! We have a range of compatible accessories in stock. Would you like to see them? 🛍️`,
  `Hello {name}! 😊 It has been {months} months since you purchased your {item}. Many customers who bought this also love our matching accessories — the feedback has been excellent! We can offer you a special price. Interested?`,
  `Hi {name}! We have just received premium accessories for your {item}. ✨ Original quality with full warranty. These will help protect your device and extend its lifespan. Shall I send you the details? 📱`,
];

const WARRANTY_TEMPLATES = [
  `⚠️ Hi {name}! Important update: The warranty for your {item} is set to expire in {months} months. You can extend your warranty now for total peace of mind. Would you like the details? 🛡️`,
  `Hello {name}, this is an important reminder. The factory warranty for your {item} will expire soon. You can secure an extended warranty plan for just ₹{price}/year. Protect your investment today? 🔒`,
  `Hi {name}! The warranty period for your {item} is almost complete. We recommend a final free check-up before it expires and perhaps looking at an extension. When can you drop by the shop? 📅`,
];

const SERVICE_DUE_TEMPLATES = [
  `Namaste {name} ji! 🙏 Aapke {item} ki urgent service due hai. Performance optimize karne ke liye aaj hi check karwayein. 🛠️`,
  `Hello {name} ji! Reminder: Aapka {item} service milestone cross kar chuka hai. Please visit for a quick checkup! ✨`,
];

const REACTIVATION_TEMPLATES = [
  `Namaste {name} ji! 👋 Bahut time ho gaya aap se mile. Kaise hain aap? Hamare paas {item} के naye model aur offers aaye hain. Ek baar shop visit kijiye na! 😊`,
  `Hi {name} ji! We miss you at Smart Choice. Aapne long time pehle {item} liya tha. Aapke liye ek special 'Welcome Back' discount ready hai! 🎁`,
];

const VIP_OFFER_TEMPLATES = [
  `Congratulations {name} ji! 🎉 Aap hamare VIP customer hain. Aapke {item} ke liye exclusive 20% OFF coupon code: VIP20. ✨ 💎`,
  `Namaste {name} ji! Aap hamare loyal customer hain isliye aapko priority access mil raha hai hamari new collection pe. 🌟`,
];

const FESTIVAL_TEMPLATES = [
  `Smart Choice ki taraf se aapko aur aapke parivaar ko Tyohar ki dheron shubhkamnayein! 🪔 Iss festive season, {item} upgrade pe payein bumper cashbacks! 🎆`,
  `Happy Festival {name} ji! 🎈 Khushiyon ke mausam mein, shop pe special deals chal rahi hain for our {item} owners. 🛍️`,
];

const CUSTOM_TEMPLATES = [
  `Hello {name}! 🙏 {message}`,
  `Hi {name}! {message}. Please reply or call us for more information. 📞`,
];

/**
 * Get random template for a trigger type
 */
function getRandomTemplate(type) {
  const templates = {
    feedback: FEEDBACK_TEMPLATES,
    service_reminder: SERVICE_TEMPLATES,
    upgrade: UPGRADE_TEMPLATES,
    upsell: UPSELL_TEMPLATES,
    warranty_expiry: WARRANTY_TEMPLATES,
    service_due: SERVICE_DUE_TEMPLATES,
    reactivation: REACTIVATION_TEMPLATES,
    vip_offer: VIP_OFFER_TEMPLATES,
    festival: FESTIVAL_TEMPLATES,
    custom: CUSTOM_TEMPLATES
  };

  const list = templates[type] || CUSTOM_TEMPLATES;
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * Generate a personalized message for a customer
 */
export function generateMessage(customer, triggerType, customMessage = '') {
  const template = getRandomTemplate(triggerType);
  const purchaseDate = new Date(customer.purchase_date);
  const now = new Date();
  const diffTime = Math.abs(now - purchaseDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const months = Math.floor(
    (now.getFullYear() - purchaseDate.getFullYear()) * 12 +
    (now.getMonth() - purchaseDate.getMonth())
  );

  const message = template
    .replace(/{name}/g, customer.name)
    .replace(/{item}/g, customer.item)
    .replace(/{months}/g, months.toString())
    .replace(/{days}/g, diffDays.toString())
    .replace(/{price}/g, '999')
    .replace(/{message}/g, customMessage);

  return message;
}

/**
 * Generate messages for a batch of customers
 */
export function generateBulkMessages(customers, triggerType) {
  return customers.map(customer => ({
    customer,
    message: generateMessage(customer, triggerType),
    triggerType
  }));
}

/**
 * Generate WhatsApp link for a message
 */
export function getWhatsAppLink(phone, message) {
  // Clean phone number - remove spaces, dashes, etc
  let cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Add India country code if not present
  if (!cleanPhone.startsWith('+')) {
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '+91' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('91')) {
      cleanPhone = '+91' + cleanPhone;
    } else {
      cleanPhone = '+' + cleanPhone;
    }
  }

  return `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(message)}`;
}

export { FEEDBACK_TEMPLATES, SERVICE_TEMPLATES, UPGRADE_TEMPLATES, UPSELL_TEMPLATES, WARRANTY_TEMPLATES };
