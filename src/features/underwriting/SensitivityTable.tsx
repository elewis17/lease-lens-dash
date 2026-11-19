import { useState } from "react";
import { modelDeal, type DealAssumptions } from "@/domain/finance/underwriting";
import { money, percent, ratio } from "@/domain/finance/format";
import { cn } from "@/lib/utils";

export function SensitivityTable({ assumptions, minimumIrr }: { assumptions: DealAssumptions; minimumIrr: number }) {
  const [selected, setSelected] = useState({ rent: 0, price: 0 });
  const rentStep = Math.max(1, Math.round(assumptions.rentMonthly * 0.06 / 100) * 100);
  const priceStep = Math.max(1, Math.round(assumptions.price * 0.055 / 1000) * 1000);
  const rentOffsets = [-1, 0, 1].filter(offset => assumptions.rentMonthly + offset * rentStep >= 0);
  const priceOffsets = [-3, -2, -1, 0, 1].filter(offset => assumptions.price + offset * priceStep > 0);
  const selectedRent = rentOffsets.includes(selected.rent) ? selected.rent : 0;
  const selectedPrice = priceOffsets.includes(selected.price) ? selected.price : 0;
  const rent = assumptions.rentMonthly + selectedRent * rentStep;
  const price = assumptions.price + selectedPrice * priceStep;
  const active = modelDeal({ ...assumptions, rentMonthly: rent, price });

  return (
    <details className="space-y-3 rounded-lg border bg-card p-4">
      <summary className="min-h-11 cursor-pointer font-semibold">Sensitivity by rent and price</summary>
      <p className="text-sm italic text-muted-foreground">
        Hypothetical · If rent and purchase price change, the cells show modelled IRR. Select a cell for DSCR and cash flow.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm tabular-nums">
          <thead><tr>
            <th scope="col" className="px-2 py-1">Rent / price</th>
            {priceOffsets.map(offset => <th key={offset} scope="col" className="whitespace-nowrap px-2 py-1">{money(assumptions.price + offset * priceStep)}</th>)}
          </tr></thead>
          <tbody>{rentOffsets.map(rentOffset => {
            const rentMonthly = assumptions.rentMonthly + rentOffset * rentStep;
            return <tr key={rentOffset} className="border-t">
              <th scope="row" className="whitespace-nowrap px-2">{money(rentMonthly)}/mo</th>
              {priceOffsets.map(priceOffset => {
                const price = assumptions.price + priceOffset * priceStep;
                const irr = modelDeal({ ...assumptions, rentMonthly, price })?.irr;
                const pressed = rentOffset === selectedRent && priceOffset === selectedPrice;
                return <td key={priceOffset} className="p-1">
                  <button type="button" aria-pressed={pressed}
                    className={cn("min-h-11 min-w-14 rounded border border-transparent px-1 italic hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring",
                      pressed && "border-input bg-muted", irr != null && irr < minimumIrr && "text-destructive",
                      rentOffset === 0 && priceOffset === 0 && "font-semibold")}
                    aria-label={"Rent " + money(rentMonthly) + ", price " + money(price) + ", IRR " + percent(irr)}
                    onClick={() => setSelected({ rent: rentOffset, price: priceOffset })}>{percent(irr)}</button>
                </td>;
              })}
            </tr>;
          })}</tbody>
        </table>
      </div>
      <p className="text-sm italic">If rent is {money(rent)}/mo and price is {money(price)}, DSCR is {ratio(active?.dscr)} and cash flow is {money(active?.cashFlow)}/mo.</p>
    </details>
  );
}
