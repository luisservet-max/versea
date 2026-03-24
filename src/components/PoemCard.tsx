import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react";
import type { PoemWithAuthor } from "@/hooks/usePoems";
import { useLikeCount, useCommentCount } from "@/hooks/usePoems";
import { useState } from "react";
import { Link } from "react-router-dom";

interface PoemCardProps {
  poem: PoemWithAuthor;
}

const PoemCard = ({ poem }: PoemCardProps) => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const { data: likeCount = 0 } = useLikeCount(poem.id);
  const { data: commentCount = 0 } = useCommentCount(poem.id);

  return (
    <article className="group rounded-lg border border-border bg-card p-5 transition-all hover:shadow-md hover:border-accent/40">
      <Link to={`/poem/${poem.id}`} className="block">
        <h3 className="font-display text-lg font-semibold text-foreground group-hover:text-accent transition-colors">
          {poem.title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          by {poem.author_name}
          {!poem.is_classic && (
            <span className="ml-2 inline-block rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
              Community
            </span>
          )}
        </p>
        <pre className="mt-3 whitespace-pre-wrap font-body text-sm leading-relaxed text-foreground/80 line-clamp-4">
          {poem.excerpt || poem.content.split("\n").slice(0, 2).join("\n")}
        </pre>
      </Link>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {(poem.tags || []).slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLiked(!liked)}
            className={`flex items-center gap-1 text-sm transition-colors ${
              liked ? "text-accent" : "text-muted-foreground hover:text-accent"
            }`}
          >
            <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
            {likeCount + (liked ? 1 : 0)}
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
            onClick={() => setSaved(!saved)}
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
