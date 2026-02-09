import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAccounts, type Account } from "@/hooks/useAccounts";
import { FiscalPeriodSelector } from "@/components/reports/FiscalPeriodSelector";
import { PrintButton } from "@/components/reports/PrintButton";
import type { FiscalPeriod } from "@/hooks/useOpenPeriod";

interface AccountLine {
  account: Account;
  amount: number;
}

export default function ReportIncome() {
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

  const { charges, products, totalCharges, totalProducts, result } = useMemo(() => {
    // Build balances per account
    const debitMap = new Map<string, number>();
    const creditMap = new Map<string, number>();

    entries.forEach((e) => {
      debitMap.set(e.debit_account_id, (debitMap.get(e.debit_account_id) || 0) + Number(e.debit_amount));
      creditMap.set(e.credit_account_id, (creditMap.get(e.credit_account_id) || 0) + Number(e.credit_amount));
    });

    const chargeLines: AccountLine[] = [];
    const productLines: AccountLine[] = [];

    accounts.forEach((account) => {
      const totalDebit = debitMap.get(account.id) || 0;
      const totalCredit = creditMap.get(account.id) || 0;

      if (account.account_class === 6) {
        // Charges: debit increases, credit decreases
        const balance = totalDebit - totalCredit;
        if (balance !== 0) {
          chargeLines.push({ account, amount: balance });
        }
      } else if (account.account_class === 7) {
        // Products: credit increases, debit decreases
        const balance = totalCredit - totalDebit;
        if (balance !== 0) {
          productLines.push({ account, amount: balance });
        }
      }
    });

    chargeLines.sort((a, b) => a.account.account_number.localeCompare(b.account.account_number));
    productLines.sort((a, b) => a.account.account_number.localeCompare(b.account.account_number));

    const tc = chargeLines.reduce((s, l) => s + l.amount, 0);
    const tp = productLines.reduce((s, l) => s + l.amount, 0);

    return {
      charges: chargeLines,
      products: productLines,
      totalCharges: tc,
      totalProducts: tp,
      result: tp - tc,
    };
  }, [entries, accounts]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  const renderSection = (title: string, lines: AccountLine[], total: number) => (
    <div className="rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground">N° Compte</th>
            <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground">Intitulé</th>
            <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">Montant</th>
          </tr>
        </thead>
        <tbody>
          {lines.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-3 py-4 text-center text-muted-foreground">
                Aucune donnée.
              </td>
            </tr>
          ) : (
            lines.map((l) => (
              <tr key={l.account.id} className="border-b">
                <td className="px-3 py-2 font-mono text-xs">{l.account.account_number}</td>
                <td className="px-3 py-2">{l.account.account_name}</td>
                <td className="px-3 py-2 text-right font-mono">{fmt(l.amount)}</td>
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr className="border-t-2 bg-muted/30 font-semibold">
            <td className="px-3 py-2.5" colSpan={2}>Total {title}</td>
            <td className="px-3 py-2.5 text-right font-mono">{fmt(total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );

  return (
    <AppLayout title="Compte de Résultat">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <FiscalPeriodSelector value={period?.id || null} onChange={setPeriod} />
        <PrintButton />
      </div>

      {/* Print header */}
      <div className="hidden print:block print:mb-4">
        <h1 className="text-xl font-bold text-center">Compte de Résultat</h1>
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
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              Charges (Classe 6)
            </h2>
            {renderSection("Charges", charges, totalCharges)}
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              Produits (Classe 7)
            </h2>
            {renderSection("Produits", products, totalProducts)}
          </div>

          {/* Result */}
          <div className="rounded-md border-2 border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-foreground">
                {result >= 0 ? "Bénéfice" : "Perte"}
              </span>
              <span
                className={`text-xl font-bold font-mono ${
                  result >= 0 ? "text-primary" : "text-destructive"
                }`}
              >
                {fmt(Math.abs(result))}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Total Produits ({fmt(totalProducts)}) − Total Charges ({fmt(totalCharges)})
            </p>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
