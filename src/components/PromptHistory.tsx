import { History, ChevronRight } from "lucide-react";
import { History, ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  history: string[];
  onSelect: (prompt: string) => void;
  onClear: () => void;
}

const PromptHistory = ({ history, onSelect }: Props) => (
const PromptHistory = ({ history, onSelect, onClear }: Props) => (
  <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
    <div className="flex items-center gap-2">
      <History className="w-4 h-4 text-primary" />
      <span className="text-sm font-medium text-foreground">Lịch sử Prompt</span>
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <History className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Lịch sử Prompt</span>
      </div>
      {history.length > 0 && (
        <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={onClear}>
          <Trash2 className="w-3.5 h-3.5 mr-1" />
          Xóa
        </Button>
      )}
    </div>
    {history.length === 0 ? (
      <p className="text-xs text-muted-foreground">Chưa có prompt nào. Hãy tạo prompt đầu tiên!</p>
    ) : (
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {history.map((p, i) => (
          <button
            key={i}
            onClick={() => onSelect(p)}
            className="w-full text-left bg-background border border-border rounded-lg px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors duration-150 flex items-start gap-2"
          >
            <ChevronRight className="w-3 h-3 mt-0.5 shrink-0 text-primary" />
            <span className="line-clamp-2">{p}</span>
          </button>
        ))}
      </div>
    )}
  </div>
);

export default PromptHistory;
