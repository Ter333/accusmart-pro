import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check if admin already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const adminExists = existingUsers?.users?.some(
      (u) => u.email === "admin@system.local"
    );

    if (adminExists) {
      return new Response(
        JSON.stringify({ message: "Admin account already exists" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Create admin user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: "admin@system.local",
      password: "admin",
      email_confirm: true,
      user_metadata: {
        first_name: "System",
        last_name: "Admin",
        phone: "",
      },
    });

    if (authError) {
      throw new Error(`Failed to create admin user: ${authError.message}`);
    }

    const userId = authData.user.id;

    // Update profile to be active and require password change
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ is_active: true, must_change_password: true })
      .eq("user_id", userId);

    if (profileError) {
      throw new Error(`Failed to update profile: ${profileError.message}`);
    }

    // Assign admin role
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" });

    if (roleError) {
      throw new Error(`Failed to assign role: ${roleError.message}`);
    }

    return new Response(
      JSON.stringify({ message: "Admin account created successfully", userId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
