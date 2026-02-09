import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FiscalPeriod {
  id: string;
  label: string;
  start_date: string;
  end_date: string;
  is_open: boolean;
  created_at: string;
}

export function useOpenPeriod() {
  const [period, setPeriod] = useState<FiscalPeriod | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("fiscal_periods")
        .select("*")
        .eq("is_open", true)
        .maybeSingle();
      setPeriod(data as FiscalPeriod | null);
      setLoading(false);
    };
    fetch();
  }, []);

  return { period, loading };
}
