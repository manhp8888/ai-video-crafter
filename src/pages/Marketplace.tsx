import { Store } from "lucide-react";

const Marketplace = () => {
  return (
    <div className="flex flex-col items-center px-4 py-6 gap-6">
      <div className="w-full max-w-5xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[hsl(280,80%,55%)] flex items-center justify-center">
            <Store className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Chợ Prompt</h1>
            <p className="text-sm text-muted-foreground">Khám phá và chia sẻ prompt chất lượng cao</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-10 text-center">
          <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-bold text-foreground mb-2">Sắp ra mắt</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Chợ Prompt đang được phát triển. Bạn sẽ có thể mua bán, chia sẻ các prompt chất lượng cao tại đây.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
