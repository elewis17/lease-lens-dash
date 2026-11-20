import { useTheme } from "next-themes";
import { useAuth } from "@/context/auth";
import { rememberWorkspaceLocation } from "@/features/navigation/sessionState";
import UserMenu from "@/components/ui/UserMenu";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isDemo = /^\/demo(?:\/|$)/.test(location.pathname);

  const { resolvedTheme, setTheme } = useTheme();
  const nextTheme = resolvedTheme === "dark" ? "light" : "dark";

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      {/* --- Top Bar --- */}
      <header className="flex items-center justify-between gap-2 px-4 py-4 sm:px-6 border-b border-border">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="h-3 w-3 shrink-0 bg-brand" />
          <h1 className="text-xl font-semibold">DealStack</h1>
        </div>
        {/* RIGHT: controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* THEME TOGGLE (pill shaped) */}
          <button
            type="button"
            onClick={() => setTheme(nextTheme)}
            className="px-4 py-1.5 rounded-full border border-border text-sm transition-colors bg-card text-card-foreground"
          >
            Use {nextTheme} theme
          </button>

          {/* Log In button – only when logged out */}
          {!user && (
            <button
              onClick={() => {
                rememberWorkspaceLocation({ pathname: location.pathname, search: "", hash: "" });
                navigate("/auth/login");
              }}
              className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
            >
              Sign in
            </button>
          )}

          {/* User avatar + dropdown – only when logged in */}
          {user && <>
            <Link className="px-2 py-2 text-sm underline underline-offset-4" to={isDemo ? "/briefing" : "/demo"}>
              {isDemo ? "Your portfolio" : "Demo"}
            </Link>
            <UserMenu />
          </>}
        </div>
      </header>

      {/* --- Main Content --- */}
      <main>{children}</main>
    </div>
  );
}
