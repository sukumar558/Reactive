/// <reference path="../deno.d.ts" />
// @ts-ignore: Deno standard library
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore: Supabase ESM
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-ignore: XLSX ESM
import * as XLSX from "https://esm.sh/xlsx";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DataRow {
  [key: string]: string | number | boolean | null;
}

interface CustomerPayload {
  user_id: string;
  name: string;
  phone: string;
  item: string;
  purchase_date: string;
  category: string;
  payment_mode: string;
  sync_source: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // 1. Get all active data sources
    const { data: sources, error: sourceError } = await supabaseClient
      .from('data_sources')
      .select('*')
      .eq('status', 'active');

    if (sourceError) throw sourceError;
    if (!sources) return new Response(JSON.stringify({ message: "No active sources" }), { headers: corsHeaders });

    const syncResults = [];

    for (const source of sources) {
      try {
        let url = source.source_url;
        
        if (url.includes("docs.google.com/spreadsheets/d/")) {
          const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
          if (match) url = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false }) as DataRow[];

        const valid: CustomerPayload[] = [];
        const seen = new Set<string>();
        let duplicates = 0;

        rows.forEach((row, i) => {
          const payload: Partial<CustomerPayload> = {};
          const mapping = source.mapping as Record<string, keyof CustomerPayload>;
          
          Object.entries(mapping).forEach(([col, field]) => {
            if (field) {
              const val = row[col];
              (payload as any)[field] = val ? val.toString().trim() : "";
            }
          });

          const phone = (payload.phone || "").replace(/\D/g, '');
          const rawDate = payload.purchase_date;
          const d = rawDate ? new Date(rawDate) : null;

          if (phone && phone.length >= 10 && d && !isNaN(d.getTime()) && d.getFullYear() >= 2024 && payload.name) {
            const key = phone;
            if (seen.has(key)) {
              duplicates++;
              return;
            }
            seen.add(key);

            valid.push({
              user_id: source.user_id,
              name: payload.name,
              phone: phone,
              item: payload.item || '',
              purchase_date: d.toISOString().split('T')[0],
              category: payload.category || 'General',
              payment_mode: 'Live Sync',
              sync_source: source.source_type
            });
          }
        });

        if (valid.length > 0) {
          const { data: inserted, error: upsertError } = await supabaseClient
            .from('customers')
            .upsert(valid, { onConflict: 'phone,item,purchase_date', ignoreDuplicates: true })
            .select('id');

          if (upsertError) throw upsertError;

          const importedCount = inserted?.length || 0;

          await supabaseClient.from('sync_logs').insert({
            source_id: source.id,
            user_id: source.user_id,
            rows_found: rows.length,
            rows_imported: importedCount,
            rows_skipped: rows.length - importedCount,
            status: 'success',
            message: `Background Sync: ${importedCount} new rows added.`
          });

          await supabaseClient.from('data_sources').update({ 
            last_sync_at: new Date().toISOString(),
            error_message: null
          }).eq('id', source.id);

          syncResults.push({ id: source.id, name: source.source_name, status: 'success', imported: importedCount });
        }

      } catch (innerError) {
        const msg = innerError instanceof Error ? innerError.message : String(innerError);
        await supabaseClient.from('data_sources').update({ 
          error_message: msg,
          status: 'error'
        }).eq('id', source.id);
        
        await supabaseClient.from('sync_logs').insert({
          source_id: source.id,
          user_id: source.user_id,
          status: 'error',
          message: msg
        });
        
        syncResults.push({ id: source.id, name: source.source_name, status: 'error', error: msg });
      }
    }

    return new Response(JSON.stringify({ success: true, results: syncResults }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
