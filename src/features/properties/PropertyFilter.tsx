import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface PropertyFilterProps {
  properties: Array<{ id: string; address: string ; alias: string }>;
  selectedProperty: string;
  onPropertyChange: (propertyId: string) => void;
}

export const PropertyFilter = ({ properties, selectedProperty, onPropertyChange }: PropertyFilterProps) => {
  const [open, setOpen] = useState(false);
  
  const currentProperty = properties.find(p => p.id === selectedProperty);
  const buttonLabel = selectedProperty === "" ? "All Properties" : (currentProperty?.alias ?? "Select property...");

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium">Property:</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[300px] justify-between"
            onClick={() => setOpen(!open)}
          >
            {buttonLabel}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0 bg-background z-50">
          <Command>
            <CommandInput placeholder="Search property..." />
            <CommandEmpty>No property found.</CommandEmpty>
            <CommandGroup>
            {/* All properties option */}
            <CommandItem
              key="__all"
              value="All Properties"
              onSelect={() => {
                onPropertyChange(""); // "" = All
                setOpen(false);
              }}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  selectedProperty === "" ? "opacity-100" : "opacity-0"
                )}
              />
              All Properties
            </CommandItem>

            {/* Individual properties */}
            {properties.map((property) => (
              <CommandItem
                key={property.id}
                value={property.alias}
                onSelect={() => {
                  onPropertyChange(property.id);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedProperty === property.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {property.alias}
              </CommandItem>
            ))}
          </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
