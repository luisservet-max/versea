import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PoemCard from "@/components/PoemCard";
import { usePoems, useHotPoems } from "@/hooks/usePoems";
import { useAvailableLanguages, useAvailableStyles } from "@/hooks/useFilterOptions";
import { useLanguage } from "@/contexts/LanguageContext";
import { languageTranslations, styleTranslations, type Locale } from "@/i18n/translations";
import { supabase } from "@/integrations/supabase/client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Feather, Search, Loader2, Library, Users, Globe, Sparkles, ChevronDown, X, User, BookOpen, Flame } from "lucide-react";
import { Link } from "react-router-dom";

type SourceFilter = "all" | "classic" | "community";

interface FilterDropdownProps {
  label: string;
  icon: React.ReactNode;
  value: string | null;
  displayOptions: string[];
  valueOptions: string[];
  onChange: (val: string | null) => void;
  placeholder: string;
  noResults: string;
}

const FilterDropdown = ({
  label, icon, value, displayOptions, valueOptions, onChange, placeholder, noResults
}: FilterDropdownProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const valueIndex = valueOptions.indexOf(value || "");
  const displayValue = valueIndex >= 0 ? displayOptions[valueIndex] : null;

  const filtered = displayOptions
    .map((d, i) => ({ display: d, value: valueOptions[i] }))
    .filter(({ display }) => display.toLowerCase().includes(search.toLowerCase()));

  const handleOpen = () => {
    setOpen(!open);
    // Don't auto-focus on mobile — user must tap the search box explicitly
    if (!open) {
      setTimeout(() => {
        const isMobile = window.innerWidth < 768;
        if (!isMobile && searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 50);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
          value
            ? "border-accent bg-accent/10 text-accent-foreground"
            : "border-border bg-card text-muted-foreground hover:text-foreground"
        }`}
      >
        {icon}
        <span>{displayValue || label}</span>
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
              ref={searchInputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={placeholder}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
          <div className="max-h-48 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">{noResults}</p>
            ) : (
              filtered.map(({ display, value: optVal }) => (
                <button
                  key={optVal}
                  onClick={() => { onChange(optVal); setOpen(false); setSearch(""); }}
                  className={`w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
                    optVal === value
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground hover:bg-secondary"
                  }`}
                >
                  {display}
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
  const { t, locale } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialise state from URL params so filters persist on back navigation
  const [activeStyle, setActiveStyleState] = useState<string | null>(searchParams.get("style"));
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [committedSearch, setCommittedSearch] = useState(searchParams.get("q") || "");
  const [source, setSourceState] = useState<SourceFilter>((searchParams.get("source") as SourceFilter) || "all");
  const [language, setLanguageState] = useState<string | null>(searchParams.get("lang"));

  // Sync state to URL params
  const setActiveStyle = (val: string | null) => {
    setActiveStyleState(val);
    setSearchParams(prev => { val ? prev.set("style", val) : prev.delete("style"); return prev; }, { replace: true });
  };
  const setSource = (val: SourceFilter) => {
    setSourceState(val);
    setSearchParams(prev => { val !== "all" ? prev.set("source", val) : prev.delete("source"); return prev; }, { replace: true });
  };
  const setLanguage = (val: string | null) => {
    setLanguageState(val);
    setSearchParams(prev => { val ? prev.set("lang", val) : prev.delete("lang"); return prev; }, { replace: true });
  };

  const hasFilters = !!(activeStyle || committedSearch || source !== "all" || language);

  const [suggestions, setSuggestions] = useState<{ type: "poem" | "author" | "classic_author"; id: string; label: string; sub?: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sugLoading, setSugLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const normalize = (s: string) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) { setSuggestions([]); return; }
    setSugLoading(true);
    const term = `%${q}%`;
    const [authorsRes, classicRes] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name").ilike("display_name", term).limit(10),
      supabase.from("classic_authors").select("id, name").ilike("name", term).limit(10),
    ]);
    const nq = normalize(q);
    const items: typeof suggestions = [];
    (authorsRes.data || []).filter((a: any) => normalize(a.display_name || "").includes(nq)).slice(0, 5)
      .forEach((a: any) => items.push({ type: "author", id: a.user_id, label: a.display_name || "Anonymous" }));
    (classicRes.data || []).filter((c: any) => normalize(c.name).includes(nq)).slice(0, 5)
      .forEach((c: any) => items.push({ type: "classic_author", id: c.name, label: c.name }));
    setSuggestions(items);
    setSugLoading(false);
  }, []);

  const handleSearchInput = (val: string) => {
    setSearchQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 250);
    setShowSuggestions(true);
  };

  const commitSearch = (val: string) => {
    setCommittedSearch(val);
    setShowSuggestions(false);
    setSearchParams(prev => { val ? prev.set("q", val) : prev.delete("q"); return prev; }, { replace: true });
  };

  const { data: availableLanguages = [] } = useAvailableLanguages();
  const { data: availableStyles = [] } = useAvailableStyles();
  const { data: hotPoems = [], isLoading: hotLoading } = useHotPoems();

  const translatedLanguages = availableLanguages.map(
    (l) => languageTranslations[l]?.[locale as Locale] ?? l
  );
  const translatedStyles = availableStyles.map(
    (s) => styleTranslations[s]?.[locale as Locale] ?? s
  );

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = usePoems({
    search: committedSearch || undefined,
    source,
    language,
    style: activeStyle,
  });

  const poems = data?.pages.flat() ?? [];

  // Show hot poems only when no filters are active
  const showHot = !hasFilters;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <section className="relative bg-parchment-warm py-20 md:py-28" style={{ zIndex: 20 }}>
        <div className="container relative z-10 flex flex-col items-center text-center">
          <div className="flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent mb-6">
            <Feather className="h-4 w-4" />
            {t("hero_badge")}
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight text-foreground md:text-6xl max-w-3xl">
            {t("hero_title_1")}
            <span className="italic text-accent">{t("hero_title_accent")}</span>
            {t("hero_title_2")}
          </h1>
          <p className="mt-4 max-w-lg text-lg text-muted-foreground">
            {t("hero_subtitle")}
          </p>

          <div ref={searchRef} className="relative z-50 mt-8 w-full max-w-md">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-accent/30">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") commitSearch(searchQuery); }}
                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                placeholder={t("hero_search_placeholder")}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
            </div>
            {showSuggestions && (suggestions.length > 0 || sugLoading) && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-border bg-popover shadow-lg max-h-64 overflow-y-auto">
                {sugLoading && suggestions.length === 0 ? (
                  <div className="flex items-center justify-center py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  suggestions.map((s, i) => {
                    const href = s.type === "poem" ? `/poem/${s.id}` : s.type === "author" ? `/author/${s.id}` : `/classic-author/${encodeURIComponent(s.id)}`;
                    const Icon = s.type === "poem" ? BookOpen : User;
                    return (
                      <Link
                        key={`${s.type}-${s.id}-${i}`}
                        to={href}
                        onClick={() => setShowSuggestions(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-secondary"
                      >
                        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <span className="font-medium text-foreground">{s.label}</span>
                          {s.sub && <span className="ml-1.5 text-xs text-muted-foreground">{t("by")} {s.sub}</span>}
                          <span className="ml-1.5 text-[10px] text-accent/70 uppercase">
                            {s.type === "classic_author" ? t("filter_classic") : t("filter_community")}
                          </span>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-sage/5 blur-3xl" />
      </section>

      {/* Filter bar */}
      <section className="border-b border-border bg-card">
        <div className="container py-4 flex flex-wrap items-center gap-2">
          {([
            { key: "all" as SourceFilter, label: t("filter_all"), icon: null },
            { key: "classic" as SourceFilter, label: t("filter_classic"), icon: Library },
            { key: "community" as SourceFilter, label: t("filter_community"), icon: Users },
          ]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSource(key)}
              className={`flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                source === key ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {Icon && <Icon className="h-3 w-3" />}
              {label}
            </button>
          ))}

          <div className="w-px h-6 bg-border mx-1" />

          <FilterDropdown
            label={t("filter_language")}
            icon={<Globe className="h-3.5 w-3.5" />}
            value={language}
            displayOptions={translatedLanguages}
            valueOptions={availableLanguages}
            onChange={setLanguage}
            placeholder={t("filter_search_languages")}
            noResults={t("no_results")}
          />

          <FilterDropdown
            label={t("filter_style")}
            icon={<Sparkles className="h-3.5 w-3.5" />}
            value={activeStyle}
            displayOptions={translatedStyles}
            valueOptions={availableStyles}
            onChange={setActiveStyle}
            placeholder={t("filter_search_styles")}
            noResults={t("no_results")}
          />
        </div>
      </section>

      <main className="container flex-1 py-10">
        {/* Hot poems section — only shown when no filters applied */}
        {showHot && hotPoems.length > 0 && (
          <div className="mb-12">
            <h2 className="font-display text-2xl font-semibold text-foreground mb-6 flex items-center gap-2">
              <Flame className="h-5 w-5 text-accent" />
              Trending This Month
            </h2>
            {hotLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {hotPoems.slice(0, 6).map((poem, i) => (
                  <div key={poem.id} className="animate-fade-in" style={{ animationDelay: `${Math.min(i, 5) * 80}ms` }}>
                    <PoemCard poem={poem} locale={locale as Locale} />
                  </div>
                ))}
              </div>
            )}
            <div className="mt-8 border-t border-border" />
          </div>
        )}

        {/* All poems / filtered poems */}
        <h2 className="font-display text-2xl font-semibold text-foreground mb-6">
          {activeStyle ? (
            <>{t("featured_poems")} — <span className="text-accent italic">{styleTranslations[activeStyle]?.[locale as Locale] ?? activeStyle}</span></>
          ) : (
            t("featured_poems")
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
                <div key={poem.id} className="animate-fade-in" style={{ animationDelay: `${Math.min(i, 5) * 100}ms` }}>
                  <PoemCard poem={poem} locale={locale as Locale} />
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
                    <><Loader2 className="h-4 w-4 animate-spin" /> {t("loading")}</>
                  ) : t("load_more")}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center py-20 text-center">
            <Search className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">{t("no_poems_found")}</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
 
