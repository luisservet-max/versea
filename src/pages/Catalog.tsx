import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PoemCard from "@/components/PoemCard";
import { featuredPoems } from "@/data/poems";
import { BookOpen } from "lucide-react";

const Catalog = () => {
  // For now, show all poems as "cataloged" — will integrate with backend later
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

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featuredPoems.slice(0, 3).map((poem, i) => (
            <div
              key={poem.id}
              className="animate-fade-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <PoemCard poem={poem} />
            </div>
          ))}
        </div>

        {featuredPoems.length === 0 && (
          <div className="flex flex-col items-center py-20 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Your catalog is empty. Start discovering poems to save them here.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Catalog;
