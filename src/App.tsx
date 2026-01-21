import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Chat from "./pages/Chat";
import CheckIn from "./pages/CheckIn";
import Plans from "./pages/Plans";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import Alerts from "./pages/Alerts";
import Strategies from "./pages/Strategies";
import Consultations from "./pages/Consultations";
import Vault from "./pages/Vault";
import Medicines from "./pages/Medicines";
import DoctorLogin from "./pages/DoctorLogin";
import DoctorWorkbench from "./pages/DoctorWorkbench";
import AdvisorWorkbench from "./pages/AdvisorWorkbench";
import DoctorProfileSetup from "./pages/DoctorProfileSetup";
import CaseDetail from "./pages/CaseDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/doctor-login" element={<DoctorLogin />} />
          
          {/* User-only routes (regular users) */}
          <Route path="/chat" element={
            <ProtectedRoute allowedRoles={["user", "admin"]}>
              <Chat />
            </ProtectedRoute>
          } />
          <Route path="/checkin" element={
            <ProtectedRoute allowedRoles={["user", "admin"]}>
              <CheckIn />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={["user", "admin"]}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/alerts" element={
            <ProtectedRoute allowedRoles={["user", "admin"]}>
              <Alerts />
            </ProtectedRoute>
          } />
          <Route path="/strategies" element={
            <ProtectedRoute allowedRoles={["user", "admin"]}>
              <Strategies />
            </ProtectedRoute>
          } />
          <Route path="/consultations" element={
            <ProtectedRoute allowedRoles={["user", "admin"]}>
              <Consultations />
            </ProtectedRoute>
          } />
          <Route path="/vault" element={
            <ProtectedRoute allowedRoles={["user", "admin"]}>
              <Vault />
            </ProtectedRoute>
          } />
          <Route path="/medicines" element={
            <ProtectedRoute allowedRoles={["user", "admin"]}>
              <Medicines />
            </ProtectedRoute>
          } />
          
          {/* Doctor/Advisor routes */}
          <Route path="/doctor-profile-setup" element={
            <ProtectedRoute allowedRoles={["doctor", "advisor", "admin"]}>
              <DoctorProfileSetup />
            </ProtectedRoute>
          } />
          <Route path="/doctor-workbench" element={
            <ProtectedRoute allowedRoles={["doctor", "admin"]}>
              <DoctorWorkbench />
            </ProtectedRoute>
          } />
          <Route path="/advisor-workbench" element={
            <ProtectedRoute allowedRoles={["advisor", "admin"]}>
              <AdvisorWorkbench />
            </ProtectedRoute>
          } />
          <Route path="/case/:caseId" element={
            <ProtectedRoute allowedRoles={["doctor", "advisor", "admin"]}>
              <CaseDetail />
            </ProtectedRoute>
          } />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;