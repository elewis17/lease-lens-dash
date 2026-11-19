import { isActiveLease } from "./activeLeases.ts";

type Lease = {
  unit_id: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
};

export class MetricsCalculator {
  static dscr(noi: number | null, debtService: number | null) {
    return noi !== null && debtService !== null && debtService > 0 ? noi / debtService : null;
  }

  static summary(input: {
    noi: number | null;
    debtService: number | null;
    propertyValue: number | null;
    investedCash: number | null;
  }) {
    const { noi, debtService, propertyValue, investedCash } = input;
    const cashFlow = noi === null || debtService === null ? null : noi - debtService;
    return {
      noi,
      cashFlow,
      capRate: noi !== null && propertyValue !== null && propertyValue > 0 ? noi * 12 / propertyValue : null,
      dscr: this.dscr(noi, debtService),
      roi: cashFlow !== null && propertyValue !== null && propertyValue > 0 ? cashFlow * 12 / propertyValue : null,
      cashOnCash: cashFlow !== null && investedCash !== null && investedCash > 0 ? cashFlow * 12 / investedCash : null,
    };
  }

  static occupancy(leases: readonly Lease[], unitIds: ReadonlySet<string>, asOf: string) {
    const activeUnitIds = new Set(leases.flatMap(lease =>
      lease.unit_id !== null && unitIds.has(lease.unit_id) && isActiveLease(lease, asOf) ? [lease.unit_id] : [],
    ));
    return { totalUnits: unitIds.size, occupiedUnits: activeUnitIds.size };
  }
}
