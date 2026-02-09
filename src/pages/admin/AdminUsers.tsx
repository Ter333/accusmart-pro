import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PendingUsersTable, type UserWithRole } from "@/components/admin/PendingUsersTable";
import { ActiveUsersTable } from "@/components/admin/ActiveUsersTable";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export default function AdminUsers() {
  const [pendingUsers, setPendingUsers] = useState<UserWithRole[]>([]);
  const [activeUsers, setActiveUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, AppRole>>({});
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);

    const [profilesResult, rolesResult] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
    ]);

    if (profilesResult.error) {
      toast({ title: "Erreur", description: profilesResult.error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    if (rolesResult.error) {
      toast({ title: "Erreur", description: rolesResult.error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const roleMap = new Map<string, AppRole>();
    rolesResult.data?.forEach((r) => roleMap.set(r.user_id, r.role as AppRole));

    const usersWithRoles: UserWithRole[] = (profilesResult.data || []).map((p) => ({
      ...p,
      role: roleMap.get(p.user_id),
    }));

    setPendingUsers(usersWithRoles.filter((u) => !u.is_active && !u.role));
    setActiveUsers(usersWithRoles.filter((u) => u.is_active || u.role));
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const logAction = async (actionType: string, description: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("system_logs").insert({
        user_id: user.id,
        action_type: actionType,
        description,
      });
    }
  };

  const approveUser = async (user: UserWithRole) => {
    const role = selectedRoles[user.user_id] || "comptable";
    setProcessing(user.user_id);

    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ is_active: true })
        .eq("user_id", user.user_id);

      if (profileError) throw profileError;

      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: user.user_id, role });

      if (roleError) throw roleError;

      await logAction("user_approved", `Utilisateur ${user.email} approuvé avec le rôle ${role}`);
      toast({ title: "Succès", description: `${user.email} a été approuvé en tant que ${role}.` });
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  const rejectUser = async (user: UserWithRole) => {
    setProcessing(user.user_id);

    try {
      // Mark as inactive to reject — the user won't be able to log in
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: false })
        .eq("user_id", user.user_id);

      if (error) throw error;

      await logAction("user_rejected", `Inscription de ${user.email} rejetée`);
      toast({ title: "Succès", description: `L'inscription de ${user.email} a été rejetée.` });
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

      await logAction("user_deactivated", `Utilisateur ${user.email} désactivé`);
      toast({ title: "Succès", description: `${user.email} a été désactivé.` });
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  const reactivateUser = async (user: UserWithRole) => {
    setProcessing(user.user_id);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: true })
        .eq("user_id", user.user_id);

      if (error) throw error;

      await logAction("user_reactivated", `Utilisateur ${user.email} réactivé`);
      toast({ title: "Succès", description: `${user.email} a été réactivé.` });
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  const handleRoleChange = (userId: string, role: AppRole) => {
    setSelectedRoles((prev) => ({ ...prev, [userId]: role }));
  };

  return (
    <AppLayout title="Gestion des Utilisateurs">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-8">
          <PendingUsersTable
            users={pendingUsers}
            selectedRoles={selectedRoles}
            onRoleChange={handleRoleChange}
            onApprove={approveUser}
            onReject={rejectUser}
            processing={processing}
          />
          <ActiveUsersTable
            users={activeUsers}
            onDeactivate={deactivateUser}
            onReactivate={reactivateUser}
            processing={processing}
          />
        </div>
      )}
    </AppLayout>
  );
}
