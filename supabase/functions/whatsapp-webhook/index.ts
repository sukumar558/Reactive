import { serve } from "std/http/server.ts"
import { createClient } from "supabase-js"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const url = new URL(req.url)

  // 1. Webhook Verification (GET)
  // Meta sends a GET request with a hub.verify_token to verify the endpoint
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')

    // Use a secret from environment or default for testing
    const VERIFY_TOKEN = Deno.env.get('WHATSAPP_VERIFY_TOKEN') || 'reactivate_secret_123'

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook verified successfully!')
      return new Response(challenge, { status: 200 })
    }
    return new Response('Verification failed', { status: 403 })
  }

  // 2. Webhook Notification (POST)
  // Meta sends actual message data here
  if (req.method === 'POST') {
    try {
      const payload = await req.json()
      console.log('Incoming Webhook Payload:', JSON.stringify(payload, null, 2))

      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

      // Extract entry, changes, and value
      const entry = payload.entry?.[0]
      const changes = entry?.changes?.[0]
      const value = changes?.value

      // Check if it's a message (not just a status update)
      if (value?.messages?.[0]) {
        const message = value.messages[0]
        const from = message.from // Phone number
        const body = message.text?.body
        const messageId = message.id
        const timestamp = message.timestamp
        const metadata = value.metadata // contains our phone_number_id

        // Find which profile this belongs to using phone_number_id
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('whatsapp_phone_id', metadata.phone_number_id)
          .single()

        if (profile) {
          // Find customer by phone (cleaning number)
          const cleanPhone = from.replace(/\D/g, '')
          const { data: customer } = await supabaseAdmin
            .from('customers')
            .select('id')
            .eq('user_id', profile.id)
            .ilike('phone', `%${cleanPhone.slice(-10)}%`)
            .single()

          // Log the message
          await supabaseAdmin
            .from('activity_logs')
            .insert({
              user_id: profile.id,
              type: 'inbound_message',
              action: `Message from ${from}`,
              meta: {
                customer_id: customer?.id || null,
                from_phone: from,
                message_body: body,
                message_type: message.type,
                provider_message_id: messageId,
                full_payload: payload
              }
            })
          
          console.log(`Log saved for ${from}: ${body}`)
        }
      }

      // Always return 200 OK to Meta immediately
      return new Response(JSON.stringify({ success: true }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      })

    } catch (error: any) {
      console.error('Webhook processing error:', error.message)
      // Still return 200 to prevent Meta from retrying and flooding
      return new Response(JSON.stringify({ error: error.message }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      })
    }
  }

  return new Response('Method not allowed', { status: 405 })
})
