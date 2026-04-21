/// <reference path="../deno.d.ts" />
import { serve } from "std/http/server.ts"
import { createClient } from "supabase-js"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseClient = createClient(supabaseUrl, supabaseKey)

    // 1. Fetch eligible targets from the logic view
    // Note: The view enforces "One Customer = One Campaign" via priority ranking
    const { data: targets, error: targetError } = await supabaseClient
      .from('active_campaign_targets')
      .select('*');

    if (targetError) throw targetError;

    const results = {
      processed: targets?.length || 0,
      assigned: 0,
      errors: [] as string[]
    };

    for (const target of targets || []) {
      try {
        // 2. Cooldown check (prevent spamming the same trigger)
        const { data: recent, error: cooldownError } = await supabaseClient
          .from('campaign_assignments')
          .select('id')
          .eq('customer_id', target.customer_id)
          .eq('trigger_id', target.trigger_id)
          .gt('assigned_on', new Date(Date.now() - (target.cooldown_days || 30) * 24 * 60 * 60 * 1000).toISOString())
          .limit(1);

        if (cooldownError) throw cooldownError;
        if (recent && recent.length > 0) continue;

        // 3. Create Campaign Assignment
        const { error: assignError } = await supabaseClient
          .from('campaign_assignments')
          .insert({
            store_id: target.store_id,
            customer_id: target.customer_id,
            trigger_id: target.trigger_id,
            status: 'pending'
          });

        if (assignError) throw assignError;

        // 4. Queue Message
        const template = target.message_template || "Hello {name}!";
        const message = template
          .replace(/{name}/g, target.name)
          .replace(/{item}/g, target.last_item || 'product');

        const { error: queueError } = await supabaseClient
          .from('message_queue')
          .insert({
            store_id: target.store_id,
            customer_id: target.customer_id,
            phone: target.phone,
            message: message,
            trigger_id: target.trigger_id,
            status: 'pending',
            scheduled_at: new Date().toISOString()
          } as any);

        if (queueError) throw queueError;
        results.assigned++;

      } catch (innerError) {
        results.errors.push(`Customer ${target.customer_id}: ${innerError instanceof Error ? innerError.message : String(innerError)}`);
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
