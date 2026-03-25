import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PoemCard from "@/components/PoemCard";
import { useParams, Link } from "react-router-dom";
import { useAuthorProfile, useAuthorPoems } from "@/hooks/useAuthor";
import { ArrowLeft, Heart, BookOpen, Loader2, User } from "lucide-react";

const AuthorProfile = () => {
  const { userId } = useParams();
  const { data: author, isLoading } = useAuthorProfile(userId);
  const { data: poems = [] } = useAuthorPoems(userId);

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

  if (!author) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Author not found.</p>
        </div>
        <Footer />
      </div>
    );
  }

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

        {/* Author header */}
        <div className="animate-fade-in flex flex-col sm:flex-row items-start gap-6 mb-10">
          <div className="h-24 w-24 shrink-0 rounded-full bg-secondary flex items-center justify-center overflow-hidden border-2 border-border">
            {author.avatar_url ? (
              <img
                src={author.avatar_url}
                alt={author.display_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-10 w-10 text-muted-foreground" />
            )}
          </div>

          <div className="flex-1">
            <h1 className="font-display text-3xl font-bold text-foreground">
              {author.display_name}
            </h1>
            {author.bio && (
              <p className="mt-2 text-muted-foreground leading-relaxed max-w-xl">
                {author.bio}
              </p>
            )}
            <div className="mt-4 flex items-center gap-6">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4 text-accent" />
                <span className="font-medium text-foreground">{author.poem_count}</span> poems
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Heart className="h-4 w-4 text-accent" />
                <span className="font-medium text-foreground">{author.total_likes}</span> likes
              </div>
            </div>
          </div>
        </div>

        {/* Poems grid */}
        <h2 className="font-display text-xl font-semibold text-foreground mb-4">
          Published Poems
        </h2>
        {poems.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {poems.map((poem) => (
              <PoemCard key={poem.id} poem={poem} />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No poems published yet.
          </p>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default AuthorProfile;
