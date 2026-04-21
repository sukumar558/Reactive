/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  RE-ACTIVATE AI: PROFESSIONAL CRM MESSAGE REPOSITORY          ║
 * ║  25 Strategic Triggers • 3 Variations Each • Premium Tone    ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

const TEMPLATES = {
  // 1. PERSONAL & URGENT
  birthday_today: [
    "Namaste {name} ji! 🙏 Janamdin ki dheron shubhkamnayein! 🎂 Aap hamare bohot valued customer hain. Aapke birthday ko special banane ke liye hamare paas ek surprise gift ready hai. Store visit karein? ✨",
    "Hello {name} ji! 👋 Happy Birthday! 🎉 Humne notice kiya aaj aapka birthday hai. Aap jaise loyal customers ke liye humne ek special surprise reserve kiya hai. Kab aa rahe hain gift lene? 🎁",
    "Janamdin Mubarak {name} ji! 🎂 Is special occasion par aapke liye ek exclusive 'Birthday Reward' unlock hua hai. Detail chahiye? 🌟"
  ],
  service_due: [
    "Namaste {name} ji! 🙏 Aapke {item} ki best performance ke liye service due hai. 🔧 Timely service se life badhti hai aur repairs ka kharcha bachta hai. Slot book karein? 📞",
    "Hello {name} ji! ⏰ Reminder: Aapka {item} service ke liye due hai. Early maintenance se reliability bani rehti hai. Kab visit karenge? 🛠️",
    "Hi {name} ji! 👋 Aapka {item} hamare liye important hai. Smooth running ke liye scheduled maintenance zaroori hai. Aaj hi appointment lein! 🔧"
  ],
  warranty_expiry: [
    "⚠️ {name} ji! Aapke {item} ki warranty sirf {days} din mein expire ho rahi hai. Extended warranty le lein toh tension-free rahenge! 🛡️ Details chahiye?",
    "Hello {name} ji! Important: {item} ki factory warranty khatam hone wali hai. Pehle free checkup karwa lein. Kab aayen? 🔒",
    "Hi {name} ji! 😰 Warranty expire hone se pehle action lein — security pe koi compromise nahi! Details bhejein?"
  ],
  complaint_recovery: [
    "Dear {name} ji, pichli baar hamari service best nahi rahi. 🙏 Hum sincerely sorry hain. Aapka trust wapas earn karne ke liye humne aapke liye ek special care package ready kiya hai. 🩹",
    "Hello {name} ji! 🙏 We value your feedback. Aapki pichli complaint ke baad humne improvements ki hain. Aapke next visit par 30% OFF as an apology. 🩹",
    "Namaste {name} ji! ✨ Ek mauka aur dein? Hum aapka experience sudharna chahte hain. Special apology gift aapke account mein add ho gaya hai. 🎁"
  ],
  vip_milestone: [
    "👑 Congratulations {name} ji! Aap hamare Super VIP customer hain. ₹{amount}+ ka trust dikhane ke liye shukriya! ✨ Aapke liye priority service card ready hai. 💎",
    "Namaste {name} ji! 🏆 Elite Status Update: Aap top 5% shoppers mein se hain. Exclusive early access aur premium gifts ke liye store visit karein! 🎁",
    "Hello {name} ji! 🔥 Your loyalty is unmatched. VIP members ke liye is month priority home delivery aur extra bonus points hain. 💎"
  ],

  // 2. POST-PURCHASE LOOP
  satisfaction_check: [
    "Hi {name} ji! 😊 Aapne recently {item} liya tha. Kaisa chal raha hai? Humein umeed hai aapka experience accha hoga. Koi help chahiye toh batayein! ⭐",
    "Hello {name} ji! 👋 Just checking in. Aapka naya {item} kaisa perform kar raha hai? Hum hamesha help ke liye available hain. 👍",
    "Namaste {name} ji! ✨ Aapke new {item} ka experience kaisa raha? Aapka feedback hamare liye bohot valuable hai. 🙏"
  ],
  upgrade_opportunity: [
    "🚀 {name} ji! Aapka {item} ab upgrade ke liye perfect hai! Naye models mein advanced features aur exchange bonus ready hai. 📱 Details dein?",
    "Hello {name} ji! ✨ Upgrade ka sahi time aa gaya! Aapke {item} ke badle naya model lein with Easy EMI aur bumper exchange offers. 🌟",
    "Hi {name} ji! 📈 Tech ka maza latest version mein hai! Aapka {item} exchange karke upgrade karne pe special ₹2000 discount sirf aaj! 📱"
  ],
  first_repeat_nudge: [
    "🔁 Hello {name} ji! {item} kaisa chal raha hai? Hum aapki next purchase pe special 15% discount de rahe hain! Second order = Extra savings 🎉",
    "Hi {name} ji! 👋 Thank you for choosing us. Aapke doosre visit pe ek surprise gift hamari taraf se ready hai! Kab aa rahe hain? 🛍️",
    "Namaste {name} ji! ✨ First experience accha raha? Next shopping pe double reward points payein. Shop now! 🔁"
  ],
  accessory_upsell: [
    "Hi {name} ji! 😊 {item} ke liye matching accessories store pe aa gaye hain. Aapke purchase ke saath special combo discounts hain! 🛍️ Dekhein?",
    "Hello {name} ji! ✨ Apne {item} ko aur behtar banayein! Protective gear aur style accessories ki nayi range aa gayi hai. 📱",
    "Namaste {name} ji! 👋 {item} ke liye curated list of accessories ready hai. Aapke liye special add-on offer available hai. ✨"
  ],
  bulk_loyalty: [
    "📦 {name} ji! Aap hamare frequent buyer hain. Bulk orders pe ab wholesale rates aur priority checkout aapke liye active hai! 🏆",
    "Hello {name} ji! Frequent shopping ke liye thank you! 📦 Aapke liye special bulk-pricing catalog ready hai. Details bhejein? ⭐",
    "Namaste {name} ji! 🔥 Bulk Buyer Status unlocked! Next ₹{amount} se zyada shopping pe free home delivery guaranteed. 📦"
  ],

  // 3. RETENTION & REACTIVATION
  dormancy_90d: [
    "Namaste {name} ji! 👋 Bahut samay ho gaya aapse mile. Humne miss kiya! 😊 Welcome Back voucher aapke account mein add ho gaya hai. Visit karein? 🎁",
    "Hi {name} ji! 😟 We miss seeing you! Aap hamare valued customer hain, isliye aapke next visit par guaranteed benefits ready hain. 🎁",
    "Hello {name} ji! 👋 Aapke bina store adhoora lag raha hai. Aapke liye ek special return offer design kiya hai. Visit kijiye na! 😊"
  ],
  win_back_180d: [
    "🔄 {name} ji! 6 mahine ho gaye! Aapke purane loyalty points expire hone wale hain. ⏳ Inhe aaj hi use karein aur flat 30% OFF payein!",
    "Hello {name} ji! Ek surprise: Aapka favorite product ab stock mein hai with a win-back discount! Ek mauka aur dein? 🔄",
    "Hi {name} ji! ⏳ Final Attempt: Hum aapke purane reward points ko reset hone se bachana chahte hain. Inhe use karne ke liye aaj hi visit karein! 🛒"
  ],
  high_value_dormant: [
    "Namaste {name} ji! 😟 Bahut time ho gaya. Aap hamare ₹{amount}+ ke valued customer hain. Special high-value return gift sirf aapke liye! 🎁",
    "Hi {name} ji! We miss you! Aapke taste ke liye naya premium range aaya hai. Valued customer discount valid till Sunday! ⏳",
    "Hello {name} ji! ✨ Special recognition: Aapke liye personal shopping experience humne book kiya hai. Kab aayenge? 💎"
  ],
  referral_request: [
    "🤝 {name} ji! Aap hamare satisfied customers mein se hain. Friends ko refer karein, aur dono ko ₹500 voucher payein! 🎁",
    "Hi {name} ji! Sharing is caring! 🤝 Refer karna easy hai — aur benefits double! App check karein details ke liye. 📲",
    "Namaste {name} ji! ✨ Aapka trust hamare liye sab kuch hai. Apne circle mein recommend karein aur referral rewards enjoy karein! 🤝"
  ],
  festival_special: [
    "🪔 {name} ji! Tyohar ki shubhkamnayein! Is festive season mein bumper cashback aur free gifts! 🎆 Check out the deals!",
    "Happy Festival {name} ji! 🎈 Badi deals, bade dhamake! Is seasonal sale mein exclusive vouchers sirf hamare customers ke liye. 🛍️",
    "Namaste {name} ji! 🎉 Festival pe naya {item} lene ka best time hai. Zero-downpayment EMI offers available! 🪔"
  ],

  // 4. BEHAVIORAL
  fast_buyer_reward: [
    "⚡ {name} ji! Waah! Back-to-back purchases! Aap hamare Fast Buyer hain — extra bonus points reward points mein add ho gaye! 🎯",
    "Hi {name} ji! Itni jaldi doosri shopping! Reward: Aapke next visit par accessories pe flat 50% OFF! 🎁",
    "Hello {name} ji! ⚡ You are on fire! Fast shoppers ke liye special surprise gift store pe ready hai. Collect kijiye! ✨"
  ],
  category_expert: [
    "🏅 {name} ji! Humne notice kiya aap {category} category ke fan hain! Naye stock pe early access sirf select fans ke liye. 🌟",
    "Hi {name} ji! Aapka taste {category} mein behtareen hai. Humne aapke liye kuch special arrivals shortlist kiye hain. ✨",
    "Namaste {name} ji! 🏅 Category Expert update: Aapke collection ko upgrade karne ke liye naye gadgets aa gaye hain! 🛍️"
  ],
  seasonal_shopper: [
    "📅 {name} ji! Har saal is waqt aap visit karte hain. Is saal ki seasonal deals pehle se better hain! Miss mat kijiye. 🕐",
    "Hi {name} ji! Aapka favorite shopping month aa gaya! 📅 Humne aapke history ke basis pe deals ready ki hain. Dekhein? ⏰",
    "Namaste {name} ji! ✨ Seasonal match found! Early bird offer sirf 24 hours ke liye. Grab it now! 🕐"
  ],
  budget_smart: [
    "💸 {name} ji! Budget shopping is smart shopping! Humne aapke liye deals under ₹4999 shortlist ki hain. Best quality at best price! 🏷️",
    "Hi {name} ji! Savings ka mahina! Quality products ab budget prices mein. Stock khatam hone se pehle visit karein! 💰",
    "Namaste {name} ji! 💸 Value-for-money deals sirf hamare customers ke liye. Check out budget store section! 🏷️"
  ],
  premium_taste: [
    "⬆️ {name} ji! Aapka taste premium hai. Latest flagship models ke liye exclusive demo aur private preview available hai. 💎",
    "Hi {name} ji! Quality over quantity — we know your style. Nayi luxury range ke liye pre-booking start ho gayi hai. 🌟",
    "Namaste {name} ji! ✨ Luxury range updates: Signature collection ab sirf select stores par. Early access link niche hai. 💰"
  ],
  no_response_last: [
    "📭 {name} ji! Humne pehle messages bheje the, shayad aap busy the. Help chahiye toh bas 'REPLY' karein — we are listening! 🔔",
    "Hello {name} ji! No pressure, bas ek check-in message. Agar hum koi help kar sakte hain toh batayein! 💬",
    "Hi {name} ji! 📭 Just a friendly nudge. Hum hamesha service ke liye ready hain. Kuch sawal hai toh puchiye! 📲"
  ],
  hot_lead_nudge: [
    "🔥 {name} ji! Aapne products dekhe but decision nahi liya. Flat 10% instant discount sirf aapke liye to help you decide! 🎯",
    "Hi {name} ji! 🔥 Products are flying off the shelves! Apne selection ko secure karein humare special offer ke saath. ⏳",
    "Hello {name} ji! 🚀 Decide karne ka best time hai! Limited stock aur heavy discounts — don't miss out! 🎯"
  ],
  last_visit_touch: [
    "🏪 {name} ji! Shop visit karne ke liye shukriya. Humein khushi hogi agar hum aapki shopping aur easy bana sakein! 👋",
    "Hi {name} ji! Kal aap store pe aaye the, thanks! Hope you liked the collection. Next visit pe tea hamari taraf se! ☕",
    "Hello {name} ji! 👋 Visit ke baad kuch dimaag mein reh gaya? Help chahiye toh bas ek message kijiye! ✨"
  ],
  abandoned_cart: [
    "🛒 {name} ji! Aapka cart intezar kar raha hai. In products pe abhi bhi special price available hai. Checkout karein? 🛍️",
    "Hi {name} ji! 🛒 Almost Yours! Complete your purchase now and get a surprise accessory for free! 🎁",
    "Hello {name} ji! 🛒 Don't leave your favorites behind! Flat ₹500 discount for completing your cart today. ⏳"
  ],
  general_news: [
    "✨ {name} ji! Kuch naya? Humne shop ko refresh kiya hai with latest electronics. Visit and explore! 👋",
    "Hi {name} ji! 🆕 New Arrivals alert! Electronics ki duniya mein naya kya hai? Store pe check karein! 🌟",
    "Namaste {name} ji! ✨ Stay ahead of tech trends! Weekly new items arrived. See you at the shop! 🛍️"
  ]
};

