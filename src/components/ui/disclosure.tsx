import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Disclosure({ label, children, className, openOnDesktop = false, initiallyOpen = false, section = false }: {
  label: ReactNode;
  children: ReactNode;
  className?: string;
  openOnDesktop?: boolean;
  initiallyOpen?: boolean;
  section?: boolean;
}) {
  const [open, setOpen] = useState(() => initiallyOpen || openOnDesktop && window.matchMedia("(min-width: 1024px)").matches);
  return (
    <details open={open} onToggle={event => setOpen(event.currentTarget.open)} className={cn("group/disclosure", section && "border-y", className)}>
      <summary className={cn("flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 focus-visible:outline-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden",
        section ? "py-2 text-base font-semibold" : "w-fit text-xs font-medium text-muted-foreground hover:text-foreground")}>
        {label}
        <ChevronDown className="size-4 shrink-0 text-muted-foreground group-open/disclosure:rotate-180" aria-hidden="true" />
      </summary>
      <div className={section ? "space-y-4 pb-4" : "space-y-2 pb-2 text-sm text-muted-foreground"}>{children}</div>
    </details>
  );
}
