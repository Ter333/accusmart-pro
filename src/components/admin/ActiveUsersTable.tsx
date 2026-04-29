import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { XCircle, CheckCircle, Loader2, KeyRound } from "lucide-react";
import type { UserWithRole } from "./PendingUsersTable";

interface ActiveUsersTableProps {
  users: UserWithRole[];
  onDeactivate: (user: UserWithRole) => void;
  onReactivate: (user: UserWithRole) => void;
  onResetPassword: (user: UserWithRole, newPassword: string) => Promise<void>;
  processing: string | null;
}

export function ActiveUsersTable({
  users,
  onDeactivate,
  onReactivate,
  onResetPassword,
  processing,
}: ActiveUsersTableProps) {
  const [resetTarget, setResetTarget] = useState<UserWithRole | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "admin": return "Admin";
      case "chef": return "Chef";
      case "comptable": return "Comptable";
      default: return "—";
    }
  };

  const handleSubmitReset = async () => {
    if (!resetTarget || newPassword.length < 8) return;
    setSubmitting(true);
    try {
      await onResetPassword(resetTarget, newPassword);
      setResetTarget(null);
      setNewPassword("");
    } finally {
      setSubmitting(false);
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
                    <div className="flex flex-wrap gap-2">
                      {user.role !== "admin" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => {
                            setResetTarget(user);
                            setNewPassword("");
                          }}
                          disabled={processing === user.user_id}
                        >
                          <KeyRound className="h-4 w-4" />
                          Réinitialiser MDP
                        </Button>
                      )}
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
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!resetTarget} onOpenChange={(o) => !o && setResetTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
            <DialogDescription>
              Définir un nouveau mot de passe pour{" "}
              <strong>{resetTarget?.first_name} {resetTarget?.last_name}</strong> ({resetTarget?.email}).
              L'utilisateur devra le changer à sa prochaine connexion.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="new-password">Nouveau mot de passe (min. 8 caractères)</Label>
            <Input
              id="new-password"
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Ex: Temp@2026"
              autoComplete="new-password"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetTarget(null)} disabled={submitting}>
              Annuler
            </Button>
            <Button
              onClick={handleSubmitReset}
              disabled={newPassword.length < 8 || submitting}
              className="gap-1"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
