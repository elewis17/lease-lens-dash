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
    <Card className="p-6 space-y-4">
      <h3 className="text-lg font-semibold">Monthly Operating Expenses</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="mortgage">Mortgage Payment</Label>
          <Input
            id="mortgage"
            type="number"
            value={expenses.mortgage}
            onChange={(e) => handleChange("mortgage", e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="taxes">Property Taxes</Label>
          <Input
            id="taxes"
            type="number"
            value={expenses.taxes}
            onChange={(e) => handleChange("taxes", e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="insurance">Insurance</Label>
          <Input
            id="insurance"
            type="number"
            value={expenses.insurance}
            onChange={(e) => handleChange("insurance", e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maintenance">Maintenance</Label>
          <Input
            id="maintenance"
            type="number"
            value={expenses.maintenance}
            onChange={(e) => handleChange("maintenance", e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="misc">Miscellaneous</Label>
          <Input
            id="misc"
            type="number"
            value={expenses.misc}
            onChange={(e) => handleChange("misc", e.target.value)}
            placeholder="0.00"
          />
        </div>
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="text-lg font-semibold">
          Total Monthly Expenses: <span className="text-primary">${totalExpenses.toLocaleString()}</span>
        </div>
        <Button onClick={() => onSave(expenses)}>Save Expenses</Button>
      </div>
    </Card>
  );
};
