import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Bot, Eye, EyeOff, Settings } from "lucide-react";

interface Props {
  apiKey: string;
  model: string;
  useAI: boolean;
  aiProvider: string;
  onChange: (key: string, model: string, enabled: boolean, provider: string) => void;
}

const providerModels: Record<string, { label: string; value: string }[]> = {
  openai: [
    { label: "GPT-4o", value: "gpt-4o" },
    { label: "GPT-4o Mini", value: "gpt-4o-mini" },
    { label: "GPT-4 Turbo", value: "gpt-4-turbo" },
  ],
  gemini: [
    { label: "Gemini 2.5 Pro", value: "gemini-2.5-pro" },
    { label: "Gemini 2.5 Flash", value: "gemini-2.5-flash" },
    { label: "Gemini 2.0 Flash", value: "gemini-2.0-flash" },
  ],
};

const AISettings = ({ apiKey, model, useAI, aiProvider, onChange }: Props) => {
  const [showKey, setShowKey] = useState(false);

  const models = providerModels[aiProvider] || providerModels.openai;

  return (
    <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Settings className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Cài đặt AI</span>
      </div>

      {/* Toggle AI */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Dùng AI tạo prompt</span>
        </div>
        <Switch
          checked={useAI}
          onCheckedChange={(checked) => onChange(apiKey, model, checked, aiProvider)}
        />
      </div>

      {/* AI Provider */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Nhà cung cấp AI</label>
        <Select value={aiProvider} onValueChange={(v) => {
          const defaultModel = providerModels[v]?.[0]?.value || "gpt-4o";
          onChange(apiKey, defaultModel, useAI, v);
        }}>
          <SelectTrigger className="bg-background border-border text-foreground rounded-xl h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="openai" className="text-foreground text-xs">OpenAI</SelectItem>
            <SelectItem value="gemini" className="text-foreground text-xs">Google Gemini</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* API Key */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          {aiProvider === "gemini" ? "Gemini API Key" : "OpenAI API Key"}
        </label>
        <div className="relative">
          <Input
            type={showKey ? "text" : "password"}
            placeholder={aiProvider === "gemini" ? "AIza..." : "sk-..."}
            value={apiKey}
            onChange={(e) => onChange(e.target.value, model, useAI, aiProvider)}
            className="bg-background border-border text-foreground rounded-xl h-9 text-xs pr-9"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Model */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Mô hình AI</label>
        <Select value={model} onValueChange={(v) => onChange(apiKey, v, useAI, aiProvider)}>
          <SelectTrigger className="bg-background border-border text-foreground rounded-xl h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {models.map((m) => (
              <SelectItem key={m.value} value={m.value} className="text-foreground text-xs">
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {useAI && !apiKey && (
        <p className="text-xs text-destructive">Vui lòng nhập API Key để sử dụng AI</p>
      )}
    </div>
  );
};

export default AISettings;
