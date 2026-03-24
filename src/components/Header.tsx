import { Link, useLocation } from "react-router-dom";
import { BookOpen, Feather, Search, User } from "lucide-react";

const Header = () => {
  const location = useLocation();

  const navItems = [
    { to: "/", label: "Discover", icon: Search },
    { to: "/catalog", label: "My Catalog", icon: BookOpen },
    { to: "/portfolio", label: "My Poems", icon: Feather },
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
          <Link
            to="/portfolio"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <User className="h-4 w-4" />
          </Link>
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
