import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { idea, style, camera, lighting, mood, model, duration, inputLanguage, outputLanguage } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const durationValue = duration || "10 giây";
    const durationMatch = durationValue.match(/\d+/);
    const durationSeconds = durationMatch ? Number(durationMatch[0]) : 10;
    const sceneCount = Math.ceil(durationSeconds / 8);
    const outLang = outputLanguage || "Tiếng Việt";

    const systemPrompt = `Bạn là chuyên gia content video ngắn & prompt engineering cho các công cụ AI video.
Nhiệm vụ: tạo một gói nội dung đầy đủ cho video AI.

Trả về JSON với format sau (KHÔNG markdown, KHÔNG giải thích thêm):
{
  "title": "tiêu đề video hấp dẫn",
  "hashtags": "5-8 hashtag phù hợp",
  "seoDescription": "mô tả video chuẩn SEO 2-3 câu",
  "coverPrompt": "prompt chi tiết tạo ảnh bìa/thumbnail chất lượng 4K",
  "masterPrompt": "prompt tổng để tạo video, bao gồm tất cả thông số kỹ thuật",
  "scenes": [
    { "id": 1, "timeRange": "0-5s", "camera": "...", "description": "..." }
  ]
}

Lưu ý:
- Tạo đúng ${sceneCount} cảnh cho video ${durationSeconds} giây
- Tổng thời lượng các cảnh phải bằng ${durationSeconds} giây
- Viết bằng ${outLang}
- Prompt phải tối ưu cho mô hình ${model || "Runway"}
- Kết hợp --style, --mood, --duration tags trong masterPrompt`;

    const userPrompt = `Thông tin:
- Ý tưởng: ${idea || "một khung cảnh thiên nhiên ngoạn mục"}
- Phong cách: ${style || "Cinematic"}
- Máy quay: ${camera || "Slow Zoom"}
- Ánh sáng: ${lighting || "Soft Lighting"}
- Tâm trạng: ${mood || "Epic"}
- Thời lượng: ${durationValue}
- Mô hình: ${model || "Runway"}
- Ngôn ngữ đầu vào: ${inputLanguage || "Tiếng Việt"}
- Ngôn ngữ đầu ra: ${outLang}`;

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
        tools: [
          {
            type: "function",
            function: {
              name: "generate_video_prompt",
              description: "Generate a complete video prompt package",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  hashtags: { type: "string" },
                  seoDescription: { type: "string" },
                  coverPrompt: { type: "string" },
                  masterPrompt: { type: "string" },
                  scenes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "number" },
                        timeRange: { type: "string" },
                        camera: { type: "string" },
                        description: { type: "string" },
                      },
                      required: ["id", "timeRange", "camera", "description"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["title", "hashtags", "seoDescription", "coverPrompt", "masterPrompt", "scenes"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_video_prompt" } },
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
