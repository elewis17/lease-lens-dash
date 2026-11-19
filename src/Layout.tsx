import { useTheme } from "next-themes";
import { useAuth } from "@/context/auth";
import { rememberWorkspaceLocation } from "@/features/navigation/sessionState";
import UserMenu from "@/components/ui/UserMenu";
import { useLocation, useNavigate } from "react-router-dom";

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const { resolvedTheme, setTheme } = useTheme();
  const nextTheme = resolvedTheme === "dark" ? "light" : "dark";

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      {/* --- Top Bar --- */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
         {/* LEFT: brand + sidebar toggle (aligned to sidebar width) */}
        <div>
          <div>
            <h1 className="text-2xl font-bold">DealStack</h1>
            <p className="text-sm text-muted-foreground -mt-1">
              AI Co-Pilot for Investors
            </p>
          </div>
        </div>
        {/* RIGHT: controls */}
        <div className="flex items-center gap-3">
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
                rememberWorkspaceLocation(location);
                navigate("/auth/login");
              }}
              className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
            >
              Sign in
            </button>
          )}

          {/* User avatar + dropdown – only when logged in */}
          {user && <UserMenu />}
        </div>
      </header>

      {/* --- Main Content --- */}
      <main>{children}</main>
    </div>
  );
}