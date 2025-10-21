// MetricCardWithInfo.tsx
import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Info } from "lucide-react";

interface MetricCardWithInfoProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ElementType;
  tooltip?: string | React.ReactNode;
  color?: string; // optional accent color (blue, green, amber)
}

export const MetricCardWithInfo = ({
  title,
  value,
  subtitle,
  icon: Icon,
  tooltip,
  color = "blue",
}: MetricCardWithInfoProps) => {
  const [open, setOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-transparent relative">
      <div className="flex items-start justify-between gap-4">
        {/* Left side: icon */}
        {Icon && (
          <span
            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-${color}-50`}
          >
            <Icon className="h-4 w-4 text-gray-600" />
          </span>
        )}

        {/* Right side: metric + tooltip */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 relative">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>

            {/* Info icon button */}
            {tooltip && (
              <div className="relative" ref={tooltipRef}>
                <button
                  type="button"
                  aria-label={`More info about ${title}`}
                  onClick={() => setOpen((prev) => !prev)}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>

                {/* Tooltip popup (mobile-safe) */}
                {open && (
                  <>
                    {/* Desktop / tablet (>=sm): inline, centered over icon, clamped width */}
                    <div
                      className="hidden sm:block absolute left-1/2 -translate-x-1/2 -top-14 z-40
                                max-w-[90vw] w-64 rounded-lg border border-gray-200 bg-white px-3 py-2
                                text-[11px] text-gray-700 shadow-lg text-center break-words"
                      role="tooltip"
                    >
                      {tooltip}
                    </div>

                    {/* Mobile (<sm): full-screen overlay with centered card */}
                    <div className="sm:hidden fixed inset-0 z-50 flex items-center justify-center p-4">
                      {/* Backdrop closes on tap */}
                      <button
                        aria-label="Close tooltip"
                        className="absolute inset-0 bg-black/30"
                        onClick={() => setOpen(false)}
                      />
                      <div
                        className="relative z-10 w-full max-w-xs rounded-xl border border-gray-200 bg-white px-4 py-3
                                  text-[12px] text-gray-800 shadow-2xl text-center break-words"
                        role="dialog"
                        aria-modal="true"
                      >
                        <div className="absolute -top-3 right-2">
                          <button
                            aria-label="Close tooltip"
                            className="rounded-md px-2 py-0.5 text-gray-600 hover:text-gray-900"
                            onClick={() => setOpen(false)}
                          >
                            ✕
                          </button>
                        </div>
                        {tooltip}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="text-2xl font-semibold leading-tight mt-0.5">
            {value}
          </div>

          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
};
