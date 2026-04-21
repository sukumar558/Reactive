// @ts-ignore: Deno standard library
import { serve } from "std/http/server.ts";
// @ts-ignore: Supabase ESM
import { createClient } from "supabase-js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const payload = await req.json();
    console.log("MSG91 Webhook Received:", payload);

    // MSG91 DLR Payload format varies, but usually includes requestId/request_id and status
    const data = Array.isArray(payload) ? payload : [payload];

    for (const report of data) {
      const requestId = report.requestId || report.request_id;
      const status = report.status?.toLowerCase(); // 'delivered', 'failed', 'read' etc.
      
      if (!requestId) continue;

      // 1. Update Message Queue
      const updateData: any = { delivery_status: status };
      if (status === 'delivered') updateData.delivered_at = new Date().toISOString();
      if (status === 'read') updateData.read_at = new Date().toISOString();

      const { data: updated, error } = await supabase
        .from("message_queue")
        .update(updateData)
        .eq("provider_message_id", requestId)
        .select('id');

      if (error) {
        console.error("Error updating message status:", error);
      } else if (updated && updated.length > 0) {
        // 2. Log History
        await supabase.from("message_status_history").insert({
          message_id: updated[0].id,
          status: status,
          provider_raw: report
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Webhook Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
