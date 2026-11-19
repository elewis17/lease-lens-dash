import { Link } from "react-router-dom";
import { useWorkspace } from "@/features/portfolio/useWorkspace";
import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { downloadCapturedDocument } from "@/features/leases/leaseCaptureApi";
import type { usePortfolio } from "@/features/portfolio/usePortfolio";
import { staleStatementDays } from "@/domain/finance/debt";
import { money, percent } from "@/domain/finance/format";
import type { Property } from "./PropertiesTable";

type Portfolio = ReturnType<typeof usePortfolio>["portfolio"];
const shortDate = (value: string | null) => value
  ? new Date(`${value.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-US", { dateStyle: "medium", timeZone: "UTC" })
  : "Date unavailable";

const expenseLabels = {
  repairs: "Repairs", pm: "Management", tax: "Tax", insurance: "Insurance", capex: "Capital improvement",
  utilities: "Utilities", hoa: "Association fees", advertising: "Advertising", other: "Other operating cost",
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group border-t">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-medium
        focus-visible:outline-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="h-4 w-4 text-muted-foreground group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="space-y-2 pb-3 text-sm">{children}</div>
    </details>
  );
}

function RecordedDocument({ ownerId, path, title }: { ownerId: string; path: string; title: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <li className="space-y-1">
      <Button variant="outline" disabled={pending} onClick={async () => {
        setPending(true);
        setError(null);
        try {
          await downloadCapturedDocument(ownerId, path);
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "The lease document could not be loaded.");
        } finally {
          setPending(false);
        }
      }}>{pending ? "Opening document…" : title}</Button>
      {error && <p role="alert" className="text-destructive">{error}</p>}
    </li>
  );
}

function RecordSections({ ownerId, property, portfolio }: { ownerId: string; property: Property; portfolio: Portfolio }) {
  const { entries, pathTo } = useWorkspace();
  const propertyDecisions = entries.entries.flatMap(entry =>
    entry.payload.kind === "capital" && entry.payload.status === "decided" && entry.payload.propertyId === property.id
      ? [{ ...entry, title: entry.payload.title }] : []);
  const { record } = portfolio;
  const units = new Set(record.units?.filter(unit => unit.property_id === property.id).map(unit => unit.id));
  const leases = portfolio.leases.filter(lease => lease.property_id === property.id);
  const leaseIds = new Set(leases.map(lease => lease.id));
  const loans = portfolio.mortgages.filter(loan => loan.property_id === property.id);
  const mortgageIds = new Set(loans.map(loan => loan.id));
  const statements = portfolio.statements.filter(statement => mortgageIds.has(statement.mortgage_id))
    .sort((a, b) => b.statement_date.localeCompare(a.statement_date));
  const expenses = (record.expenses ?? []).filter(expense =>
    expense.property_id === property.id ||
    (expense.property_id === null && expense.unit_id !== null && units.has(expense.unit_id)),
  ).sort((a, b) => b.date.localeCompare(a.date));
  const improvements = expenses.filter(expense => expense.category === "capex");
  const operating = expenses.filter(expense => expense.category !== "capex");
  const timeline = [
    ...loans.flatMap(loan => loan.start_date && Number.isFinite(loan.start_date.getTime())
      ? [{ date: loan.start_date.toISOString().slice(0, 10), title: loan.loan_name || "Financing began", basis: "Contractual" }] : []),
    ...leases.flatMap(lease => lease.startDate
      ? [{ date: lease.startDate, title: `Lease began · ${lease.unit_label ?? "Unit unavailable"}`, basis: "Contractual" }] : []),
    ...propertyDecisions.map(entry => ({ date: entry.created_at, title: entry.title, basis: "Decision recorded" })),
    ...statements.map(statement => ({ date: statement.statement_date, title: "Principal balance confirmed · " + money(statement.principal_balance), basis: "Statement" })),
    ...improvements.map(item => ({ date: item.date, title: `Capital improvement · ${money(item.amount)}`, basis: "Recorded expense" })),
  ].sort((a, b) => b.date.localeCompare(a.date));
  const receipts = new Map<string, { amount: number; months: Set<string> }>();
  for (const payment of record.payments ?? []) {
    if (!leaseIds.has(payment.lease_id) || !payment.paid_date || payment.paid_amount === null) continue;
    const year = payment.paid_date.slice(0, 4);
    const current = receipts.get(year) ?? { amount: 0, months: new Set<string>() };
    current.amount += payment.paid_amount;
    current.months.add(payment.paid_date.slice(0, 7));
    receipts.set(year, current);
  }
  const documents = leases.filter(lease => lease.documentPath);
  const history = (entries: typeof expenses) => (
    <ul className="space-y-2">
      {entries.map((entry, index) => (
        <li key={index}>{shortDate(entry.date)} · {expenseLabels[entry.category]} · {money(entry.amount)}</li>
      ))}
    </ul>
  );

  return (
    <div className="space-y-4">
      <section className="space-y-2">
        <h3 className="font-medium">Timeline</h3>
        {timeline.length ? (
          <ol className="space-y-3 border-l pl-3 text-sm">
            {timeline.map((event, index) => (
              <li key={index}>
                <p>{event.title}</p>
                <p className="text-xs text-muted-foreground">{shortDate(event.date)} · {event.basis}</p>
              </li>
            ))}
          </ol>
        ) : <p className="text-sm text-muted-foreground">No dated events in the current record.</p>}
      </section>
      <div>
        <Section title="Acquisition">
          <p>{property.purchase_price == null ? "Acquisition price is unavailable." : `Recorded purchase price · ${money(property.purchase_price)}`}</p>
          <p className="text-muted-foreground">The acquisition date is unavailable.</p>
        </Section>
        <Section title="Financing">
          {loans.length ? <ul className="space-y-2">{loans.map(loan => {
            const source = statements.find(statement => statement.mortgage_id === loan.id);
            const backedByStatement = source?.principal_balance === loan.current_balance && !!source;
            const age = source ? Math.max(0, Math.floor((Date.now() - Date.parse(source.statement_date)) / 86_400_000)) : null;
            return (
              <li key={loan.id}>
                <p className="font-medium">{loan.loan_name || "Mortgage"}</p>
                <p className="text-muted-foreground">Contractual · {percent(loan.interest_rate / 100)} · {loan.term_months} months · {money(loan.monthly_payment)} scheduled monthly payment</p>
                <p className="text-muted-foreground">{loan.current_balance == null ? "Current balance unavailable" : "Recorded balance · " + money(loan.current_balance)}</p>
                {backedByStatement && source ? (
                  <p className={age !== null && age > staleStatementDays ? "text-warning" : "text-muted-foreground"}>
                    Source · Confirmed statement dated {shortDate(source.statement_date)}{age !== null ? " · " + age + " days old" : ""}
                    {age !== null && age > staleStatementDays ? " · Check for a newer statement." : ""}
                  </p>
                ) : loan.current_balance != null && <p className="text-muted-foreground">Balance source date unverified.</p>}
              </li>
            );
          })}</ul> : <p className="text-muted-foreground">No financing records.</p>}
        </Section>
        <Section title="Leases">
          {leases.length ? <ul className="space-y-2">{leases.map(lease => (
            <li key={lease.id}>
              <p className="font-medium">{lease.unit_label ?? "Unit unavailable"} · {lease.tenant}</p>
              <p className="text-muted-foreground">Contractual · {money(lease.monthlyRent)}/mo · {shortDate(lease.startDate)} to {shortDate(lease.leaseEnd)}</p>
            </li>
          ))}</ul> : <p className="text-muted-foreground">No lease records.</p>}
        </Section>
        <Section title="Expenses">
          {operating.length ? <><p className="text-muted-foreground">Recorded operating expenses</p>{history(operating)}</>
            : <p className="text-muted-foreground">No operating expense records.</p>}
        </Section>
        <Section title="Improvements">
          {improvements.length ? <><p className="text-muted-foreground">Recorded capital expenses</p>{history(improvements)}</>
            : <p className="text-muted-foreground">No capital improvement expenses recorded.</p>}
        </Section>
        <Section title="Valuation">
          <p>{property.property_value == null ? "No valuation estimate on record." : `Estimate · Current recorded value ${money(property.property_value)}`}</p>
          <p className="text-muted-foreground">Appraisal date and valuation history are unavailable.</p>
        </Section>
        <Section title="Documents">
          {documents.length || statements.length ? <ul className="space-y-2">
            {documents.map(lease => lease.documentPath && <RecordedDocument key={lease.id} ownerId={ownerId} path={lease.documentPath}
              title={"Download lease · " + (lease.unit_label ?? "Unit unavailable")} />)}
            {statements.map(statement => <RecordedDocument key={statement.id} ownerId={ownerId} path={statement.document_path}
              title={"Download statement · " + shortDate(statement.statement_date)} />)}
          </ul> : <p className="text-muted-foreground">No lease documents or mortgage statements linked.</p>}
        </Section>
        <Section title="Decisions">
          {entries.isError ? <p className="text-muted-foreground">Could not load property-linked decisions.</p>
            : propertyDecisions.length ? <ul className="space-y-2">{propertyDecisions.map(entry => (
              <li key={entry.id}><Link className="underline" to={pathTo("/decisions/" + entry.id + "/memo")}>{entry.title}</Link></li>
            ))}</ul>
            : <p className="text-muted-foreground">No property-linked decisions recorded.</p>}
        </Section>
        <Section title="Performance">
          {receipts.size ? (
            <>
              <p className="text-muted-foreground">Recorded rent receipts by calendar year. Coverage reflects months with a recorded receipt.</p>
              <ul className="space-y-2">{[...receipts].sort(([a], [b]) => b.localeCompare(a)).map(([year, value]) => (
                <li key={year}>{year} · {money(value.amount)} · {value.months.size} of 12 months</li>
              ))}</ul>
            </>
          ) : <p className="text-muted-foreground">No rent receipts on record.</p>}
          <p className="text-muted-foreground">Historical net cash flow needs a complete operating and debt-payment history.</p>
        </Section>
      </div>
    </div>
  );
}

export function PropertyRecord({ ownerId, property, portfolio }: { ownerId: string; property: Property; portfolio: Portfolio }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button type="button" className="min-h-11 text-left font-medium underline decoration-border underline-offset-4
          hover:decoration-current focus-visible:outline-2 focus-visible:outline-ring">
          {property.alias}
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" hideClose
        className="mx-auto flex max-h-[min(90dvh,48rem)] max-w-2xl flex-col gap-0 border p-0">
        <header className="space-y-1 border-b px-4 py-4 sm:px-6">
          <SheetTitle>{property.alias}</SheetTitle>
          <SheetDescription>Property record</SheetDescription>
        </header>
        <div className="min-h-0 overflow-y-auto overscroll-contain p-4 sm:px-6">
          <RecordSections ownerId={ownerId} property={property} portfolio={portfolio} />
        </div>
        <footer className="flex shrink-0 justify-end border-t px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
          <SheetClose asChild><Button variant="outline" className="min-h-11">Close</Button></SheetClose>
        </footer>
      </SheetContent>
    </Sheet>
  );
}
