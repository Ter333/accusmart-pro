import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ChevronsUpDown, Search } from "lucide-react";
import type { Account } from "@/hooks/useAccounts";

interface AccountPickerProps {
  accounts: Account[];
  value: string | null;
  onChange: (accountId: string, account: Account) => void;
  placeholder?: string;
}

const CLASS_LABELS: Record<number, string> = {
  1: "Capitaux",
  2: "Immobilisations",
  3: "Stocks",
  4: "Tiers",
  5: "Trésorerie",
  6: "Charges",
  7: "Produits",
};

export function AccountPicker({ accounts, value, onChange, placeholder = "Sélectionner un compte" }: AccountPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState<number | null>(null);

  const selectedAccount = accounts.find((a) => a.id === value);

  const filtered = useMemo(() => {
    let result = accounts;
    if (filterClass !== null) {
      result = result.filter((a) => a.account_class === filterClass);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.account_number.includes(q) ||
          a.account_name.toLowerCase().includes(q)
      );
    }
    return result.slice(0, 50);
  }, [accounts, search, filterClass]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between font-normal"
        >
          {selectedAccount
            ? `${selectedAccount.account_number} — ${selectedAccount.account_name}`
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="border-b p-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par n° ou nom..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            <Badge
              variant={filterClass === null ? "default" : "outline"}
              className="cursor-pointer text-xs"
              onClick={() => setFilterClass(null)}
            >
              Tous
            </Badge>
            {[1, 2, 3, 4, 5, 6, 7].map((cls) => (
              <Badge
                key={cls}
                variant={filterClass === cls ? "default" : "outline"}
                className="cursor-pointer text-xs"
                onClick={() => setFilterClass(filterClass === cls ? null : cls)}
              >
                {cls}
              </Badge>
            ))}
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="p-3 text-center text-sm text-muted-foreground">Aucun compte trouvé.</p>
          ) : (
            filtered.map((account) => (
              <button
                key={account.id}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
                  value === account.id ? "bg-accent" : ""
                }`}
                onClick={() => {
                  onChange(account.id, account);
                  setOpen(false);
                  setSearch("");
                }}
              >
                <span className="w-14 shrink-0 font-mono text-xs text-muted-foreground">
                  {account.account_number}
                </span>
                <span className="flex-1 truncate">{account.account_name}</span>
                <Badge variant="secondary" className="text-xs">
                  {account.account_class}
                </Badge>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
