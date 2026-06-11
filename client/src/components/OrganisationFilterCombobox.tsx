import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface OrganisationOption {
  id: number;
  name: string;
}

interface OrganisationFilterComboboxProps {
  organisations?: OrganisationOption[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  allLabel?: string;
  placeholder?: string;
  triggerIcon?: React.ReactNode;
}

export function OrganisationFilterCombobox({
  organisations,
  value,
  onValueChange,
  className,
  allLabel = "All Organisations",
  placeholder = "All Organisations",
  triggerIcon,
}: OrganisationFilterComboboxProps) {
  const [open, setOpen] = useState(false);

  const sortedOrganisations = [...(organisations ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const selectedOrg = sortedOrganisations.find(
    (org) => String(org.id) === value
  );
  const selectedLabel =
    value === "all" ? allLabel : selectedOrg?.name ?? placeholder;

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between font-normal", className)}
          data-testid="combobox-organisation-filter"
        >
          <span className="flex items-center min-w-0">
            {triggerIcon}
            <span className="truncate">{selectedLabel}</span>
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[240px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search organisations..." data-testid="input-search-organisation" />
          <CommandList>
            <CommandEmpty>No organisation found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value={allLabel}
                onSelect={() => handleSelect("all")}
                data-testid="option-organisation-all"
              >
                {allLabel}
                <Check
                  className={cn(
                    "ml-auto h-4 w-4",
                    value === "all" ? "opacity-100" : "opacity-0"
                  )}
                />
              </CommandItem>
              {sortedOrganisations.map((org) => (
                <CommandItem
                  key={org.id}
                  value={org.name}
                  onSelect={() => handleSelect(String(org.id))}
                  data-testid={`option-organisation-${org.id}`}
                >
                  {org.name}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === String(org.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
