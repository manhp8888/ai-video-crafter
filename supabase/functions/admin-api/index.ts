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

    // Check if user is admin (except for init-admin and user-facing actions)
    const userActions = ["purchase-product", "list-user-purchases"];
    if (action !== "init-admin" && !userActions.includes(action)) {
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
        const { data: existingAdmins } = await supabaseAdmin
          .from("user_roles")
          .select("id")
          .eq("role", "admin");
        if (existingAdmins && existingAdmins.length > 0) {
          throw new Error("Admin already exists");
        }
        await supabaseAdmin.from("profiles").upsert({ id: user.id, email: user.email });
        await supabaseAdmin.from("user_roles").upsert({ user_id: user.id, role: "admin" });
        result = { success: true, message: "You are now admin" };
        break;
      }

      case "list-users": {
        const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
        if (error) throw error;
        const { data: activations } = await supabaseAdmin.from("premium_activations").select("user_id, activated_at, expires_at");
        const premiumMap = new Map((activations || []).map(a => [a.user_id, a]));
        const { data: balances } = await supabaseAdmin.from("profiles").select("id, balance");
        const balanceMap = new Map((balances || []).map(b => [b.id, b.balance]));
        
        result = (users || []).map(u => {
          const activation = premiumMap.get(u.id);
          return {
            id: u.id,
            email: u.email,
            created_at: u.created_at,
            isPremium: !!activation && (!activation.expires_at || new Date(activation.expires_at) > new Date()),
            premiumSince: activation?.activated_at || null,
            premiumExpiresAt: activation?.expires_at || null,
            balance: balanceMap.get(u.id) || 0,
          };
        });
        break;
      }

      case "list-codes": {
        const { data } = await supabaseAdmin.from("premium_codes").select("*").order("created_at", { ascending: false });
        result = data;
        break;
      }

      case "create-code": {
        const { code, max_uses, premium_days } = params;
        if (!code) throw new Error("Code is required");
        const { data, error } = await supabaseAdmin.from("premium_codes").insert({
          code: (code as string).toUpperCase(),
          max_uses: (max_uses as number) || 1,
          premium_days: (premium_days as number) || 30,
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
        const { error } = await supabaseAdmin.from("premium_activations").delete().eq("user_id", target_user_id as string);
        if (error) throw error;
        result = { success: true };
        break;
      }

      case "grant-premium": {
        const { target_user_id, days } = params;
        const numDays = (days as number) || 30;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + numDays);

        const { data: existingActivation } = await supabaseAdmin
          .from("premium_activations")
          .select("id, expires_at")
          .eq("user_id", target_user_id as string)
          .maybeSingle();

        if (existingActivation) {
          let baseDate = new Date();
          if (existingActivation.expires_at) {
            const exp = new Date(existingActivation.expires_at);
            if (exp > baseDate) baseDate = exp;
          }
          baseDate.setDate(baseDate.getDate() + numDays);
          await supabaseAdmin.from("premium_activations")
            .update({ expires_at: baseDate.toISOString() })
            .eq("id", existingActivation.id);
        } else {
          let { data: sysCode } = await supabaseAdmin.from("premium_codes")
            .select("id").eq("code", "ADMIN-GRANT").maybeSingle();
          if (!sysCode) {
            const { data: newCode } = await supabaseAdmin.from("premium_codes")
              .insert({ code: "ADMIN-GRANT", max_uses: 999999, created_by: user.id })
              .select("id").single();
            sysCode = newCode;
          }
          await supabaseAdmin.from("premium_activations")
            .insert({ user_id: target_user_id as string, code_id: sysCode!.id, expires_at: expiresAt.toISOString() });
        }
        result = { success: true };
        break;
      }

      // ===== MARKETPLACE PRODUCTS =====
      case "list-products": {
        const { data } = await supabaseAdmin.from("marketplace_products").select("*").order("created_at", { ascending: false });
        result = data;
        break;
      }

      case "create-product": {
        const { title, description, price, category, image_url, content } = params;
        if (!title) throw new Error("Title is required");
        const { data, error } = await supabaseAdmin.from("marketplace_products").insert({
          title: title as string,
          description: (description as string) || null,
          price: (price as number) || 0,
          category: (category as string) || "prompt",
          image_url: (image_url as string) || null,
          content: (content as string) || null,
          created_by: user.id,
        }).select().single();
        if (error) throw error;
        result = data;
        break;
      }

      case "update-product": {
        const { product_id, ...updates } = params;
        const { error } = await supabaseAdmin.from("marketplace_products").update(updates).eq("id", product_id as string);
        if (error) throw error;
        result = { success: true };
        break;
      }

      case "delete-product": {
        const { product_id } = params;
        const { error } = await supabaseAdmin.from("marketplace_products").delete().eq("id", product_id as string);
        if (error) throw error;
        result = { success: true };
        break;
      }

      case "toggle-product": {
        const { product_id, is_active } = params;
        const { error } = await supabaseAdmin.from("marketplace_products").update({ is_active }).eq("id", product_id as string);
        if (error) throw error;
        result = { success: true };
        break;
      }

      // ===== USER BALANCE =====
      case "add-balance": {
        const { target_user_id, amount, description: desc } = params;
        const numAmount = (amount as number) || 0;
        if (numAmount <= 0) throw new Error("Amount must be positive");

        // Ensure profile exists
        await supabaseAdmin.from("profiles").upsert({ id: target_user_id as string });

        // Get current balance
        const { data: profile } = await supabaseAdmin.from("profiles").select("balance").eq("id", target_user_id as string).single();
        const newBalance = (profile?.balance || 0) + numAmount;

        await supabaseAdmin.from("profiles").update({ balance: newBalance }).eq("id", target_user_id as string);
        await supabaseAdmin.from("balance_transactions").insert({
          user_id: target_user_id as string,
          amount: numAmount,
          type: "topup",
          description: (desc as string) || "Admin nạp tiền",
        });
        result = { success: true, balance: newBalance };
        break;
      }

      // ===== PURCHASE (user action, but through admin API for atomicity) =====
      case "purchase-product": {
        const { product_id } = params;
        const { data: product } = await supabaseAdmin.from("marketplace_products")
          .select("*").eq("id", product_id as string).eq("is_active", true).single();
        if (!product) throw new Error("Sản phẩm không tồn tại");

        // Check stock
        if (product.stock === 0) throw new Error("Sản phẩm đã hết hàng");

        // Ensure profile
        await supabaseAdmin.from("profiles").upsert({ id: user.id, email: user.email });

        const { data: profile } = await supabaseAdmin.from("profiles").select("balance").eq("id", user.id).single();
        const currentBalance = profile?.balance || 0;
        if (currentBalance < product.price) throw new Error("Số dư không đủ");

        // Check if already purchased
        const { data: existing } = await supabaseAdmin.from("user_purchases")
          .select("id").eq("user_id", user.id).eq("product_id", product_id as string).maybeSingle();
        if (existing) throw new Error("Bạn đã mua sản phẩm này");

        // Deduct balance
        await supabaseAdmin.from("profiles").update({ balance: currentBalance - product.price }).eq("id", user.id);
        await supabaseAdmin.from("balance_transactions").insert({
          user_id: user.id,
          amount: -product.price,
          type: "purchase",
          description: `Mua: ${product.title}`,
        });
        await supabaseAdmin.from("user_purchases").insert({
          user_id: user.id,
          product_id: product_id as string,
        });

        // Update stock & sales count
        const updateData: Record<string, unknown> = { sales_count: (product.sales_count || 0) + 1 };
        if (product.stock > 0) updateData.stock = product.stock - 1;
        await supabaseAdmin.from("marketplace_products").update(updateData).eq("id", product_id as string);

        result = { success: true, content: product.content };
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
