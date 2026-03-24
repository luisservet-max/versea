import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { featuredPoems } from "@/data/poems";
import { Feather, Plus } from "lucide-react";
import PoemCard from "@/components/PoemCard";
import { useState } from "react";

const Portfolio = () => {
  const [showForm, setShowForm] = useState(false);
  const userPoems = featuredPoems.filter((p) => p.isUserPoem);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container flex-1 py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Feather className="h-6 w-6 text-accent" />
            <h1 className="font-display text-3xl font-bold text-foreground">My Poems</h1>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Write a Poem
          </button>
        </div>
        <p className="text-muted-foreground mb-8 max-w-lg">
          Your poetry portfolio. Write and share your verses with the Versea community.
        </p>

        {showForm && (
          <div className="mb-8 animate-fade-in rounded-lg border border-border bg-card p-6">
            <h2 className="font-display text-xl font-semibold text-foreground mb-4">New Poem</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Title</label>
                <input
                  type="text"
                  placeholder="Give your poem a title..."
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Your Poem</label>
                <textarea
                  rows={8}
                  placeholder="Write your verses here..."
                  className="mt-1 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent/30 font-body"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="love, nature, modern..."
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Cancel
                </button>
                <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                  Publish Poem
                </button>
              </div>
            </div>
          </div>
        )}

        {userPoems.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {userPoems.map((poem, i) => (
              <div
                key={poem.id}
                className="animate-fade-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <PoemCard poem={poem} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-20 text-center">
            <Feather className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">You haven't written any poems yet. Start writing!</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Portfolio;
