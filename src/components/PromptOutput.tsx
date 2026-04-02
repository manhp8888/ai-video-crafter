import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, ChevronDown, ChevronUp, Zap, Shuffle, Download } from "lucide-react";
import type { GeneratedPrompt } from "@/lib/prompt";

interface Props {
  prompt: string;
  structured?: GeneratedPrompt | null;
  onEnhance?: () => void;
  onRemix?: () => void;
  isEnhancing?: boolean;
  isPremium?: boolean;
}

function CopyBtn({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button onClick={handleCopy} variant="ghost" size="sm" className="h-7 text-xs shrink-0 rounded-lg">
      {copied ? <Check className="w-3 h-3 mr-1 text-success" /> : <Copy className="w-3 h-3 mr-1" />}
      {copied ? "Đã chép" : label || "Sao chép"}
    </Button>
  );
}

function OutputBlock({ icon, label, content, children }: { icon: string; label: string; content?: string; children?: React.ReactNode }) {
  if (!content && !children) return null;
  return (
    <div className="bg-background/50 border border-border/50 rounded-xl p-3.5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
          <span>{icon}</span> {label}
        </span>
        {content && <CopyBtn text={content} />}
      </div>
      {content && <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{content}</p>}
      {children}
    </div>
  );
}

const PromptOutput = ({ prompt, structured, onEnhance, onRemix, isEnhancing, isPremium }: Props) => {
  const [expandedScenes, setExpandedScenes] = useState(true);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleExportJSON = () => {
    if (!structured) return;
    const blob = new Blob([JSON.stringify(structured, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prompt-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (structured) {
    const hashtagsStr = Array.isArray(structured.hashtags) ? structured.hashtags.join(" ") : (structured.hashtags || "");
    const cameraInfo = structured.camera_settings
      ? `${structured.camera_settings.lens} · ${structured.camera_settings.angle} · ${structured.camera_settings.motion} · ${structured.camera_settings.fps}`
      : "";
    const lightingInfo = structured.lighting_settings
      ? `${structured.lighting_settings.type} · ${structured.lighting_settings.time_of_day} · ${structured.lighting_settings.color_temperature}`
      : "";

    return (
      <div className="glass-card rounded-2xl p-5 space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
        {/* Header with actions */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-sm font-bold text-foreground flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-[hsl(280,80%,55%)] flex items-center justify-center text-xs text-primary-foreground">🎬</span>
            Kết quả Prompt Cinematic
          </span>
          <div className="flex gap-1.5">
            {onEnhance && (
              <Button onClick={onEnhance} variant="outline" size="sm" className="h-8 text-xs rounded-lg" disabled={isEnhancing}>
                <Zap className="w-3.5 h-3.5 mr-1" />
                Nâng cấp
              </Button>
            )}
            {onRemix && (
              <Button onClick={onRemix} variant="outline" size="sm" className="h-8 text-xs rounded-lg" disabled={isEnhancing}>
                <Shuffle className="w-3.5 h-3.5 mr-1" />
                Remix
              </Button>
            )}
            {isPremium && (
              <Button onClick={handleExportJSON} variant="outline" size="sm" className="h-8 text-xs rounded-lg">
                <Download className="w-3.5 h-3.5 mr-1" />
                JSON
              </Button>
            )}
            <Button onClick={handleCopyAll} variant={copiedAll ? "default" : "secondary"} size="sm" className="h-8 text-xs rounded-lg">
              {copiedAll ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
              {copiedAll ? "Đã chép!" : "Chép tất cả"}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <OutputBlock icon="🎬" label="Tiêu đề" content={structured.title} />
          {structured.visual_prompt && <OutputBlock icon="👁️" label="Visual Prompt" content={structured.visual_prompt} />}
          {structured.motion_prompt && <OutputBlock icon="🎬" label="Motion Prompt" content={structured.motion_prompt} />}
          {structured.cinematic_style && <OutputBlock icon="🎨" label="Cinematic Style" content={structured.cinematic_style} />}
          {structured.negative_prompt && <OutputBlock icon="🚫" label="Negative Prompt" content={structured.negative_prompt} />}
          <OutputBlock icon="🎯" label="Master Prompt" content={structured.master_prompt} />

          {(cameraInfo || lightingInfo) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {cameraInfo && (
                <div className="bg-background/50 border border-border/50 rounded-xl p-3.5">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-1.5">📷 Camera</span>
                  <p className="text-xs text-foreground leading-relaxed">{cameraInfo}</p>
                </div>
              )}
              {lightingInfo && (
                <div className="bg-background/50 border border-border/50 rounded-xl p-3.5">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-1.5">💡 Ánh sáng</span>
                  <p className="text-xs text-foreground leading-relaxed">{lightingInfo}</p>
                </div>
              )}
            </div>
          )}

          {structured.scenes && structured.scenes.length > 0 && (
            <div className="bg-background/50 border border-border/50 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <button onClick={() => setExpandedScenes(!expandedScenes)} className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    🎞️ Cảnh quay ({structured.scenes.length} cảnh)
                  </span>
                  {expandedScenes ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                </button>
                <CopyBtn
                  text={structured.scenes.map((s) => 
                    `${s.description}\n📷 ${s.camera} | 💡 ${s.lighting} | 🎬 ${s.motion}`
                  ).join("\n\n")}
                  label="Chép tất cả cảnh"
                />
              </div>
              {expandedScenes && (
                <div className="space-y-2.5 mt-2">
                  {structured.scenes.map((scene) => (
                    <div key={scene.scene} className="glass-card rounded-xl p-3.5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-primary">{scene.scene}</span>
                        <CopyBtn text={`${scene.description}\n📷 ${scene.camera} | 💡 ${scene.lighting} | 🎬 ${scene.motion}`} />
                      </div>
                      <p className="text-xs text-foreground/90 leading-relaxed mb-2.5">{scene.description}</p>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">📷 {scene.camera}</span>
                        <span className="inline-flex items-center text-[10px] bg-accent text-accent-foreground px-2 py-0.5 rounded-full font-semibold">💡 {scene.lighting}</span>
                        <span className="inline-flex items-center text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full font-semibold">🎬 {scene.motion}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <OutputBlock icon="🖼️" label="Prompt ảnh bìa" content={structured.thumbnail_prompt} />
          <OutputBlock icon="📝" label="Mô tả SEO" content={structured.description} />
          <OutputBlock icon="#️⃣" label="Hashtag" content={hashtagsStr} />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-5 space-y-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-sm font-bold text-foreground">Prompt đã tạo</span>
        <div className="flex gap-1.5">
          {onEnhance && (
            <Button onClick={onEnhance} variant="outline" size="sm" className="h-8 text-xs rounded-lg" disabled={isEnhancing}>
              <Zap className="w-3.5 h-3.5 mr-1" />
              Nâng cấp
            </Button>
          )}
          {onRemix && (
            <Button onClick={onRemix} variant="outline" size="sm" className="h-8 text-xs rounded-lg" disabled={isEnhancing}>
              <Shuffle className="w-3.5 h-3.5 mr-1" />
              Remix
            </Button>
          )}
        </div>
      </div>
      <div className="bg-background/50 border border-border/50 rounded-xl p-4">
        <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">{prompt}</p>
      </div>
      <Button onClick={handleCopyAll} variant={copiedAll ? "default" : "secondary"} className="w-full h-10 rounded-xl text-sm font-semibold">
        {copiedAll ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
        {copiedAll ? "Đã sao chép!" : "Sao chép Prompt"}
      </Button>
    </div>
  );
};

export default PromptOutput;
