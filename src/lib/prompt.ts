export type PromptMode = "basic" | "advanced" | "pro";

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
  mode: PromptMode;
  // Advanced/Pro fields
  cameraAngle?: string;
  cameraLens?: string;
  cameraMotion?: string;
  lightingType?: string;
  timeOfDay?: string;
  colorTemperature?: string;
  realism?: string;
}

export interface GeneratedPrompt {
  title: string;
  description: string;
  hashtags: string[];
  thumbnail_prompt: string;
  master_prompt: string;
  camera_settings: {
    angle: string;
    lens: string;
    fps: string;
    motion: string;
  };
  lighting_settings: {
    type: string;
    time_of_day: string;
    color_temperature: string;
  };
  scenes: {
    scene: number;
    description: string;
    camera: string;
    lighting: string;
    motion: string;
  }[];
}

function translateLabel(value: string, lang: string) {
  if (lang === "English") return value;
  const mapping: Record<string, string> = {
    Cinematic: "Điện ảnh", Anime: "Anime", Realistic: "Chân thực",
    Cyberpunk: "Cyberpunk", Fantasy: "Giả tưởng", Documentary: "Tài liệu",
    "Pixar Style": "Phong cách Pixar", "Static Shot": "Cảnh tĩnh",
    "Slow Zoom": "Zoom chậm", "Drone Shot": "Cảnh drone",
    "Tracking Shot": "Cảnh bám theo", Handheld: "Cầm tay",
    "Cinematic Pan": "Quay lia điện ảnh", "Soft Lighting": "Ánh sáng mềm",
    "Neon Lighting": "Ánh sáng neon", "Sunset Lighting": "Ánh sáng hoàng hôn",
    "Studio Lighting": "Ánh sáng studio", "Dramatic Lighting": "Ánh sáng kịch tính",
    Epic: "Hùng tráng", Dark: "Tối bí ẩn", Dreamy: "Mơ màng",
    Emotional: "Cảm xúc", Futuristic: "Tương lai",
  };
  return mapping[value] || value;
}

export function parseDurationSeconds(duration: string) {
  const match = duration.match(/\d+/);
  return match ? Number(match[0]) : 10;
}

export function calculateSceneCount(duration: string) {
  return Math.ceil(parseDurationSeconds(duration) / 8);
}

function buildSceneRanges(durationSeconds: number, sceneCount: number) {
  const ranges: Array<{ start: number; end: number }> = [];
  for (let i = 0; i < sceneCount; i += 1) {
    const start = Math.floor((i * durationSeconds) / sceneCount);
    const end = i === sceneCount - 1 ? durationSeconds : Math.floor(((i + 1) * durationSeconds) / sceneCount);
    ranges.push({ start, end });
  }
  return ranges;
}

export function buildSceneLines(data: PromptData) {
  const camera = data.camera || "Slow Zoom";
  const style = data.style || "Cinematic";
  const mood = data.mood || "Epic";
  const duration = data.duration || "10 giây";
  const idea = data.idea.trim() || "một khung cảnh thiên nhiên ngoạn mục";
  const outputLanguage = data.outputLanguage || "Tiếng Việt";
  const sceneCount = calculateSceneCount(duration);
  const durationSeconds = parseDurationSeconds(duration);
  const ranges = buildSceneRanges(durationSeconds, sceneCount);
  const cameraOut = translateLabel(camera, outputLanguage);
  const styleOut = translateLabel(style, outputLanguage);
  const moodOut = translateLabel(mood, outputLanguage);

  return ranges.map((range, index) => {
    if (outputLanguage === "English") {
      return `Scene ${index + 1} (${range.start}-${range.end}s): Camera ${camera.toLowerCase()}, ${style.toLowerCase()} visual of ${idea}, keep ${mood.toLowerCase()} tone.`;
    }
    return `Cảnh ${index + 1} (${range.start}-${range.end}s): Máy quay ${cameraOut.toLowerCase()}, khung hình ${styleOut.toLowerCase()} về ${idea}, giữ cảm xúc ${moodOut.toLowerCase()}.`;
  });
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
  const durationSeconds = parseDurationSeconds(duration);
  const sceneCount = calculateSceneCount(duration);
  const styleOut = translateLabel(style, outputLanguage);
  const cameraOut = translateLabel(camera, outputLanguage);
  const lightingOut = translateLabel(lighting, outputLanguage);
  const moodOut = translateLabel(mood, outputLanguage);

  const title = outputLanguage === "English"
    ? `${style} ${durationSeconds}s AI Video: ${idea}`
    : `${styleOut} ${duration}: ${idea}`;
  const hashtags = "#AIVideo #PromptVideo #SangTaoNoiDung #TikTokCreator #Runway";
  const description = `Tạo video ${duration} phong cách ${styleOut.toLowerCase()} về ${idea}. Máy quay: ${cameraOut.toLowerCase()}, ánh sáng: ${lightingOut.toLowerCase()}, cảm xúc: ${moodOut.toLowerCase()}.`;
  const coverPrompt = `Ảnh bìa tương phản cao, chủ thể chính là ${idea}, bố cục trung tâm, ${lightingOut.toLowerCase()}, màu điện ảnh, chất lượng 4K.`;
  const masterPrompt = `[${model} Prompt] Video ${duration} phong cách ${styleOut.toLowerCase()} về ${idea}. Quay bằng ${cameraOut.toLowerCase()}, ${lightingOut.toLowerCase()}, cảm xúc ${moodOut.toLowerCase()}, chi tiết cao, 4K.`;
  const scenes = buildSceneLines(data);

  return `## Tiêu đề\n${title}\n\n## Hashtag\n${hashtags}\n\n## Mô tả video chuẩn SEO\n${description}\n\n## Prompt tạo ảnh bìa\n${coverPrompt}\n\n## Prompt tổng\n${masterPrompt}\n\n## Prompt theo cảnh\n${scenes.join("\n")}`;
}

const IDEA_SUGGESTIONS = [
  "Một chiến binh samurai đứng giữa cơn mưa neon ở Tokyo tương lai",
  "Chuyến tàu hơi nước băng qua thung lũng phủ sương lúc bình minh",
  "Một chú mèo du hành vũ trụ đang điều khiển phi thuyền mini",
  "Quán cà phê nhỏ bên bờ biển trong cơn gió chiều vàng cam",
  "Khung cảnh thành phố cổ châu Âu vào mùa lễ hội ánh sáng",
  "Một creator review mỹ phẩm dưới ánh đèn studio kiểu TikTok",
  "Cô gái bước đi trên con phố Hà Nội buổi sáng sớm, ánh nắng xuyên qua hàng cây",
  "Drone bay lướt trên ruộng bậc thang Sapa phủ sương mù",
];

export function getRandomIdea() {
  return IDEA_SUGGESTIONS[Math.floor(Math.random() * IDEA_SUGGESTIONS.length)];
}
