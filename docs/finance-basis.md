# DealStack financial basis

Portfolio Snapshot and Portfolio Decisions use the same property and scope calculations. Offers and the investment memo use the same 10-year acquisition model and policy table. Acquisition IRR solves a cash-flow series that includes net sale proceeds after selling costs and loan payoff. The portfolio uses no implied IRR.

| Record field | Unit and basis |
| --- | --- |
| `properties.property_value` | Current value estimate in dollars. Purchase and prior sale prices are separate. |
| `properties.property_taxes`, `properties.insurance` | Annual dollars. Confirm existing entries if recorded under an earlier convention. |
| `properties.mgmt_pct`, `maintenance_pct` | Percentage points applied to monthly rent after the vacancy adjustment. |
| `properties.vacancy_pct`, `rent_growth_rate`, `opex_inflation_rate` | Percentage points. Rent and expense growth are annual. |
| `leases.monthly_rent` | Monthly contractual dollars. Active dates are inclusive. A lease marked expired or vacant does not count. Property membership follows the unit. |
| `mortgages.interest_rate`, `term_months`, `start_date` | Annual percentage points, original term in months, and the loan origination date. |
| `mortgages.current_balance`, `monthly_payment` | Recorded dollars. Principal amount does not establish current balance. The monthly payment includes escrow when marked escrowed. |
| `expenses.amount`, `date` | Recorded transaction dollars and date. Property attribution uses the property ID or, for a unit-only record, its parent property. |
| `payments.amount_due`, `paid_amount` | Contractual payment schedule dollars and recorded cash received. Economic occupancy uses the last completed month. |

- The operating run-rate uses recorded operating costs from the trailing 12 months divided by 12. A recorded category takes precedence over its configured estimate. Capital expenses are excluded from NOI. Taxes, insurance, management, and repairs need a record, estimate, explicit zero, or the applicable escrow basis. Unrecorded optional categories, including utilities, HOA, advertising and other, are disclosed with missing amounts. Expense totals cover the categories with a basis.
- For an escrowed property, the cash run-rate includes escrow funding instead of the tax and insurance disbursements it funds. For loans that mix principal, interest, and escrow, the split estimates scheduled P&I from the recorded balance and remaining term, caps P&I at the recorded payment, and leaves the rest as escrow. All loans in scope are included. Unknown loan terms or escrow status leave affected metrics missing.
- The refinance what-if replaces the existing principal and interest payments with one quote using the total recorded payoff balance as an estimate. Escrow stays at the current run-rate. Closing costs are cash-paid on day one and the user enters quote fees and any prepayment charges. The annualized run-rate extrapolates the monthly difference. First-year net follows the current loan schedules and includes closing costs.
- The 10-year trajectory applies recorded rent and expense growth to the existing run-rate and keeps initial vacancy assumptions and capitalization rates fixed. Scheduled loan payments roll off at maturity. Estimated ending balances use current balances and the remaining contractual term. Starting invested cash is unavailable in the schema, so portfolio cash-on-cash is unavailable.
- The one-year wealth projection annualizes the displayed whole-dollar monthly cash flow, then adds scheduled principal reduction and the entered appreciation assumption. This reproduces the deck's reporting convention. Underlying decisions and charts retain full precision.
- The portfolio does not infer distress history, the feasibility of a fix, liquidity, or deployable sale proceeds from equity. The policy accepts documented distress duration and whether a credible fix exists when those records are available. The stated recommendation is based on known inputs. The sample review is read-only and its records are illustrative.

## M2 verification

| Check | Verified outcome |
| --- | --- |
| CALC-01 | Decisions uses cash flow, DSCR, and current-balance equity. A missing balance removes the asset's rank in the preview. |
| CALC-02 | Finance tests verify ROI and cash-on-cash from post-debt-service cash flow. IRR is calculated from an acquisition cash-flow series and shared with the memo. |
| CALC-03 | The default policy and verdict functions are shared. Policy tests exercise alternate thresholds and documented sell conditions. The preview matched cash flow, DSCR, and verdict across both portfolio views for each of the five properties. |
| CALC-04 | Kirkwood reproduces the deck's metrics. The model passes at the exact whole-dollar max-offer boundary. Editing rent updates the metrics, gates, and scenarios. Comparables show an empty state. |
| CALC-05 | Portfolio verdicts and charts contain no margin heuristic. |
| CALC-06 | A seasoned escrowed loan with a known payment verifies $1,000 P&I, $250 escrow, $1,500 NOI, and 1.50× DSCR. |
| CALC-07 | Inclusive contract dates and expired, future, and missing date cases are tested. Ledger dates render from the record, with missing dates displayed as missing. |
| CALC-08 | Annual tax and insurance units are documented and labelled. The shared expense engine and both portfolio screens use the same inputs. |
| CALC-09 | Refinance includes all balances, escrow, and quote costs. The preview verifies first-year and annualized values independently. Rent estimates reprice rent-based costs. Tax results are labelled and require explicit assumptions. |
| CALC-10 | The app shows n/a and no distress in the debt-free fixture. Physical occupancy follows units and matches 10 of 11. |
| CALC-11 | Tests verify property-specific growth, maturity roll-off, and missing projection basis. The chart states its inputs. |
| CALC-12 | Current loan balances are required for equity. A missing balance produces a missing equity and missing rank in the offline screen checks. |
| CALC-13 | DSCR is the only financial coverage spelling in identifiers and user-visible copy. |
| DATA-02 | Empty-record fixtures show add-data actions and no numeric fallback in either portfolio view. |
| DATA-07 | A $1,200 recorded repair changes run-rate costs and cash flow by $100/month in both offline portfolio screens. The ledger and estimate basis are visible. |
