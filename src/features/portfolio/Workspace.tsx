import { format } from "date-fns";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { PropertyFilter } from "@/features/properties/PropertyFilter";
import { usePortfolio } from "./usePortfolio";
import { defaultThresholds } from "@/domain/finance/thresholds";
import { currentPolicies } from "@/features/decisions/entries";
import { PolicySettings } from "@/features/decisions/PolicySettings";
import { useWorkspaceEntries } from "@/features/decisions/useWorkspaceEntries";
import { PortfolioNav } from "@/features/navigation/PortfolioNav";
import { ScrollRestoration } from "@/features/navigation/ScrollRestoration";
import { useSessionState } from "@/features/navigation/sessionState";
import { assumptionsFrom, draftFragment, initialValues, readDraft, type AssumptionInputs } from "@/features/underwriting/draft";
import { kirkwoodExample } from "@/domain/finance/underwriting";
import { modelPortfolio } from "@/domain/finance/portfolio";
import { connectedReview } from "./releaseProfile";

function useWorkspaceState(userId: string, prefix: string, illustrative: boolean) {
  const location = useLocation();
  const navigate = useNavigate();
  const { pathname, search, hash } = location;
  const query = usePortfolio(userId, illustrative);
  const entries = useWorkspaceEntries(userId, illustrative);
  const { properties, leases, mortgages, record } = query.portfolio;
  const selection = new URLSearchParams(search).get("property") ?? "";
  const selectedProperty = properties.some(property => property.id === selection) ? selection : "";
  const filteredProperties = selectedProperty ? properties.filter(property => property.id === selectedProperty) : properties;
  const filteredLeases = selectedProperty ? leases.filter(lease => lease.property_id === selectedProperty) : leases;
  const filteredMortgages = selectedProperty ? mortgages.filter(mortgage => mortgage.property_id === selectedProperty) : mortgages;
  const escrowByProperty = new Map(mortgages.flatMap(loan => loan.property_id && loan.includes_escrow ? [[loan.property_id, true] as const] : []));
  const propertyOptions = properties.map(property => ({ id: property.id, name: property.alias }));
  const [marketRate, setMarketRate] = useSessionState(`dealstack:${userId}:market-rate`, illustrative ? "6.25" : "");
  const marketRateAmount = marketRate.trim() === "" ? null : Number(marketRate);
  const marketRatePct = marketRateAmount !== null && Number.isFinite(marketRateAmount) && marketRateAmount >= 0 ? marketRateAmount : null;
  const policies = currentPolicies(entries.entries);
  const portfolioPolicy = policies.get("Portfolio")?.policy ?? defaultThresholds;
  const policyFor = (type?: string | null) => policies.get(type ?? "")?.policy ?? portfolioPolicy;
  const propertyPolicies = new Map([...policies].map(([target, value]) => [target, value.policy]));
  const asOf = format(new Date(), "yyyy-MM-dd");
  const metrics = modelPortfolio(filteredProperties, record, asOf, marketRatePct, portfolioPolicy, propertyPolicies);
  const rentScenario = (increase: number) => modelPortfolio(filteredProperties, {
    ...record,
    leases: record.leases?.map(lease => ({ ...lease, monthly_rent: lease.monthly_rent * (1 + increase / 100) })) ?? null,
  }, asOf, marketRatePct, portfolioPolicy, propertyPolicies);

  const [sessionDraft, setSessionDraft] = useSessionState<AssumptionInputs>(
    `dealstack:${userId}:underwriting`, initialValues(illustrative ? kirkwoodExample : null),
  );
  const draft = readDraft(hash) ?? sessionDraft;
  const activeDealId = new URLSearchParams(search).get("deal");
  const openDeal = (id: string | null, values: AssumptionInputs) => {
    const params = new URLSearchParams(search);
    if (id) params.set("deal", id);
    else params.delete("deal");
    setSessionDraft(values);
    navigate({ pathname, search: params.toString(), hash: draftFragment(values) }, { replace: true, preventScrollReset: true });
  };
  const setDraft = (values: AssumptionInputs) => openDeal(activeDealId, values);
  const setSelectedProperty = (id: string) => {
    const params = new URLSearchParams(search);
    if (id) params.set("property", id);
    else params.delete("property");
    navigate({ pathname, search: params.toString(), hash });
  };
  const pathTo = (path: string) => ({ pathname: prefix + path, search, hash });

  return {
    userId, illustrative, query, metrics, selectedProperty, setSelectedProperty, pathTo,
    properties, leases, mortgages, filteredProperties, filteredLeases, filteredMortgages, escrowByProperty, propertyOptions,
    marketRate, setMarketRate, rentScenario,
    draft, setDraft, entries, activeDealId, openDeal, policyFor, dealAssumptions: assumptionsFrom(draft),
  };
}

export type WorkspaceContext = ReturnType<typeof useWorkspaceState>;

export function Workspace({ userId, prefix = "", illustrative = false }: {
  userId: string;
  prefix?: string;
  illustrative?: boolean;
}) {
  const { pathname: pathnameForView } = useLocation();
  const context = useWorkspaceState(userId, prefix, illustrative);
  const { properties, query, selectedProperty, setSelectedProperty } = context;
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <PortfolioNav prefix={prefix} />
      <div className="container min-w-0 flex-1 space-y-6 px-4 pt-8 pb-[calc(9rem+env(safe-area-inset-bottom))] sm:px-8 lg:pb-8">
        {(illustrative || connectedReview) && <p className="text-sm text-muted-foreground">
          {illustrative ? "Illustrative data · Demo portfolio" : "Connected portfolio · Read-only review"}
        </p>}
        {query.isSuccess && properties.length > 0 && (
          <PropertyFilter properties={properties.map(property => ({
            id: property.id, alias: property.alias, address: property.address ?? "",
          }))} selectedProperty={selectedProperty} onPropertyChange={setSelectedProperty} />
        )}
        {(!connectedReview || illustrative) && <PolicySettings store={context.entries} />}
        <ScrollRestoration ownerId={userId} />
        <div key={pathnameForView} className={/\/(holdings|underwrite)\/?$/.test(pathnameForView) ? undefined : "animate-fade-in"}><Outlet context={context} /></div>
      </div>
    </div>
  );
}
