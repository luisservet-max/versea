import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useActivityFeed, useFollowingList } from "@/hooks/useFollows";
import { Link } from "react-router-dom";
import { Activity, Feather, Heart, MessageCircle, Bookmark, Loader2, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es as esLocale, fr as frLocale } from "date-fns/locale";

const Feed = () => {
  const { user } = useAuth();
  const { locale, t } = useLanguage();
  const { data: followingIds = [] } = useFollowingList();
  const { data: feed = [], isLoading } = useActivityFeed();

  const dateFnsLocale = locale === "es" ? esLocale : locale === "fr" ? frLocale : undefined;

  const typeConfig = {
    poem: { icon: Feather, verb: t("feed_published"), color: "text-accent" },
    like: { icon: Heart, verb: t("feed_liked"), color: "text-red-400" },
    comment: { icon: MessageCircle, verb: t("feed_commented"), color: "text-blue-400" },
    save: { icon: Bookmark, verb: t("feed_saved"), color: "text-amber-400" },
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="container flex-1 flex flex-col items-center justify-center py-20 text-center">
          <Activity className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground mb-4">{t("feed_sign_in_prompt")}</p>
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
      <main className="container flex-1 py-10 max-w-2xl">
        <div className="flex items-center gap-3 mb-2">
          <Activity className="h-6 w-6 text-accent" />
          <h1 className="font-display text-3xl font-bold text-foreground">{t("feed_title")}</h1>
        </div>
        <p className="text-muted-foreground mb-8">
          {t("feed_subtitle")}
        </p>

        {followingIds.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground mb-2">{t("feed_no_following")}</p>
            <p className="text-sm text-muted-foreground/70">
              {t("feed_no_following_hint")}
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        ) : feed.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <Activity className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">{t("feed_no_activity")}</p>
          </div>
        ) : (
          <div className="space-y-1">
            {feed.map((item) => {
              const config = typeConfig[item.type];
              const Icon = config.icon;
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-secondary/30 animate-fade-in"
                >
                  <div className={`mt-0.5 ${config.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      <Link
                        to={`/author/${item.user_id}`}
                        className="font-semibold hover:text-accent transition-colors"
                      >
                        {item.user_name}
                      </Link>{" "}
                      {config.verb}{" "}
                      <Link
                        to={`/poem/${item.poem_id}`}
                        className="font-medium text-accent hover:underline"
                      >
                        {item.poem_title}
                      </Link>
                    </p>
                    {item.type === "comment" && item.content && (
                      <p className="mt-1 text-sm text-muted-foreground italic line-clamp-2">
                        "{item.content}"
                      </p>
                    )}
                    {item.type === "poem" && item.content && (
                      <p className="mt-1 text-sm text-muted-foreground italic line-clamp-2">
                        {item.content}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground/60">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: dateFnsLocale })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Feed;
