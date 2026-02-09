import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { FiscalPeriod } from "@/hooks/useOpenPeriod";

interface FiscalPeriodSelectorProps {
  value: string | null;
  onChange: (period: FiscalPeriod) => void;
}

export function FiscalPeriodSelector({ value, onChange }: FiscalPeriodSelectorProps) {
  const [periods, setPeriods] = useState<FiscalPeriod[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("fiscal_periods")
        .select("*")
        .order("start_date", { ascending: false });
      const p = (data as FiscalPeriod[]) || [];
      setPeriods(p);
      // Auto-select the open period or first period
      if (!value && p.length > 0) {
        const open = p.find((pr) => pr.is_open);
        onChange(open || p[0]);
      }
    };
    fetch();
  }, []);

  return (
    <div className="space-y-1.5 print:hidden">
      <Label className="text-xs">Période Fiscale</Label>
      <Select
        value={value || ""}
        onValueChange={(id) => {
          const p = periods.find((pr) => pr.id === id);
          if (p) onChange(p);
        }}
      >
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Sélectionner une période" />
        </SelectTrigger>
        <SelectContent>
          {periods.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.label} {p.is_open ? "(ouverte)" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
