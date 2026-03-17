import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

const PromptOutput = ({ prompt }: { prompt: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6 space-y-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-150">
      <label className="text-sm font-medium text-muted-foreground">Prompt đã tạo</label>
      <div className="bg-background border border-border rounded-xl p-4">
        <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">{prompt}</p>
      </div>
      <Button
        onClick={handleCopy}
        variant={copied ? "success" : "secondary"}
        className="w-full h-10 rounded-xl text-sm font-medium"
      >
        {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
        {copied ? "Đã sao chép!" : "Sao chép Prompt"}
      </Button>
    </div>
  );
};

export default PromptOutput;
