import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useParams, Link } from "react-router-dom";
import { featuredPoems } from "@/data/poems";
import { ArrowLeft, Heart, MessageCircle, Share2, Bookmark } from "lucide-react";
import { useState } from "react";

const PoemDetail = () => {
  const { id } = useParams();
  const poem = featuredPoems.find((p) => p.id === id);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [comment, setComment] = useState("");

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
            by <span className="font-medium text-foreground">{poem.author}</span>
            {poem.isUserPoem && (
              <span className="ml-2 inline-block rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                Community
              </span>
            )}
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {poem.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-8 rounded-lg border border-border bg-parchment-warm p-6 md:p-8">
            <pre className="whitespace-pre-wrap font-body text-base leading-relaxed text-foreground">
              {poem.content}
            </pre>
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center gap-4">
            <button
              onClick={() => setLiked(!liked)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                liked
                  ? "bg-accent/10 text-accent"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
              {poem.likes + (liked ? 1 : 0)}
            </button>
            <button
              onClick={() => setSaved(!saved)}
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
              Comments ({poem.comments})
            </h2>
            <div className="mt-4 rounded-lg border border-border bg-card p-4">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts on this poem..."
                rows={3}
                className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent/30"
              />
              <div className="mt-2 flex justify-end">
                <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                  Post Comment
                </button>
              </div>
            </div>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Sign in to see and post comments.
            </p>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default PoemDetail;
