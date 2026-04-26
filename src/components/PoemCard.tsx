import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react";
import type { PoemWithAuthor } from "@/hooks/usePoems";
import { useLikeCount, useUserLiked, useToggleLike, useSavedStatus, useToggleSave } from "@/hooks/useInteractions";
import { useCommentCount } from "@/hooks/useComments";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { tagTranslations, type Locale } from "@/i18n/translations";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface PoemCardProps {
  poem: PoemWithAuthor;
  locale?: Locale;
}

const PoemCard = ({ poem, locale: localeProp }: PoemCardProps) => {
  const { user } = useAuth();
  const { t, locale: contextLocale } = useLanguage();
  const locale = localeProp ?? contextLocale as Locale;
  const navigate = useNavigate();
  const { data: likeCount = 0 } = useLikeCount(poem.id);
  const { data: liked = false } = useUserLiked(poem.id);
  const { data: saved = false } = useSavedStatus(poem.id);
  const { data: commentCount = 0 } = useCommentCount(poem.id);
  const toggleLike = useToggleLike(poem.id);
  const toggleSave = useToggleSave(poem.id);

  const handleLike = () => {
    if (!user) { navigate("/auth"); return; }
    toggleLike.mutate(liked);
  };

  const handleSave = () => {
    if (!user) { navigate("/auth"); return; }
    toggleSave.mutate(saved, {
      onSuccess: () => toast.success(saved ? t("detail_removed_catalog") : t("detail_saved_catalog")),
    });
  };

  const translateTag = (tag: string) =>
    tagTranslations[tag]?.[locale] ?? tag.charAt(0).toUpperCase() + tag.slice(1);

  return (
    <article className="group rounded-lg border border-border bg-card p-5 transition-all hover:shadow-md hover:border-accent/40">
      <Link to={`/poem/${poem.id}`} className="block">
        <h3 className="font-display text-lg font-semibold text-foreground group-hover:text-accent transition-colors">
          {poem.title}
        </h3>
      </Link>

      <p className="mt-1 text-sm">
        <span className="text-muted-foreground">{t("by")} </span>
        {!poem.is_classic && poem.user_id ? (
          <Link
            to={`/author/${poem.user_id}`}
            className="font-medium text-accent/80 hover:text-accent transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {poem.author_name}
          </Link>
        ) : poem.is_classic ? (
          <Link
            to={`/classic-author/${encodeURIComponent(poem.author_name || "Unknown")}`}
            className="font-medium text-accent/80 hover:text-accent transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {poem.author_name}
          </Link>
        ) : (
          <span className="font-medium text-accent/80">{poem.author_name}</span>
        )}
        {!poem.is_classic && (
          <span className="ml-2 inline-block rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
            {t("community_badge")}
          </span>
        )}
      </p>

      <Link to={`/poem/${poem.id}`} className="block">
        <pre className="mt-2 whitespace-pre font-body text-xs leading-relaxed text-foreground/80 line-clamp-4 max-w-prose overflow-x-hidden">
          {poem.excerpt || poem.content.split("\n").slice(0, 2).join("\n")}
        </pre>
      </Link>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {(poem.tags || []).slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
          >
            {translateTag(tag)}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-3">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 text-sm transition-colors ${
              liked ? "text-accent" : "text-muted-foreground hover:text-accent"
            }`}
          >
            <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
            {likeCount}
          </button>
          <Link
            to={`/poem/${poem.id}`}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            {commentCount}
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className={`transition-colors ${
              saved ? "text-accent" : "text-muted-foreground hover:text-accent"
            }`}
          >
            <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
          </button>
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
};

export default PoemCard;
