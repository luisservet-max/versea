import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PoemCard from "@/components/PoemCard";
import { useSavedPoems } from "@/hooks/useInteractions";
import { useCatalogPrivacy } from "@/hooks/useFollows";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { BookOpen, Loader2, Globe, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const Catalog = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { data: poems = [], isLoading } = useSavedPoems();
  const { isPublic, togglePrivacy } = useCatalogPrivacy();

  const handleTogglePrivacy = () => {
    togglePrivacy.mutate(!isPublic, {
      onSuccess: () => toast.success(isPublic ? t("catalog_now_private") : t("catalog_now_public")),
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="container flex-1 flex flex-col items-center justify-center py-20 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground mb-4">{t("catalog_sign_in_prompt")}</p>
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
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-accent" />
            <h1 className="font-display text-3xl font-bold text-foreground">{t("catalog_title")}</h1>
          </div>
          <button
            onClick={handleTogglePrivacy}
            disabled={togglePrivacy.isPending}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              isPublic
                ? "bg-accent/10 text-accent hover:bg-accent/20"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
            title={isPublic ? t("catalog_public") : t("catalog_private")}
          >
            {isPublic ? (
              <><Globe className="h-3.5 w-3.5" /> {t("catalog_public")}</>
            ) : (
              <><Lock className="h-3.5 w-3.5" /> {t("catalog_private")}</>
            )}
          </button>
        </div>
        <p className="text-muted-foreground mb-8 max-w-lg">
          {t("catalog_subtitle")}
          {isPublic ? t("catalog_public_note") : t("catalog_private_note")}
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
            <p className="text-muted-foreground">{t("catalog_empty")}</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Catalog;
