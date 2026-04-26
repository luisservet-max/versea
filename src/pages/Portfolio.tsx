import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useMyPoems, usePublishPoem, useUpdatePoem, useDeletePoem } from "@/hooks/usePoems";
import type { PoemWithAuthor } from "@/hooks/usePoems";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { styleTranslations, languageTranslations, type Locale } from "@/i18n/translations";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Feather, Plus, Loader2, Sparkles, Pencil, Trash2, Share2, Check, Heart, Bookmark, MessageCircle } from "lucide-react";
import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const LANGUAGE_KEYS = [
  "English", "Spanish", "Catalan", "French", "German",
  "Italian", "Portuguese", "Russian", "Chinese",
  "Japanese", "Arabic", "Hindi", "Korean",
];

const STYLE_KEYS = [
  "Ballad", "Elegy", "Epic", "Free Verse", "Lyric",
  "Modernist Verse", "Mystical Verse", "Ode",
  "Romantic Verse", "Satirical Verse", "Sonnet",
];

const EMPTY_FORM = { title: "", content: "", tagsInput: "", language: "English", style: "" };

// ─── Poem stats hook ───────────────────────────────────────────────────────────
const usePoemStats = (poemId: string) => {
  return useQuery({
    queryKey: ["poem-stats", poemId],
    queryFn: async () => {
      const [likesRes, savesRes, commentsRes] = await Promise.all([
        supabase.from("likes").select("*", { count: "exact", head: true }).eq("poem_id", poemId),
        supabase.from("saved_poems").select("*", { count: "exact", head: true }).eq("poem_id", poemId),
        supabase.from("comments").select("*", { count: "exact", head: true }).eq("poem_id", poemId),
      ]);
      return {
        likes: likesRes.count || 0,
        saves: savesRes.count || 0,
        comments: commentsRes.count || 0,
      };
    },
  });
};

// ─── Poem Form ─────────────────────────────────────────────────────────────────
interface PoemFormProps {
  initial?: { title: string; content: string; tagsInput: string; language: string; style: string };
  onCancel: () => void;
  onSubmit: (values: { title: string; content: string; tags: string[]; language: string; style: string }) => Promise<void>;
  isPending: boolean;
  submitLabel: string;
  pendingLabel: string;
  t: (key: string) => string;
  locale: Locale;
}

