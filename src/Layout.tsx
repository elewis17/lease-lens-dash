import { useEffect, useState } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  // Theme state (light / dark)
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light"
  );

  useEffect(() => {
    // Apply theme to <html>
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);

    // Persist
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      {/* --- Top Bar --- */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold">Pocket CFO</h1>
          <p className="text-sm text-muted-foreground -mt-1">
            Real Estate AI Advisor
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* THEME TOGGLE (pill shaped) */}
          <button
            onClick={toggleTheme}
            className="px-4 py-1.5 rounded-full border border-border text-sm transition-colors bg-card text-card-foreground"
          >
            {theme === "dark" ? "Dark Mode" : "Light Mode"}
          </button>

          {/* Demo label */}
          <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm">
            Demo Mode
          </span>

          {/* Log In */}
          <button className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
            Log In
          </button>
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="p-6">{children}</main>
    </div>
  );
}