import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { AccountPicker } from "./AccountPicker";
import type { Account } from "@/hooks/useAccounts";

export interface JournalEntryData {
  id?: string;
  entry_date: string;
  debit_account_id: string;
  credit_account_id: string;
  amount: number;
  label: string;
}

interface JournalEntryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  initialData?: JournalEntryData | null;
  onSubmit: (data: JournalEntryData) => Promise<void>;
  periodStartDate?: string;
  periodEndDate?: string;
}

export function JournalEntryForm({
  open,
  onOpenChange,
  accounts,
  initialData,
  onSubmit,
  periodStartDate,
  periodEndDate,
}: JournalEntryFormProps) {
  const [entryDate, setEntryDate] = useState("");
  const [debitAccountId, setDebitAccountId] = useState<string | null>(null);
  const [creditAccountId, setCreditAccountId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isEditing = !!initialData?.id;

  useEffect(() => {
    if (open && initialData) {
      setEntryDate(initialData.entry_date);
      setDebitAccountId(initialData.debit_account_id);
      setCreditAccountId(initialData.credit_account_id);
      setAmount(String(initialData.amount));
      setLabel(initialData.label);
    } else if (open) {
      setEntryDate(new Date().toISOString().split("T")[0]);
      setDebitAccountId(null);
      setCreditAccountId(null);
      setAmount("");
      setLabel("");
    }
    setError("");
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!debitAccountId || !creditAccountId) {
      setError("Veuillez sélectionner les comptes débit et crédit.");
      return;
    }

    if (debitAccountId === creditAccountId) {
      setError("Les comptes débit et crédit doivent être différents.");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Le montant doit être un nombre positif.");
      return;
    }

    if (!label.trim()) {
      setError("Le libellé est requis.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        id: initialData?.id,
        entry_date: entryDate,
        debit_account_id: debitAccountId,
        credit_account_id: creditAccountId,
        amount: numAmount,
        label: label.trim(),
      });
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la sauvegarde.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier l'Écriture" : "Nouvelle Écriture Comptable"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="entry-date">Date</Label>
            <Input
              id="entry-date"
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              min={periodStartDate}
              max={periodEndDate}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Compte Débit</Label>
            <AccountPicker
              accounts={accounts}
              value={debitAccountId}
              onChange={(id) => setDebitAccountId(id)}
              placeholder="Sélectionner le compte à débiter"
            />
          </div>

          <div className="space-y-2">
            <Label>Compte Crédit</Label>
            <AccountPicker
              accounts={accounts}
              value={creditAccountId}
              onChange={(id) => setCreditAccountId(id)}
              placeholder="Sélectionner le compte à créditer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Montant</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="entry-label">Libellé</Label>
            <Input
              id="entry-label"
              placeholder="Description de l'opération"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Modifier" : "Enregistrer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
