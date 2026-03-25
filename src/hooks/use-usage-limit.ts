import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useUsageLimit(feature: string, freeLimit: number) {
  const [usageCount, setUsageCount] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkStatus = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check premium
      const { data: activation } = await supabase
        .from("premium_activations")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      setIsPremium(!!activation);

      // Check today's usage
      const today = new Date().toISOString().split("T")[0];
      const { data: usage } = await supabase
        .from("usage_tracking")
        .select("count")
        .eq("user_id", user.id)
        .eq("feature", feature)
        .eq("used_at", today)
        .maybeSingle();
      setUsageCount(usage?.count || 0);
    } catch (e) {
      console.error("Usage check error:", e);
    } finally {
      setLoading(false);
    }
  }, [feature]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const canUse = isPremium || usageCount < freeLimit;
  const remaining = isPremium ? Infinity : Math.max(0, freeLimit - usageCount);

  const recordUsage = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];
    const { data: existing } = await supabase
      .from("usage_tracking")
      .select("id, count")
      .eq("user_id", user.id)
      .eq("feature", feature)
      .eq("used_at", today)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("usage_tracking")
        .update({ count: existing.count + 1 })
        .eq("id", existing.id);
      setUsageCount(existing.count + 1);
    } else {
      await supabase
        .from("usage_tracking")
        .insert({ user_id: user.id, feature, used_at: today, count: 1 });
      setUsageCount(1);
    }
  }, [feature]);

  return { canUse, remaining, usageCount, isPremium, loading, recordUsage, refresh: checkStatus };
}
