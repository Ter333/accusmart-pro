import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Lock, Unlock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function AdminPeriods() {
  const [periods, setPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchPeriods = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("fiscal_periods")
      .select("*")
      .order("start_date", { ascending: false });

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setPeriods(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPeriods();
  }, []);

  const createPeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label || !startDate || !endDate) return;

    setSubmitting(true);
    const { error } = await supabase.from("fiscal_periods").insert({
      label,
      start_date: startDate,
      end_date: endDate,
      is_open: false,
      created_by: user?.id,
    });

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Succès", description: "Période fiscale créée." });
      setLabel("");
      setStartDate("");
      setEndDate("");
      setDialogOpen(false);
      fetchPeriods();
    }
    setSubmitting(false);
  };

  const togglePeriod = async (periodId: string, currentlyOpen: boolean) => {
    if (!currentlyOpen) {
      // Close all other periods first
      const { error: closeError } = await supabase
        .from("fiscal_periods")
        .update({ is_open: false })
        .neq("id", periodId);

      if (closeError) {
        toast({ title: "Erreur", description: closeError.message, variant: "destructive" });
        return;
      }
    }

    const { error } = await supabase
      .from("fiscal_periods")
      .update({ is_open: !currentlyOpen })
      .eq("id", periodId);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "Succès",
        description: currentlyOpen ? "Période fermée." : "Période ouverte.",
      });
      fetchPeriods();
    }
  };

  return (
    <AppLayout title="Périodes Fiscales">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Gérez les exercices fiscaux. Une seule période peut être ouverte à la fois.
        </p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle Période
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une Période Fiscale</DialogTitle>
            </DialogHeader>
            <form onSubmit={createPeriod} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="period-label">Libellé</Label>
                <Input
                  id="period-label"
                  placeholder="Exercice 2026"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Date de début</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">Date de fin</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Créer
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : periods.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Aucune période fiscale créée.
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Libellé</TableHead>
                <TableHead>Début</TableHead>
                <TableHead>Fin</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {periods.map((period) => (
                <TableRow key={period.id}>
                  <TableCell className="font-medium">{period.label}</TableCell>
                  <TableCell>
                    {new Date(period.start_date).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell>
                    {new Date(period.end_date).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={period.is_open ? "default" : "secondary"}>
                      {period.is_open ? "Ouverte" : "Fermée"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => togglePeriod(period.id, period.is_open)}
                    >
                      {period.is_open ? (
                        <>
                          <Lock className="h-4 w-4" /> Fermer
                        </>
                      ) : (
                        <>
                          <Unlock className="h-4 w-4" /> Ouvrir
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AppLayout>
  );
}
