import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { idea } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Bạn là chuyên gia content video AI. Dựa trên ý tưởng người dùng, hãy gợi ý toàn bộ thông số để tạo video AI tốt nhất.
Trả về JSON với đúng format sau (không thêm gì khác):
{
  "style": "một trong: Cinematic, Anime, Realistic, Cyberpunk, Fantasy, Documentary, Pixar Style, 3D Render, Watercolor, Oil Painting, Sketch, Vaporwave, Retro, Minimalist",
  "camera": "một trong: Static Shot, Slow Zoom, Drone Shot, Tracking Shot, Handheld, Cinematic Pan, Dolly Zoom, 360° Rotation, First Person, Top Down",
  "lighting": "một trong: Soft Lighting, Neon Lighting, Sunset Lighting, Studio Lighting, Dramatic Lighting, Natural Light, Backlight, Rim Light, Volumetric Light, Moonlight",
  "mood": "một trong: Epic, Dark, Dreamy, Emotional, Futuristic, Peaceful, Mysterious, Romantic, Energetic, Melancholic",
  "model": "gợi ý mô hình AI phù hợp nhất",
  "duration": "thời lượng phù hợp, ví dụ: 10 giây, 15 giây",
  "title": "tiêu đề hấp dẫn cho video",
  "description": "mô tả SEO ngắn gọn",
  "hashtags": "5-8 hashtag phù hợp",
  "coverPrompt": "prompt tạo ảnh bìa chi tiết",
  "enhancedIdea": "ý tưởng được nâng cấp và chi tiết hơn"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Ý tưởng: ${idea}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_video_params",
              description: "Suggest all parameters for AI video creation",
              parameters: {
                type: "object",
                properties: {
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
                },
                required: ["style", "camera", "lighting", "mood", "model", "duration", "title", "description", "hashtags", "coverPrompt", "enhancedIdea"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_video_params" } },
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
