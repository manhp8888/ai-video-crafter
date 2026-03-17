export interface PromptData {
  idea: string;
  style: string;
  camera: string;
  lighting: string;
  mood: string;
  model: string;
  duration: string;
  inputLanguage: string;
  outputLanguage: string;
}

function translateLabel(value: string, lang: string) {
  if (lang === "English") {
    return value;
  }

  const mapping: Record<string, string> = {
    Cinematic: "Điện ảnh",
    Anime: "Anime",
    Realistic: "Chân thực",
    Cyberpunk: "Cyberpunk",
    Fantasy: "Giả tưởng",
    Documentary: "Tài liệu",
    "Pixar Style": "Phong cách Pixar",
    "Slow Zoom": "Zoom chậm",
    "Drone Shot": "Cảnh drone",
    "Tracking Shot": "Cảnh bám theo",
    Handheld: "Cầm tay",
    "Cinematic Pan": "Quay lia điện ảnh",
    "Soft Lighting": "Ánh sáng mềm",
    "Neon Lighting": "Ánh sáng neon",
    "Sunset Lighting": "Ánh sáng hoàng hôn",
    "Studio Lighting": "Ánh sáng studio",
    "Dramatic Lighting": "Ánh sáng kịch tính",
    Epic: "Hùng tráng",
    Dark: "Tối bí ẩn",
    Dreamy: "Mơ màng",
    Emotional: "Cảm xúc",
    Futuristic: "Tương lai",
  };

  return mapping[value] || value;
}

export function generatePrompt(data: PromptData) {
  const style = data.style || "Cinematic";
  const camera = data.camera || "Slow Zoom";
  const lighting = data.lighting || "Soft Lighting";
  const mood = data.mood || "Epic";
  const model = data.model || "Runway";
  const duration = data.duration || "10 giây";
  const inputLanguage = data.inputLanguage || "Tiếng Việt";
  const outputLanguage = data.outputLanguage || "Tiếng Việt";
  const idea = data.idea.trim() || "một khung cảnh thiên nhiên ngoạn mục";

  const styleOut = translateLabel(style, outputLanguage);
  const cameraOut = translateLabel(camera, outputLanguage);
  const lightingOut = translateLabel(lighting, outputLanguage);
  const moodOut = translateLabel(mood, outputLanguage);

  const title =
    outputLanguage === "English"
      ? `${style} ${duration} AI Video: ${idea}`
      : `${styleOut} ${duration}: ${idea}`;

  const hashtags =
    outputLanguage === "English"
      ? "#AIVideo #VideoPrompt #ContentCreation #TikTokCreator #RunwayML"
      : "#AIVideo #PromptVideo #SangTaoNoiDung #TikTokCreator #Runway";

  const description =
    outputLanguage === "English"
      ? `Create a ${duration} ${style.toLowerCase()} video about ${idea}. Camera: ${camera.toLowerCase()}, lighting: ${lighting.toLowerCase()}, mood: ${mood.toLowerCase()}. Optimized for TikTok/Reels/Shorts with engaging pacing and a clear visual hook.`
      : `Tạo video ${duration} phong cách ${styleOut.toLowerCase()} về ${idea}. Máy quay: ${cameraOut.toLowerCase()}, ánh sáng: ${lightingOut.toLowerCase()}, cảm xúc: ${moodOut.toLowerCase()}. Tối ưu cho TikTok/Reels/Shorts với nhịp dựng cuốn hút và hook mạnh ngay 3 giây đầu.`;

  const coverPrompt =
    outputLanguage === "English"
      ? `High-contrast thumbnail, ${idea}, bold subject in center, ${lighting.toLowerCase()}, clean composition, cinematic color grading, readable title area, 4K.`
      : `Ảnh bìa tương phản cao, chủ thể chính là ${idea}, bố cục trung tâm, ${lightingOut.toLowerCase()}, màu điện ảnh, chừa vùng chữ rõ ràng, chất lượng 4K.`;

  const masterPrompt =
    outputLanguage === "English"
      ? `[${model} Prompt | Input: ${inputLanguage} | Output: ${outputLanguage}] ${duration} ${style.toLowerCase()} video about ${idea}. Shot with ${camera.toLowerCase()}, ${lighting.toLowerCase()}, mood ${mood.toLowerCase()}, high detail, 4K, cinematic grading, pro composition. --style ${style.toLowerCase().replace(/\s/g, "_")} --mood ${mood.toLowerCase()} --duration ${duration}`
      : `[${model} Prompt | Input: ${inputLanguage} | Output: ${outputLanguage}] Video ${duration} phong cách ${styleOut.toLowerCase()} về ${idea}. Quay bằng ${cameraOut.toLowerCase()}, ${lightingOut.toLowerCase()}, cảm xúc ${moodOut.toLowerCase()}, chi tiết cao, 4K, màu điện ảnh, bố cục chuyên nghiệp. --style ${style.toLowerCase().replace(/\s/g, "_")} --mood ${mood.toLowerCase()} --duration ${duration}`;

  const scenes =
    outputLanguage === "English"
      ? [
          "Scene 1 (0-3s): Hook shot, reveal main subject with strong motion and contrast.",
          "Scene 2 (3-7s): Mid-shot storytelling, emphasize product/character details.",
          "Scene 3 (7-end): Hero ending shot, logo/message reveal with cinematic transition.",
        ]
      : [
          "Cảnh 1 (0-3s): Cảnh hook, lộ chủ thể chính với chuyển động mạnh và tương phản cao.",
          "Cảnh 2 (3-7s): Cảnh trung, kể chuyện và nhấn chi tiết sản phẩm/nhân vật.",
          "Cảnh 3 (7s-cuối): Cảnh hero kết thúc, xuất hiện thông điệp/logo với transition điện ảnh.",
        ];

  return `## Tiêu đề\n${title}\n\n## Hashtag\n${hashtags}\n\n## Mô tả video chuẩn SEO\n${description}\n\n## Prompt tạo ảnh bìa\n${coverPrompt}\n\n## Prompt tổng\n${masterPrompt}\n\n## Prompt theo cảnh\n${scenes.join("\n")}`;
}

const IDEA_SUGGESTIONS = [
  "Một chiến binh samurai đứng giữa cơn mưa neon ở Tokyo tương lai",
  "Chuyến tàu hơi nước băng qua thung lũng phủ sương lúc bình minh",
  "Một chú mèo du hành vũ trụ đang điều khiển phi thuyền mini",
  "Quán cà phê nhỏ bên bờ biển trong cơn gió chiều vàng cam",
  "Khung cảnh thành phố cổ châu Âu vào mùa lễ hội ánh sáng",
  "Một creator review mỹ phẩm dưới ánh đèn studio kiểu TikTok",
];

export function getRandomIdea() {
  return IDEA_SUGGESTIONS[Math.floor(Math.random() * IDEA_SUGGESTIONS.length)];
}
