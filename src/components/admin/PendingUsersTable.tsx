import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export interface UserWithRole {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  role?: AppRole;
}

interface PendingUsersTableProps {
  users: UserWithRole[];
  selectedRoles: Record<string, AppRole>;
  onRoleChange: (userId: string, role: AppRole) => void;
  onApprove: (user: UserWithRole) => void;
  onReject: (user: UserWithRole) => void;
  processing: string | null;
}

export function PendingUsersTable({
  users,
  selectedRoles,
  onRoleChange,
  onApprove,
  onReject,
  processing,
}: PendingUsersTableProps) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-foreground">
        Inscriptions en Attente ({users.length})
      </h2>
      {users.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune inscription en attente.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell className="font-medium">
                    {user.first_name} {user.last_name}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone || "—"}</TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={selectedRoles[user.user_id] || "comptable"}
                      onValueChange={(val) => onRoleChange(user.user_id, val as AppRole)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="comptable">Comptable</SelectItem>
                        <SelectItem value="chef">Chef</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="gap-1"
                        onClick={() => onApprove(user)}
                        disabled={processing === user.user_id}
                      >
                        {processing === user.user_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        Approuver
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-destructive hover:text-destructive"
                            disabled={processing === user.user_id}
                          >
                            <XCircle className="h-4 w-4" />
                            Rejeter
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmer le rejet</AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir rejeter l'inscription de{" "}
                              <strong>{user.first_name} {user.last_name}</strong> ({user.email}) ?
                              Cette action désactivera définitivement ce compte.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onReject(user)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Rejeter
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
