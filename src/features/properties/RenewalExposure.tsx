import { Disclosure } from "@/components/ui/disclosure";
import { addDays, format, parseISO } from "date-fns";
import { money } from "@/domain/finance/format";
import { isActiveLease } from "@/domain/finance/activeLeases";
import { useWorkspace } from "@/features/portfolio/useWorkspace";
import { balanceEvidence } from "@/domain/finance/debt";

const renewalWindowDays = 90;

export function RenewalExposure() {
  const { filteredProperties, metrics, query, setSelectedProperty } = useWorkspace();
  const { leases, units } = query.portfolio.record;
  const today = format(new Date(), "yyyy-MM-dd");
  const windowEnd = format(addDays(parseISO(today), renewalWindowDays), "yyyy-MM-dd");
  const propertyById = new Map(filteredProperties.map(property => [property.id, property]));
  const unitsById = new Map(units?.map(unit => [unit.id, unit.property_id]));
  const nextLeasesByUnit = new Map<string, Array<Parameters<typeof isActiveLease>[0] & { id: string }>>();
  for (const lease of leases ?? []) {
    if (!lease.end_date || lease.end_date < today) continue;
    const matching = nextLeasesByUnit.get(lease.unit_id) ?? [];
    matching.push(lease);
    nextLeasesByUnit.set(lease.unit_id, matching);
  }
  const gaps = (leases ?? []).flatMap(lease => {
    const property = propertyById.get(unitsById.get(lease.unit_id) ?? "");
    const endDate = lease.end_date;
    if (!property || !endDate || endDate > windowEnd || !isActiveLease(lease, today) || !(lease.monthly_rent > 0)) return [];
    const nextDay = format(addDays(parseISO(endDate), 1), "yyyy-MM-dd");
    if (nextLeasesByUnit.get(lease.unit_id)?.some(next => next.id !== lease.id && isActiveLease(next, nextDay))) return [];
    return [{ leaseId: lease.id, endDate, property, annualRent: lease.monthly_rent * 12 }];
  }).sort((a, b) => b.annualRent - a.annualRent || a.endDate.localeCompare(b.endDate));
  const balances = metrics.assets.flatMap(asset => {
    const unverified = (asset.loans ?? []).reduce((sum, loan) => {
      const evidence = balanceEvidence([loan], query.portfolio.statements, today);
      return sum + (evidence.stale || evidence.undated ? loan.balance ?? 0 : 0);
    }, 0);
    return unverified > 0 ? [{ property: asset.property, balance: unverified }] : [];
  }).sort((a, b) => b.balance - a.balance || a.property.alias.localeCompare(b.property.alias));

  return (
    <aside aria-label="Renewals to verify" className="space-y-3 border-t pt-3 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
      <Disclosure label={`Renewals to verify · ${gaps.length}`} openOnDesktop section>
      <Disclosure label="Ranking basis"><p>Leases ending in the next {renewalWindowDays} days without a replacement on record, ranked by annualized contractual rent.</p></Disclosure>
      {!leases || !units ? <p className="text-sm text-muted-foreground">Lease or unit records are unavailable.</p>
        : gaps.length ? <ul className="divide-y border-y">
          {gaps.map(({ leaseId, endDate, property, annualRent }) => <li key={leaseId} className="space-y-1 py-2">
            <p className="font-semibold tabular-nums">{money(annualRent)}/yr</p>
            <button type="button" className="text-sm underline underline-offset-2 focus-visible:outline-ring" onClick={() => setSelectedProperty(property.id)}>
              Filter to {property.alias}
            </button>
            <p className="text-xs text-muted-foreground">Current lease ends {endDate}.</p>
          </li>)}
        </ul> : <p className="text-sm text-muted-foreground">No upcoming renewals need review in the current records.</p>}
      </Disclosure>
      {balances.length > 0 && <Disclosure label={`Mortgage balances to verify · ${balances.length}`} section>
        <Disclosure label="Balance basis"><p>Recorded principal with a stale or unverified statement date.</p></Disclosure>
        <ul className="divide-y border-y">{balances.map(({ property, balance }) => (
          <li key={property.id} className="space-y-1 py-2">
            <p className="font-semibold tabular-nums">{money(balance)}</p>
            <button type="button" className="text-sm underline underline-offset-2 focus-visible:outline-ring" onClick={() => setSelectedProperty(property.id)}>
              Filter to {property.alias}
            </button>
          </li>
        ))}</ul>
      </Disclosure>}
    </aside>
  );
}
