import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAccounts, type Account } from "@/hooks/useAccounts";
import { FiscalPeriodSelector } from "@/components/reports/FiscalPeriodSelector";
import { PrintButton } from "@/components/reports/PrintButton";
import type { FiscalPeriod } from "@/hooks/useOpenPeriod";

interface AccountBalance {
  account: Account;
  totalDebit: number;
  totalCredit: number;
  soldeDebit: number;
  soldeCredit: number;
}

export default function ReportBalance() {
  const [period, setPeriod] = useState<FiscalPeriod | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { accounts, loading: accountsLoading } = useAccounts();
  const { toast } = useToast();

  useEffect(() => {
    if (!period) return;
    const fetchEntries = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("journal_entries")
        .select("debit_account_id, credit_account_id, debit_amount, credit_amount")
        .eq("fiscal_period_id", period.id);

      if (error) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
      } else {
        setEntries(data || []);
      }
      setLoading(false);
    };
    fetchEntries();
  }, [period]);

  const balances = useMemo(() => {
    const debitMap = new Map<string, number>();
    const creditMap = new Map<string, number>();

    entries.forEach((e) => {
      debitMap.set(e.debit_account_id, (debitMap.get(e.debit_account_id) || 0) + Number(e.debit_amount));
      creditMap.set(e.credit_account_id, (creditMap.get(e.credit_account_id) || 0) + Number(e.credit_amount));
    });

    const result: AccountBalance[] = [];
    accounts.forEach((account) => {
      const totalDebit = debitMap.get(account.id) || 0;
      const totalCredit = creditMap.get(account.id) || 0;
      if (totalDebit === 0 && totalCredit === 0) return;

      const solde = totalDebit - totalCredit;
      result.push({
        account,
        totalDebit,
        totalCredit,
        soldeDebit: solde > 0 ? solde : 0,
        soldeCredit: solde < 0 ? Math.abs(solde) : 0,
      });
    });

    return result.sort((a, b) => a.account.account_number.localeCompare(b.account.account_number));
  }, [entries, accounts]);

  const totals = useMemo(() => {
    return balances.reduce(
      (acc, b) => ({
        totalDebit: acc.totalDebit + b.totalDebit,
        totalCredit: acc.totalCredit + b.totalCredit,
        soldeDebit: acc.soldeDebit + b.soldeDebit,
        soldeCredit: acc.soldeCredit + b.soldeCredit,
      }),
      { totalDebit: 0, totalCredit: 0, soldeDebit: 0, soldeCredit: 0 }
    );
  }, [balances]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  return (
    <AppLayout title="Balance de Vérification">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <FiscalPeriodSelector value={period?.id || null} onChange={setPeriod} />
        <PrintButton />
      </div>

      {/* Print header */}
      <div className="hidden print:block print:mb-4">
        <h1 className="text-xl font-bold text-center">Balance de Vérification</h1>
        {period && <p className="text-center text-sm">{period.label}</p>}
      </div>

      {loading || accountsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !period ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Sélectionnez une période fiscale.
        </p>
      ) : balances.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Aucune écriture pour cette période.
        </p>
      ) : (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground">N° Compte</th>
                <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground">Intitulé</th>
                <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">Mouvement Débit</th>
                <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">Mouvement Crédit</th>
                <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">Solde Débit</th>
                <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">Solde Crédit</th>
              </tr>
            </thead>
            <tbody>
              {balances.map((b) => (
                <tr key={b.account.id} className="border-b">
                  <td className="px-3 py-2 font-mono text-xs">{b.account.account_number}</td>
                  <td className="px-3 py-2">{b.account.account_name}</td>
                  <td className="px-3 py-2 text-right font-mono">{fmt(b.totalDebit)}</td>
                  <td className="px-3 py-2 text-right font-mono">{fmt(b.totalCredit)}</td>
                  <td className="px-3 py-2 text-right font-mono">{fmt(b.soldeDebit)}</td>
                  <td className="px-3 py-2 text-right font-mono">{fmt(b.soldeCredit)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 bg-muted/30 font-semibold">
                <td className="px-3 py-2.5" colSpan={2}>Totaux</td>
                <td className="px-3 py-2.5 text-right font-mono">{fmt(totals.totalDebit)}</td>
                <td className="px-3 py-2.5 text-right font-mono">{fmt(totals.totalCredit)}</td>
                <td className="px-3 py-2.5 text-right font-mono">{fmt(totals.soldeDebit)}</td>
                <td className="px-3 py-2.5 text-right font-mono">{fmt(totals.soldeCredit)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </AppLayout>
  );
}
