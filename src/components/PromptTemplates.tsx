import { Clapperboard, Flame, Film, Wand2, Building2, Baby, ShoppingBag } from "lucide-react";
import type { PromptData } from "@/lib/prompt";

const templates: { name: string; icon: React.ReactNode; data: PromptData }[] = [
  {
    name: "Cảnh phim điện ảnh",
    icon: <Film className="w-4 h-4" />,
    data: { idea: "Một thám tử đi bộ qua con hẻm tối đầy mưa với ánh đèn neon phản chiếu", style: "Cinematic", camera: "Tracking Shot", lighting: "Neon Lighting", mood: "Dark", model: "Runway", duration: "10 giây", inputLanguage: "Tiếng Việt", outputLanguage: "Tiếng Việt" },
  },
  {
    name: "Video TikTok viral",
    icon: <Flame className="w-4 h-4" />,
    data: { idea: "Hiệu ứng chuyển cảnh ngoạn mục từ phòng ngủ ra bãi biển nhiệt đới", style: "Realistic", camera: "Handheld", lighting: "Sunset Lighting", mood: "Dreamy", model: "Pika", duration: "15 giây", inputLanguage: "Tiếng Việt", outputLanguage: "Tiếng Việt" },
  },
  {
    name: "Review sản phẩm TikTok",
    icon: <ShoppingBag className="w-4 h-4" />,
    data: { idea: "Review serum vitamin C: texture, before/after và call-to-action mua hàng", style: "Realistic", camera: "Handheld", lighting: "Studio Lighting", mood: "Emotional", model: "Sora", duration: "30 giây", inputLanguage: "Tiếng Việt", outputLanguage: "Tiếng Việt" },
  },
  {
    name: "B-roll YouTube",
    icon: <Clapperboard className="w-4 h-4" />,
    data: { idea: "Cảnh quay toàn cảnh thành phố lúc hoàng hôn với xe cộ di chuyển", style: "Cinematic", camera: "Drone Shot", lighting: "Sunset Lighting", mood: "Epic", model: "Sora", duration: "20 giây", inputLanguage: "Tiếng Việt", outputLanguage: "Tiếng Việt" },
  },
  {
    name: "Cảnh Fantasy",
    icon: <Wand2 className="w-4 h-4" />,
    data: { idea: "Một phù thủy triệu hồi rồng giữa khu rừng cổ đại phát sáng", style: "Fantasy", camera: "Cinematic Pan", lighting: "Dramatic Lighting", mood: "Epic", model: "Kling", duration: "45 giây", inputLanguage: "Tiếng Việt", outputLanguage: "Tiếng Việt" },
  },
  {
    name: "Thành phố Cyberpunk",
    icon: <Building2 className="w-4 h-4" />,
    data: { idea: "Xe bay lướt qua các tòa nhà chọc trời với biển quảng cáo hologram", style: "Cyberpunk", camera: "Drone Shot", lighting: "Neon Lighting", mood: "Futuristic", model: "Runway", duration: "15 giây", inputLanguage: "Tiếng Việt", outputLanguage: "Tiếng Việt" },
  },
  {
    name: "Hoạt hình Pixar",
    icon: <Baby className="w-4 h-4" />,
    data: { idea: "Chú robot nhỏ dễ thương khám phá khu vườn hoa đầy màu sắc", style: "Pixar Style", camera: "Slow Zoom", lighting: "Soft Lighting", mood: "Emotional", model: "Sora", duration: "60 giây", inputLanguage: "Tiếng Việt", outputLanguage: "Tiếng Việt" },
  },
];

interface Props {
  onSelect: (data: PromptData) => void;
}

const PromptTemplates = ({ onSelect }: Props) => (
  <div className="space-y-3">
    <label className="text-sm font-medium text-muted-foreground">Mẫu có sẵn</label>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
