import { Feather } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border bg-card py-8 mt-16">
    <div className="container flex flex-col items-center gap-3 text-center">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Feather className="h-4 w-4 text-accent" />
        <span className="font-display text-sm font-medium">Versea</span>
      </div>
      <p className="text-xs text-muted-foreground max-w-md">
        A place for poetry lovers to discover, catalog, and share the verses that move them.
      </p>
    </div>
  </footer>
);

export default Footer;
