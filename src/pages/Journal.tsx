import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useOpenPeriod } from "@/hooks/useOpenPeriod";
import { useAccounts } from "@/hooks/useAccounts";
import { JournalTable, type JournalEntry } from "@/components/journal/JournalTable";
import { JournalEntryForm, type JournalEntryData } from "@/components/journal/JournalEntryForm";

export default function Journal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntryData | null>(null);

  const { toast } = useToast();
  const { user } = useAuth();
  const { period, loading: periodLoading } = useOpenPeriod();
  const { accounts, loading: accountsLoading } = useAccounts();

  const fetchEntries = useCallback(async () => {
    if (!period) return;
    setLoadingEntries(true);
    const { data, error } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("fiscal_period_id", period.id)
      .order("entry_date", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setEntries((data as JournalEntry[]) || []);
    }
    setLoadingEntries(false);
  }, [period, toast]);

  useEffect(() => {
    if (period) fetchEntries();
    else if (!periodLoading) setLoadingEntries(false);
  }, [period, periodLoading, fetchEntries]);

  const handleSubmit = async (data: JournalEntryData) => {
    if (!period || !user) throw new Error("Aucune période ouverte ou utilisateur non connecté.");

    if (data.id) {
      // Update
      const { error } = await supabase
        .from("journal_entries")
        .update({
          entry_date: data.entry_date,
          debit_account_id: data.debit_account_id,
          credit_account_id: data.credit_account_id,
          debit_amount: data.amount,
          credit_amount: data.amount,
          label: data.label,
        })
        .eq("id", data.id);

      if (error) throw error;

      // Log the update
      await supabase.from("system_logs").insert({
        user_id: user.id,
        action_type: "journal_update",
        description: `Écriture modifiée: ${data.label} (${data.amount})`,
      });

      toast({ title: "Succès", description: "Écriture modifiée." });
    } else {
      // Create
      const { error } = await supabase.from("journal_entries").insert({
        entry_date: data.entry_date,
        debit_account_id: data.debit_account_id,
        credit_account_id: data.credit_account_id,
        debit_amount: data.amount,
        credit_amount: data.amount,
        label: data.label,
        fiscal_period_id: period.id,
        created_by: user.id,
      });

      if (error) throw error;

      // Log the creation
      await supabase.from("system_logs").insert({
        user_id: user.id,
        action_type: "journal_create",
        description: `Écriture créée: ${data.label} (${data.amount})`,
      });

      toast({ title: "Succès", description: "Écriture enregistrée." });
    }

    fetchEntries();
  };

  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry({
      id: entry.id,
      entry_date: entry.entry_date,
      debit_account_id: entry.debit_account_id,
      credit_account_id: entry.credit_account_id,
      amount: Number(entry.debit_amount),
      label: entry.label,
    });
    setFormOpen(true);
  };

  const handleNewEntry = () => {
    setEditingEntry(null);
    setFormOpen(true);
  };

  const isLoading = periodLoading || accountsLoading;

  if (isLoading) {
    return (
      <AppLayout title="Journal Comptable">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!period) {
    return (
      <AppLayout title="Journal Comptable">
        <div className="flex flex-col items-center justify-center gap-3 rounded-md border bg-card py-12">
          <AlertCircle className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Aucune période fiscale ouverte. Veuillez contacter l'administrateur.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Journal Comptable">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">
            Période : {period.label}
          </p>
          <p className="text-xs text-muted-foreground">
            Du {new Date(period.start_date).toLocaleDateString("fr-FR")} au{" "}
            {new Date(period.end_date).toLocaleDateString("fr-FR")}
          </p>
        </div>
        <Button className="gap-2 print:hidden" onClick={handleNewEntry}>
          <Plus className="h-4 w-4" />
          Nouvelle Écriture
        </Button>
      </div>

      {loadingEntries ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <JournalTable
          entries={entries}
          accounts={accounts}
          onEdit={handleEdit}
        />
      )}

      <JournalEntryForm
        open={formOpen}
        onOpenChange={setFormOpen}
        accounts={accounts}
        initialData={editingEntry}
        onSubmit={handleSubmit}
        periodStartDate={period.start_date}
        periodEndDate={period.end_date}
      />
    </AppLayout>
  );
}
