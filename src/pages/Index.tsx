import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PoemCard from "@/components/PoemCard";
import { usePoems } from "@/hooks/usePoems";
import { useAvailableLanguages, useAvailableTags } from "@/hooks/useFilterOptions";
import { useState, useRef, useEffect } from "react";
import { Feather, Search, Loader2, Library, Users, Globe, Tag, ChevronDown, X } from "lucide-react";

type SourceFilter = "all" | "classic" | "community";

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

interface FilterDropdownProps {
  label: string;
  icon: React.ReactNode;
  value: string | null;
  options: string[];
  onChange: (val: string | null) => void;
  placeholder: string;
}

const FilterDropdown = ({ label, icon, value, options, onChange, placeholder }: FilterDropdownProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = options.filter((o) => o.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
          value
            ? "border-accent bg-accent/10 text-accent-foreground"
            : "border-border bg-card text-muted-foreground hover:text-foreground"
        }`}
      >
        {icon}
        <span>{value || label}</span>
        {value ? (
          <X
            className="h-3.5 w-3.5 ml-1 hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); onChange(null); setOpen(false); }}
          />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 ml-1" />
        )}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border border-border bg-popover shadow-md">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={placeholder}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
          <div className="max-h-48 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">No results</p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt}
                  onClick={() => { onChange(opt); setOpen(false); setSearch(""); }}
                  className={`w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
                    opt === value
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground hover:bg-secondary"
                  }`}
                >
                  {opt}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Index = () => {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [source, setSource] = useState<SourceFilter>("all");
  const [language, setLanguage] = useState<string | null>(null);

  const { data: availableLanguages = [] } = useAvailableLanguages();
  const { data: availableTags = [] } = useAvailableTags();

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = usePoems({
    tag: activeTag,
    search: searchQuery || undefined,
    source,
    language,
  });

  const poems = data?.pages.flat() ?? [];

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
        </div>
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-sage/5 blur-3xl" />
      </section>

      <section className="border-b border-border bg-card">
        <div className="container py-4 flex flex-wrap items-center gap-2">
          {/* Source filter pills */}
          {([
            { key: "all" as SourceFilter, label: "All Poems", icon: null },
            { key: "classic" as SourceFilter, label: "Classic", icon: Library },
            { key: "community" as SourceFilter, label: "Community", icon: Users },
          ]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSource(key)}
              className={`flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                source === key
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {Icon && <Icon className="h-3 w-3" />}
              {label}
            </button>
          ))}

          <div className="w-px h-6 bg-border mx-1" />

          {/* Language dropdown */}
          <FilterDropdown
            label="Language"
            icon={<Globe className="h-3.5 w-3.5" />}
            value={language}
            options={availableLanguages}
            onChange={setLanguage}
            placeholder="Search languages..."
          />

          {/* Style/Tag dropdown */}
          <FilterDropdown
            label="Style"
            icon={<Tag className="h-3.5 w-3.5" />}
            value={activeTag ? capitalize(activeTag) : null}
            options={tags.map(capitalize)}
            onChange={(val) => setActiveTag(val ? val.toLowerCase() : null)}
            placeholder="Search styles..."
          />
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

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        ) : poems.length > 0 ? (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {poems.map((poem, i) => (
                <div
                  key={poem.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${Math.min(i, 5) * 100}ms` }}
                >
                  <PoemCard poem={poem} />
                </div>
              ))}
            </div>
            {hasNextPage && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="inline-flex items-center gap-2 rounded-md bg-secondary px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50"
                >
                  {isFetchingNextPage ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Loading...</>
                  ) : (
                    "Load More Poems"
                  )}
                </button>
              </div>
            )}
          </>
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
