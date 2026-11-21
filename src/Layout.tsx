import { useTheme } from "next-themes";
import { useAuth } from "@/context/auth";
import { rememberWorkspaceLocation } from "@/features/navigation/sessionState";
import UserMenu from "@/components/ui/UserMenu";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isDemo = /^\/demo(?:\/|$)/.test(location.pathname);

  const { resolvedTheme, setTheme } = useTheme();
  const nextTheme = resolvedTheme === "dark" ? "light" : "dark";

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <header className="flex min-h-16 items-center justify-between gap-2 border-b border-border px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="h-3 w-3 shrink-0 bg-brand" />
          <span className="text-lg font-semibold tracking-tight">DealStack</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-3">
          <Button type="button" size="icon" variant="ghost" onClick={() => setTheme(nextTheme)}
            aria-label={`Use ${nextTheme} theme`} title={`Use ${nextTheme} theme`}>
            {nextTheme === "dark" ? <Moon /> : <Sun />}
          </Button>

          {!user && (
            <Button size="sm"
              onClick={() => {
                rememberWorkspaceLocation({ pathname: location.pathname, search: "", hash: "" });
                navigate("/auth/login");
              }}
            >
              Sign in
            </Button>
          )}

          {user && <>
            <Link className="px-2 py-2 text-sm underline underline-offset-4" to={isDemo ? "/briefing" : "/demo"}>
              {isDemo ? "Your portfolio" : "Demo"}
            </Link>
            <UserMenu />
          </>}
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
