import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useActivityFeed, useFollowingList, useFollowStatus, useToggleFollow } from "@/hooks/useFollows";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Activity, Feather, Heart, MessageCircle, Bookmark, Loader2, Users, Search, User, UserPlus, UserMinus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es as esLocale, fr as frLocale } from "date-fns/locale";
import { useState } from "react";
import { toast } from "sonner";

// ─── User Card (Find Poets tab) ────────────────────────────────────────────────
interface UserResult {
  user_id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
}

const UserCard = ({ person }: { person: UserResult }) => {
  const { user } = useAuth();
  const { data: isFollowing } = useFollowStatus(person.user_id);
  const toggleFollow = useToggleFollow(person.user_id);
  const { t } = useLanguage();
  const isOwnProfile = user?.id === person.user_id;

  const handleFollow = () => {
    if (!user) { toast.info(t("feed_sign_in_prompt")); return; }
    toggleFollow.mutate(!!isFollowing);
  };

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-accent/40 hover:shadow-sm">
      <Link to={`/author/${person.user_id}`}
        className="h-11 w-11 shrink-0 rounded-full bg-secondary flex items-center justify-center overflow-hidden border border-border">
        {person.avatar_url ? (
          <img src={person.avatar_url} alt={person.display_name || ""} className="h-full w-full object-cover" />
        ) : (
          <User className="h-5 w-5 text-muted-foreground" />
        )}
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/author/${person.user_id}`} className="font-medium text-foreground hover:text-accent transition-colors text-sm">
          {person.display_name || "Poet"}
        </Link>
        {person.bio && (
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{person.bio}</p>
        )}
      </div>
      {!isOwnProfile && user && (
        <button
          onClick={handleFollow}
          disabled={toggleFollow.isPending}
          className={`shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            isFollowing
              ? "bg-secondary text-foreground hover:bg-destructive/10 hover:text-destructive"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {isFollowing
            ? <><UserMinus className="h-3 w-3" /> {t("find_unfollow")}</>
            : <><UserPlus className="h-3 w-3" /> {t("find_follow")}</>}
        </button>
      )}
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
const People = () => {
  const { user } = useAuth();
  const { locale, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"activity" | "find">("activity");

  // Activity feed
  const { data: followingIds = [] } = useFollowingList();
  const { data: feed = [], isLoading: feedLoading } = useActivityFeed();

  // Find poets
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);

  const dateFnsLocale = locale === "es" ? esLocale : locale === "fr" ? frLocale : undefined;

  const typeConfig = {
    poem: { icon: Feather, verb: t("feed_published"), color: "text-accent" },
    like: { icon: Heart, verb: t("feed_liked"), color: "text-red-400" },
    comment: { icon: MessageCircle, verb: t("feed_commented"), color: "text-blue-400" },
    save: { icon: Bookmark, verb: t("feed_saved"), color: "text-amber-400" },
  };

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setSearched(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, display_name, bio, avatar_url")
      .ilike("display_name", `%${q}%`)
      .limit(20);
    if (error) {
      toast.error(error.message);
      setResults([]);
    } else {
      setResults((data || []) as UserResult[]);
    }
    setSearching(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="container flex-1 flex flex-col items-center justify-center py-20 text-center">
          <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground mb-4">{t("feed_sign_in_prompt")}</p>
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
      <main className="container flex-1 py-10 max-w-2xl">

        {/* Page header */}
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold text-foreground">People</h1>
          <p className="text-muted-foreground mt-1 text-sm">Your community of poets</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-border">
          <button
            onClick={() => setActiveTab("activity")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === "activity"
                ? "border-accent text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Activity className="h-4 w-4" />
            Activity
          </button>
          <button
            onClick={() => setActiveTab("find")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === "find"
                ? "border-accent text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Search className="h-4 w-4" />
            Find Poets
          </button>
        </div>

        {/* Activity tab */}
        {activeTab === "activity" && (
          <>
            {followingIds.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-center">
                <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground mb-2">{t("feed_no_following")}</p>
                <p className="text-sm text-muted-foreground/70 mb-6">{t("feed_no_following_hint")}</p>
                <button
                  onClick={() => setActiveTab("find")}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Search className="h-4 w-4" />
                  Find poets to follow
                </button>
              </div>
            ) : feedLoading ? (
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
                      className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-secondary/30 animate-fade-in"
                    >
                      <div className={`mt-0.5 ${config.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                          <Link to={`/author/${item.user_id}`} className="font-semibold hover:text-accent transition-colors">
                            {item.user_name}
                          </Link>{" "}
                          {config.verb}{" "}
                          <Link to={`/poem/${item.poem_id}`} className="font-medium text-accent hover:underline">
                            {item.poem_title}
                          </Link>
                        </p>
                        {item.type === "comment" && item.content && (
                          <p className="mt-1 text-sm text-muted-foreground italic line-clamp-2">"{item.content}"</p>
                        )}
                        {item.type === "poem" && item.content && (
                          <p className="mt-1 text-sm text-muted-foreground italic line-clamp-2">{item.content}</p>
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
          </>
        )}

        {/* Find Poets tab */}
        {activeTab === "find" && (
          <>
            <div className="flex gap-2 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder={t("find_placeholder")}
                  className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={searching || !query.trim()}
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : t("find_search")}
              </button>
            </div>

            {searching && (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-accent" />
              </div>
            )}

            {!searching && searched && results.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">{t("find_no_results")}</p>
            )}

            {!searching && results.length > 0 && (
              <div className="space-y-3">
                {results.map((person) => (
                  <UserCard key={person.user_id} person={person} />
                ))}
              </div>
            )}

            {!searched && !searching && (
              <p className="text-center text-sm text-muted-foreground py-12">{t("find_hint")}</p>
            )}
          </>
        )}

      </main>
      <Footer />
    </div>
  );
};

export default People;
