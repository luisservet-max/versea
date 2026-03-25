import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useMyPoems, usePublishPoem } from "@/hooks/usePoems";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Feather, Plus, Loader2, Sparkles } from "lucide-react";
import PoemCard from "@/components/PoemCard";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const LANGUAGES = ["English", "Spanish", "French", "German", "Italian", "Portuguese", "Russian", "Chinese", "Japanese", "Arabic", "Hindi", "Korean"];

const Portfolio = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { data: userPoems = [], isLoading } = useMyPoems();
  const publishPoem = usePublishPoem();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [language, setLanguage] = useState("English");
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!content.trim()) {
      toast.error(t("portfolio_analyze_prompt"));
      return;
    }
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-poem", {
        body: { title, content },
      });
      if (error) throw error;
      if (data?.tags?.length) {
        setTagsInput(data.tags.join(", "));
      }
      if (data?.language) {
        setLanguage(data.language);
      }
      toast.success(t("portfolio_ai_success"));
    } catch (err: any) {
      toast.error(err.message || t("portfolio_ai_error"));
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error(t("portfolio_required"));
      return;
    }

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    try {
      await publishPoem.mutateAsync({ title, content, tags, language });
      toast.success(t("portfolio_published"));
      setTitle("");
      setContent("");
      setTagsInput("");
      setLanguage("English");
      setShowForm(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="container flex-1 flex flex-col items-center justify-center py-20 text-center">
          <Feather className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground mb-4">{t("portfolio_sign_in_prompt")}</p>
          <Link
            to="/auth"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Feather className="h-6 w-6 text-accent" />
            <h1 className="font-display text-3xl font-bold text-foreground">{t("portfolio_title")}</h1>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            {t("portfolio_write")}
          </button>
        </div>
        <p className="text-muted-foreground mb-8 max-w-lg">
          {t("portfolio_subtitle")}
        </p>

        {showForm && (
          <div className="mb-8 animate-fade-in rounded-lg border border-border bg-card p-6">
            <h2 className="font-display text-xl font-semibold text-foreground mb-4">{t("portfolio_new_poem")}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">{t("portfolio_title_label")}</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("portfolio_title_placeholder")}
                  maxLength={200}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">{t("portfolio_content_label")}</label>
                <textarea
                  rows={8}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t("portfolio_content_placeholder")}
                  maxLength={10000}
                  className="mt-1 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent/30 font-body"
                />
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={analyzing || !content.trim()}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/20 disabled:opacity-50"
                >
                  {analyzing ? (
                    <><Loader2 className="h-3 w-3 animate-spin" /> {t("portfolio_analyzing")}</>
                  ) : (
                    <><Sparkles className="h-3 w-3" /> {t("portfolio_analyze")}</>
                  )}
                </button>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">{t("portfolio_tags_label")}</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder={t("portfolio_tags_placeholder")}
                  maxLength={200}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">{t("portfolio_language_label")}</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/30"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t("portfolio_cancel")}
                </button>
                <button
                  onClick={handlePublish}
                  disabled={publishPoem.isPending}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {publishPoem.isPending ? t("portfolio_publishing") : t("portfolio_publish")}
                </button>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        ) : userPoems.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {userPoems.map((poem, i) => (
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
