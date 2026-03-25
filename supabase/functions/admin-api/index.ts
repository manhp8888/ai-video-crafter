import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    const { action, ...params } = await req.json();

    // Check if user is admin (except for init-admin which bootstraps)
    if (action !== "init-admin") {
      const { data: roleData } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();
      if (!roleData) throw new Error("Admin access required");
    }

    let result: unknown = null;

    switch (action) {
      case "init-admin": {
        // Only works if no admins exist yet
        const { data: existingAdmins } = await supabaseAdmin
          .from("user_roles")
          .select("id")
          .eq("role", "admin");
        if (existingAdmins && existingAdmins.length > 0) {
          throw new Error("Admin already exists");
        }
        // Ensure profile exists
        await supabaseAdmin.from("profiles").upsert({ id: user.id, email: user.email });
        // Make current user admin
        await supabaseAdmin.from("user_roles").upsert({ user_id: user.id, role: "admin" });
        result = { success: true, message: "You are now admin" };
        break;
      }

      case "list-users": {
        const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
        if (error) throw error;
        // Get premium activations
        const { data: activations } = await supabaseAdmin.from("premium_activations").select("user_id, activated_at");
        const premiumMap = new Map((activations || []).map(a => [a.user_id, a.activated_at]));
        
        result = (users || []).map(u => ({
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          isPremium: premiumMap.has(u.id),
          premiumSince: premiumMap.get(u.id) || null,
        }));
        break;
      }

      case "list-codes": {
        const { data } = await supabaseAdmin.from("premium_codes").select("*").order("created_at", { ascending: false });
        result = data;
        break;
      }

      case "create-code": {
        const { code, max_uses } = params;
        if (!code) throw new Error("Code is required");
        const { data, error } = await supabaseAdmin.from("premium_codes").insert({
          code: code.toUpperCase(),
          max_uses: max_uses || 1,
          created_by: user.id,
        }).select().single();
        if (error) throw error;
        result = data;
        break;
      }

      case "delete-code": {
        const { code_id } = params;
        const { error } = await supabaseAdmin.from("premium_codes").delete().eq("id", code_id);
        if (error) throw error;
        result = { success: true };
        break;
      }

      case "toggle-code": {
        const { code_id, is_active } = params;
        const { error } = await supabaseAdmin.from("premium_codes").update({ is_active }).eq("id", code_id);
        if (error) throw error;
        result = { success: true };
        break;
      }

      case "revoke-premium": {
        const { target_user_id } = params;
        const { error } = await supabaseAdmin.from("premium_activations").delete().eq("user_id", target_user_id);
        if (error) throw error;
        result = { success: true };
        break;
      }

      default:
        throw new Error("Unknown action");
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("admin-api error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
