import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Account {
  id: string;
  account_number: string;
  account_name: string;
  account_class: number;
  is_custom: boolean;
}

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = async () => {
    const { data } = await supabase
      .from("accounts")
      .select("id, account_number, account_name, account_class, is_custom")
      .order("account_number", { ascending: true });
    setAccounts((data as Account[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  return { accounts, loading, refetch: fetchAccounts };
}