/**
 * Get a random template for a campaign type
 */
export function getRandomTemplate(type) {
  const list = TEMPLATES[type] || TEMPLATES.general_news;
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * Generate a personalized message for a customer
 */
export function generateMessage(customer, triggerType) {
  const template = getRandomTemplate(triggerType);
  const purchaseDate = new Date(customer.purchase_date || new Date());
  const now = new Date();
  
  const diffDays = customer.days_since_last_purchase || 0;
  const months = customer.product_age_months || 0;

  return template
    .replace(/{name}/g, customer.name || 'Customer')
    .replace(/{item}/g, customer.item_name || 'product')
    .replace(/{months}/g, months.toString())
    .replace(/{days}/g, diffDays.toString())
    .replace(/{brand}/g, customer.brand || 'brand')
    .replace(/{amount}/g, (customer.total_spend || 0).toLocaleString())
    .replace(/{category}/g, customer.category || 'electronics');
}

/**
 * Generate WhatsApp link
 */
export function getWhatsAppLink(phone, message) {
  let cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  if (!cleanPhone.startsWith('+')) {
    if (cleanPhone.startsWith('0')) cleanPhone = '+91' + cleanPhone.substring(1);
    else if (!cleanPhone.startsWith('91')) cleanPhone = '+91' + cleanPhone;
    else cleanPhone = '+' + cleanPhone;
  }
  return `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(message)}`;
}

export { TEMPLATES };
