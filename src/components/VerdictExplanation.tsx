export function VerdictExplanation({ label, detail, live = false }: {
  label: string;
  detail: string;
  live?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="font-medium" role={live ? "status" : undefined}>{live ? label : `Verdict · ${label}`}</p>
      <p className="text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}
