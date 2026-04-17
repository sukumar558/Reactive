import { serve } from "std/http/server.ts"
import { createClient } from "supabase-js"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MILESTONES = [
  { type: 'feedback', days: 15 },
  { type: 'upsell', months: 3 },
  { type: 'service_reminder', months: 6 },
  { type: 'vip_offer', months: 9 },
  { type: 'service_due', months: 10 },
  { type: 'warranty_expiry', months: 11 },
  { type: 'upgrade', months: 12 },
  { type: 'reactivation', months: 18 }
];

interface Templates {
  [key: string]: string[];
}

const TEMPLATES: Templates = {
  feedback: [
    "Namaste {name} ji! 🙏 Aapne exactly 15 din pehle {item} liya tha. Kaisa chal raha hai? 😊 Agar koi problem ho toh batayein, aur agar accha laga toh review zaroor dein!",
    "Hi {name} ji! Aapka {item} use karte hue 2 hafte ho gaye hain. Hope everything is great! 👍 Ek chota feedback mil sakta hai kya? Hamare liye bohot zaroori hai."
  ],
  service_reminder: [
    "Namaste {name} ji! 🙏 Aapne 6 mahine pehle {item} liya tha hamare yahan se. Ab service ka time aa gaya hai. Aaj hi slot book karein? 🔧",
    "Hello {name} ji! Aapka {item} ka 6 month service due hai. Expert service se life badhti hai! 🚀 Kab aayen shop pe?"
  ],
  service_due: [
    "Namaste {name} ji! 🙏 Aapke {item} ki urgent service due hai. Aaj hi check karwayein. 🛠️",
    "Hello {name} ji! Reminder: Aapka {item} service milestone cross kar chuka hai! ✨"
  ],
  reactivation: [
    "Namaste {name} ji! 👋 Bahut time ho gaya aap se mile. Hamare paas {item} के naye models aaye hain. Visit shop! 😊",
    "Hi {name} ji! We miss you! Aapke liye ek special discount ready hai for your next {item} purchase! 🎁"
  ],
  vip_offer: [
    "Congratulations {name} ji! 🎉 Aap hamare VIP customer hain. Exclusive 20% OFF code: VIP20. 💎",
    "Namaste {name} ji! Loyal customer priority access for new {item} collection! 🌟"
  ],
  festival: [
    "Smart Choice ki taraf se Happy Festival! 🪔 {item} upgrade pe bumper cashbacks! 🎆",
    "Happy Festival {name} ji! 🎈 Special seasonal deals on {item}! 🛍️"
  ],
  upsell: [
    "Hi {name} ji! 👋 Aapke {item} ke liye compatible accessories aa gaye hain with amazing quality. ✨ Dekhne aaiye na shop pe? — Smart Choice Mobile",
    "Namaste {name} ji! Aapke {item} ko aur better banane ke liye premium covers aur parts available hain. 🛍️ Aaj hi visit karein!"
  ],
  warranty_expiry: [
    "⚠️ {name} ji! Important: Aapke {item} ki warranty jaldi khatam ho rahi hai. Extended warranty le lein toh tension free rahenge. Details chahiye? 🛡️",
    "Hello {name} ji! Factory warranty khatam hone se pehle free checkup karwa lein. Kab aayen? 🔒"
  ],
  upgrade: [
    "🚀 {name} ji! Aapka {item} ab 1 saal purana ho gaya hai. Market mein naye models aa gaye hain with exchange offers! Purana dein, naya lein. 📱",
    "Namaste {name} ji! Amazing Upgrade Offer: Purane {item} pe best exchange value milega. Aaj hi offer check karein! 🌟"
  ]
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Get all profiles with automation active
    const { data: profiles, error: pError } = await supabaseAdmin
      .from('ra_profiles')
      .select('*')
      .eq('automation_active', true)
      .not('whatsapp_cloud_token', 'is', null)

    if (pError) throw pError

    const totalProcessed = { businesses: profiles.length, messagesSent: 0 }

    for (const profile of profiles as any[]) {
      // 2. Fetch customers for this profile
      const { data: customers, error: cError } = await supabaseAdmin
        .from('ra_customers')
        .select('*')
        .eq('user_id', profile.id)

      if (cError) continue

      const eligibleThisRun = []

      for (const customer of (customers as any[])) {
        const purchaseDate = new Date(customer.purchase_date)
        const now = new Date()

        // Exact Milestone Check
        for (const m of MILESTONES) {
          const target = new Date(purchaseDate)
          if (m.days) target.setDate(target.getDate() + m.days)
          else target.setMonth(target.getMonth() + (m.months || 0))

          // If milestone is TODAY (or within last 24h)
          const isToday = target.toDateString() === now.toDateString()
          const wasRecentlySent = customer.last_automated_trigger_type === m.type && customer.last_automated_date === now.toISOString().split('T')[0]

          if (isToday && !wasRecentlySent) {
            eligibleThisRun.push({ customer, type: m.type })
          }
        }
      }

      if (eligibleThisRun.length > 0) {
        // 3. Send Messages
        const campaignTitle = `Auto-Run @ ${new Date().toLocaleDateString()}`
        const { data: campaign, error: campaignError } = await supabaseAdmin
          .from('ra_campaigns')
          .insert({
            user_id: profile.id,
            title: campaignTitle,
            trigger_type: 'automation',
            campaign_type: 'automation',
            status: 'completed'
          })
          .select()
          .single()

        if (campaignError || !campaign) continue

        for (const item of eligibleThisRun) {
          const { customer, type } = item
          // @ts-ignore
          const templateList = TEMPLATES[type] || TEMPLATES.feedback // fallback
          const template = templateList[Math.floor(Math.random() * templateList.length)]
          const body = template
            .replace(/{name}/g, customer.name)
            .replace(/{item}/g, customer.item)

          // Insert into Message Queue with campaign/customer links
          const { error: qError } = await supabaseAdmin
            .from('message_queue')
            .insert({
              user_id: profile.id,
              campaign_id: (campaign as any).id,
              customer_id: customer.id,
              phone: customer.phone,
              message: body,
              status: 'pending',
              scheduled_at: new Date().toISOString()
            })

          if (!qError) {
            totalProcessed.messagesSent++
            // Update customer
            await supabaseAdmin
              .from('ra_customers')
              .update({
                last_contact_date: new Date().toISOString(),
                last_automated_trigger_type: type,
                last_automated_date: new Date().toISOString().split('T')[0]
              })
              .eq('id', customer.id)

            // Log for dashboard details (keep status as pending until worker sends it)
            await supabaseAdmin
              .from('ra_campaign_customers')
              .insert({
                campaign_id: (campaign as any).id,
                customer_id: customer.id,
                personalized_message: body,
                status: 'pending'
              })

            // Log for general message history
            await supabaseAdmin
              .from('ra_message_history')
              .insert({
                user_id: profile.id,
                customer_id: customer.id,
                campaign_id: (campaign as any).id,
                message: body,
                trigger_type: type,
                sent_at: new Date().toISOString()
              })
          }
        }
      }
    }

    return new Response(JSON.stringify(totalProcessed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
