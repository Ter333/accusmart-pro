import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAccounts, type Account } from "@/hooks/useAccounts";
import { FiscalPeriodSelector } from "@/components/reports/FiscalPeriodSelector";
import { PrintButton } from "@/components/reports/PrintButton";
import type { FiscalPeriod } from "@/hooks/useOpenPeriod";

interface BilanLine {
  account: Account;
  amount: number;
}

export default function ReportBalanceSheet() {
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

  const { actifLines, passifLines, totalActif, totalPassif, netResult } = useMemo(() => {
    const debitMap = new Map<string, number>();
    const creditMap = new Map<string, number>();

    entries.forEach((e) => {
      debitMap.set(e.debit_account_id, (debitMap.get(e.debit_account_id) || 0) + Number(e.debit_amount));
      creditMap.set(e.credit_account_id, (creditMap.get(e.credit_account_id) || 0) + Number(e.credit_amount));
    });

    const actif: BilanLine[] = [];
    const passif: BilanLine[] = [];
    let totalCharges = 0;
    let totalProducts = 0;

    accounts.forEach((account) => {
      const totalDebit = debitMap.get(account.id) || 0;
      const totalCredit = creditMap.get(account.id) || 0;
      const balance = totalDebit - totalCredit;

      if (balance === 0 && totalDebit === 0 && totalCredit === 0) return;

      switch (account.account_class) {
        case 1:
          // Capitaux propres → Passif (credit balance normal)
          if (balance !== 0) {
            passif.push({ account, amount: Math.abs(balance) });
          }
          break;
        case 2:
          // Immobilisations → Actif (debit balance normal)
          if (balance !== 0) {
            actif.push({ account, amount: Math.abs(balance) });
          }
          break;
        case 3:
          // Stocks → Actif
          if (balance !== 0) {
            actif.push({ account, amount: Math.abs(balance) });
          }
          break;
        case 4:
          // Tiers → Actif if debit balance, Passif if credit balance
          if (balance > 0) {
            actif.push({ account, amount: balance });
          } else if (balance < 0) {
            passif.push({ account, amount: Math.abs(balance) });
          }
          break;
        case 5:
          // Trésorerie → Actif
          if (balance !== 0) {
            actif.push({ account, amount: Math.abs(balance) });
          }
          break;
        case 6:
          totalCharges += totalDebit - totalCredit;
          break;
        case 7:
          totalProducts += totalCredit - totalDebit;
          break;
      }
    });

    actif.sort((a, b) => a.account.account_number.localeCompare(b.account.account_number));
    passif.sort((a, b) => a.account.account_number.localeCompare(b.account.account_number));

    const result = totalProducts - totalCharges;

    const ta = actif.reduce((s, l) => s + l.amount, 0);
    const tp = passif.reduce((s, l) => s + l.amount, 0) + result;

    return {
      actifLines: actif,
      passifLines: passif,
      totalActif: ta,
      totalPassif: tp,
      netResult: result,
    };
  }, [entries, accounts]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  const renderColumn = (title: string, lines: BilanLine[], extraLine: { label: string; amount: number } | undefined, total: number) => (
    <div className="flex-1">
      <h2 className="mb-2 text-lg font-semibold text-foreground">{title}</h2>
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
            {lines.length === 0 && !extraLine ? (
              <tr>
                <td colSpan={3} className="px-3 py-4 text-center text-muted-foreground">
                  Aucune donnée.
                </td>
              </tr>
            ) : (
              <>
                {lines.map((l) => (
                  <tr key={l.account.id} className="border-b">
                    <td className="px-3 py-2 font-mono text-xs">{l.account.account_number}</td>
                    <td className="px-3 py-2">{l.account.account_name}</td>
                    <td className="px-3 py-2 text-right font-mono">{fmt(l.amount)}</td>
                  </tr>
                ))}
                {extraLine && (
                  <tr className="border-b bg-primary/5">
                    <td className="px-3 py-2"></td>
                    <td className="px-3 py-2 font-medium italic">{extraLine.label}</td>
                    <td className={`px-3 py-2 text-right font-mono font-medium ${extraLine.amount >= 0 ? "" : "text-destructive"}`}>
                      {fmt(extraLine.amount)}
                    </td>
                  </tr>
                )}
              </>
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
    </div>
  );

  return (
    <AppLayout title="Bilan">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <FiscalPeriodSelector value={period?.id || null} onChange={setPeriod} />
        <PrintButton />
      </div>

      {/* Print header */}
      <div className="hidden print:block print:mb-4">
        <h1 className="text-xl font-bold text-center">Bilan</h1>
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
        <>
          <div className="flex gap-6 print:gap-4">
            {renderColumn("Actif", actifLines, undefined, totalActif)}
            {renderColumn(
              "Passif",
              passifLines,
              { label: netResult >= 0 ? "Résultat net (Bénéfice)" : "Résultat net (Perte)", amount: netResult },
              totalPassif
            )}
          </div>

          {/* Verification */}
          <div className={`mt-4 rounded-md border-2 p-3 text-center text-sm font-medium ${
            Math.abs(totalActif - totalPassif) < 0.01
              ? "border-primary/30 bg-primary/5 text-primary"
              : "border-destructive/30 bg-destructive/5 text-destructive"
          }`}>
            {Math.abs(totalActif - totalPassif) < 0.01
              ? `✓ Équilibré — Total Actif = Total Passif = ${fmt(totalActif)}`
              : `✗ Déséquilibré — Actif: ${fmt(totalActif)} ≠ Passif: ${fmt(totalPassif)} (écart: ${fmt(Math.abs(totalActif - totalPassif))})`}
          </div>
        </>
      )}
    </AppLayout>
  );
}
