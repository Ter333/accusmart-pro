import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import type { Account } from "@/hooks/useAccounts";

export interface JournalEntry {
  id: string;
  entry_date: string;
  debit_account_id: string;
  credit_account_id: string;
  debit_amount: number;
  credit_amount: number;
  label: string;
  fiscal_period_id: string;
  created_by: string;
}

interface JournalTableProps {
  entries: JournalEntry[];
  accounts: Account[];
  onEdit?: (entry: JournalEntry) => void;
  readOnly?: boolean;
}

export function JournalTable({ entries, accounts, onEdit, readOnly = false }: JournalTableProps) {
  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  const getAccount = (id: string) => accountMap.get(id);

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  // Group entries by date for display
  let lastDate = "";

  // Totals
  const totalDebit = entries.reduce((sum, e) => sum + Number(e.debit_amount), 0);
  const totalCredit = entries.reduce((sum, e) => sum + Number(e.credit_amount), 0);

  return (
    <div className="journal-table-wrapper rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="w-16 px-3 py-2.5 text-center font-semibold text-muted-foreground">Débit</th>
            <th className="w-16 px-3 py-2.5 text-center font-semibold text-muted-foreground">Crédit</th>
            <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground">Date / Compte / Libellé</th>
            <th className="w-32 px-3 py-2.5 text-right font-semibold text-muted-foreground">Montant Débit</th>
            <th className="w-32 px-3 py-2.5 text-right font-semibold text-muted-foreground">Montant Crédit</th>
            {!readOnly && <th className="w-12 px-2 py-2.5 print:hidden"></th>}
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 ? (
            <tr>
              <td colSpan={readOnly ? 5 : 6} className="px-3 py-8 text-center text-muted-foreground">
                Aucune écriture comptable.
              </td>
            </tr>
          ) : (
            entries.map((entry) => {
              const debitAccount = getAccount(entry.debit_account_id);
              const creditAccount = getAccount(entry.credit_account_id);
              const showDate = entry.entry_date !== lastDate;
              lastDate = entry.entry_date;

              return (
                <tbody key={entry.id} className="journal-entry-block">
                  {/* Row 1: Debit line */}
                  <tr className="border-0">
                    <td className="px-3 py-1 text-center font-mono text-xs text-muted-foreground">
                      {debitAccount?.account_class}
                    </td>
                    <td className="px-3 py-1"></td>
                    <td className="px-3 py-1">
                      {showDate && (
                        <span className="mr-3 font-semibold text-foreground">
                          {formatDate(entry.entry_date)}
                        </span>
                      )}
                      <span className="text-foreground">
                        {debitAccount
                          ? `${debitAccount.account_number} ${debitAccount.account_name}`
                          : "—"}
                      </span>
                    </td>
                    <td className="px-3 py-1 text-right font-mono">
                      {formatAmount(entry.debit_amount)}
                    </td>
                    <td className="px-3 py-1"></td>
                    {!readOnly && (
                      <td className="px-2 py-1 print:hidden" rowSpan={3}>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => onEdit?.(entry)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    )}
                  </tr>
                  {/* Row 2: Credit line (indented) */}
                  <tr className="border-0">
                    <td className="px-3 py-1"></td>
                    <td className="px-3 py-1 text-center font-mono text-xs text-muted-foreground">
                      {creditAccount?.account_class}
                    </td>
                    <td className="px-3 py-1 pl-12">
                      <span className="text-foreground">
                        {creditAccount
                          ? `${creditAccount.account_number} ${creditAccount.account_name}`
                          : "—"}
                      </span>
                    </td>
                    <td className="px-3 py-1"></td>
                    <td className="px-3 py-1 text-right font-mono">
                      {formatAmount(entry.credit_amount)}
                    </td>
                  </tr>
                  {/* Row 3: Label */}
                  <tr className="border-b border-dashed border-border/40">
                    <td className="px-3 pb-2 pt-0"></td>
                    <td className="px-3 pb-2 pt-0"></td>
                    <td className="px-3 pb-2 pt-0 pl-6 text-sm italic text-muted-foreground">
                      {entry.label}
                    </td>
                    <td className="px-3 pb-2 pt-0"></td>
                    <td className="px-3 pb-2 pt-0"></td>
                  </tr>
                </tbody>
              );
            })
          )}
        </tbody>
        {entries.length > 0 && (
          <tfoot>
            <tr className="border-t-2 bg-muted/30 font-semibold">
              <td className="px-3 py-2.5"></td>
              <td className="px-3 py-2.5"></td>
              <td className="px-3 py-2.5 text-foreground">Totaux</td>
              <td className="px-3 py-2.5 text-right font-mono">{formatAmount(totalDebit)}</td>
              <td className="px-3 py-2.5 text-right font-mono">{formatAmount(totalCredit)}</td>
              {!readOnly && <td className="print:hidden"></td>}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
