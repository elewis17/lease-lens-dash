import { monthlyPayment } from "./underwriting.ts";

export type LoanInput = {
  id: string;
  property_id: string;
  current_balance: number | null;
  interest_rate: number;
  term_months: number;
  start_date: string;
  monthly_payment: number;
  includes_escrow: boolean | null;
};

export function splitLoan(loan: LoanInput, asOf: string) {
  const start = new Date(`${loan.start_date}T00:00:00Z`);
  const date = new Date(`${asOf}T00:00:00Z`);
  const elapsedMonths = (date.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    date.getUTCMonth() - start.getUTCMonth() - Number(date.getUTCDate() < start.getUTCDate());
  const remaining = Math.max(0, loan.term_months - elapsedMonths);
  const balance = loan.current_balance;
  const rate = loan.interest_rate / 100;
  const payment = loan.monthly_payment;
  const scheduled = Number.isFinite(remaining) && elapsedMonths >= 0 && Number.isInteger(loan.term_months) && loan.term_months > 0;
  const knownBalance = balance !== null && Number.isFinite(balance) && balance >= 0 ? balance : null;
  const validPayment = Number.isFinite(payment) && payment >= 0 ? payment : null;
  if (knownBalance === 0) return { remaining: 0, balance: 0, rate, principalInterest: 0, escrow: 0 };

  const modeled = knownBalance !== null && rate >= 0 && Number.isFinite(rate) && scheduled && remaining > 0
    ? monthlyPayment(knownBalance, rate, remaining)
    : null;
  const principalInterest = loan.includes_escrow === false
    ? validPayment
    : loan.includes_escrow === true && modeled !== null && validPayment !== null ? Math.min(modeled, validPayment) : null;
  const escrow = loan.includes_escrow === false ? 0
    : principalInterest !== null && validPayment !== null ? Math.max(0, validPayment - principalInterest) : null;
  return { remaining: scheduled && remaining > 0 ? remaining : null, balance: knownBalance, rate, principalInterest, escrow };
}

export type Loan = ReturnType<typeof splitLoan>;

export function balanceAfter(loan: Loan, months: number): number | null {
  if (loan.balance === 0) return 0;
  if (loan.balance === null || loan.remaining === null || loan.principalInterest === null ||
      !Number.isFinite(loan.rate) || loan.rate < 0) return null;
  if (months >= loan.remaining) return 0;
  return loan.balance * monthlyPayment(1, loan.rate, loan.remaining) /
    monthlyPayment(1, loan.rate, loan.remaining - months);
}

export type BalanceStatement = { mortgage_id: string; statement_date: string; principal_balance: number };
export const staleStatementDays = 45;

export function balanceEvidence(loans: readonly { id: string; balance: number | null }[] | null,
  statements: readonly BalanceStatement[], asOf: string) {
  const latest = new Map<string, BalanceStatement>();
  for (const statement of statements) {
    if (statement.statement_date > asOf) continue;
    const prior = latest.get(statement.mortgage_id);
    if (!prior || statement.statement_date > prior.statement_date) latest.set(statement.mortgage_id, statement);
  }
  return (loans ?? []).reduce((result, loan) => {
    if (loan.balance === null) return { ...result, missing: result.missing + 1 };
    if (loan.balance === 0) return result;
    const current = latest.get(loan.id);
    if (!current || current.principal_balance !== loan.balance) {
      return { ...result, undated: result.undated + 1 };
    }
    const age = Math.floor((Date.parse(asOf) - Date.parse(current.statement_date)) / 86_400_000);
    if (age > staleStatementDays) return { ...result, stale: result.stale + 1 };
    return { ...result, confirmed: result.confirmed + 1 };
  }, { confirmed: 0, stale: 0, undated: 0, missing: 0 });
}

export function balanceEvidenceText(evidence: ReturnType<typeof balanceEvidence>) {
  const counts = [
    [evidence.stale, "stale statement", "stale statements"],
    [evidence.undated, "unverified source date", "unverified source dates"],
    [evidence.missing, "missing balance", "missing balances"],
  ] as const;
  const issues = counts.flatMap(([count, single, plural]) => count ? [count + " " + (count === 1 ? single : plural)] : []);
  if (issues.length) return "Debt evidence · " + issues.join(", ") + ".";
  return evidence.confirmed ? "Current balances match confirmed statements." : null;
}
