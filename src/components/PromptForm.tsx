import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, Bot, Lightbulb, Wand2 } from "lucide-react";
import type { PromptData, PromptMode } from "@/lib/prompt";

const modeLabels: Record<PromptMode, string> = {
  basic: "Cơ bản",
  advanced: "Nâng cao",
  pro: "Chuyên nghiệp",
};

const basicDropdowns = [
  { label: "Ngôn ngữ đầu vào", key: "inputLanguage" as const, placeholder: "Chọn", options: ["Tiếng Việt", "English", "中文", "日本語", "한국어"] },
  { label: "Ngôn ngữ đầu ra", key: "outputLanguage" as const, placeholder: "Chọn", options: ["Tiếng Việt", "English", "中文", "日本語", "한국어"] },
  { label: "Phong cách", key: "style" as const, placeholder: "Chọn", options: ["Cinematic", "Anime", "Realistic", "Cyberpunk", "Fantasy", "Documentary", "Pixar Style", "3D Render", "Watercolor", "Oil Painting", "Sketch", "Vaporwave", "Retro", "Minimalist", "Photorealistic", "Hyper Realistic"] },
  { label: "Máy quay", key: "camera" as const, placeholder: "Chọn", options: ["Static Shot", "Slow Zoom", "Drone Shot", "Tracking Shot", "Handheld", "Cinematic Pan", "Dolly Zoom", "360° Rotation", "First Person", "Top Down", "Steadicam", "Crane Shot"] },
  { label: "Ánh sáng", key: "lighting" as const, placeholder: "Chọn", options: ["Soft Lighting", "Neon Lighting", "Sunset Lighting", "Studio Lighting", "Dramatic Lighting", "Natural Light", "Backlight", "Rim Light", "Volumetric Light", "Moonlight", "Golden Hour", "Blue Hour"] },
  { label: "Tâm trạng", key: "mood" as const, placeholder: "Chọn", options: ["Epic", "Dark", "Dreamy", "Emotional", "Futuristic", "Peaceful", "Mysterious", "Romantic", "Energetic", "Melancholic", "Cinematic", "Horror"] },
  { label: "Thời lượng", key: "duration" as const, placeholder: "Chọn", options: ["5 giây", "10 giây", "15 giây", "20 giây", "30 giây", "45 giây", "60 giây", "90 giây"] },
  {
    label: "Mô hình AI", key: "model" as const, placeholder: "Chọn",
    options: [
      "Runway", "Pika", "Sora", "Kling", "Luma Dream Machine", "Stable Video", "Vidu", "PixVerse",
      "Hailuo AI", "Jimeng (即梦)", "Tongyi Wanxiang (通义万相)", "Midjourney", "DALL-E 3", "Flux",
      "Wan (万)", "CogVideoX", "Genmo",
    ],
  },
];

const advancedDropdowns = [
  { label: "Góc máy", key: "cameraAngle" as const, placeholder: "Chọn góc", options: ["Eye Level", "Low Angle", "High Angle", "Bird's Eye", "Dutch Angle", "Worm's Eye", "Over the Shoulder"] },
  { label: "Ống kính", key: "cameraLens" as const, placeholder: "Chọn lens", options: ["14mm Ultra Wide", "24mm Wide", "35mm Standard", "50mm Normal", "85mm Portrait", "135mm Telephoto", "200mm Telephoto", "Anamorphic"] },
  { label: "Chuyển động máy", key: "cameraMotion" as const, placeholder: "Chọn", options: ["Tracking", "Handheld", "Slow Motion", "Speed Ramp", "Whip Pan", "Dolly In", "Dolly Out", "Orbit", "Push In", "Pull Out"] },
];

const proDropdowns = [
  { label: "Kiểu ánh sáng", key: "lightingType" as const, placeholder: "Chọn", options: ["Key + Fill + Rim", "Soft Diffused", "Hard Direct", "Neon RGB", "Volumetric Fog", "Practical Lights", "Chiaroscuro", "Rembrandt"] },
  { label: "Thời điểm", key: "timeOfDay" as const, placeholder: "Chọn", options: ["Golden Hour", "Blue Hour", "Midnight", "Dawn", "High Noon", "Overcast Day", "Sunset", "Twilight"] },
  { label: "Nhiệt độ màu", key: "colorTemperature" as const, placeholder: "Chọn", options: ["2700K Warm", "3200K Tungsten", "4100K Fluorescent", "5600K Daylight", "6500K Cool", "7500K Shade", "Mixed Warm/Cool"] },
  { label: "Độ chân thực", key: "realism" as const, placeholder: "Chọn", options: ["Photorealistic", "Hyper Realistic", "Ultra Detail 8K", "Cinematic Film Stock", "RAW Ungraded", "Film Grain 35mm"] },
];

