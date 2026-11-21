# DealStack design review evidence

Captured from the local review build with illustrative data. The mobile layout was checked at 390 × 900 and the desktop layout at 1440 × 900 in Chromium.

| Route | 390 px | 1440 px |
| --- | --- | --- |
| Briefing | [Mobile](mobile-briefing.webp) | [Desktop](desktop-briefing.webp) |
| Capital | [Mobile](mobile-capital.webp) | [Desktop](desktop-capital.webp) |
| Underwrite | [Mobile](mobile-underwrite.webp) | [Desktop](desktop-underwrite.webp) |
| Holdings | [Mobile](mobile-holdings.webp) | [Desktop](desktop-holdings.webp) |
| Decisions | [Mobile](mobile-decisions.webp) | [Desktop](desktop-decisions.webp) |
| Draft memo | [Mobile](mobile-draft-memo.webp) | [Desktop](desktop-draft-memo.webp) |
| Recorded memo | [Mobile](mobile-recorded-memo.webp) | [Desktop](desktop-recorded-memo.webp) |

## Acceptance checks

| Review item | Verification |
| --- | --- |
| Finding-first headlines | Checked the finding and active destination on all seven routes at both widths. The two memo routes render their findings inside the sheet. |
| Capital fit | Reproduced the previous build's contradiction with blank inputs and $40,000 deployable. Verified a recommended allocation with $50,000 deployable, a named nearest miss at $0, and restored recommendations at $40,000. Each opportunity reports cost and objective fit or identifies missing assumptions. |
| Underwrite verdict and action | Kirkwood names the DSCR and IRR gates it misses. Scrolled Underwrite in 150 px increments at both widths and checked that Save deal never intersected a figure. |
| Decisions and memos | Decisions is a labelled tab. The Kirkwood row shows a decision, date, maximum offer, lifecycle state, projected cash flow, and pending actual outcome. Opened and closed the recorded memo at a nonzero scroll position and verified the log kept that position. |
| Policies | Checked that Save policies remained in the viewport at both widths while the form fields scroll separately. [Mobile sheet](mobile-policies.webp) |
| Briefing evidence | Checked that the illustration shows a prior-period finding when the previous month has no receipts. Expense evidence groups zero estimates and missing categories under each property. |
| Waterfall handle | Compared the rendered width, border color, and center fill of the Briefing and Underwrite handles. Both use the shared slider. |
| Holdings | Checked Oak Grove's portfolio finding and the per-property verdict and cash-flow evidence. The sample properties, tenants, and loans are clearly labelled as illustrative at the workspace level. |
| Density and desktop | Checked for horizontal page overflow on all routes at both widths. The screenshots show the desktop rails, active nav bar, and collapsed supporting evidence. |
| Motion and loading | Verified intermediate animated values and convergence to the final figure, then verified immediate updates with reduced motion. The price drag updated the displayed price and projected cash flow continuously at roughly 60 fps in Chromium. A mocked 3.5-second portfolio load showed skeletons. [Drag result](mobile-underwrite-after-drag.webp) · [Slow load](mobile-slow-load.webp) |

## Assumptions

- The $75,000 available and $25,000 reserve defaults apply to the illustrative workspace. Connected portfolios use entered budgets. The worked illustration uses a refinance quote at the illustrative market rate, a 24-year term, $3,500 estimated closing costs, and one month to close. The vacancy scenario uses the deck's $3,906 annual rent increase and $5,000 refresh, with rent beginning in month two and no additional recurring costs entered.
- Decisions display existing recorded data. Acquisition actuals stay pending because the existing outcome recording flow stores Capital outcomes. Portfolio-wide policy entries name the policy's scope in place of a property.
- The review used the records and earlier receipt basis already present in the fixture. Where an earlier period has no receipts, Briefing reports that gap.
- Deployment and merge are outside this review. The branch remains a draft pull request.
