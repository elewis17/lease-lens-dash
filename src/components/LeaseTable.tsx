import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, MessageSquare, RefreshCw, DollarSign } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format, differenceInDays } from "date-fns";

interface LeaseData {
  id: string;
  tenant: string;
  unit: string;
  monthlyRent: number;
  status: "paid" | "overdue" | "expiring";
  leaseEnd: Date;
  daysOverdue?: number;
  deposit: number;
  startDate: Date;
}

interface LeaseTableProps {
  leases: LeaseData[];
}

export const LeaseTable = ({ leases }: LeaseTableProps) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusBadge = (status: string, daysOverdue?: number) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-success text-success-foreground">✓ Paid</Badge>;
      case "overdue":
        return <Badge variant="destructive">✗ Overdue ({daysOverdue}d)</Badge>;
      case "expiring":
        return <Badge className="bg-warning text-warning-foreground">🟡 Expiring Soon</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead></TableHead>
            <TableHead className="font-semibold">Tenant</TableHead>
            <TableHead className="font-semibold">Unit</TableHead>
            <TableHead className="font-semibold">Monthly Rent</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Lease Ends</TableHead>
            <TableHead className="font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leases.map((lease) => (
            <Collapsible key={lease.id} open={expandedRows.has(lease.id)} onOpenChange={() => toggleRow(lease.id)} asChild>
              <>
                <TableRow className="hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        {expandedRows.has(lease.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                  </TableCell>
                  <TableCell className="font-medium">{lease.tenant}</TableCell>
                  <TableCell>{lease.unit}</TableCell>
                  <TableCell>${lease.monthlyRent.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(lease.status, lease.daysOverdue)}</TableCell>
                  <TableCell>{format(lease.leaseEnd, "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="h-8">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Message
                      </Button>
                      <Button variant="outline" size="sm" className="h-8">
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Renew
                      </Button>
                      {lease.status === "overdue" && (
                        <Button variant="outline" size="sm" className="h-8">
                          <DollarSign className="h-3 w-3 mr-1" />
                          Late Fee
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
                <CollapsibleContent asChild>
                  <TableRow>
                    <TableCell colSpan={7} className="bg-muted/20 p-4">
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Lease Details</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Start Date:</span>
                            <p className="font-medium">{format(lease.startDate, "MMM d, yyyy")}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">End Date:</span>
                            <p className="font-medium">{format(lease.leaseEnd, "MMM d, yyyy")}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Deposit:</span>
                            <p className="font-medium">${lease.deposit.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Notice Period:</span>
                            <p className="font-medium">60 days</p>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                </CollapsibleContent>
              </>
            </Collapsible>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
