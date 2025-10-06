import { Button } from "@/components/ui/button";
import { Upload, DollarSign, Receipt, Wrench, Download } from "lucide-react";

interface QuickActionsProps {
  onUploadClick: () => void;
}

export const QuickActions = ({ onUploadClick }: QuickActionsProps) => {
  return (
    <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border p-4">
      <div className="flex flex-wrap gap-3 justify-center">
        <Button onClick={onUploadClick} className="flex-1 sm:flex-none">
          <Upload className="mr-2 h-4 w-4" />
          Upload Lease
        </Button>
        <Button variant="outline" className="flex-1 sm:flex-none">
          <DollarSign className="mr-2 h-4 w-4" />
          Record Payment
        </Button>
        <Button variant="outline" className="flex-1 sm:flex-none">
          <Receipt className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
        <Button variant="outline" className="flex-1 sm:flex-none">
          <Wrench className="mr-2 h-4 w-4" />
          New Maintenance
        </Button>
        <Button variant="outline" className="flex-1 sm:flex-none">
          <Download className="mr-2 h-4 w-4" />
          Export Excel
        </Button>
      </div>
    </div>
  );
};
