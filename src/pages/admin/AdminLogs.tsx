import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LogEntry {
  id: string;
  user_id: string | null;
  action_type: string;
  description: string;
  created_at: string;
  user_email?: string;
}

const ACTION_TYPES = [
  { value: "all", label: "Tous les types" },
  { value: "login", label: "Connexion" },
  { value: "logout", label: "Déconnexion" },
  { value: "user_approved", label: "Approbation" },
  { value: "user_rejected", label: "Rejet" },
  { value: "user_deactivated", label: "Désactivation" },
  { value: "user_reactivated", label: "Réactivation" },
  { value: "journal_create", label: "Écriture créée" },
  { value: "journal_update", label: "Écriture modifiée" },
];

const getActionBadgeVariant = (actionType: string) => {
  switch (actionType) {
    case "login": return "default" as const;
    case "logout": return "secondary" as const;
    case "user_approved":
    case "user_reactivated": return "default" as const;
    case "user_deactivated":
    case "user_rejected": return "destructive" as const;
    case "journal_create": return "default" as const;
    case "journal_update": return "secondary" as const;
    default: return "secondary" as const;
  }
};

const getActionLabel = (actionType: string) => {
  const found = ACTION_TYPES.find((a) => a.value === actionType);
  return found ? found.label : actionType;
};

export default function AdminLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const fetchLogs = async () => {
      // Fetch logs
      const { data: logsData, error: logsError } = await supabase
        .from("system_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (logsError) {
        toast({ title: "Erreur", description: logsError.message, variant: "destructive" });
        setLoading(false);
        return;
      }

      // Fetch profiles to map user_id → email
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, first_name, last_name");

      const profileMap = new Map<string, string>();
      profiles?.forEach((p) => {
        profileMap.set(p.user_id, `${p.first_name} ${p.last_name} (${p.email})`);
      });

      const enrichedLogs: LogEntry[] = (logsData || []).map((log) => ({
        ...log,
        user_email: log.user_id ? profileMap.get(log.user_id) || "Inconnu" : "Système",
      }));

      setLogs(enrichedLogs);
      setLoading(false);
    };

    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    let result = logs;

    if (filterType !== "all") {
      result = result.filter((log) => log.action_type === filterType);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (log) =>
          log.description.toLowerCase().includes(query) ||
          (log.user_email && log.user_email.toLowerCase().includes(query))
      );
    }

    return result;
  }, [logs, filterType, searchQuery]);

  return (
    <AppLayout title="Journaux d'Activité">
      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="filter-type" className="text-xs">Type d'action</Label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger id="filter-type" className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTION_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="search" className="text-xs">Rechercher</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Rechercher dans les logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-9"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {filteredLogs.length} résultat{filteredLogs.length !== 1 ? "s" : ""}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Aucun journal d'activité trouvé.
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-44">Date & Heure</TableHead>
                <TableHead className="w-32">Type</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {new Date(log.created_at).toLocaleString("fr-FR")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getActionBadgeVariant(log.action_type)}>
                      {getActionLabel(log.action_type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{log.user_email}</TableCell>
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
