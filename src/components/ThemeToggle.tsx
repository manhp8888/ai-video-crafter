import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

const ThemeToggle = () => {
  const { theme, toggle } = useTheme();

  return (
    <Button variant="ghost" size="icon" onClick={toggle} className="rounded-xl" title={theme === "dark" ? "Chế độ sáng" : "Chế độ tối"}>
      {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Button>
  );
};

export default ThemeToggle;
