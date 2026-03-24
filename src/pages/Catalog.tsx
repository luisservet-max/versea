import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PoemCard from "@/components/PoemCard";
import { useSavedPoems } from "@/hooks/useInteractions";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

const Catalog = () => {
  const { user } = useAuth();
  const { data: poems = [], isLoading } = useSavedPoems();

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="container flex-1 flex flex-col items-center justify-center py-20 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground mb-4">Sign in to build your poetry catalog.</p>
          <Link
            to="/auth"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Sign In
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container flex-1 py-10">
        <div className="flex items-center gap-3 mb-8">
          <BookOpen className="h-6 w-6 text-accent" />
          <h1 className="font-display text-3xl font-bold text-foreground">My Catalog</h1>
        </div>
        <p className="text-muted-foreground mb-8 max-w-lg">
          Your personal poetry collection. Save poems you love and build your reading library.
        </p>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        ) : poems.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {poems.map((poem, i) => (
              <div
                key={poem.id}
                className="animate-fade-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <PoemCard poem={poem} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-20 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Your catalog is empty. Discover poems and bookmark them to save here.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Catalog;
