import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RelatedPoems from "@/components/RelatedPoems";
import { useParams, Link, useNavigate } from "react-router-dom";
import { usePoem, useDeletePoem } from "@/hooks/usePoems";
import { useLikeCount, useUserLiked, useToggleLike, useSavedStatus, useToggleSave } from "@/hooks/useInteractions";
import {
  useComments, useCommentCount, usePostComment,
  useDeleteComment, useCommentLikeCount, useUserLikedComment, useToggleCommentLike
} from "@/hooks/useComments";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { tagTranslations, type Locale } from "@/i18n/translations";
import { ArrowLeft, Heart, MessageCircle, Share2, Bookmark, Loader2, Trash2, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es as esLocale, fr as frLocale } from "date-fns/locale";

// ─── Single comment row with like + delete ─────────────────────────────────────
interface CommentRowProps {
  c: { id: string; content: string; created_at: string; user_id: string; author_name: string };
  currentUserId?: string;
  poemId: string;
  dateFnsLocale: any;
  t: (key: string) => string;
}

const CommentRow = ({ c, currentUserId, poemId, dateFnsLocale, t }: CommentRowProps) => {
  const { data: likeCount = 0 } = useCommentLikeCount(c.id);
  const { data: liked = false } = useUserLikedComment(c.id);
  const toggleLike = useToggleCommentLike(c.id);
  const deleteComment = useDeleteComment(poemId);
  const isOwner = currentUserId === c.user_id;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">{c.author_name}</span>
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: dateFnsLocale })}
        </span>
      </div>
      <p className="text-sm text-foreground/80 whitespace-pre-wrap">{c.content}</p>

      {/* Like + delete row */}
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={() => toggleLike.mutate(liked)}
          disabled={!currentUserId || toggleLike.isPending}
          className={`flex items-center gap-1 text-xs transition-colors disabled:opacity-40 ${
            liked ? "text-accent" : "text-muted-foreground hover:text-accent"
          }`}
        >
          <Heart className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`} />
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>

        {isOwner && (
          <button
            onClick={() => {
              if (!window.confirm(t("detail_delete_confirm"))) return;
              deleteComment.mutate(c.id, {
                onSuccess: () => toast.success(t("detail_deleted")),
                onError: (err: any) => toast.error(err.message),
              });
            }}
            disabled={deleteComment.isPending}
            className="flex items-center gap-1 text-xs text-destructive/60 hover:text-destructive transition-colors disabled:opacity-40 ml-auto"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t("detail_delete")}
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Poem Detail Page ──────────────────────────────────────────────────────────
const PoemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { locale, t } = useLanguage();
  const { data: poem, isLoading } = usePoem(id);
  const { data: likeCount = 0 } = useLikeCount(id || "");
  const { data: liked = false } = useUserLiked(id || "");
  const { data: saved = false } = useSavedStatus(id || "");
  const { data: commentCount = 0 } = useCommentCount(id || "");
  const { data: comments = [] } = useComments(id || "");
  const toggleLike = useToggleLike(id || "");
  const toggleSave = useToggleSave(id || "");
  const postComment = usePostComment(id || "");
  const deletePoem = useDeletePoem();
  const [comment, setComment] = useState("");

  const dateFnsLocale = locale === "es" ? esLocale : locale === "fr" ? frLocale : undefined;

  const translateTag = (tag: string) =>
    tagTranslations[tag]?.[locale as Locale] ?? tag.charAt(0).toUpperCase() + tag.slice(1);

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

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("detail_link_copied"));
    } catch {
      toast.error(t("detail_link_error"));
    }
  };

  const handlePostComment = () => {
    if (!user) { navigate("/auth"); return; }
    if (!comment.trim()) return;
    postComment.mutate(comment, {
      onSuccess: () => { setComment(""); toast.success(t("detail_comment_posted")); },
      onError: (err: any) => toast.error(err.message),
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

  if (!poem) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">{t("no_poems_found")}</p>
        </div>
        <Footer />
      </div>
    );
  }

  const isAuthorLinked = !poem.is_classic && poem.user_id;
  const isClassicAuthor = poem.is_classic;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container flex-1 py-10 max-w-2xl">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("detail_back")}
        </Link>

        <article className="animate-fade-in">
          {/* Author block */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center border border-border overflow-hidden">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              {isAuthorLinked ? (
                <Link to={`/author/${poem.user_id}`} className="text-sm font-medium text-foreground hover:text-accent transition-colors">
                  {poem.author_name}
                </Link>
              ) : isClassicAuthor ? (
                <Link to={`/classic-author/${encodeURIComponent(poem.author_name || "Unknown")}`} className="text-sm font-medium text-foreground hover:text-accent transition-colors">
                  {poem.author_name}
                </Link>
              ) : (
                <span className="text-sm font-medium text-foreground">{poem.author_name}</span>
              )}
              <div className="flex items-center gap-2">
                {!poem.is_classic && (
                  <span className="inline-block rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
                    {t("community_badge")}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(poem.created_at), { addSuffix: true, locale: dateFnsLocale })}
                </span>
              </div>
            </div>
          </div>

          <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl lg:text-5xl leading-tight">
            {poem.title}
          </h1>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {(poem.tags || []).map((tag) => (
              <span key={tag} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {translateTag(tag)}
              </span>
            ))}
          </div>

          {/* Poem content */}
          <div className="mt-8 rounded-xl border border-border bg-parchment-warm p-8 md:p-10 shadow-sm overflow-x-auto">
            <pre className="whitespace-pre font-display text-sm leading-[1.9] text-foreground tracking-wide">
              {poem.content}
            </pre>
          </div>

          {/* Action bar */}
          <div className="mt-6 flex items-center gap-3 flex-wrap">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                liked ? "bg-accent/10 text-accent shadow-sm" : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              }`}
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
              {likeCount}
            </button>
            <button
              onClick={handleSave}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                saved ? "bg-accent/10 text-accent shadow-sm" : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              }`}
            >
              <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
              {saved ? t("detail_saved") : t("detail_save")}
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:text-foreground hover:bg-secondary/80"
            >
              <Share2 className="h-4 w-4" />
              {t("detail_share")}
            </button>
            {user && poem.user_id === user.id && (
              <button
                onClick={() => {
                  if (window.confirm(t("detail_delete_confirm"))) {
                    deletePoem.mutate(poem.id, {
                      onSuccess: () => { toast.success(t("detail_deleted")); navigate("/portfolio"); },
                      onError: (err: any) => toast.error(err.message),
                    });
                  }
                }}
                disabled={deletePoem.isPending}
                className="flex items-center gap-1.5 rounded-full bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition-all hover:bg-destructive/20 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {deletePoem.isPending ? t("detail_deleting") : t("detail_delete")}
              </button>
            )}
          </div>

          {/* Comments */}
          <section className="mt-10">
            <h2 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-accent" />
              {t("detail_comments")} ({commentCount})
            </h2>

            <div className="mt-4 rounded-xl border border-border bg-card p-4">
              {user ? (
                <>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t("detail_comment_placeholder")}
                    rows={3}
                    maxLength={2000}
                    className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent/30"
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={handlePostComment}
                      disabled={postComment.isPending || !comment.trim()}
                      className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                    >
                      {postComment.isPending ? t("detail_posting") : t("detail_post_comment")}
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-2">
                  <Link to="/auth" className="text-accent hover:underline">{t("detail_sign_in_comment")}</Link>
                  {t("detail_to_comment")}
                </p>
              )}
            </div>

            <div className="mt-4 space-y-3">
              {comments.map((c) => (
                <CommentRow
                  key={c.id}
                  c={c}
                  currentUserId={user?.id}
                  poemId={id || ""}
                  dateFnsLocale={dateFnsLocale}
                  t={t}
                />
              ))}
              {comments.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  {t("detail_no_comments")}
                </p>
              )}
            </div>
          </section>

          {/* Related poems */}
          <RelatedPoems poemId={poem.id} tags={poem.tags} authorName={poem.author_name} />
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default PoemDetail;
