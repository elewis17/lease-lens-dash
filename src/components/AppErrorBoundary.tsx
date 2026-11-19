import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
        <section className="max-w-md space-y-4" aria-labelledby="recovery-title">
          <h1 id="recovery-title" className="text-2xl font-semibold">DealStack couldn’t open this page</h1>
          <p role="alert" className="text-sm text-muted-foreground">Reload the page to try again.</p>
          <Button onClick={() => window.location.reload()}>Reload DealStack</Button>
        </section>
      </main>
    );
  }
}
