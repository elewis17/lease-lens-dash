import { Calculator, Database, FileText, Home, TrendingUp } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

const destinations = [
  { path: "/briefing", label: "Briefing", icon: Home },
  { path: "/capital", label: "Capital", icon: TrendingUp },
  { path: "/underwrite", label: "Underwrite", icon: Calculator },
  { path: "/holdings", label: "Holdings", icon: Database },
  { path: "/decisions", label: "Decision Log", icon: FileText },
];

export function PortfolioNav({ prefix }: { prefix: string }) {
  const { search, hash } = useLocation();
  return (
    <aside className="shrink-0 border-b border-border lg:w-56 lg:border-b-0 lg:border-r">
      <nav aria-label="Portfolio views" className="flex gap-1 overflow-x-auto p-2 lg:flex-col">
        {destinations.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={{ pathname: prefix + path, search, hash }}
            className={({ isActive }) => [
              "flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm",
              isActive ? "bg-primary/10 font-medium text-foreground" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
            ].join(" ")}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
