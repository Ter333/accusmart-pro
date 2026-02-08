import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  isActive: boolean;
  mustChangePassword: boolean;
  loading: boolean;
  profile: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (data: SignUpData) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);

  const fetchUserData = async (userId: string) => {
    try {
      const [profileResult, roleResult] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
        supabase.rpc("get_user_role", { _user_id: userId }),
      ]);

      if (profileResult.data) {
        setIsActive(profileResult.data.is_active);
        setMustChangePassword(profileResult.data.must_change_password);
        setProfile({
          first_name: profileResult.data.first_name,
          last_name: profileResult.data.last_name,
          email: profileResult.data.email,
        });
      }

      if (roleResult.data) {
        setRole(roleResult.data as AppRole);
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserData(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setRole(null);
          setIsActive(false);
          setMustChangePassword(false);
          setProfile(null);
        }

        if (event === "SIGNED_OUT") {
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserData(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: error.message };
    }
    // Log login event
    if (data.user) {
      supabase.from("system_logs").insert({
        user_id: data.user.id,
        action_type: "login",
        description: `Connexion de ${email}`,
      }).then();
    }
    return { error: null };
  };

  const signUp = async (data: SignUpData) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
        },
      },
    });
    if (error) {
      if (error.message.includes("already registered")) {
        return { error: "Un compte avec cet email existe déjà." };
      }
      return { error: error.message };
    }
    return { error: null };
  };

  const signOut = async () => {
    // Log the logout before signing out
    if (user) {
      await supabase.from("system_logs").insert({
        user_id: user.id,
        action_type: "logout",
        description: `Déconnexion de ${profile?.email || user.email}`,
      });
    }
    await supabase.auth.signOut();
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      return { error: error.message };
    }
    // Update must_change_password flag
    if (user) {
      await supabase
        .from("profiles")
        .update({ must_change_password: false })
        .eq("user_id", user.id);
      setMustChangePassword(false);
    }
    return { error: null };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        isActive,
        mustChangePassword,
        loading,
        profile,
        signIn,
        signUp,
        signOut,
        updatePassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
