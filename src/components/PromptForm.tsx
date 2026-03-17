import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, Bot } from "lucide-react";
import type { PromptData } from "@/pages/Index";
import { Sparkles, Loader2, Bot, Lightbulb } from "lucide-react";
import type { PromptData } from "@/lib/prompt";

const dropdowns = [
  { label: "Ngôn ngữ đầu vào", key: "inputLanguage" as const, placeholder: "Chọn ngôn ngữ", options: ["Tiếng Việt", "English"] },
  { label: "Ngôn ngữ đầu ra", key: "outputLanguage" as const, placeholder: "Chọn ngôn ngữ", options: ["Tiếng Việt", "English"] },
  { label: "Phong cách", key: "style" as const, placeholder: "Chọn phong cách", options: ["Cinematic", "Anime", "Realistic", "Cyberpunk", "Fantasy", "Documentary", "Pixar Style"] },
  { label: "Chuyển động máy quay", key: "camera" as const, placeholder: "Chọn chuyển động", options: ["Static Shot", "Slow Zoom", "Drone Shot", "Tracking Shot", "Handheld", "Cinematic Pan"] },
  { label: "Ánh sáng", key: "lighting" as const, placeholder: "Chọn ánh sáng", options: ["Soft Lighting", "Neon Lighting", "Sunset Lighting", "Studio Lighting", "Dramatic Lighting"] },
  { label: "Tâm trạng", key: "mood" as const, placeholder: "Chọn tâm trạng", options: ["Epic", "Dark", "Dreamy", "Emotional", "Futuristic"] },
  { label: "Thời lượng video", key: "duration" as const, placeholder: "Chọn thời lượng", options: ["5 giây", "10 giây", "15 giây", "20 giây", "30 giây"] },
  { label: "Thời lượng video", key: "duration" as const, placeholder: "Chọn thời lượng", options: ["5 giây", "10 giây", "15 giây", "20 giây", "30 giây", "45 giây", "60 giây", "90 giây"] },
  { label: "Mô hình Video", key: "model" as const, placeholder: "Chọn mô hình", options: ["Runway", "Pika", "Sora", "Kling"] },
];

interface PromptFormProps {
  data: PromptData;
  onChange: (data: PromptData) => void;
  onGenerate: () => void;
  onRandomIdea: () => void;
  isGenerating?: boolean;
  useAI?: boolean;
}

const PromptForm = ({ data, onChange, onGenerate, isGenerating, useAI }: PromptFormProps) => {
const PromptForm = ({ data, onChange, onGenerate, onRandomIdea, isGenerating, useAI }: PromptFormProps) => {
  const updateField = (key: keyof PromptData, value: string) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Ý tưởng Video</label>
        <div className="flex items-center justify-between gap-2">
          <label className="text-sm font-medium text-muted-foreground">Ý tưởng Video</label>
          <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={onRandomIdea}>
            <Lightbulb className="w-3.5 h-3.5 mr-1" />
            Gợi ý ý tưởng
          </Button>
        </div>
        <Textarea
          placeholder="Mô tả ý tưởng video của bạn... VD: 'Một phi hành gia đi bộ qua khu chợ ngoài hành tinh đầy ánh neon'"
          placeholder="Mô tả ý tưởng video của bạn... VD: 'Một creator review sản phẩm skincare dưới ánh đèn studio'"
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
