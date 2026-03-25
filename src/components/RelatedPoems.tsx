import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface RelatedPoemsProps {
  poemId: string;
  tags: string[] | null;
  authorName: string;
}

const RelatedPoems = ({ poemId, tags, authorName }: RelatedPoemsProps) => {
  const { data: related = [] } = useQuery({
    queryKey: ["related-poems", poemId],
    queryFn: async () => {
      // Fetch poems with overlapping tags or same author, excluding current
      let query = supabase
        .from("poems")
        .select("id, title, author_name, excerpt")
        .neq("id", poemId)
        .limit(6);

      if (tags && tags.length > 0) {
        query = query.overlaps("tags", tags);
      }

      const { data, error } = await query;
      if (error) throw error;

      // If not enough from tags, fill with same author
      if ((data || []).length < 3) {
        const { data: byAuthor } = await supabase
          .from("poems")
          .select("id, title, author_name, excerpt")
          .eq("author_name", authorName)
          .neq("id", poemId)
          .limit(3);
        const ids = new Set((data || []).map((p) => p.id));
        const combined = [...(data || [])];
        (byAuthor || []).forEach((p) => {
          if (!ids.has(p.id) && combined.length < 6) {
            combined.push(p);
            ids.add(p.id);
          }
        });
        return combined;
      }

      return data || [];
    },
  });

  if (related.length === 0) return null;

  return (
    <section className="mt-12 pt-8 border-t border-border">
      <h2 className="font-display text-xl font-semibold text-foreground mb-4">
        You Might Also Enjoy
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {related.map((poem) => (
          <Link
            key={poem.id}
            to={`/poem/${poem.id}`}
            className="group rounded-lg border border-border bg-card p-4 transition-all hover:shadow-md hover:border-accent/30"
          >
            <h3 className="font-display font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-1">
              {poem.title}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              by {poem.author_name || "Anonymous"}
            </p>
            {poem.excerpt && (
              <p className="mt-2 text-sm text-muted-foreground/80 line-clamp-2 italic">
                {poem.excerpt}
              </p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
};

export default RelatedPoems;
