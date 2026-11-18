import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const illustrativeProperties = [
  { name: "Monroe Duplex", rent: 4300, value: 410000 },
  { name: "North Ave Fourplex", rent: 7400, value: 640000 },
  { name: "Ponce Cottage", rent: 3200, value: 310000 },
  { name: "Glen Iris Triplex", rent: 4650, value: 480000 },
  { name: "Oak Grove SFR", rent: 1950, value: 271000 },
];

const dollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function DemoPortfolio() {
  return (
    <section aria-labelledby="demo-title" className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <header className="space-y-2">
        <h2 id="demo-title" className="text-2xl font-semibold">Demo portfolio</h2>
        <p className="text-sm text-muted-foreground">
          Illustrative data · Read-only. Sign in to view your private portfolio.
        </p>
      </header>
      <Table aria-labelledby="demo-title" className="tabular-nums">
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Property</TableHead>
            <TableHead scope="col" className="text-right">Rent / mo</TableHead>
            <TableHead scope="col" className="text-right">Estimated value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {illustrativeProperties.map((property) => (
            <TableRow key={property.name}>
              <th scope="row" className="px-4 py-3 text-left font-medium">{property.name}</th>
              <TableCell className="text-right">{dollars.format(property.rent)}</TableCell>
              <TableCell className="text-right">~{dollars.format(property.value)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
