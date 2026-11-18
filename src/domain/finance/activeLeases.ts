type LeaseTerm = {
  status: string | null;
  start_date: string | null;
  end_date: string | null;
};

/** Contract dates are inclusive. Expired and vacant records do not establish current rent. */
export function isActiveLease(lease: LeaseTerm, asOf: string): boolean {
  if (lease.status === "expired" || lease.status === "vacant") return false;
  if (!lease.start_date || !lease.end_date) return false;
  return lease.start_date <= asOf && asOf <= lease.end_date;
}
