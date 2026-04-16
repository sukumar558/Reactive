import { serve } from "std/http/server.ts"
import { createClient } from "supabase-js"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface MessagePayload {
  messages: Array<{
    phone: string;
    body: string;
  }>;
}

interface MetaResponse {
  messaging_product: string;
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
  error?: {
    message: string;
    type: string;
    code: number;
    error_data?: any;
  };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } }
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const { data: profile, error: profileError } = await supabaseClient
      .from('ra_profiles')
      .select('whatsapp_cloud_token, whatsapp_phone_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.whatsapp_cloud_token || !profile?.whatsapp_phone_id) {
      throw new Error('WhatsApp API credentials missing. Please set them in Integrations.');
    }

    const payload: MessagePayload = await req.json();
    if (!payload.messages || !Array.isArray(payload.messages)) {
      throw new Error('Invalid payload. Expected an array of messages.');
    }

    const results = [];

    // Send messages sequentially to Meta API
    for (const msg of payload.messages) {
      try {
        const response = await fetch(
          `https://graph.facebook.com/v18.0/${profile.whatsapp_phone_id}/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${profile.whatsapp_cloud_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: msg.phone,
              type: "text",
              text: { body: msg.body },
            })
          }
        );

        const metaResult: MetaResponse = await response.json();
        
        results.push({
          phone: msg.phone,
          success: response.ok,
          metaId: metaResult.messages?.[0]?.id || null,
          error: response.ok ? null : (metaResult.error?.message || 'Unknown Meta API error')
        });
      } catch (e: any) {
        results.push({ phone: msg.phone, success: false, error: e.message });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
