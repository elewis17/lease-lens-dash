export type PaymentInput = {
  lease_id: string;
  due_date: string;
  amount_due: number;
  paid_date: string | null;
  paid_amount: number | null;
};

export function leaseReceipts(payments: PaymentInput[] | null | undefined, leaseIds: ReadonlySet<string>, asOf: string) {
  const priorMonth = new Date(`${asOf.slice(0, 7)}-01T00:00:00Z`);
  priorMonth.setUTCMonth(priorMonth.getUTCMonth() - 1);
  const month = priorMonth.toISOString().slice(0, 7);
  const records = payments?.filter(payment => leaseIds.has(payment.lease_id));
  const due = records?.filter(payment => payment.due_date.startsWith(month));
  const recordedReceipts = records?.filter(payment => payment.paid_date?.startsWith(month)) ?? [];
  const receipts = (due?.length || recordedReceipts.length) &&
    recordedReceipts.every(payment => payment.paid_amount !== null && Number.isFinite(payment.paid_amount))
    ? recordedReceipts.reduce((sum, payment) => sum + (payment.paid_amount ?? 0), 0) : null;
  const rentDue = due?.length ? due.reduce((sum, payment) => sum + payment.amount_due, 0) : null;
  const arrearsRows = records?.filter(payment => payment.due_date < asOf);
  const arrears = arrearsRows?.length ? arrearsRows.reduce((sum, payment) =>
    sum + Math.max(0, payment.amount_due - (payment.paid_date && payment.paid_date <= asOf ? payment.paid_amount ?? 0 : 0)), 0) : null;
  return { month, receipts, rentDue, arrears, economicOccupancy: rentDue !== null && rentDue > 0 && receipts !== null ? receipts / rentDue : null };
}
