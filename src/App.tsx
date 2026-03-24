import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import Auth from "@/components/Auth";
import AppLayout from "@/components/AppLayout";
import Index from "./pages/Index";
import ImageSegment from "./pages/ImageSegment";
import RemoveBg from "./pages/RemoveBg";
import ImageEnhance from "./pages/ImageEnhance";
import AIVideo from "./pages/AIVideo";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {!session ? (
            <Auth />
          ) : (
            <AppLayout>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/image-segment" element={<ImageSegment />} />
                <Route path="/remove-bg" element={<RemoveBg />} />
                <Route path="/enhance" element={<ImageEnhance />} />
                <Route path="/ai-video" element={<AIVideo />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayout>
          )}
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
