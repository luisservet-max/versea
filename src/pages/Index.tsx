import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PoemCard from "@/components/PoemCard";
import { featuredPoems, tags } from "@/data/poems";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Feather, Search } from "lucide-react";

const Index = () => {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = featuredPoems.filter((poem) => {
    const matchesTag = !activeTag || poem.tags.includes(activeTag);
    const matchesSearch =
      !searchQuery ||
      poem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      poem.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTag && matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-parchment-warm py-20 md:py-28">
        <div className="container relative z-10 flex flex-col items-center text-center">
          <div className="flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent mb-6">
            <Feather className="h-4 w-4" />
            Your poetry companion
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight text-foreground md:text-6xl max-w-3xl">
            Discover the poems that{" "}
            <span className="italic text-accent">move</span> you
          </h1>
          <p className="mt-4 max-w-lg text-lg text-muted-foreground">
            Find, catalog, and share poetry. Build your reading collection or share your own verses with a community of poetry lovers.
          </p>

          {/* Search bar */}
          <div className="mt-8 flex w-full max-w-md items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-accent/30">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search poems or poets..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>

          <div className="mt-6 flex items-center gap-3">
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Start Cataloging
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/portfolio"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <Feather className="h-4 w-4" />
              Share Your Poems
            </Link>
          </div>
        </div>
        {/* Decorative element */}
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-sage/5 blur-3xl" />
      </section>

      {/* Tags */}
      <section className="border-b border-border bg-card">
        <div className="container flex gap-2 overflow-x-auto py-4 scrollbar-none">
          <button
            onClick={() => setActiveTag(null)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              !activeTag
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag === activeTag ? null : tag)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                tag === activeTag
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      {/* Poems grid */}
      <main className="container flex-1 py-10">
        <h2 className="font-display text-2xl font-semibold text-foreground mb-6">
          {activeTag ? (
            <>Poems tagged <span className="text-accent capitalize">"{activeTag}"</span></>
          ) : (
            "Featured Poems"
          )}
        </h2>
        {filtered.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((poem, i) => (
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
            <Search className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No poems found. Try a different search or tag.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
