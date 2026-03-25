import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index.tsx";
import PoemDetail from "./pages/PoemDetail.tsx";
import Catalog from "./pages/Catalog.tsx";
import Portfolio from "./pages/Portfolio.tsx";
import Auth from "./pages/Auth.tsx";
import NotFound from "./pages/NotFound.tsx";
import AuthorProfilePage from "./pages/AuthorProfile.tsx";
import ClassicAuthorProfile from "./pages/ClassicAuthorProfile.tsx";
import Feed from "./pages/Feed.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/poem/:id" element={<PoemDetail />} />
              <Route path="/author/:userId" element={<AuthorProfilePage />} />
              <Route path="/classic-author/:authorName" element={<ClassicAuthorProfile />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
