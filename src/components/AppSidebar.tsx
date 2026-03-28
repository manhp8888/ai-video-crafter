import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Sparkles, Wand2, Scissors, Eraser, ImageUp, Video, LogOut, Shield } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const menuItems = [
  { title: "Tạo Prompt", icon: Wand2, path: "/" },
  { title: "Tách ảnh AI", icon: Scissors, path: "/image-segment" },
  { title: "Xóa nền ảnh", icon: Eraser, path: "/remove-bg" },
  { title: "Nâng cấp ảnh", icon: ImageUp, path: "/enhance" },
  { title: "Tạo video AI", icon: Video, path: "/ai-video" },
];

const AppSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAdmin();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-[hsl(280,80%,55%)] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-bold text-foreground">Prompt AI Studio</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Công cụ</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={location.pathname === item.path}
                    onClick={() => navigate(item.path)}
                    tooltip={item.title}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Quản trị</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={location.pathname === "/admin"}
                    onClick={() => navigate("/admin")}
                    tooltip="Admin"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Admin</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center justify-between px-2 py-1">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-lg px-2 py-1.5 hover:bg-muted"
          >
            <LogOut className="w-3.5 h-3.5" />
            Đăng xuất
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
