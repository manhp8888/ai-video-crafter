import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles } from "lucide-react";
import type { PromptData } from "@/pages/Index";

const dropdowns = [
  { label: "Phong cách", key: "style" as const, placeholder: "Chọn phong cách", options: ["Cinematic", "Anime", "Realistic", "Cyberpunk", "Fantasy", "Documentary", "Pixar Style"] },
  { label: "Chuyển động máy quay", key: "camera" as const, placeholder: "Chọn chuyển động", options: ["Static Shot", "Slow Zoom", "Drone Shot", "Tracking Shot", "Handheld", "Cinematic Pan"] },
  { label: "Ánh sáng", key: "lighting" as const, placeholder: "Chọn ánh sáng", options: ["Soft Lighting", "Neon Lighting", "Sunset Lighting", "Studio Lighting", "Dramatic Lighting"] },
  { label: "Tâm trạng", key: "mood" as const, placeholder: "Chọn tâm trạng", options: ["Epic", "Dark", "Dreamy", "Emotional", "Futuristic"] },
  { label: "Mô hình Video", key: "model" as const, placeholder: "Chọn mô hình", options: ["Runway", "Pika", "Sora", "Kling"] },
];

interface PromptFormProps {
  data: PromptData;
  onChange: (data: PromptData) => void;
  onGenerate: () => void;
}

const PromptForm = ({ data, onChange, onGenerate }: PromptFormProps) => {
  const updateField = (key: keyof PromptData, value: string) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Ý tưởng Video</label>
        <Textarea
          placeholder="Mô tả ý tưởng video của bạn... VD: 'Một phi hành gia đi bộ qua khu chợ ngoài hành tinh đầy ánh neon'"
          value={data.idea}
          onChange={(e) => updateField("idea", e.target.value)}
          className="min-h-[100px] bg-background border-border text-foreground placeholder:text-muted-foreground/50 rounded-xl resize-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {dropdowns.map((d) => (
          <div key={d.key} className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{d.label}</label>
            <Select value={data[d.key]} onValueChange={(v) => updateField(d.key, v)}>
              <SelectTrigger className="bg-background border-border text-foreground rounded-xl h-10">
                <SelectValue placeholder={d.placeholder} />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
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

      <Button onClick={onGenerate} className="w-full h-11 rounded-xl text-sm font-semibold">
        <Sparkles className="w-4 h-4 mr-2" />
        Tạo Prompt
      </Button>
    </div>
  );
};

export default PromptForm;
