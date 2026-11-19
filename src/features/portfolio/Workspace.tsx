import { format } from "date-fns";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { PropertyFilter } from "@/features/properties/PropertyFilter";
import { usePortfolio } from "./usePortfolio";
import { PortfolioNav } from "@/features/navigation/PortfolioNav";
import { ScrollRestoration } from "@/features/navigation/ScrollRestoration";
import { useSessionState } from "@/features/navigation/sessionState";
import { assumptionsFrom, draftFragment, initialValues, readDraft, type AssumptionInputs } from "@/features/underwriting/draft";
import { kirkwoodExample } from "@/domain/finance/underwriting";
import { modelPortfolio } from "@/domain/finance/portfolio";

function useWorkspaceState(userId: string, prefix: string, illustrative: boolean) {
  const location = useLocation();
  const navigate = useNavigate();
  const { pathname, search, hash } = location;
  const query = usePortfolio(userId);
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
  const asOf = format(new Date(), "yyyy-MM-dd");
  const metrics = modelPortfolio(filteredProperties, record, asOf, marketRatePct);
  const rentScenario = (increase: number) => modelPortfolio(filteredProperties, {
    ...record,
    leases: record.leases?.map(lease => ({ ...lease, monthly_rent: lease.monthly_rent * (1 + increase / 100) })) ?? null,
  }, asOf, marketRatePct);

  const [sessionDraft, setSessionDraft] = useSessionState<AssumptionInputs>(
    `dealstack:${userId}:underwriting`, initialValues(illustrative ? kirkwoodExample : null),
  );
  const draft = readDraft(hash) ?? sessionDraft;
  const setDraft = (values: AssumptionInputs) => {
    setSessionDraft(values);
    navigate({ pathname, search, hash: draftFragment(values) }, { replace: true, preventScrollReset: true });
  };
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
    draft, setDraft, dealAssumptions: assumptionsFrom(draft),
  };
}

export type WorkspaceContext = ReturnType<typeof useWorkspaceState>;

export function Workspace({ userId, prefix = "", illustrative = false }: {
  userId: string;
  prefix?: string;
  illustrative?: boolean;
}) {
  const context = useWorkspaceState(userId, prefix, illustrative);
  const { properties, query, selectedProperty, setSelectedProperty } = context;
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <PortfolioNav prefix={prefix} />
      <div className="container min-w-0 flex-1 space-y-6 px-4 py-8 sm:px-8">
        {query.isSuccess && properties.length > 0 && (
          <PropertyFilter properties={properties.map(property => ({
            id: property.id, alias: property.alias, address: property.address ?? "",
          }))} selectedProperty={selectedProperty} onPropertyChange={setSelectedProperty} />
        )}
        <ScrollRestoration ownerId={userId} />
        <Outlet context={context} />
      </div>
    </div>
  );
}
