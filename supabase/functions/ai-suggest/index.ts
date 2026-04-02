import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { idea, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const promptMode = mode || "basic";
    const isAdvanced = promptMode === "advanced" || promptMode === "pro";
    const isPro = promptMode === "pro";

    const systemPrompt = `Bạn là chuyên gia content video AI và đạo diễn điện ảnh chuyên nghiệp. Dựa trên ý tưởng người dùng, hãy gợi ý TOÀN BỘ thông số để tạo video AI chất lượng cao nhất.

Lưu ý quan trọng:
- Các giá trị style, camera, lighting, mood PHẢI nằm trong danh sách cho sẵn
- Chọn model AI phù hợp nhất với nội dung
- enhancedIdea phải chi tiết, bổ sung thêm mô tả về nhân vật, bối cảnh, hành động, ánh sáng, không khí
- title phải hấp dẫn, clickbait
- description phải chuẩn SEO
- hashtags phải trending
- coverPrompt phải chi tiết về bố cục, ánh sáng, màu sắc cho ảnh bìa 4K

Danh sách giá trị hợp lệ:
- style: Cinematic, Anime, Realistic, Cyberpunk, Fantasy, Documentary, Pixar Style, 3D Render, Watercolor, Oil Painting, Sketch, Vaporwave, Retro, Minimalist, Photorealistic, Hyper Realistic
- camera: Static Shot, Slow Zoom, Drone Shot, Tracking Shot, Handheld, Cinematic Pan, Dolly Zoom, 360° Rotation, First Person, Top Down, Steadicam, Crane Shot
- lighting: Soft Lighting, Neon Lighting, Sunset Lighting, Studio Lighting, Dramatic Lighting, Natural Light, Backlight, Rim Light, Volumetric Light, Moonlight, Golden Hour, Blue Hour
- mood: Epic, Dark, Dreamy, Emotional, Futuristic, Peaceful, Mysterious, Romantic, Energetic, Melancholic, Cinematic, Horror
- duration: 5 giây, 10 giây, 15 giây, 20 giây, 30 giây, 45 giây, 60 giây, 90 giây, 120 giây, 150 giây, 180 giây, 210 giây, 240 giây, 270 giây, 300 giây
- model: Runway, Pika, Sora, Kling, Luma Dream Machine, Stable Video, Vidu, PixVerse, Hailuo AI, Jimeng (即梦), Tongyi Wanxiang (通义万相), Midjourney, DALL-E 3, Flux, Wan (万), CogVideoX, Genmo
${isAdvanced ? `
Giá trị Advanced:
- cameraAngle: Eye Level, Low Angle, High Angle, Bird's Eye, Dutch Angle, Worm's Eye, Over the Shoulder
- cameraLens: 14mm Ultra Wide, 24mm Wide, 35mm Standard, 50mm Normal, 85mm Portrait, 135mm Telephoto, 200mm Telephoto, Anamorphic
- cameraMotion: Tracking, Handheld, Slow Motion, Speed Ramp, Whip Pan, Dolly In, Dolly Out, Orbit, Push In, Pull Out` : ""}
${isPro ? `
Giá trị Pro:
- lightingType: Key + Fill + Rim, Soft Diffused, Hard Direct, Neon RGB, Volumetric Fog, Practical Lights, Chiaroscuro, Rembrandt
- timeOfDay: Golden Hour, Blue Hour, Midnight, Dawn, High Noon, Overcast Day, Sunset, Twilight
- colorTemperature: 2700K Warm, 3200K Tungsten, 4100K Fluorescent, 5600K Daylight, 6500K Cool, 7500K Shade, Mixed Warm/Cool
- realism: Photorealistic, Hyper Realistic, Ultra Detail 8K, Cinematic Film Stock, RAW Ungraded, Film Grain 35mm` : ""}`;

    const properties: Record<string, { type: string }> = {
      style: { type: "string" },
      camera: { type: "string" },
      lighting: { type: "string" },
      mood: { type: "string" },
      model: { type: "string" },
      duration: { type: "string" },
      title: { type: "string" },
      description: { type: "string" },
      hashtags: { type: "string" },
      coverPrompt: { type: "string" },
      enhancedIdea: { type: "string" },
    };
    const required = ["style", "camera", "lighting", "mood", "model", "duration", "title", "description", "hashtags", "coverPrompt", "enhancedIdea"];

    if (isAdvanced) {
      properties.cameraAngle = { type: "string" };
      properties.cameraLens = { type: "string" };
      properties.cameraMotion = { type: "string" };
      required.push("cameraAngle", "cameraLens", "cameraMotion");
    }
    if (isPro) {
      properties.lightingType = { type: "string" };
      properties.timeOfDay = { type: "string" };
      properties.colorTemperature = { type: "string" };
      properties.realism = { type: "string" };
      required.push("lightingType", "timeOfDay", "colorTemperature", "realism");
    }

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
          { role: "user", content: `Ý tưởng: ${idea}\nChế độ: ${promptMode}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "suggest_video_params",
            description: "Suggest all parameters for AI video creation",
            parameters: {
              type: "object",
              properties,
              required,
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "suggest_video_params" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Đã vượt giới hạn yêu cầu, vui lòng thử lại sau." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    const suggestion = toolCall ? JSON.parse(toolCall.function.arguments) : null;

    return new Response(JSON.stringify({ suggestion }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-suggest error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Lỗi không xác định" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
