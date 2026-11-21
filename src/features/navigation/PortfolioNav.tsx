import { Calculator, Database, FileText, Home, TrendingUp } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

const destinations = [
  { path: "/briefing", label: "Briefing", icon: Home },
  { path: "/capital", label: "Capital", icon: TrendingUp },
  { path: "/underwrite", label: "Underwrite", icon: Calculator },
  { path: "/holdings", label: "Holdings", icon: Database },
  { path: "/decisions", label: "Decision Log", icon: FileText, desktopOnly: true },
];

export function PortfolioNav({ prefix }: { prefix: string }) {
  const { search, hash } = useLocation();
  const destination = (path: string) => ({ pathname: prefix + path, search, hash });
  return (
    <aside className="shrink-0 lg:w-56 lg:border-r lg:border-border">
      <nav aria-label="Portfolio views"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] lg:static lg:flex lg:flex-col lg:gap-1 lg:border-t-0 lg:p-2">
        {destinations.map(({ path, label, icon: Icon, desktopOnly }) => (
          <NavLink
            key={path}
            to={destination(path)}
            className={({ isActive }) => [
              desktopOnly ? "hidden lg:flex" : "flex",
              "min-h-14 min-w-0 flex-col items-center justify-center gap-1 border-t-2 px-1 text-center text-xs lg:min-h-11 lg:flex-row lg:justify-start lg:gap-2 lg:rounded-r-md lg:border-l-2 lg:border-t-0 lg:px-3 lg:text-left lg:text-sm",
              isActive ? "border-brand font-semibold text-foreground" : "border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground",
            ].join(" ")}
          >
            <Icon className="h-5 w-5 shrink-0 lg:h-4 lg:w-4" aria-hidden />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
