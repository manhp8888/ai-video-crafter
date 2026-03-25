import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODEL_PROMPT_GUIDES: Record<string, string> = {
  "Runway": `Tối ưu cho Runway Gen-3/Gen-4:
- Mô tả chuyển động camera rõ ràng (ví dụ: "camera slowly pushes in", "steady tracking shot")
- Dùng ngôn ngữ tự nhiên, mô tả từng chi tiết hình ảnh theo thứ tự: chủ thể → hành động → bối cảnh → ánh sáng → mood
- Thêm "cinematic quality, 4K, shallow depth of field" cho chất lượng cao
- Mỗi prompt nên tập trung vào MỘT hành động/chuyển động chính`,

  "Pika": `Tối ưu cho Pika:
- Giữ prompt ngắn gọn, tập trung vào hành động chính
- Bắt đầu bằng mô tả chủ thể, sau đó mô tả chuyển động
- Dùng keywords: "smooth motion", "high quality", "detailed"
- Tránh prompt quá dài, Pika hoạt động tốt nhất với 1-2 câu mô tả`,

  "Sora": `Tối ưu cho Sora:
- Viết prompt như kịch bản phim: mô tả cảnh, nhân vật, hành động chi tiết
- Sora hiểu ngữ cảnh phức tạp - có thể mô tả nhiều đối tượng tương tác
- Thêm chi tiết về vật liệu, texture, ánh sáng tự nhiên
- Dùng ngôn ngữ điện ảnh: "wide establishing shot", "close-up", "over-the-shoulder"`,

  "Kling": `Tối ưu cho Kling AI:
- Mô tả chi tiết nhân vật: ngoại hình, trang phục, biểu cảm
- Kling mạnh về chuyển động người - tận dụng mô tả cử chỉ, hành động cơ thể
- Thêm "realistic skin texture, natural hair movement, fabric physics"
- Dùng prompt song ngữ (Anh-Trung) để tối ưu kết quả`,

  "Luma Dream Machine": `Tối ưu cho Luma Dream Machine:
- Tập trung vào mô tả 3D và chiều sâu không gian
- Dùng "photorealistic, volumetric lighting, ray tracing quality"
- Mô tả camera movement rõ: "orbit around", "fly through", "dolly in"
- Luma mạnh về cảnh thiên nhiên và kiến trúc - tận dụng chi tiết môi trường`,

  "Hailuo AI": `Tối ưu cho Hailuo AI (MiniMax):
- Hỗ trợ prompt tiếng Trung tốt nhất, nên thêm bản dịch Trung
- Mô tả chuyển động mượt mà, tự nhiên
- Dùng "电影质感, 高清画质, 自然光线" cho chất lượng cao
- Tập trung vào narrative flow giữa các cảnh`,

  "Midjourney": `Tối ưu cho Midjourney (ảnh tĩnh/concept):
- Dùng tham số: --ar 16:9 --v 6.1 --style raw --q 2
- Cấu trúc: [chủ thể], [hành động], [bối cảnh], [phong cách], [kỹ thuật]
- Thêm từ khóa chất lượng: "8K UHD, hyper-detailed, masterpiece"
- Dùng "cinematic still frame" để tạo ảnh tĩnh giống frame phim`,

  "DALL-E 3": `Tối ưu cho DALL-E 3:
- Viết prompt dạng paragraph mô tả tự nhiên, chi tiết
- DALL-E 3 hiểu ngữ cảnh tốt - mô tả cảm xúc, câu chuyện
- Thêm chi tiết về composition: "rule of thirds", "golden ratio"
- Dùng "photorealistic photograph" hoặc "digital art illustration" để định hướng style`,
};

