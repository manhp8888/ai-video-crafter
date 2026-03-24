import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import type { GeneratedPrompt } from "@/hooks/use-prompt-generator";

interface Props {
  prompt: string;
  structured?: GeneratedPrompt | null;
}

const sections = [
  { key: "title", label: "Tiêu đề", icon: "🎬" },
  { key: "hashtags", label: "Hashtag", icon: "#️⃣" },
  { key: "seoDescription", label: "Mô tả SEO", icon: "📝" },
  { key: "coverPrompt", label: "Prompt ảnh bìa", icon: "🖼️" },
  { key: "masterPrompt", label: "Prompt tổng", icon: "🎯" },
] as const;

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button
      onClick={handleCopy}
      variant="ghost"
      size="sm"
      className="h-7 text-xs shrink-0"
    >
      {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
      {copied ? "Đã chép" : label || "Sao chép"}
    </Button>
  );
}

const PromptOutput = ({ prompt, structured }: Props) => {
  const [expandedScenes, setExpandedScenes] = useState(true);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  if (structured) {
    return (
      <div className="bg-card rounded-2xl border border-border p-5 space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">Prompt đã tạo</span>
          <Button
            onClick={handleCopyAll}
            variant={copiedAll ? "default" : "secondary"}
            size="sm"
            className="h-8 text-xs rounded-lg"
          >
            {copiedAll ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
            {copiedAll ? "Đã sao chép!" : "Sao chép tất cả"}
          </Button>
        </div>

        <div className="space-y-3">
          {sections.map(({ key, label, icon }) => {
            const value = structured[key];
            if (!value) return null;
            return (
              <div key={key} className="bg-background border border-border rounded-xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <span>{icon}</span> {label}
                  </span>
                  <CopyButton text={value} />
                </div>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{value}</p>
              </div>
            );
          })}

          {/* Scenes */}
          {structured.scenes && structured.scenes.length > 0 && (
            <div className="bg-background border border-border rounded-xl p-3">
              <button
                onClick={() => setExpandedScenes(!expandedScenes)}
                className="flex items-center justify-between w-full mb-1.5"
              >
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <span>🎞️</span> Prompt theo cảnh ({structured.scenes.length} cảnh)
                </span>
                {expandedScenes ? (
                  <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </button>
              {expandedScenes && (
                <div className="space-y-2 mt-2">
                  {structured.scenes.map((scene) => (
                    <div
                      key={scene.id}
                      className="bg-card border border-border rounded-lg p-2.5 flex items-start justify-between gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-primary">
                            Cảnh {scene.id}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {scene.timeRange}
                          </span>
                          <span className="text-xs text-muted-foreground/70">
                            · {scene.camera}
                          </span>
                        </div>
                        <p className="text-xs text-foreground/80 leading-relaxed">
                          {scene.description}
                        </p>
                      </div>
                      <CopyButton
                        text={`Cảnh ${scene.id} (${scene.timeRange}): ${scene.camera} — ${scene.description}`}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback: raw text
  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
      <span className="text-sm font-semibold text-foreground">Prompt đã tạo</span>
      <div className="bg-background border border-border rounded-xl p-4">
        <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">{prompt}</p>
      </div>
      <Button
        onClick={handleCopyAll}
        variant={copiedAll ? "default" : "secondary"}
        className="w-full h-10 rounded-xl text-sm font-medium"
      >
        {copiedAll ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
        {copiedAll ? "Đã sao chép!" : "Sao chép Prompt"}
      </Button>
    </div>
  );
};

export default PromptOutput;
