import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GymProvider } from "@/contexts/GymContext";
import LoginPage from "@/pages/LoginPage";
import OwnerDashboard from "@/pages/OwnerDashboard";
import MemberDashboard from "@/pages/MemberDashboard";
import TrainerDashboard from "@/pages/TrainerDashboard";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <GymProvider>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/owner" element={<OwnerDashboard />} />
            <Route path="/member" element={<MemberDashboard />} />
            <Route path="/trainer" element={<TrainerDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </GymProvider>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
