import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LogEntry {
  id: string;
  user_id: string | null;
  action_type: string;
  description: string;
  created_at: string;
}

export default function AdminLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from("system_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
      } else {
        setLogs(data || []);
      }
      setLoading(false);
    };

    fetchLogs();
  }, []);

  const getActionBadgeVariant = (actionType: string) => {
    switch (actionType) {
      case "login": return "default";
      case "logout": return "secondary";
      case "user_approved": return "default";
      case "user_deactivated": return "destructive";
      case "journal_create": return "default";
      case "journal_update": return "secondary";
      default: return "secondary";
    }
  };

  const getActionLabel = (actionType: string) => {
    switch (actionType) {
      case "login": return "Connexion";
      case "logout": return "Déconnexion";
      case "user_approved": return "Approbation";
      case "user_deactivated": return "Désactivation";
      case "journal_create": return "Écriture créée";
      case "journal_update": return "Écriture modifiée";
      default: return actionType;
    }
  };

  return (
    <AppLayout title="Journaux d'Activité">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : logs.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Aucun journal d'activité disponible.
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Heure</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {new Date(log.created_at).toLocaleString("fr-FR")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getActionBadgeVariant(log.action_type)}>
                      {getActionLabel(log.action_type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{log.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AppLayout>
  );
}
