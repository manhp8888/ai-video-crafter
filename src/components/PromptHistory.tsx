import { History, ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  history: string[];
  onSelect: (prompt: string) => void;
  onClear: () => void;
}

const PromptHistory = ({ history, onSelect, onClear }: Props) => (
  <div className="glass-card rounded-2xl p-4 space-y-3">
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <History className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="text-sm font-semibold text-foreground">Lịch sử Prompt</span>
      </div>
      {history.length > 0 && (
        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs rounded-lg" onClick={onClear}>
          <Trash2 className="w-3 h-3 mr-1" />
          Xóa
        </Button>
      )}
    </div>
    {history.length === 0 ? (
      <p className="text-xs text-muted-foreground py-2">Chưa có prompt nào. Hãy tạo prompt đầu tiên!</p>
    ) : (
      <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
        {history.map((p, i) => (
          <button
            key={i}
            onClick={() => onSelect(p)}
            className="w-full text-left bg-background/50 border border-border/50 rounded-lg px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 hover:border-primary/30 transition-all duration-150 flex items-start gap-2"
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
