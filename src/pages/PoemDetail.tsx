import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RelatedPoems from "@/components/RelatedPoems";
import { useParams, Link, useNavigate } from "react-router-dom";
import { usePoem, useDeletePoem } from "@/hooks/usePoems";
import { useLikeCount, useUserLiked, useToggleLike, useSavedStatus, useToggleSave } from "@/hooks/useInteractions";
import { useComments, useCommentCount, usePostComment } from "@/hooks/useComments";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Heart, MessageCircle, Share2, Bookmark, Loader2, Trash2, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const PoemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
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

  const handleLike = () => {
    if (!user) { navigate("/auth"); return; }
    toggleLike.mutate(liked);
  };

  const handleSave = () => {
    if (!user) { navigate("/auth"); return; }
    toggleSave.mutate(saved, {
      onSuccess: () => toast.success(saved ? "Removed from catalog" : "Saved to catalog"),
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handlePostComment = () => {
    if (!user) { navigate("/auth"); return; }
    if (!comment.trim()) return;
    postComment.mutate(comment, {
      onSuccess: () => { setComment(""); toast.success("Comment posted!"); },
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
          <p className="text-muted-foreground">Poem not found.</p>
        </div>
        <Footer />
      </div>
    );
  }

  const isAuthorLinked = !poem.is_classic && poem.user_id;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container flex-1 py-10 max-w-2xl">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Discover
        </Link>

        <article className="animate-fade-in">
          {/* Author block */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center border border-border overflow-hidden">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              {isAuthorLinked ? (
                <Link
                  to={`/author/${poem.user_id}`}
                  className="text-sm font-medium text-foreground hover:text-accent transition-colors"
                >
                  {poem.author_name}
                </Link>
              ) : (
                <span className="text-sm font-medium text-foreground">
                  {poem.author_name}
                </span>
              )}
              <div className="flex items-center gap-2">
                {!poem.is_classic && (
                  <span className="inline-block rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
                    Community
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(poem.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>

          <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl lg:text-5xl leading-tight">
            {poem.title}
          </h1>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {(poem.tags || []).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
              >
                {tag.charAt(0).toUpperCase() + tag.slice(1)}
              </span>
            ))}
          </div>

          {/* Poem content */}
          <div className="mt-8 rounded-xl border border-border bg-parchment-warm p-8 md:p-10 shadow-sm">
            <pre className="whitespace-pre-wrap font-display text-lg md:text-xl leading-[1.8] text-foreground tracking-wide">
              {poem.content}
            </pre>
          </div>

          {/* Action bar */}
          <div className="mt-6 flex items-center gap-3 flex-wrap">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                liked
                  ? "bg-accent/10 text-accent shadow-sm"
                  : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              }`}
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
              {likeCount}
            </button>
            <button
              onClick={handleSave}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                saved
                  ? "bg-accent/10 text-accent shadow-sm"
                  : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              }`}
            >
              <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
              {saved ? "Saved" : "Save"}
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:text-foreground hover:bg-secondary/80"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
            {user && poem.user_id === user.id && (
              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete this poem?")) {
                    deletePoem.mutate(poem.id, {
                      onSuccess: () => {
                        toast.success("Poem deleted");
                        navigate("/portfolio");
                      },
                      onError: (err: any) => toast.error(err.message),
                    });
                  }
                }}
                disabled={deletePoem.isPending}
                className="flex items-center gap-1.5 rounded-full bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition-all hover:bg-destructive/20 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {deletePoem.isPending ? "Deleting..." : "Delete"}
              </button>
            )}
          </div>

          {/* Comments */}
          <section className="mt-10">
            <h2 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-accent" />
              Comments ({commentCount})
            </h2>

            <div className="mt-4 rounded-xl border border-border bg-card p-4">
              {user ? (
                <>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your thoughts on this poem..."
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
                      {postComment.isPending ? "Posting..." : "Post Comment"}
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-2">
                  <Link to="/auth" className="text-accent hover:underline">Sign in</Link> to post a comment.
                </p>
              )}
            </div>

            <div className="mt-4 space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{c.author_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap">{c.content}</p>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No comments yet. Be the first to share your thoughts!
                </p>
              )}
            </div>
          </section>

          {/* Related poems */}
          <RelatedPoems
            poemId={poem.id}
            tags={poem.tags}
            authorName={poem.author_name}
          />
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default PoemDetail;
