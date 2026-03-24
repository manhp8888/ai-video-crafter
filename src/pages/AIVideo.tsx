import { Video } from "lucide-react";

const AIVideo = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Video className="w-5 h-5 text-primary" /> Tạo video AI
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tạo video từ prompt bằng các mô hình AI — sắp ra mắt
        </p>
      </div>
      <div className="bg-card rounded-2xl border border-border p-12 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Video className="w-12 h-12 text-muted-foreground/30 mx-auto" />
          <p className="text-muted-foreground text-sm">Tính năng đang được phát triển</p>
          <p className="text-muted-foreground/60 text-xs">Hỗ trợ Runway, Sora, Kling, Hailuo và nhiều hơn nữa</p>
        </div>
      </div>
    </div>
  );
};

export default AIVideo;
