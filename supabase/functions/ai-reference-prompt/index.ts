import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { referenceImage, youtubeUrl, idea, style, model, outputLanguage } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const outLang = outputLanguage || "Tiếng Việt";
    const modelName = model || "Runway";

    const messages: any[] = [
      {
        role: "system",
        content: `You are an elite AI video/image prompt engineer specializing in reverse-engineering visual references into production-ready prompts.

CORE TASK: Analyze the provided reference (image or video description) and generate TWO distinct prompt sections:

1. VISUAL PROMPT: Exhaustive description of visual elements:
   - Subject appearance (face, hair, skin, clothing material/color/texture)
   - Environment/background (architecture, nature, objects, depth)
   - Color palette (dominant colors, gradients, color harmony)
   - Lighting (direction, intensity, shadows, reflections, color temperature)
   - Composition (framing, rule of thirds, leading lines, depth of field)
   - Texture details (surfaces, materials, particles, atmosphere)

2. MOTION PROMPT: Detailed movement and dynamics:
   - Camera movement (type, speed, direction, acceleration)
   - Subject motion (body language, gestures, micro-expressions)
   - Physics (hair/fabric/water/smoke dynamics, gravity effects)
   - Transitions (cuts, fades, speed ramps)
   - Temporal pacing (slow motion, real-time, time-lapse sections)

3. CINEMATIC STYLE: Overall aesthetic direction
4. NEGATIVE PROMPT: What to avoid for quality control

Output language: ${outLang}
Target AI model: ${modelName}`,
      },
    ];

    // Build user message content
    const userContent: any[] = [];

    if (referenceImage) {
      userContent.push({
        type: "image_url",
        image_url: { url: referenceImage },
      });
      userContent.push({
        type: "text",
        text: `Analyze this reference image and create production-ready prompts.${idea ? ` Additional context: ${idea}` : ""}${style ? ` Desired style: ${style}` : ""}`,
      });
    } else if (youtubeUrl) {
      userContent.push({
        type: "text",
        text: `Analyze this YouTube video reference and create production-ready prompts based on the visual style and motion described in this video URL: ${youtubeUrl}.${idea ? ` Additional context: ${idea}` : ""}${style ? ` Desired style: ${style}` : ""}\n\nNote: Since you cannot watch the video directly, infer the likely visual style, cinematography, and motion based on the URL context, title patterns, and any available metadata. Focus on creating cinematic prompts that would match high-quality video content.`,
      });
    } else {
      return new Response(JSON.stringify({ error: "Cần cung cấp ảnh reference hoặc link YouTube" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    messages.push({ role: "user", content: userContent });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        tools: [
          {
            type: "function",
            function: {
              name: "generate_reference_prompt",
              description: "Generate visual and motion prompts from a reference",
              parameters: {
                type: "object",
                properties: {
                  visual_prompt: {
                    type: "string",
                    description: "Detailed visual description: subject, environment, colors, lighting, textures, composition",
                  },
                  motion_prompt: {
                    type: "string",
                    description: "Detailed motion description: camera movement, subject action, physics, transitions",
                  },
                  cinematic_style: {
                    type: "string",
                    description: "Overall cinematic style direction and aesthetic",
                  },
                  negative_prompt: {
                    type: "string",
                    description: "What to avoid: artifacts, unwanted elements, quality issues",
                  },
                  title: { type: "string", description: "Short descriptive title" },
                  hashtags: {
                    type: "array",
                    items: { type: "string" },
                    description: "5-8 relevant hashtags",
                  },
                  camera_settings: {
                    type: "object",
                    properties: {
                      angle: { type: "string" },
                      lens: { type: "string" },
                      fps: { type: "string" },
                      motion: { type: "string" },
                    },
                    required: ["angle", "lens", "fps", "motion"],
                    additionalProperties: false,
                  },
                  lighting_settings: {
                    type: "object",
                    properties: {
                      type: { type: "string" },
                      time_of_day: { type: "string" },
                      color_temperature: { type: "string" },
                    },
                    required: ["type", "time_of_day", "color_temperature"],
                    additionalProperties: false,
                  },
                },
                required: [
                  "visual_prompt",
                  "motion_prompt",
                  "cinematic_style",
                  "negative_prompt",
                  "title",
                  "hashtags",
                  "camera_settings",
                  "lighting_settings",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_reference_prompt" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Đã vượt giới hạn, vui lòng thử lại sau." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Hết credits AI." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    const promptData = toolCall ? JSON.parse(toolCall.function.arguments) : null;

    return new Response(JSON.stringify({ prompt: promptData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-reference-prompt error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Lỗi không xác định" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
