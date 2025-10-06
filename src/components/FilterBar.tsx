import { Badge } from "@/components/ui/badge";

interface FilterBarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

const filters = [
  { id: "all", label: "All" },
  { id: "paid", label: "Paid" },
  { id: "overdue", label: "Overdue" },
  { id: "expiring", label: "Expiring ≤60d" },
  { id: "maintenance", label: "Maintenance Active" },
];

export const FilterBar = ({ activeFilter, onFilterChange }: FilterBarProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <Badge
          key={filter.id}
          variant={activeFilter === filter.id ? "default" : "outline"}
          className="cursor-pointer transition-all hover:scale-105"
          onClick={() => onFilterChange(filter.id)}
        >
          {filter.label}
        </Badge>
      ))}
    </div>
  );
};
