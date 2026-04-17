import { serve } from "std/http/server.ts"
import { createClient } from "supabase-js"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Get all profiles with sync active
    const { data: profiles, error: pError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('sync_active', true)
      .not('external_sync_url', 'is', null)

    if (pError) throw pError

    const stats = { businesses: profiles.length, imported: 0, updated: 0, skipped: 0, mappings: {} as any }

    for (const profile of profiles as any[]) {
      let url = profile.external_sync_url;

      if (url.includes('docs.google.com/spreadsheets')) {
        url = url.replace(/\/edit.*$/, '/export?format=csv');
      }

      const res = await fetch(url);
      if (!res.ok) continue;

      const csvText = await res.text();
      const lines = csvText.split('\n').map(l => l.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
      if (lines.length === 0) continue;
      
      const numCols = lines[0].length;
      const scores = Array.from({ length: numCols }, () => ({ phone: 0, date: 0, name: 0, item: 0, category: 0, spent: 0 }));

      // 🔍 Score Content (Sample first 10 rows)
      const sample = lines.slice(0, 10);
      sample.forEach(row => {
        row.forEach((cell, i) => {
          if (!cell || i >= numCols) return;
          const clean = cell.trim();
          if (!clean) return;

          // Phone: 10-12 digits
          if (clean.replace(/\D/g, '').length >= 10) scores[i].phone += 2;
          
          // Date: valid date string with separators
          if (!isNaN(Date.parse(clean)) && (clean.includes('/') || clean.includes('-'))) scores[i].date += 2;
          
          // Name: 2-4 words, mostly letters
          const words = clean.split(/\s+/);
          if (words.length >= 2 && words.length <= 4 && /^[a-zA-Z\s.]+$/.test(clean)) scores[i].name += 1.5;
          
          // Category vs Item
          if (clean.length > 2 && clean.length < 15) scores[i].category += 1;
          if (clean.length >= 15 || (words.length > 1 && !/^[a-zA-Z\s.]+$/.test(clean))) scores[i].item += 1;

          // Total Spent: Numeric with optional currency/decimals
          if (/^[\d,.]+$/.test(clean.replace(/[^\d,.]/g, '')) && parseFloat(clean.replace(/[^\d.]/g, '')) > 0) scores[i].spent += 1;
        });
      });

      // 🏆 Pick winners (Highest score for each field wins)
      const getBestIdx = (field: keyof typeof scores[0]) => {
        let max = 0, idx = -1;
        scores.forEach((s, i) => { if (s[field] > max) { max = s[field]; idx = i; } });
        return idx;
      };

      const phoneIdx = getBestIdx('phone');
      const nameIdx = getBestIdx('name');
      const dateIdx = getBestIdx('date');
      const itemIdx = getBestIdx('item');
      const categoryIdx = getBestIdx('category');
      const spentIdx = getBestIdx('spent');

      // Store mappings for feedback
      stats.mappings[profile.id] = {
        name: nameIdx !== -1 ? `Col ${nameIdx + 1}` : 'Not Found',
        phone: phoneIdx !== -1 ? `Col ${phoneIdx + 1}` : 'Not Found',
        item: itemIdx !== -1 ? `Col ${itemIdx + 1}` : 'Not Found',
        purchase_date: dateIdx !== -1 ? `Col ${dateIdx + 1}` : 'Not Found',
        total_spent: spentIdx !== -1 ? `Col ${spentIdx + 1}` : 'Not Found'
      };

      if (phoneIdx === -1) continue;

      // Skip header if it exists
      let startRow = 0;
      const firstRowIsHeader = lines[0].some(c => isNaN(Number(c.replace(/[^\d.]/g, '')))); 
      if (firstRowIsHeader && lines.length > 1) startRow = 1;

      for (let i = startRow; i < lines.length; i++) {
        const row = lines[i];
        if (row.length < 2 || !row[phoneIdx]) {
          stats.skipped++;
          continue;
        }

        const cleanPhone = row[phoneIdx].replace(/\D/g, '');
        if (cleanPhone.length < 10) {
          stats.skipped++;
          continue;
        }

        const customerData = {
          user_id: profile.id,
          name: nameIdx !== -1 ? row[nameIdx] : 'Guest',
          phone: cleanPhone,
          item: itemIdx !== -1 ? row[itemIdx] : 'Unknown',
          purchase_date: dateIdx !== -1 ? new Date(row[dateIdx]).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          total_spent: spentIdx !== -1 ? parseFloat(row[spentIdx].replace(/[^\d.]/g, '')) || 0 : 0,
          category: categoryIdx !== -1 ? row[categoryIdx] : null,
          sync_source: 'google_sheets'
        };

        const { data: existing } = await supabaseAdmin
          .from('customers')
          .select('id')
          .eq('user_id', profile.id)
          .eq('phone', cleanPhone)
          .single();

        const { error: upsertError } = await supabaseAdmin
          .from('customers')
          .upsert(customerData, { onConflict: 'user_id, phone' });

        if (!upsertError) {
          if (existing) stats.updated++;
          else stats.imported++;
        } else {
          stats.skipped++;
        }
      }

      await supabaseAdmin
        .from('profiles')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', profile.id);
    }

    return new Response(JSON.stringify(stats), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
