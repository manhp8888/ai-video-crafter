import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { visual_prompt, motion_prompt, cinematic_style, outputLanguage } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const outLang = outputLanguage || "Tiếng Việt";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You create 3 creative variations of cinematic prompts. Each variant should keep the core concept but change: lighting, mood, camera angle, color palette, or time of day. Output language: ${outLang}`,
          },
          {
            role: "user",
            content: `Create 3 distinct variations of this prompt:\n\nVisual: ${visual_prompt}\nMotion: ${motion_prompt}\nStyle: ${cinematic_style}\n\nEach variant should feel fresh and unique while maintaining the original concept.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_variants",
              description: "Generate 3 prompt variations",
              parameters: {
                type: "object",
                properties: {
                  variants: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        label: { type: "string", description: "Short variant name like 'Moody Night' or 'Golden Hour'" },
                        visual_prompt: { type: "string" },
                        motion_prompt: { type: "string" },
                        cinematic_style: { type: "string" },
                        negative_prompt: { type: "string" },
                      },
                      required: ["label", "visual_prompt", "motion_prompt", "cinematic_style", "negative_prompt"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["variants"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_variants" } },
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Vượt giới hạn, thử lại sau." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    const data = toolCall ? JSON.parse(toolCall.function.arguments) : { variants: [] };

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-generate-variants error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Lỗi" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
