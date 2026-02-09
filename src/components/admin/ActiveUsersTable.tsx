import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { XCircle, CheckCircle, Loader2 } from "lucide-react";
import type { UserWithRole } from "./PendingUsersTable";

interface ActiveUsersTableProps {
  users: UserWithRole[];
  onDeactivate: (user: UserWithRole) => void;
  onReactivate: (user: UserWithRole) => void;
  processing: string | null;
}

export function ActiveUsersTable({
  users,
  onDeactivate,
  onReactivate,
  processing,
}: ActiveUsersTableProps) {
  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "admin": return "Admin";
      case "chef": return "Chef";
      case "comptable": return "Comptable";
      default: return "—";
    }
  };

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-foreground">
        Utilisateurs ({users.length})
      </h2>
      {users.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun utilisateur.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
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
                  <TableCell>
                    <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? "default" : "destructive"}>
                      {user.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.role !== "admin" && (
                      <>
                        {user.is_active ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1 text-destructive hover:text-destructive"
                                disabled={processing === user.user_id}
                              >
                                {processing === user.user_id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <XCircle className="h-4 w-4" />
                                )}
                                Désactiver
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmer la désactivation</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Êtes-vous sûr de vouloir désactiver le compte de{" "}
                                  <strong>{user.first_name} {user.last_name}</strong> ({user.email}) ?
                                  L'utilisateur ne pourra plus se connecter.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => onDeactivate(user)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Désactiver
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => onReactivate(user)}
                            disabled={processing === user.user_id}
                          >
                            {processing === user.user_id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                            Réactiver
                          </Button>
                        )}
                      </>
                    )}
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
