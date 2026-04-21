import { serve } from "std/http/server.ts";
import { createClient } from "supabase-js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // @ts-ignore
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // 1. Atomically claim pending jobs
  // This uses 'FOR UPDATE SKIP LOCKED' via a Postgres function
  const { data: jobs, error } = await supabase
    .rpc('claim_message_jobs', { worker_limit: 20 });

  if (error) {
    console.error("Claim jobs error:", error);
    return new Response(JSON.stringify(error), { status: 500, headers: corsHeaders });
  }

  // 2. Fetch profiles for the claimed jobs manually (as RPC doesn't join)
  const userIds = [...new Set(jobs?.map((j: any) => j.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, whatsapp_cloud_token, whatsapp_phone_id')
    .in('id', userIds);

  const results = [];

  for (const job of jobs ?? []) {
    // Sync 'processing' status to dashboard immediately
    if (job.campaign_id && job.customer_id) {
      await supabase
        .from("customer_campaigns")
        .update({ status: "processing" })
        .eq("campaign_id", job.campaign_id)
        .eq("customer_id", job.customer_id);
    }

    try {
      const profile = profiles?.find((p: any) => p.id === job.user_id);
      if (!profile?.whatsapp_cloud_token || !profile?.whatsapp_phone_id) {
        throw new Error("Missing WhatsApp configuration for user");
      }

      // Send via WhatsApp Cloud API
      const res = await fetch(
        `https://graph.facebook.com/v18.0/${profile.whatsapp_phone_id}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${profile.whatsapp_cloud_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: job.phone,
            type: "text",
            text: { body: job.message },
          })
        }
      );

      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error?.message || "WhatsApp API failure");

      // Stage 3: 'sent'
      const providerMsgId = payload.messages?.[0]?.id || null;
      await supabase
        .from("message_queue")
        .update({
          status: "sent",
          provider_message_id: providerMsgId,
          delivery_status: "sent",
          sent_at: new Date().toISOString(),
          provider_response: JSON.stringify(payload)
        })
        .eq("id", job.id);

      // Audit Log
      await supabase.from("message_status_history").insert({
        message_id: job.id,
        status: "sent",
        provider_raw: payload
      });

      if (job.campaign_id && job.customer_id) {
        await supabase
          .from("customer_campaigns")
          .update({ 
            status: "sent",
            sent_at: new Date().toISOString()
          })
          .eq("campaign_id", job.campaign_id)
          .eq("customer_id", job.customer_id);
      }
        
      results.push({ id: job.id, success: true });

    } catch (e: any) {
      const attempts = (job.attempts || 0) + 1;
      const isPermanent = attempts >= 3;
      const nextStatus = isPermanent ? "failed" : "pending";

      console.error(`Job ${job.id} failed (Attempt ${attempts}):`, e.message);

      // Back to 'pending' (for retry) OR 'failed' (permanent)
      await supabase
        .from("message_queue")
        .update({
          status: nextStatus,
          retry_count: attempts,
          provider_response: String(e.message),
          scheduled_at: isPermanent ? null : new Date(Date.now() + 5 * 60000).toISOString()
        })
        .eq("id", job.id);

      // Sync status back to dashboard
      if (job.campaign_id && job.customer_id) {
        await supabase
          .from("customer_campaigns")
          .update({ status: nextStatus })
          .eq("campaign_id", job.campaign_id)
          .eq("customer_id", job.customer_id);
      }
        
      results.push({ id: job.id, success: false, error: e.message });
    }
  }

  return new Response(
    JSON.stringify({ success: true, processed: jobs?.length ?? 0, results }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
