import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { AuthProvider } from "./context/AuthContext";
import { companyRelease } from "./features/portfolio/releaseProfile";
import { restoreCompanyDeepLink } from "./features/navigation/companyDeepLink";
import "./index.css";

if (companyRelease) restoreCompanyDeepLink(window.location, window.history);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AppErrorBoundary>
        <AuthProvider>
          <App />
        </AuthProvider>
      </AppErrorBoundary>
    </ThemeProvider>
  </StrictMode>,
);
