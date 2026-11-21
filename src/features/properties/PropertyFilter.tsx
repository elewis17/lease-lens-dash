import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";

interface PropertyFilterProps {
  properties: Array<{ id: string; address: string ; alias: string }>;
  selectedProperty: string;
  onPropertyChange: (propertyId: string) => void;
}

export const PropertyFilter = ({ properties, selectedProperty, onPropertyChange }: PropertyFilterProps) => {
  const filterButton = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  const searchInput = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  
  const currentProperty = properties.find(p => p.id === selectedProperty);
  const buttonLabel = selectedProperty === "" ? "All Properties" : (currentProperty?.alias ?? "Select property...");

  return (
    <div className="flex min-w-0 max-w-xs flex-1 items-center">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={filterButton}
            variant="outline"
            role="combobox"
            aria-label={`Property filter, ${buttonLabel}`}
            aria-expanded={open}
            className="w-full min-w-0 justify-between"
          >
            <span className="truncate">{buttonLabel}</span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="z-50 w-[min(20rem,calc(100vw-2rem))] bg-background p-0" align="start"
          onEscapeKeyDown={() => { restoreFocus.current = true; }}
          onCloseAutoFocus={event => {
            if (!restoreFocus.current) return;
            event.preventDefault();
            restoreFocus.current = false;
            filterButton.current?.focus();
          }}
          onOpenAutoFocus={event => {
            if (searchInput.current) {
              event.preventDefault();
              searchInput.current.focus();
            }
          }}>
          <Command>
            <CommandInput ref={searchInput} aria-label="Search properties" placeholder="Search property..."
              onKeyDown={event => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  restoreFocus.current = true;
                  setOpen(false);
                }
              }} />
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
                value={property.id}
                keywords={[property.alias, property.address]}
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
