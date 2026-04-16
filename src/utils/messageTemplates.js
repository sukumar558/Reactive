/**
 * AI-Style Message Templates (Hinglish)
 * Personalized message generation without external API
 */

const FEEDBACK_TEMPLATES = [
  `Namaste {name} ji! 🙏 Aapne 15 din pehle {item} liya tha. Kaisa chal raha hai? 😊 Agar koi problem ho toh batayein, aur agar accha laga toh review zaroor dein!`,
  `Hi {name} ji! Aapka {item} use karte hue 2 hafte ho gaye hain. Hope everything is great! 👍 Ek chota feedback mil sakta hai kya? Hamare liye bohot zaroori hai.`,
  `Hello {name} ji! 👋 Kaise hain aap? Aapke {item} ke baare mein jaana tha — experience kaisa hai? Hum hamesha help ke liye ready hain. Review ke liye reply karein!`,
];

const SERVICE_TEMPLATES = [
  `Namaste {name} ji! 🙏 Aapne {months} mahine pehle {item} liya tha hamare yahan se. Ab service ka time aa gaya hai. Aaj hi booking karwa dein toh aapka {item} bilkul naye jaisa chalega! Reply karein ya call karein. 📞`,
  `{name} ji, kaise hain aap? 😊 Aapke {item} ko {months} mahine ho gaye hain. Expert service se performance aur badhegi. Kya aaj slot book karein aapke liye? Hum ghar pe service bhi dete hain! 🏠`,
  `Hello {name} ji! Aapka {item} ka {months} month service due hai. Timely service se product ki life double hoti hai! 💪 Special offer: Is week book karein toh 10% discount milega. Interested? 🎉`,
];

const UPGRADE_TEMPLATES = [
  `{name} ji! 🚀 Aapne {months} mahine pehle {item} liya tha. Ab market mein naye models aa gaye hain with amazing features! Exchange offer bhi available hai. Dekhne aaiye na shop pe? 😊`,
  `Namaste {name} ji! Aapke {item} ko {months} mahine ho gaye. Naya model launch hua hai — better performance, kam bijli, zyada features! 🌟 Purane {item} pe accha exchange value milega. Interest hai?`,
  `{name} ji, aapka {item} ab {months} months purana ho gaya hai. Latest version mein 40% zyada efficiency hai! 📊 Special upgrade offer: purana dein, naya lein + easy EMI available. Baat karein? 💬`,
];

const UPSELL_TEMPLATES = [
  `Hi {name} ji! 👋 Aapke {item} ke saath ye accessories use karenge toh experience aur bhi amazing hoga! Hamare paas compatible accessories available hain. Dekhenge? 🛍️`,
  `{name} ji, kaise hain? 😊 Aapne {months} mahine pehle {item} liya tha. Kuch customers ne matching accessories liye — unki feedback bohot acchi hai! Aapke liye special price rakhenge. Interest hai?`,
  `Namaste {name} ji! Aapke {item} ke liye premium accessories aa gaye hain. ✨ Original quality, warranty ke saath. Ye use karenge toh {item} ki life bhi badhegi. Details bhejein? 📱`,
];

const WARRANTY_TEMPLATES = [
  `⚠️ {name} ji! Important update: Aapke {item} ki warranty {months} mahine mein expire ho rahi hai. Extended warranty le lein toh tension free rahenge. Details chahiye? 🛡️`,
  `{name} ji, ye zaroori message hai. Aapke {item} ki factory warranty jaldi expire hogi. Extended warranty plan sirf ₹{price}/year mein available hai. Secure kar lein? 🔒`,
  `Hello {name} ji! Aapke {item} ki warranty period complete hone wala hai. Warranty khatam hone se pehle free checkup karwa lein aur extended plan dekhein. Kab aayen shop pe? 📅`,
];

const CUSTOM_TEMPLATES = [
  `Namaste {name} ji! 🙏 {message}`,
  `Hi {name} ji! {message}. Reply karein ya call karein. 📞`,
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
