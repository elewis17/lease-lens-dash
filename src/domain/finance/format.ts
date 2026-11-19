const dollars = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export const money = (value: number | null | undefined) => value == null || !Number.isFinite(value) ? "—" : dollars.format(value);
export const ratio = (value: number | null | undefined, unavailable = "—") => value == null || !Number.isFinite(value) ? unavailable : `${value.toFixed(2)}×`;
export const percent = (value: number | null | undefined) => value == null || !Number.isFinite(value) ? "—" : `${(100 * value).toFixed(1)}%`;
export const coverage = (metrics: { dscr: number | null; debtService: number | null }) => ratio(metrics.dscr, metrics.debtService === 0 ? "n/a" : "—");
