import Layout from "./Layout";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Workspace } from "@/features/portfolio/Workspace";
import { workspaceRoutes } from "@/features/portfolio/workspaceRoutes";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Login from "./pages/auth/Login.tsx";
import AuthCallback from "./pages/auth/AuthCallback";
import { connectedReview, connectedReviewCallback } from "@/features/portfolio/releaseProfile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Layout>
          <Routes>
            {workspaceRoutes(
              <ProtectedRoute signedOut={<Workspace key="illustrative" userId="illustrative" illustrative />}>
                {(userId) => <Workspace key={userId} userId={userId} />}
              </ProtectedRoute>,
            )}
            {workspaceRoutes(<Workspace key="illustrative" userId="illustrative" prefix="/demo" illustrative />, "/demo")}
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            {connectedReview && <Route path={connectedReviewCallback} element={<AuthCallback />} />}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
