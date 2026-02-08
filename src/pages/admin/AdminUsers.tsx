import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserWithRole {
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

export default function AdminUsers() {
  const [pendingUsers, setPendingUsers] = useState<UserWithRole[]>([]);
  const [activeUsers, setActiveUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, AppRole>>({});
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);

    // Fetch all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesError) {
      toast({ title: "Erreur", description: profilesError.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Fetch all roles
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("*");

    if (rolesError) {
      toast({ title: "Erreur", description: rolesError.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const roleMap = new Map<string, AppRole>();
    roles?.forEach((r) => roleMap.set(r.user_id, r.role as AppRole));

    const usersWithRoles: UserWithRole[] = (profiles || []).map((p) => ({
      ...p,
      role: roleMap.get(p.user_id),
    }));

    // Separate into pending (inactive, no role) and active
    setPendingUsers(usersWithRoles.filter((u) => !u.is_active && !u.role));
    setActiveUsers(usersWithRoles.filter((u) => u.is_active || u.role));
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const approveUser = async (user: UserWithRole) => {
    const role = selectedRoles[user.user_id] || "comptable";
    setProcessing(user.user_id);

    try {
      // Activate profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ is_active: true })
        .eq("user_id", user.user_id);

      if (profileError) throw profileError;

      // Assign role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: user.user_id, role });

      if (roleError) throw roleError;

      // Log the action
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        await supabase.from("system_logs").insert({
          user_id: currentUser.id,
          action_type: "user_approved",
          description: `Utilisateur ${user.email} approuvé avec le rôle ${role}`,
        });
      }

      toast({ title: "Succès", description: `${user.email} a été approuvé en tant que ${role}.` });
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  const deactivateUser = async (user: UserWithRole) => {
    setProcessing(user.user_id);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: false })
        .eq("user_id", user.user_id);

      if (error) throw error;

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        await supabase.from("system_logs").insert({
          user_id: currentUser.id,
          action_type: "user_deactivated",
          description: `Utilisateur ${user.email} désactivé`,
        });
      }

      toast({ title: "Succès", description: `${user.email} a été désactivé.` });
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  return (
    <AppLayout title="Gestion des Utilisateurs">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Pending Registrations */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Inscriptions en Attente ({pendingUsers.length})
            </h2>
            {pendingUsers.length === 0 ? (
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
                    {pendingUsers.map((user) => (
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
                            onValueChange={(val) =>
                              setSelectedRoles((prev) => ({ ...prev, [user.user_id]: val as AppRole }))
                            }
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
                          <Button
                            size="sm"
                            className="gap-1"
                            onClick={() => approveUser(user)}
                            disabled={processing === user.user_id}
                          >
                            {processing === user.user_id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                            Approuver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>

          {/* Active Users */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Utilisateurs Actifs ({activeUsers.length})
            </h2>
            {activeUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun utilisateur actif.</p>
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
                    {activeUsers.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell className="font-medium">
                          {user.first_name} {user.last_name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                            {user.role === "admin" ? "Admin" : user.role === "chef" ? "Chef" : "Comptable"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.is_active ? "default" : "destructive"}>
                            {user.is_active ? "Actif" : "Inactif"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.role !== "admin" && user.is_active && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-destructive"
                              onClick={() => deactivateUser(user)}
                              disabled={processing === user.user_id}
                            >
                              {processing === user.user_id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                              Désactiver
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>
        </div>
      )}
    </AppLayout>
  );
}
