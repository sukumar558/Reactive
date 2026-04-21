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
      .from('profiles')
      .select('id, whatsapp_cloud_token, whatsapp_phone_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) throw new Error('Profile not found');

    const payload: MessagePayload = await req.json();
    const campaignId = req.headers.get('x-campaign-id'); // Optional link

    // Insert all messages into the queue for background processing
    const queueEntries = payload.messages.map(msg => ({
      user_id: profile.id,
      campaign_id: campaignId || null,
      phone: msg.phone,
      message: msg.body,
      status: 'pending',
      scheduled_at: new Date().toISOString()
    }));

    const { error: queueError } = await supabaseClient
      .from('message_queue')
      .insert(queueEntries);

    if (queueError) throw queueError;

    return new Response(JSON.stringify({
      success: true,
      queued: queueEntries.length,
      message: "Messages added to background queue for reliable delivery."
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