const PoemForm = ({ initial = EMPTY_FORM, onCancel, onSubmit, isPending, submitLabel, pendingLabel, t, locale }: PoemFormProps) => {
  const [title, setTitle] = useState(initial.title);
  const [content, setContent] = useState(initial.content);
  const [tagsInput, setTagsInput] = useState(initial.tagsInput);
  const [language, setLanguage] = useState(initial.language);
  const [style, setStyle] = useState(initial.style);
  const [analyzing, setAnalyzing] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const runAnalysis = async (titleVal: string, contentVal: string) => {
    if (!contentVal.trim() || contentVal.trim().length < 20) return;
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-poem", {
        body: { title: titleVal, content: contentVal },
      });
      if (error) throw error;
      if (data?.tags?.length) setTagsInput(data.tags.join(", "));
      if (data?.language) setLanguage(data.language);
      if (data?.style) setStyle(data.style);
    } catch {
      // Silent fail
    } finally {
      setAnalyzing(false);
    }
  };

  const handleContentChange = (val: string) => {
    setContent(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runAnalysis(title, val), 1500);
  };

  const handleManualAnalyze = async () => {
    if (!content.trim()) { toast.error(t("portfolio_analyze_prompt")); return; }
    await runAnalysis(title, content);
    toast.success(t("portfolio_ai_success"));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) { toast.error(t("portfolio_required")); return; }
    const tags = tagsInput.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    await onSubmit({ title, content, tags, language, style });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground">{t("portfolio_title_label")}</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder={t("portfolio_title_placeholder")} maxLength={200}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent/30" />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground">{t("portfolio_content_label")}</label>
        <textarea rows={10} value={content} onChange={(e) => handleContentChange(e.target.value)}
          placeholder={t("portfolio_content_placeholder")} maxLength={10000}
          className="mt-1 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent/30 font-body leading-relaxed" />
        <div className="mt-1 flex items-center gap-2">
          <button type="button" onClick={handleManualAnalyze} disabled={analyzing || !content.trim()}
            className="inline-flex items-center gap-1.5 rounded-md bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/20 disabled:opacity-50">
            {analyzing ? <><Loader2 className="h-3 w-3 animate-spin" /> {t("portfolio_analyzing")}</> : <><Sparkles className="h-3 w-3" /> {t("portfolio_analyze")}</>}
          </button>
          {analyzing && <span className="text-xs text-muted-foreground">{t("portfolio_detecting")}</span>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-foreground">{t("portfolio_language_label")}</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/30">
            {LANGUAGE_KEYS.map((lang) => (
              <option key={lang} value={lang}>{languageTranslations[lang]?.[locale] ?? lang}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">{t("portfolio_style_label")}</label>
          <select value={style} onChange={(e) => setStyle(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/30">
            <option value="">{t("portfolio_style_placeholder")}</option>
            {STYLE_KEYS.map((s) => (
              <option key={s} value={s}>{styleTranslations[s]?.[locale] ?? s}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground">{t("portfolio_tags_label")}</label>
        <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)}
          placeholder={t("portfolio_tags_placeholder")} maxLength={200}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent/30" />
        <p className="mt-1 text-xs text-muted-foreground">{t("portfolio_tags_hint")}</p>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onCancel}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          {t("portfolio_cancel")}
        </button>
        <button onClick={handleSubmit} disabled={isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
          {isPending ? pendingLabel : submitLabel}
        </button>
      </div>
    </div>
  );
};

// ─── My Poem Card ──────────────────────────────────────────────────────────────
interface MyPoemCardProps {
  poem: PoemWithAuthor;
  t: (key: string) => string;
  locale: Locale;
}

const MyPoemCard = ({ poem, t, locale }: MyPoemCardProps) => {
  const updatePoem = useUpdatePoem();
  const deletePoem = useDeletePoem();
  const { data: stats } = usePoemStats(poem.id);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/poem/${poem.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(t("detail_link_copied"));
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error(t("detail_link_error")); }
  };

  const handleDelete = () => {
    if (!window.confirm(t("detail_delete_confirm"))) return;
    deletePoem.mutate(poem.id, {
      onSuccess: () => toast.success(t("detail_deleted")),
      onError: (err: any) => toast.error(err.message),
    });
  };

  const handleUpdate = async (values: { title: string; content: string; tags: string[]; language: string; style: string }) => {
    await updatePoem.mutateAsync({ id: poem.id, ...values }, {
      onSuccess: () => { toast.success(t("profile_updated")); setEditing(false); },
      onError: (err: any) => toast.error(err.message),
    });
  };

  return (
    <article className="rounded-lg border border-border bg-card transition-all hover:shadow-md hover:border-accent/40">
      {editing ? (
        <div className="p-5">
          <h3 className="font-display text-base font-semibold text-foreground mb-4">
            {t("profile_edit")} — <span className="text-accent">{poem.title}</span>
          </h3>
          <PoemForm
            initial={{ title: poem.title, content: poem.content, tagsInput: (poem.tags || []).join(", "), language: poem.language || "English", style: poem.style || "" }}
            onCancel={() => setEditing(false)}
            onSubmit={handleUpdate}
            isPending={updatePoem.isPending}
            submitLabel={t("profile_save")}
            pendingLabel={t("portfolio_publishing")}
            t={t}
            locale={locale}
          />
        </div>
      ) : (
        <div className="p-5">
          <Link to={`/poem/${poem.id}`} className="block group">
            <h3 className="font-display text-lg font-semibold text-foreground group-hover:text-accent transition-colors">
              {poem.title}
            </h3>
          </Link>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {poem.language && (
              <span className="rounded-full bg-secondary px-2 py-0.5">
                {languageTranslations[poem.language]?.[locale] ?? poem.language}
              </span>
            )}
            {poem.style && (
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-accent">
                {styleTranslations[poem.style]?.[locale] ?? poem.style}
              </span>
            )}
          </div>

          <Link to={`/poem/${poem.id}`} className="block mt-3">
            <pre className="whitespace-pre font-body text-xs leading-relaxed text-foreground/70 line-clamp-3 overflow-x-hidden">
              {poem.excerpt || poem.content.split("\n").slice(0, 2).join("\n")}
            </pre>
          </Link>

          {(poem.tags || []).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(poem.tags || []).slice(0, 3).map((tag) => (
                <span key={tag} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {tag.charAt(0).toUpperCase() + tag.slice(1)}
                </span>
              ))}
            </div>
          )}

          {/* Stats row */}
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground border-t border-border pt-3">
            <span className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5 text-accent/60" />
              {stats?.likes ?? 0}
            </span>
            <span className="flex items-center gap-1">
              <Bookmark className="h-3.5 w-3.5 text-accent/60" />
              {stats?.saves ?? 0}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5 text-accent/60" />
              {stats?.comments ?? 0}
            </span>
          </div>

          {/* Action buttons */}
          <div className="mt-3 flex items-center justify-end gap-2 border-t border-border pt-3">
            <button onClick={handleShare}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              {copied ? <Check className="h-3.5 w-3.5 text-accent" /> : <Share2 className="h-3.5 w-3.5" />}
              {copied ? "✓" : t("detail_share")}
            </button>
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              <Pencil className="h-3.5 w-3.5" />{t("profile_edit")}
            </button>
            <button onClick={handleDelete} disabled={deletePoem.isPending}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50">
              <Trash2 className="h-3.5 w-3.5" />{t("detail_delete")}
            </button>
          </div>
        </div>
      )}
    </article>
  );
};

// ─── Portfolio Page ────────────────────────────────────────────────────────────
const Portfolio = () => {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const { data: userPoems = [], isLoading } = useMyPoems();
  const publishPoem = usePublishPoem();
  const [showForm, setShowForm] = useState(false);

  const handlePublish = async (values: { title: string; content: string; tags: string[]; language: string; style: string }) => {
    await publishPoem.mutateAsync(values, {
      onSuccess: () => { toast.success(t("portfolio_published")); setShowForm(false); },
      onError: (err: any) => toast.error(err.message),
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="container flex-1 flex flex-col items-center justify-center py-20 text-center">
          <Feather className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground mb-4">{t("portfolio_sign_in_prompt")}</p>
          <Link to="/auth" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            {t("nav_sign_in")}
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
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Feather className="h-6 w-6 text-accent" />
            <h1 className="font-display text-3xl font-bold text-foreground">{t("portfolio_title")}</h1>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            <Plus className="h-4 w-4" />{t("portfolio_write")}
          </button>
        </div>
        <p className="text-muted-foreground mb-8 max-w-lg">{t("portfolio_subtitle")}</p>

        {showForm && (
          <div className="mb-8 animate-fade-in rounded-lg border border-border bg-card p-6">
            <h2 className="font-display text-xl font-semibold text-foreground mb-4">{t("portfolio_new_poem")}</h2>
            <PoemForm
              onCancel={() => setShowForm(false)}
              onSubmit={handlePublish}
              isPending={publishPoem.isPending}
              submitLabel={t("portfolio_publish")}
              pendingLabel={t("portfolio_publishing")}
              t={t}
              locale={locale as Locale}
            />
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        ) : userPoems.length > 0 ? (
          <>
            <p className="text-xs text-muted-foreground mb-4">
              {userPoems.length} {userPoems.length === 1 ? t("profile_poems").toLowerCase().slice(0, -1) : t("profile_poems").toLowerCase()}
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {userPoems.map((poem, i) => (
                <div key={poem.id} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                  <MyPoemCard poem={poem} t={t} locale={locale as Locale} />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center py-20 text-center">
            <Feather className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">{t("portfolio_empty")}</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Portfolio;
