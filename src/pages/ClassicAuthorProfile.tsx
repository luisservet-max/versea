import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PoemCard from "@/components/PoemCard";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, BookOpen, Loader2, User, Calendar, MapPin } from "lucide-react";
import type { PoemWithAuthor } from "@/hooks/usePoems";

const useClassicAuthor = (name: string | undefined) =>
  useQuery({
    queryKey: ["classic-author", name],
    enabled: !!name,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classic_authors")
        .select("*")
        .eq("name", name!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

const useClassicAuthorPoems = (authorName: string | undefined) =>
  useQuery({
    queryKey: ["classic-author-poems", authorName],
    enabled: !!authorName,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("poems")
        .select("*")
        .eq("author_name", authorName!)
        .is("user_id", null)
        .order("title");
      if (error) throw error;
      return (data || []).map((p) => ({
        ...p,
        is_classic: true,
        author_name: p.author_name || authorName!,
      })) as PoemWithAuthor[];
    },
  });

const ClassicAuthorProfile = () => {
  const { authorName } = useParams();
  const decodedName = authorName ? decodeURIComponent(authorName) : undefined;
  const { data: author, isLoading } = useClassicAuthor(decodedName);
  const { data: poems = [] } = useClassicAuthorPoems(decodedName);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
        <Footer />
      </div>
    );
  }

  const lifespan = author?.birth_year
    ? `${author.birth_year}–${author.death_year || "present"}`
    : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container flex-1 py-10 max-w-4xl">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Discover
        </Link>

        <div className="animate-fade-in flex flex-col sm:flex-row items-start gap-6 mb-10">
          <div className="h-24 w-24 shrink-0 rounded-full bg-secondary flex items-center justify-center overflow-hidden border-2 border-border">
            {author?.image_url ? (
              <img src={author.image_url} alt={decodedName} className="h-full w-full object-cover" />
            ) : (
              <User className="h-10 w-10 text-muted-foreground" />
            )}
          </div>

          <div className="flex-1">
            <h1 className="font-display text-3xl font-bold text-foreground">
              {decodedName}
            </h1>
            <div className="mt-2 flex items-center gap-4 flex-wrap text-sm text-muted-foreground">
              {lifespan && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-accent" />
                  {lifespan}
                </span>
              )}
              {author?.nationality && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-accent" />
                  {author.nationality}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-accent" />
                <span className="font-medium text-foreground">{poems.length}</span> poems
              </span>
            </div>
            {author?.bio && (
              <p className="mt-4 text-muted-foreground leading-relaxed max-w-xl">
                {author.bio}
              </p>
            )}
            {!author && (
              <p className="mt-4 text-muted-foreground italic">
                No biography available yet for this author.
              </p>
            )}
          </div>
        </div>

        <h2 className="font-display text-xl font-semibold text-foreground mb-4">Poems</h2>
        {poems.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {poems.map((poem) => (
              <PoemCard key={poem.id} poem={poem} />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No poems found for this author.
          </p>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ClassicAuthorProfile;