function getModelGuide(model: string): string {
  return MODEL_PROMPT_GUIDES[model] || MODEL_PROMPT_GUIDES["Runway"];
}

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
    const modelName = model || "Runway";
    const modelGuide = getModelGuide(modelName);

    const systemPrompt = `Bạn là chuyên gia hàng đầu về AI video production, cinematography, và prompt engineering.
Bạn có kiến thức sâu về cách các công cụ AI video hoạt động và cách viết prompt để tạo ra video chân thật, chất lượng cao nhất.

NGUYÊN TẮC VÀNG khi viết prompt video AI:
1. **Cụ thể hóa mọi chi tiết**: Không dùng từ chung chung. Thay "đẹp" bằng mô tả cụ thể (ánh sáng golden hour chiếu xiên 45°, tạo bóng mềm trên khuôn mặt)
2. **Mô tả vật lý thực tế**: Bao gồm texture bề mặt, phản xạ ánh sáng, chuyển động vật lý tự nhiên (tóc bay theo gió, vải rủ theo trọng lực, nước bắn tung tóe)
3. **Kỹ thuật cinematography chuyên nghiệp**: Dùng thuật ngữ điện ảnh chính xác (focal length, depth of field, color grading LUT, aspect ratio)
4. **Liên kết cảnh mượt mà**: Mỗi cảnh phải có transition logic, không nhảy đột ngột
5. **Emotion-driven**: Mỗi cảnh phải truyền tải cảm xúc cụ thể qua ánh sáng, góc máy, và nhịp độ

${modelGuide}

TECHNICAL SPECS cho prompt chất lượng:
- Luôn chỉ định: resolution (4K/8K), frame rate (24fps cinematic / 60fps smooth), color space
- Mô tả depth of field: shallow (f/1.4-2.8) cho portrait, deep (f/8-16) cho landscape
- Chỉ định lens type: wide (14-24mm), standard (35-50mm), telephoto (85-200mm)
- Ánh sáng: key light direction, fill ratio, color temperature (3200K warm / 5600K daylight / 6500K cool)

Trả về JSON với format sau (KHÔNG markdown, KHÔNG giải thích thêm):
{
  "title": "tiêu đề video hấp dẫn, cuốn hút click",
  "hashtags": "8-12 hashtag trending phù hợp nền tảng TikTok/Reels/YouTube Shorts",
  "seoDescription": "mô tả video chuẩn SEO 3-4 câu, chứa từ khóa chính, kêu gọi xem",
  "coverPrompt": "prompt chi tiết tạo thumbnail/ảnh bìa 4K với composition rule of thirds, high contrast, readable text area",
  "masterPrompt": "prompt tổng hợp đầy đủ thông số kỹ thuật: style, camera, lighting setup, color grading, mood, atmosphere, physics, texture. Prompt phải đủ chi tiết để paste trực tiếp vào tool AI và tạo ra video chất lượng cao",
  "scenes": [
    {
      "id": 1,
      "timeRange": "0-5s",
      "camera": "mô tả chi tiết: lens, movement, speed, angle",
      "description": "mô tả cảnh cực kỳ chi tiết: chủ thể, hành động, bối cảnh, ánh sáng, texture, atmosphere, particle effects, sound design suggestion"
    }
  ]
}

Lưu ý:
- Tạo đúng ${sceneCount} cảnh cho video ${durationSeconds} giây
- Tổng thời lượng các cảnh phải bằng ${durationSeconds} giây
- Viết bằng ${outLang}
- masterPrompt phải có thể copy paste trực tiếp vào ${modelName} và tạo video ngay
- Mỗi scene description phải >= 2 câu, mô tả đủ chi tiết để AI hiểu chính xác cần render gì
- Camera movement phải ghi rõ lens focal length, tốc độ di chuyển, hướng
- Kết hợp tags kỹ thuật: --style, --mood, --duration, --quality, --fps trong masterPrompt`;

    const userPrompt = `Tạo bộ prompt video AI CHẤT LƯỢNG CAO với thông tin sau:
- Ý tưởng: ${idea || "một khung cảnh thiên nhiên ngoạn mục"}
- Phong cách: ${style || "Cinematic"}
- Máy quay: ${camera || "Slow Zoom"}
- Ánh sáng: ${lighting || "Soft Lighting"}
- Tâm trạng/Mood: ${mood || "Epic"}
- Thời lượng: ${durationValue}
- Mô hình AI: ${modelName}
- Ngôn ngữ đầu vào: ${inputLanguage || "Tiếng Việt"}
- Ngôn ngữ đầu ra: ${outLang}

YÊU CẦU ĐẶC BIỆT:
1. masterPrompt phải viết theo đúng format mà ${modelName} hiểu tốt nhất
2. Mỗi scene phải có chi tiết về: ánh sáng cụ thể, texture bề mặt, chuyển động vật lý, atmosphere
3. Cover prompt phải tạo ra thumbnail thu hút click, high contrast, có focal point rõ ràng
4. SEO description phải chứa từ khóa trending và kêu gọi hành động`;

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
              description: "Generate a complete, high-quality video prompt package optimized for AI video tools",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Catchy, click-worthy video title" },
                  hashtags: { type: "string", description: "8-12 trending hashtags" },
                  seoDescription: { type: "string", description: "SEO-optimized video description 3-4 sentences" },
                  coverPrompt: { type: "string", description: "Detailed 4K thumbnail/cover prompt with composition details" },
                  masterPrompt: { type: "string", description: "Complete master prompt with all technical specs, ready to paste into AI tool" },
                  scenes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "number" },
                        timeRange: { type: "string" },
                        camera: { type: "string", description: "Detailed camera info: lens, movement, speed, angle" },
                        description: { type: "string", description: "Extremely detailed scene description: subject, action, environment, lighting, texture, atmosphere" },
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
