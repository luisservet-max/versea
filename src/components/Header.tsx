import { Link, useLocation } from "react-router-dom";
import { BookOpen, Feather, Search, User, LogOut, Activity, Globe, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { localeNames, type Locale } from "@/i18n/translations";
import { useState, useRef, useEffect } from "react";

const Header = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { locale, setLocale, t } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const navItems = [
    { to: "/", label: t("nav_discover"), icon: Search },
    { to: "/feed", label: t("nav_feed"), icon: Activity },
    { to: "/find-people", label: t("nav_find_people"), icon: Users },
    { to: "/catalog", label: t("nav_catalog"), icon: BookOpen },
    { to: "/portfolio", label: t("nav_poems"), icon: Feather },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Feather className="h-6 w-6 text-accent" />
          <span className="font-display text-xl font-semibold tracking-tight text-foreground">
            Versea
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <div ref={langRef} className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              title="Language"
            >
              <Globe className="h-4 w-4" />
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-1 w-36 rounded-lg border border-border bg-popover shadow-md z-50 p-1">
                {(Object.keys(localeNames) as Locale[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => { setLocale(l); setLangOpen(false); }}
                    className={`w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
                      l === locale
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground hover:bg-secondary"
                    }`}
                  >
                    {localeNames[l]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {user ? (
            <>
              <Link
                to="/portfolio"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <User className="h-4 w-4" />
              </Link>
              <button
                onClick={signOut}
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                title={t("nav_sign_out")}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t("nav_sign_in")}
            </Link>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="flex border-t border-border md:hidden">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? "text-accent"
                  : "text-muted-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
};

export default Header;