interface PromptFormProps {
  data: PromptData;
  onChange: (data: PromptData) => void;
  onGenerate: () => void;
  onRandomIdea: () => void;
  onAISuggest?: () => void;
  isGenerating?: boolean;
  isSuggesting?: boolean;
  useAI?: boolean;
  disabled?: boolean;
}

const PromptForm = ({ data, onChange, onGenerate, onRandomIdea, onAISuggest, isGenerating, isSuggesting, useAI, disabled }: PromptFormProps) => {
  const updateField = (key: string, value: string) => {
    onChange({ ...data, [key]: value });
  };

  const mode = data.mode || "basic";
  const showAdvanced = mode === "advanced" || mode === "pro";
  const showPro = mode === "pro";

  const allDropdowns = [
    ...basicDropdowns,
    ...(showAdvanced ? advancedDropdowns : []),
    ...(showPro ? proDropdowns : []),
  ];

  return (
    <div className="glass-card rounded-2xl p-6 space-y-5">
      {/* Mode Selector */}
      <div className="flex gap-1 p-1 bg-muted/60 rounded-xl">
        {(["basic", "advanced", "pro"] as PromptMode[]).map((m) => (
          <button
            key={m}
            onClick={() => updateField("mode", m)}
            className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
              mode === m
                ? "bg-gradient-to-r from-primary to-[hsl(280,80%,55%)] text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-card"
            }`}
          >
            {modeLabels[m]}
            {m === "pro" && " ⚡"}
          </button>
        ))}
      </div>

      {/* Idea textarea */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <label className="text-sm font-semibold text-foreground">Ý tưởng Video</label>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" className="h-8 text-xs rounded-lg" onClick={onRandomIdea}>
              <Lightbulb className="w-3.5 h-3.5 mr-1" />
              Gợi ý ngẫu nhiên
            </Button>
            {onAISuggest && (
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs rounded-lg" onClick={onAISuggest} disabled={isSuggesting || !data.idea.trim()}>
                {isSuggesting ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Wand2 className="w-3.5 h-3.5 mr-1" />}
                AI gợi ý toàn bộ
              </Button>
            )}
          </div>
        </div>
        <Textarea
          placeholder="Mô tả ý tưởng video... VD: 'Cô gái bước đi dưới mưa neon ở Tokyo, áo khoác da phản chiếu ánh sáng'"
          value={data.idea}
          onChange={(e) => updateField("idea", e.target.value)}
          className="min-h-[100px] bg-background/50 border-border text-foreground placeholder:text-muted-foreground/40 rounded-xl resize-none focus:bg-background transition-colors"
        />
      </div>

      {/* Dropdowns grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {allDropdowns.map((d) => (
          <div key={d.key} className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">{d.label}</label>
            <Select value={(data as unknown as Record<string, string>)[d.key] || ""} onValueChange={(v) => updateField(d.key, v)}>
              <SelectTrigger className="bg-background/50 border-border text-foreground rounded-xl h-10 focus:bg-background transition-colors">
                <SelectValue placeholder={d.placeholder} />
              </SelectTrigger>
              <SelectContent className="bg-card border-border max-h-[300px]">
                {d.options.map((opt) => (
                  <SelectItem key={opt} value={opt} className="text-foreground focus:bg-accent focus:text-accent-foreground">
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      {/* Generate button */}
      <Button
        onClick={onGenerate}
        disabled={isGenerating || disabled}
        className="w-full h-12 rounded-xl text-sm font-bold bg-gradient-to-r from-primary to-[hsl(280,80%,55%)] hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
      >
        {isGenerating ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : useAI ? (
          <Bot className="w-4 h-4 mr-2" />
        ) : (
          <Sparkles className="w-4 h-4 mr-2" />
        )}
        {isGenerating ? "Đang tạo prompt cinematic..." : useAI ? "Tạo Prompt bằng AI" : "Tạo Prompt"}
      </Button>
    </div>
  );
};

export default PromptForm;
