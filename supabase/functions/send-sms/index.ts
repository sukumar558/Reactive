// @ts-ignore: Deno standard library
import { serve } from "std/http/server.ts";
// @ts-ignore: Supabase ESM
import { createClient } from "supabase-js";

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Pending messages fetch
  const { data: rows, error } = await supabase
    .from("message_queue")
    .select("*")
    .eq("status", "pending")
    .limit(20);

  if (error) {
    console.error("Fetch pending error:", error);
    return new Response(JSON.stringify(error), { status: 500 });
  }

  const results = [];

  for (const row of rows) {
    try {
      // 1. MSG91 API Integration (Flow-based)
      const smsRes = await fetch("https://api.msg91.com/api/v5/flow/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "authkey": Deno.env.get("MSG91_AUTH_KEY")!,
        },
        body: JSON.stringify({
          template_id: Deno.env.get("MSG91_TEMPLATE_ID"),
          recipients: [
            {
              mobiles: row.phone,
              name: row.customer_name || "Customer",
              message: row.message
            }
          ]
        })
      });

      const responseData = await smsRes.json();
      const requestId = responseData.request_id || responseData.message || null;

      if (smsRes.ok && requestId) {
        // 2. SUCCESS: Update queue with provider info
        await supabase
          .from("message_queue")
          .update({
            status: "sent",
            provider_message_id: requestId,
            provider_response: JSON.stringify(responseData),
            sent_at: new Date().toISOString()
          })
          .eq("id", row.id);

        // 3. AUDIT: Log sent state
        await supabase.from("message_status_history").insert({
          message_id: row.id,
          status: "sent",
          provider_raw: responseData
        });

        results.push({ id: row.id, status: 'sent', requestId });
      } else {
        // 4. FAILURE: Update status and retry count
        const newRetryCount = (row.retry_count || 0) + 1;
        await supabase
          .from("message_queue")
          .update({
            status: newRetryCount >= 3 ? "failed" : "pending",
            retry_count: newRetryCount,
            provider_response: JSON.stringify(responseData)
          })
          .eq("id", row.id);

        results.push({ id: row.id, status: 'failed', error: responseData });
      }

    } catch (err) {
      console.error(`Error processing job ${row.id}:`, err);
      const newRetryCount = (row.retry_count || 0) + 1;
      await supabase
        .from("message_queue")
        .update({
          status: newRetryCount >= 3 ? "failed" : "pending",
          retry_count: newRetryCount,
          provider_response: String(err)
        })
        .eq("id", row.id);
      results.push({ id: row.id, status: 'error', error: String(err) });
    }
  }

  return new Response(
    JSON.stringify({ success: true, processed: rows.length, results }),
    { headers: { "Content-Type": "application/json" } }
  );
});
