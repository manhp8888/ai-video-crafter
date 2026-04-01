import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODEL_GUIDES: Record<string, string> = {
  "Runway": "Optimize for Runway Gen-3/Gen-4: describe camera movement explicitly ('camera slowly pushes in'), use natural language scene-by-scene. Add 'cinematic quality, 4K, shallow depth of field'.",
  "Pika": "Optimize for Pika: keep prompts concise, focus on main action. Start with subject, then motion. Use 'smooth motion, high quality'. 1-2 sentences per scene.",
  "Sora": "Optimize for Sora: write like a film script with detailed scene, character, action descriptions. Sora understands complex context. Use cinematic language: 'wide establishing shot', 'close-up', 'over-the-shoulder'.",
  "Kling": "Optimize for Kling AI: detail character appearance, clothing, expression. Kling excels at human motion—describe gestures, body movement. Add 'realistic skin texture, natural hair movement, fabric physics'.",
  "Luma Dream Machine": "Optimize for Luma: focus on 3D depth, spatial description. Use 'photorealistic, volumetric lighting, ray tracing'. Describe camera: 'orbit around', 'fly through', 'dolly in'.",
  "Hailuo AI": "Optimize for Hailuo (MiniMax): supports Chinese prompts well. Describe smooth, natural motion. Add '电影质感, 高清画质, 自然光线'.",
  "Midjourney": "Optimize for Midjourney: use params --ar 16:9 --v 6.1 --style raw --q 2. Structure: [subject], [action], [environment], [style], [technique]. Add '8K UHD, hyper-detailed, masterpiece'.",
  "DALL-E 3": "Optimize for DALL-E 3: write natural paragraph descriptions. Detail emotion, story. Add composition: 'rule of thirds', 'golden ratio'.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { idea, style, camera, lighting, mood, model, duration, inputLanguage, outputLanguage, mode, cameraAngle, cameraLens, cameraMotion, lightingType, timeOfDay, colorTemperature, realism } = body;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const durationValue = duration || "10 giây";
    const durationMatch = durationValue.match(/\d+/);
    const durationSeconds = durationMatch ? Number(durationMatch[0]) : 10;
    const sceneCount = Math.max(2, Math.ceil(durationSeconds / 5));
    const outLang = outputLanguage || "Tiếng Việt";
    const modelName = model || "Runway";
    const promptMode = mode || "basic";
    const modelGuide = MODEL_GUIDES[modelName] || MODEL_GUIDES["Runway"];

    const advancedContext = promptMode !== "basic" ? `
ADVANCED CINEMATOGRAPHY REQUIREMENTS:
- Camera Angle: ${cameraAngle || "eye level"} 
- Lens: ${cameraLens || "50mm"} (specify exact focal length, aperture f-stop)
- Camera Motion: ${cameraMotion || "tracking"} (specify speed: slow/medium/fast, smoothness)
- Lighting Type: ${lightingType || "soft"} 
- Time of Day: ${timeOfDay || "golden hour"}
- Color Temperature: ${colorTemperature || "5600K daylight"}
- Realism Level: ${realism || "photorealistic"}

PRO PHYSICS & REALISM RULES:
1. Hair: describe strand-level movement, reaction to wind/gravity
2. Fabric: material type (silk/cotton/leather), drape physics, wrinkle patterns
3. Skin: subsurface scattering, pore-level detail, natural imperfections
4. Water: caustics, refraction, surface tension, splash dynamics
5. Light: bounce, volumetric rays, lens flare type, chromatic aberration
6. Atmosphere: particle density (dust/fog/rain), depth haze, air perspective
7. Motion blur: shutter angle specification (180° standard, 90° for staccato)` : "";

    const systemPrompt = `You are an elite AI video production specialist and prompt engineer. You create PRODUCTION-READY prompts that generate ultra-realistic, cinematic AI videos.

${modelGuide}

CORE PRINCIPLES:
1. SPECIFICITY: Never use vague words. Replace "beautiful" with exact details (golden hour light at 45° angle, soft shadows on face contours)
2. REALISTIC PHYSICS: Include surface textures, light reflections, natural movement (hair swaying in wind, fabric draping with gravity, water splash dynamics)
3. PROFESSIONAL CINEMATOGRAPHY: Use precise film terminology (focal length, depth of field f/1.4-2.8, color grading LUT, aspect ratio)
4. SMOOTH TRANSITIONS: Each scene must have logical flow, no jarring cuts
5. EMOTION-DRIVEN: Every scene conveys specific emotion through lighting, angle, and pacing
${advancedContext}

TECHNICAL SPECS:
- Resolution: 4K/8K, frame rate (24fps cinematic / 60fps smooth)
- Depth of field: shallow (f/1.4-2.8) for portrait, deep (f/8-16) for landscape
- Lens type: wide (14-24mm), standard (35-50mm), telephoto (85-200mm)
- Light: key light direction, fill ratio, color temperature (3200K warm / 5600K daylight / 6500K cool)
- The master_prompt MUST be directly paste-able into ${modelName} with zero editing needed

Generate exactly ${sceneCount} scenes for a ${durationSeconds}-second video.
Output language: ${outLang}
Mode: ${promptMode}`;

    const userPrompt = `Create a PRODUCTION-READY cinematic video prompt:
- Idea: ${idea || "a breathtaking natural landscape"}
- Style: ${style || "Cinematic"}
- Camera: ${camera || "Slow Zoom"}
- Lighting: ${lighting || "Soft Lighting"}  
- Mood: ${mood || "Epic"}
- Duration: ${durationValue}
- AI Model: ${modelName}
- Input Language: ${inputLanguage || "Tiếng Việt"}
- Output Language: ${outLang}

REQUIREMENTS:
1. master_prompt must follow ${modelName}'s optimal format
2. Each scene needs: specific lighting, surface texture, physics movement, atmosphere
3. thumbnail_prompt must create click-worthy 4K thumbnail with rule-of-thirds, high contrast
4. Include realistic human motion if people are in scene (micro-expressions, weight shifting, breathing)`;

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
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_cinematic_prompt",
            description: "Generate a complete production-ready cinematic video prompt package",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "Catchy, click-worthy video title" },
                description: { type: "string", description: "SEO-optimized video description 3-4 sentences with keywords" },
                hashtags: { type: "array", items: { type: "string" }, description: "8-12 trending hashtags" },
                thumbnail_prompt: { type: "string", description: "Detailed 4K thumbnail prompt with composition, lighting, focal point" },
                master_prompt: { type: "string", description: "Complete master prompt with ALL technical specs, ready to paste into AI tool" },
                visual_prompt: { type: "string", description: "Detailed visual description: subject appearance, environment, colors, lighting, textures, composition" },
                motion_prompt: { type: "string", description: "Detailed motion: camera movement, subject action, physics, transitions, pacing" },
                cinematic_style: { type: "string", description: "Overall cinematic aesthetic direction" },
                negative_prompt: { type: "string", description: "What to avoid: artifacts, low quality, unwanted elements" },
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
                scenes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      scene: { type: "number" },
                      description: { type: "string", description: "Ultra-detailed scene: subject, action, environment, textures, particles, physics" },
                      camera: { type: "string", description: "Lens focal length, movement speed, direction, angle" },
                      lighting: { type: "string", description: "Specific lighting setup for this scene" },
                      motion: { type: "string", description: "Subject movement, physics, particle effects" },
                    },
                    required: ["scene", "description", "camera", "lighting", "motion"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["title", "description", "hashtags", "thumbnail_prompt", "master_prompt", "visual_prompt", "motion_prompt", "cinematic_style", "negative_prompt", "camera_settings", "lighting_settings", "scenes"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_cinematic_prompt" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Đã vượt giới hạn yêu cầu, vui lòng thử lại sau." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Hết credits AI, vui lòng nạp thêm." }), {
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
    console.error("ai-generate-prompt error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Lỗi không xác định" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
