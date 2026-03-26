import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PoemCard from "@/components/PoemCard";
import { useParams, Link } from "react-router-dom";
import { useAuthorProfile, useAuthorPoems } from "@/hooks/useAuthor";
import { useFollowStatus, useToggleFollow, useFollowerCount, useFollowingCount, useUserSavedPoems } from "@/hooks/useFollows";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Heart, BookOpen, Loader2, User, UserPlus, UserMinus, Users, Bookmark, Lock, Feather, Share2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import { toast } from "sonner";

const AuthorProfile = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const { data: author, isLoading } = useAuthorProfile(userId);
  const { data: poems = [] } = useAuthorPoems(userId);
  const { data: isFollowing } = useFollowStatus(userId);
  const toggleFollow = useToggleFollow(userId || "");
  const { data: followerCount = 0 } = useFollowerCount(userId);
  const { data: followingCount = 0 } = useFollowingCount(userId);
  const { data: savedData } = useUserSavedPoems(userId);
  const [activeTab, setActiveTab] = useState<"poems" | "catalog">("poems");
  const { t } = useLanguage();

  const handleShareProfile = async () => {
    const url = `${window.location.origin}/author/${userId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("find_link_copied"));
    } catch {
      toast.error(t("detail_link_error"));
    }
  };

  const handleFollow = () => {
    if (!user) {
      toast.info("Sign in to follow authors");
      return;
    }
    toggleFollow.mutate(!!isFollowing, {
      onSuccess: () => toast.success(isFollowing ? "Unfollowed" : "Following!"),
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!author) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Author not found.</p>
        </div>
        <Footer />
      </div>
    );
  }

  const isOwnProfile = user?.id === userId;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container flex-1 py-10 max-w-4xl">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Discover
        </Link>

        {/* Author header */}
        <div className="animate-fade-in flex flex-col sm:flex-row items-start gap-6 mb-10">
          <div className="h-24 w-24 shrink-0 rounded-full bg-secondary flex items-center justify-center overflow-hidden border-2 border-border">
            {author.avatar_url ? (
              <img
                src={author.avatar_url}
                alt={author.display_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-10 w-10 text-muted-foreground" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display text-3xl font-bold text-foreground">
                {author.display_name}
              </h1>
              {!isOwnProfile && (
                <button
                  onClick={handleFollow}
                  disabled={toggleFollow.isPending}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    isFollowing
                      ? "bg-secondary text-foreground hover:bg-destructive/10 hover:text-destructive"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  {isFollowing ? (
                    <><UserMinus className="h-3.5 w-3.5" /> {t("find_unfollow")}</>
                  ) : (
                    <><UserPlus className="h-3.5 w-3.5" /> {t("find_follow")}</>
                  )}
                </button>
              )}
              <button
                onClick={handleShareProfile}
                className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary/80"
              >
                <Share2 className="h-3.5 w-3.5" />
                {t("find_share_profile")}
              </button>
              )}
            </div>
            {author.bio && (
              <p className="mt-2 text-muted-foreground leading-relaxed max-w-xl">
                {author.bio}
              </p>
            )}
            <div className="mt-4 flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4 text-accent" />
                <span className="font-medium text-foreground">{author.poem_count}</span> poems
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Heart className="h-4 w-4 text-accent" />
                <span className="font-medium text-foreground">{author.total_likes}</span> likes
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="h-4 w-4 text-accent" />
                <span className="font-medium text-foreground">{followerCount}</span> followers
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="h-4 w-4 text-muted-foreground/50" />
                <span className="font-medium text-foreground">{followingCount}</span> following
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab("poems")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === "poems"
                ? "border-accent text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Feather className="h-4 w-4 inline mr-1.5 -mt-0.5" />
            Poems
          </button>
          <button
            onClick={() => setActiveTab("catalog")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === "catalog"
                ? "border-accent text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Bookmark className="h-4 w-4 inline mr-1.5 -mt-0.5" />
            Catalog
          </button>
        </div>

        {/* Tab content */}
        {activeTab === "poems" ? (
          <>
            {poems.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {poems.map((poem) => (
                  <PoemCard key={poem.id} poem={poem} />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No poems published yet.
              </p>
            )}
          </>
        ) : (
          <>
            {savedData?.isPublic ? (
              savedData.poems.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {savedData.poems.map((poem: any) => (
                    <PoemCard key={poem.id} poem={poem} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No saved poems yet.
                </p>
              )
            ) : (
              <div className="flex flex-col items-center py-12 text-center">
                <Lock className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">This catalog is private.</p>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default AuthorProfile;
