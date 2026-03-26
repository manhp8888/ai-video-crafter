import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, action } = await req.json(); // action: "enhance" | "remix"
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = action === "remix"
      ? `You are a creative AI director. Take the given prompt and REMIX it by randomly changing:
- Lighting style (neon, volumetric, golden hour, moonlight, dramatic shadows)
- Mood (dark, dreamy, epic, romantic, mysterious, energetic)
- Camera style (handheld, dolly, drone, steadicam, crane shot, first person)
- Color palette (warm tones, cool tones, desaturated, vibrant, monochrome)
Keep the core subject but make it feel completely different and fresh.`
      : `You are an elite cinematography AI. Take the given prompt and ENHANCE it to production quality by adding:
1. Specific camera: exact lens (e.g., 85mm f/1.4), movement speed, stabilization
2. Professional lighting: key/fill/rim setup, color temperature, direction
3. Realistic physics: material textures, fluid dynamics, particle effects
4. Motion detail: speed ramping, motion blur shutter angle, subject micro-movements
5. Atmosphere: volumetric haze, dust particles, lens effects (flare, bokeh shape)
6. Color science: specific LUT reference, contrast ratio, color space`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `${action === "remix" ? "Remix" : "Enhance"} this prompt:\n\n${prompt}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_enhanced_prompt",
            description: "Return the enhanced/remixed prompt",
            parameters: {
              type: "object",
              properties: {
                enhanced_prompt: { type: "string", description: "The enhanced or remixed prompt text" },
                changes_summary: { type: "string", description: "Brief summary of what was changed/added" },
              },
              required: ["enhanced_prompt", "changes_summary"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_enhanced_prompt" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    const data = toolCall ? JSON.parse(toolCall.function.arguments) : null;

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-enhance-prompt error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
