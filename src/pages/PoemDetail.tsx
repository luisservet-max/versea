import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useParams, Link, useNavigate } from "react-router-dom";
import { usePoem, useDeletePoem } from "@/hooks/usePoems";
import { useLikeCount, useUserLiked, useToggleLike, useSavedStatus, useToggleSave } from "@/hooks/useInteractions";
import { useComments, useCommentCount, usePostComment } from "@/hooks/useComments";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Heart, MessageCircle, Share2, Bookmark, Loader2, Trash2 } from "lucide-react";
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
          <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            {poem.title}
          </h1>
          <p className="mt-2 text-muted-foreground">
            by <span className="font-medium text-foreground">{poem.author_name}</span>
            {!poem.is_classic && (
              <span className="ml-2 inline-block rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                Community
              </span>
            )}
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {(poem.tags || []).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
              >
                {tag.charAt(0).toUpperCase() + tag.slice(1)}
              </span>
            ))}
          </div>

          <div className="mt-8 rounded-lg border border-border bg-parchment-warm p-6 md:p-8">
            <pre className="whitespace-pre-wrap font-body text-base leading-relaxed text-foreground">
              {poem.content}
            </pre>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                liked
                  ? "bg-accent/10 text-accent"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
              {likeCount}
            </button>
            <button
              onClick={handleSave}
              className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                saved
                  ? "bg-accent/10 text-accent"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
              {saved ? "Saved" : "Save"}
            </button>
            <button className="flex items-center gap-1.5 rounded-md bg-secondary px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>

          {/* Comments */}
          <section className="mt-10">
            <h2 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-accent" />
              Comments ({commentCount})
            </h2>

            {/* Comment form */}
            <div className="mt-4 rounded-lg border border-border bg-card p-4">
              {user ? (
                <>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your thoughts on this poem..."
                    rows={3}
                    maxLength={2000}
                    className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent/30"
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={handlePostComment}
                      disabled={postComment.isPending || !comment.trim()}
                      className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
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

            {/* Comment list */}
            <div className="mt-4 space-y-4">
              {comments.map((c) => (
                <div key={c.id} className="rounded-lg border border-border bg-card p-4">
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
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default PoemDetail;
