import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Property {
  id: string;
  address: string;
}

interface PropertyFilterProps {
  properties: Property[];
  selectedProperty: string;
  onPropertyChange: (propertyId: string) => void;
}

export const PropertyFilter = ({ properties, selectedProperty, onPropertyChange }: PropertyFilterProps) => {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium">Property:</label>
      <Select value={selectedProperty} onValueChange={onPropertyChange}>
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder="Select a property" />
        </SelectTrigger>
        <SelectContent className="bg-background z-50">
          {properties.map((property) => (
            <SelectItem key={property.id} value={property.id}>
              {property.address}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
