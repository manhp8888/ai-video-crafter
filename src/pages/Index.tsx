import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Copy, Check } from "lucide-react";

const dropdowns = [
  { label: "Style", key: "style", options: ["Cinematic", "Anime", "Realistic", "Cyberpunk", "Fantasy", "Documentary", "Pixar Style"] },
  { label: "Camera Movement", key: "camera", options: ["Static Shot", "Slow Zoom", "Drone Shot", "Tracking Shot", "Handheld", "Cinematic Pan"] },
  { label: "Lighting", key: "lighting", options: ["Soft Lighting", "Neon Lighting", "Sunset Lighting", "Studio Lighting", "Dramatic Lighting"] },
  { label: "Mood", key: "mood", options: ["Epic", "Dark", "Dreamy", "Emotional", "Futuristic"] },
  { label: "Video Model", key: "model", options: ["Runway", "Pika", "Sora", "Kling"] },
] as const;

function generatePrompt(idea: string, selections: Record<string, string>) {
  const style = selections.style || "Cinematic";
  const camera = selections.camera || "Slow Zoom";
  const lighting = selections.lighting || "Soft Lighting";
  const mood = selections.mood || "Epic";
  const model = selections.model || "Runway";

  return `[${model} Prompt] ${style} style video of ${idea.trim() || "a breathtaking landscape"}. Shot with ${camera.toLowerCase()}, ${lighting.toLowerCase()}, creating a ${mood.toLowerCase()} atmosphere. High quality, 4K resolution, cinematic color grading, professional composition. --style ${style.toLowerCase().replace(/\s/g, "_")} --mood ${mood.toLowerCase()}`;
}

const Index = () => {
  const [idea, setIdea] = useState("");
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [prompt, setPrompt] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    setPrompt(generatePrompt(idea, selections));
    setCopied(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-[640px] space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-semibold text-foreground">AI Video Prompt Generator</h1>
          </div>
          <p className="text-muted-foreground text-sm">Create cinematic prompts for Runway, Pika, Sora & Kling</p>
        </div>

        {/* Main Card */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
          {/* Video Idea */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Video Idea</label>
            <Textarea
              placeholder="Describe your video idea... e.g. 'A lone astronaut walking through a neon-lit alien marketplace'"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              className="min-h-[100px] bg-background border-border text-foreground placeholder:text-muted-foreground/50 rounded-xl resize-none"
            />
          </div>

          {/* Dropdowns Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {dropdowns.map((d) => (
              <div key={d.key} className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{d.label}</label>
                <Select onValueChange={(v) => setSelections((s) => ({ ...s, [d.key]: v }))}>
                  <SelectTrigger className="bg-background border-border text-foreground rounded-xl h-10">
                    <SelectValue placeholder={`Select ${d.label.toLowerCase()}`} />
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

          {/* Generate Button */}
          <Button onClick={handleGenerate} className="w-full h-11 rounded-xl text-sm font-semibold" variant="default">
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Prompt
          </Button>

          {/* Output */}
          {prompt && (
            <div className="space-y-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-150">
              <label className="text-sm font-medium text-muted-foreground">Generated Prompt</label>
              <div className="bg-background border border-border rounded-xl p-4">
                <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">{prompt}</p>
              </div>
              <Button
                onClick={handleCopy}
                variant={copied ? "success" : "secondary"}
                className="w-full h-10 rounded-xl text-sm font-medium"
              >
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? "Copied!" : "Copy Prompt"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
