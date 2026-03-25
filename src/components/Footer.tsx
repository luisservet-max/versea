import { Feather } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();
  return (
    <footer className="border-t border-border bg-card py-8 mt-16">
      <div className="container flex flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Feather className="h-4 w-4 text-accent" />
          <span className="font-display text-sm font-medium">Versea</span>
        </div>
        <p className="text-xs text-muted-foreground max-w-md">
          {t("footer_tagline")}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
