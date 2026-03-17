const AdPlaceholder = ({ position }: { position: "top" | "bottom" | "sidebar" }) => {
  const sizes: Record<string, string> = {
    top: "w-full max-w-4xl h-[90px]",
    bottom: "w-full max-w-4xl h-[90px]",
    sidebar: "w-full h-[250px]",
  };

  return (
    <div className={`${sizes[position]} bg-card/50 border border-dashed border-border rounded-xl flex items-center justify-center`}>
      <span className="text-xs text-muted-foreground/50">Quảng cáo — AdSense</span>
    </div>
  );
};

export default AdPlaceholder;
