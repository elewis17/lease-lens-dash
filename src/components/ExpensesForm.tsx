import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface ExpensesData {
  mortgage: number;
  taxes: number;
  insurance: number;
  maintenance: number;
  misc: number;
}

interface ExpensesFormProps {
  propertyId: string;
  initialData: ExpensesData;
  onSave: (data: ExpensesData) => void;
}

export const ExpensesForm = ({ initialData, onSave }: ExpensesFormProps) => {
  const [expenses, setExpenses] = useState<ExpensesData>(initialData);

  const handleChange = (field: keyof ExpensesData, value: string) => {
    setExpenses({ ...expenses, [field]: parseFloat(value) || 0 });
  };

  const totalExpenses = Object.values(expenses).reduce((sum, val) => sum + val, 0);

  return (
    <Card className="p-6 space-y-6 rounded-xl shadow-sm border-border">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="mortgage" className="text-sm font-medium">Mortgage Payment</Label>
          <Input
            id="mortgage"
            type="number"
            value={expenses.mortgage}
            onChange={(e) => handleChange("mortgage", e.target.value)}
            placeholder="0.00"
            className="text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="taxes" className="text-sm font-medium">Property Taxes</Label>
          <Input
            id="taxes"
            type="number"
            value={expenses.taxes}
            onChange={(e) => handleChange("taxes", e.target.value)}
            placeholder="0.00"
            className="text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="insurance" className="text-sm font-medium">Insurance</Label>
          <Input
            id="insurance"
            type="number"
            value={expenses.insurance}
            onChange={(e) => handleChange("insurance", e.target.value)}
            placeholder="0.00"
            className="text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maintenance" className="text-sm font-medium">Maintenance</Label>
          <Input
            id="maintenance"
            type="number"
            value={expenses.maintenance}
            onChange={(e) => handleChange("maintenance", e.target.value)}
            placeholder="0.00"
            className="text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="misc" className="text-sm font-medium">Miscellaneous</Label>
          <Input
            id="misc"
            type="number"
            value={expenses.misc}
            onChange={(e) => handleChange("misc", e.target.value)}
            placeholder="0.00"
            className="text-sm"
          />
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t border-border gap-4">
        <div className="text-base font-semibold leading-snug">
          Total: <span className="text-primary text-lg">${totalExpenses.toLocaleString()}</span>
          <span className="text-xs text-muted-foreground ml-2 leading-relaxed">per month</span>
        </div>
        <Button onClick={() => onSave(expenses)} className="hover:scale-105 transition-transform">Save Expenses</Button>
      </div>
    </Card>
  );
};
