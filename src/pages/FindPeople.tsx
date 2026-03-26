import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useFollowStatus, useToggleFollow } from "@/hooks/useFollows";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, User, UserPlus, UserMinus, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
    if (!user) {
      toast.info(t("feed_sign_in_prompt"));
      return;
    }
    toggleFollow.mutate(!!isFollowing);
  };

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-all hover:shadow-md">
      <Link
        to={`/author/${person.user_id}`}
        className="h-12 w-12 shrink-0 rounded-full bg-secondary flex items-center justify-center overflow-hidden border border-border"
      >
        {person.avatar_url ? (
          <img src={person.avatar_url} alt={person.display_name || ""} className="h-full w-full object-cover" />
        ) : (
          <User className="h-5 w-5 text-muted-foreground" />
        )}
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/author/${person.user_id}`} className="font-medium text-foreground hover:text-accent transition-colors text-sm">
          {person.display_name || t("by")}
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
          {isFollowing ? (
            <><UserMinus className="h-3 w-3" /> {t("find_unfollow")}</>
          ) : (
            <><UserPlus className="h-3 w-3" /> {t("find_follow")}</>
          )}
        </button>
      )}
    </div>
  );
};

const FindPeople = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
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
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container flex-1 py-10 max-w-xl">
        <h1 className="font-display text-2xl font-bold text-foreground mb-1">
          {t("find_title")}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">{t("find_subtitle")}</p>

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
            disabled={loading || !query.trim()}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("find_search")}
          </button>
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-accent" />
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">{t("find_no_results")}</p>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-3">
            {results.map((person) => (
              <UserCard key={person.user_id} person={person} />
            ))}
          </div>
        )}

        {!searched && !loading && (
          <p className="text-center text-sm text-muted-foreground py-12">{t("find_hint")}</p>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default FindPeople;
