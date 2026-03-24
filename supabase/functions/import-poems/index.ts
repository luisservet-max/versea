import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function inferTags(_author: string, title: string, lines: string[]): string[] {
  const tags: string[] = ["classic"];
  const text = (title + " " + lines.join(" ")).toLowerCase();
  if (text.match(/love|heart|beloved|kiss|darling|romance/)) tags.push("love");
  if (text.match(/death|die|grave|mortal|tomb|funeral/)) tags.push("mortality");
  if (text.match(/nature|tree|flower|river|mountain|sea|ocean|wind|sky|sun|moon|bird/)) tags.push("nature");
  if (text.match(/hope|dream|faith|believe|light/)) tags.push("hope");
  if (text.match(/sorrow|grief|weep|tear|mourn|sad/)) tags.push("heartbreak");
  if (text.match(/joy|happy|laugh|delight|merry|glad/)) tags.push("joy");
  if (text.match(/war|battle|soldier|fight|sword/)) tags.push("war");
  if (text.match(/god|heaven|pray|soul|divine|spirit/)) tags.push("spiritual");
  if (text.match(/alone|solitude|lonely|silence|quiet/)) tags.push("solitude");
  if (text.match(/courage|brave|strong|rise|conquer/)) tags.push("courage");
  return tags.slice(0, 5);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { offset = 0, limit = 15 } = await req.json().catch(() => ({}));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch author list
    const authRes = await fetch("https://poetrydb.org/author");
    const authData = await authRes.json();
    const allAuthors: string[] = authData.authors;
    const authors = allAuthors.slice(offset, offset + limit);

    console.log(`Processing authors ${offset}-${offset + limit} of ${allAuthors.length}: ${authors.join(", ")}`);

    let totalImported = 0;
    const errors: string[] = [];

    for (const author of authors) {
      try {
        const poemsRes = await fetch(`https://poetrydb.org/author/${encodeURIComponent(author)}`);
        if (!poemsRes.ok) continue;
        const poems = await poemsRes.json();
        if (!Array.isArray(poems)) continue;

        const rows = poems.map((poem: any) => {
          const lines: string[] = poem.lines || [];
          const content = lines.join("\n");
          const excerpt = lines.slice(0, 2).join("\n");
          return {
            title: poem.title,
            content,
            excerpt: excerpt.length > 150 ? excerpt.substring(0, 150) + "..." : excerpt,
            author_name: poem.author,
            tags: inferTags(poem.author, poem.title, lines),
            user_id: null,
          };
        });

        for (let i = 0; i < rows.length; i += 50) {
          const batch = rows.slice(i, i + 50);
          const { error } = await supabase.from("poems").insert(batch);
          if (error) {
            errors.push(`${author}: ${error.message}`);
          } else {
            totalImported += batch.length;
          }
        }
        console.log(`✓ ${author}: ${poems.length} poems`);
      } catch (e) {
        errors.push(`${author}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      totalImported,
      processedAuthors: authors.length,
      totalAuthors: allAuthors.length,
      nextOffset: offset + limit,
      hasMore: offset + limit < allAuthors.length,
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
