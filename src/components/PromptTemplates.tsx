import { Film, Flame, ShoppingBag, Clapperboard, Wand2, Building2, Baby, User, Eye, Video } from "lucide-react";
import type { PromptData } from "@/lib/prompt";

const templates: { name: string; icon: React.ReactNode; data: PromptData }[] = [
  {
    name: "TikTok Girl",
    icon: <User className="w-4 h-4" />,
    data: { idea: "Cô gái Gen Z quay vlog thời trang trên phố đi bộ, chuyển trang phục mượt mà qua từng cut", style: "Realistic", camera: "Handheld", lighting: "Natural Light", mood: "Energetic", model: "Kling", duration: "15 giây", inputLanguage: "Tiếng Việt", outputLanguage: "Tiếng Việt", mode: "basic" },
  },
  {
    name: "Quảng cáo sản phẩm",
    icon: <ShoppingBag className="w-4 h-4" />,
    data: { idea: "Lọ nước hoa xoay chậm 360° trên nền marble đen, tia sáng chiếu tạo caustic lấp lánh", style: "Cinematic", camera: "Slow Zoom", lighting: "Studio Lighting", mood: "Romantic", model: "Runway", duration: "10 giây", inputLanguage: "Tiếng Việt", outputLanguage: "English", mode: "advanced" },
  },
  {
    name: "Cinematic Story",
    icon: <Film className="w-4 h-4" />,
    data: { idea: "Thám tử cô đơn bước qua con hẻm tối đầy mưa, ánh neon phản chiếu trên mặt đường ướt", style: "Cinematic", camera: "Tracking Shot", lighting: "Neon Lighting", mood: "Dark", model: "Sora", duration: "30 giây", inputLanguage: "Tiếng Việt", outputLanguage: "Tiếng Việt", mode: "pro", cameraAngle: "Low Angle", cameraLens: "35mm Standard", cameraMotion: "Tracking", lightingType: "Chiaroscuro", timeOfDay: "Midnight", colorTemperature: "3200K Tungsten", realism: "Cinematic Film Stock" },
  },
  {
    name: "POV Video",
    icon: <Eye className="w-4 h-4" />,
    data: { idea: "POV bạn đang lái xe qua đường ven biển California lúc golden hour, gió thổi tóc bay", style: "Realistic", camera: "First Person", lighting: "Sunset Lighting", mood: "Peaceful", model: "Runway", duration: "20 giây", inputLanguage: "Tiếng Việt", outputLanguage: "English", mode: "advanced", cameraAngle: "Eye Level", cameraLens: "24mm Wide", cameraMotion: "Handheld" },
  },
  {
    name: "Video TikTok viral",
    icon: <Flame className="w-4 h-4" />,
    data: { idea: "Hiệu ứng chuyển cảnh ngoạn mục từ phòng ngủ ra bãi biển nhiệt đới", style: "Realistic", camera: "Handheld", lighting: "Golden Hour", mood: "Dreamy", model: "Pika", duration: "15 giây", inputLanguage: "Tiếng Việt", outputLanguage: "Tiếng Việt", mode: "basic" },
  },
  {
    name: "B-roll YouTube",
    icon: <Clapperboard className="w-4 h-4" />,
    data: { idea: "Cảnh quay toàn cảnh thành phố Tokyo lúc hoàng hôn với xe cộ tạo light trails", style: "Cinematic", camera: "Drone Shot", lighting: "Golden Hour", mood: "Epic", model: "Sora", duration: "20 giây", inputLanguage: "Tiếng Việt", outputLanguage: "Tiếng Việt", mode: "advanced", cameraAngle: "Bird's Eye", cameraLens: "24mm Wide", cameraMotion: "Orbit" },
  },
  {
    name: "Fantasy Epic",
    icon: <Wand2 className="w-4 h-4" />,
    data: { idea: "Phù thủy triệu hồi rồng khổng lồ giữa khu rừng cổ đại phát sáng xanh", style: "Fantasy", camera: "Cinematic Pan", lighting: "Volumetric Light", mood: "Epic", model: "Kling", duration: "45 giây", inputLanguage: "Tiếng Việt", outputLanguage: "Tiếng Việt", mode: "pro", cameraAngle: "Low Angle", cameraLens: "14mm Ultra Wide", cameraMotion: "Dolly Out", lightingType: "Volumetric Fog", timeOfDay: "Twilight", colorTemperature: "6500K Cool", realism: "Hyper Realistic" },
  },
  {
    name: "Cyberpunk City",
    icon: <Building2 className="w-4 h-4" />,
    data: { idea: "Xe bay lướt qua tòa nhà chọc trời với biển quảng cáo hologram, mưa acid", style: "Cyberpunk", camera: "Drone Shot", lighting: "Neon Lighting", mood: "Futuristic", model: "Runway", duration: "15 giây", inputLanguage: "Tiếng Việt", outputLanguage: "English", mode: "advanced", cameraAngle: "Dutch Angle", cameraLens: "14mm Ultra Wide", cameraMotion: "Speed Ramp" },
  },
];

interface Props {
  onSelect: (data: PromptData) => void;
}

const PromptTemplates = ({ onSelect }: Props) => (
  <div className="space-y-3">
    <label className="text-sm font-medium text-muted-foreground">Mẫu có sẵn</label>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {templates.map((t) => (
        <button
          key={t.name}
          onClick={() => onSelect(t.data)}
          className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2.5 text-xs font-medium text-foreground hover:border-primary/50 hover:bg-accent transition-colors duration-150 text-left"
        >
          <span className="text-primary shrink-0">{t.icon}</span>
          {t.name}
        </button>
      ))}
    </div>
  </div>
);

export default PromptTemplates;
