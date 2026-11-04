import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import FloatingAssistant from "./components/FloatingAssistant.tsx";

const queryClient = new QueryClient();

// The app is a single page; anything other than "/" is a 404.
const isHome = window.location.pathname === "/" || window.location.pathname === "/index.html";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      {isHome ? (
        <>
          <Index />
          <FloatingAssistant />
        </>
      ) : (
        <NotFound />
      )}
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
