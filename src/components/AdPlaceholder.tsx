const AdPlaceholder = ({ position }: { position: "top" | "bottom" | "sidebar" }) => {
  const sizes: Record<string, string> = {
    top: "w-full max-w-5xl h-[80px]",
    bottom: "w-full max-w-5xl h-[80px]",
    sidebar: "w-full h-[220px]",
  };

  return (
    <div className={`${sizes[position]} bg-muted/30 border border-dashed border-border/50 rounded-xl flex items-center justify-center`}>
      <span className="text-[10px] text-muted-foreground/40 font-medium tracking-wider uppercase">Quảng cáo</span>
    </div>
  );
};

export default AdPlaceholder;
