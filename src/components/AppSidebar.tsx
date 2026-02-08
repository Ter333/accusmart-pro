import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Users,
  Calendar,
  FileText,
  BookOpen,
  BarChart3,
  LogOut,
  Shield,
  ClipboardList,
} from "lucide-react";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

export function AppSidebar() {
  const { role, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getNavItems = (): NavItem[] => {
    switch (role) {
      case "admin":
        return [
          { label: "Utilisateurs", path: "/admin", icon: <Users className="h-5 w-5" /> },
          { label: "Périodes Fiscales", path: "/admin/periods", icon: <Calendar className="h-5 w-5" /> },
          { label: "Journaux d'Activité", path: "/admin/logs", icon: <ClipboardList className="h-5 w-5" /> },
        ];
      case "chef":
        return [
          { label: "Balance", path: "/reports/balance", icon: <BarChart3 className="h-5 w-5" /> },
          { label: "Compte de Résultat", path: "/reports/income", icon: <FileText className="h-5 w-5" /> },
          { label: "Bilan", path: "/reports/balance-sheet", icon: <BookOpen className="h-5 w-5" /> },
        ];
      case "comptable":
        return [
          { label: "Journal", path: "/journal", icon: <BookOpen className="h-5 w-5" /> },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const getRoleLabel = () => {
    switch (role) {
      case "admin": return "Administrateur";
      case "chef": return "Chef Comptable";
      case "comptable": return "Comptable";
      default: return "";
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-sidebar-background">
      {/* Header */}
      <div className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-sm font-bold text-sidebar-foreground">OHADA Compta</h1>
            <p className="text-xs text-muted-foreground">SYSCOHADA</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="border-t border-sidebar-border p-4">
        <div className="mb-3">
          <p className="text-sm font-medium text-sidebar-foreground">
            {profile?.first_name} {profile?.last_name}
          </p>
          <p className="text-xs text-muted-foreground">{getRoleLabel()}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </Button>
      </div>
    </aside>
  );
}
