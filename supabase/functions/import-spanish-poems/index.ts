import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function inferTags(title: string, lines: string[]): string[] {
  const tags: string[] = ["classic"];
  const text = (title + " " + lines.join(" ")).toLowerCase();
  if (text.match(/amor|corazón|beso|querida|amada|pasión|enamorad/)) tags.push("love");
  if (text.match(/muerte|morir|tumba|sepulcro|funeral|difunto/)) tags.push("mortality");
  if (text.match(/naturaleza|árbol|flor|río|montaña|mar|océano|viento|cielo|sol|luna|pájaro/)) tags.push("nature");
  if (text.match(/esperanza|sueño|fe|creer|luz/)) tags.push("hope");
  if (text.match(/dolor|pena|llanto|lágrima|luto|triste/)) tags.push("heartbreak");
  if (text.match(/alegría|feliz|risa|gozo|contento/)) tags.push("joy");
  if (text.match(/guerra|batalla|soldado|lucha|espada/)) tags.push("war");
  if (text.match(/dios|cielo|oración|alma|divino|espíritu/)) tags.push("spiritual");
  if (text.match(/soledad|solo|silencio|quietud/)) tags.push("solitude");
  if (text.match(/valor|valiente|fuerte|surgir|conquistar/)) tags.push("courage");
  return tags.slice(0, 5);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { offset = 0, limit = 500 } = await req.json().catch(() => ({}));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch from Hugging Face datasets API
    const hfUrl = `https://datasets-server.huggingface.co/rows?dataset=andreamorgar%2Fspanish_poetry&config=default&split=train&offset=${offset}&length=${limit}`;
    console.log(`Fetching Spanish poems offset=${offset} limit=${limit}`);

    const hfRes = await fetch(hfUrl);
    if (!hfRes.ok) {
      const errText = await hfRes.text();
      throw new Error(`HuggingFace API error ${hfRes.status}: ${errText}`);
    }

    const hfData = await hfRes.json();
    const rows = hfData.rows || [];
    const totalRows = hfData.num_rows_total || 0;

    console.log(`Got ${rows.length} rows, total available: ${totalRows}`);

    let totalImported = 0;
    const errors: string[] = [];

    const poemRows = rows.map((row: any) => {
      const r = row.row;
      const content = (r.content || "").trim();
      const title = (r.title || "Sin título").trim();
      const author = (r.author || "Anónimo").trim();
      const lines = content.split("\n");
      const excerpt = lines.slice(0, 2).join("\n");

      return {
        title,
        content,
        excerpt: excerpt.length > 150 ? excerpt.substring(0, 150) + "..." : excerpt,
        author_name: author,
        tags: inferTags(title, lines),
        language: "Spanish",
        user_id: null,
      };
    }).filter((p: any) => p.content.length > 0 && p.title.length > 0);

    // Insert in batches of 50
    for (let i = 0; i < poemRows.length; i += 50) {
      const batch = poemRows.slice(i, i + 50);
      const { error } = await supabase.from("poems").insert(batch);
      if (error) {
        errors.push(`Batch ${i}: ${error.message}`);
      } else {
        totalImported += batch.length;
      }
    }

    console.log(`Imported ${totalImported} Spanish poems`);

    return new Response(JSON.stringify({
      success: true,
      totalImported,
      totalAvailable: totalRows,
      nextOffset: offset + limit,
      hasMore: offset + limit < totalRows,
      errors: errors.slice(0, 5),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Import error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
