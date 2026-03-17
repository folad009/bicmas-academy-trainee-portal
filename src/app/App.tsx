import Router from "./router";
import { AuthProvider } from "@/context/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import { PWAIOSBanner } from "@/components/PWAIOSBanner";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />

        <PWAInstallBanner />
        <PWAIOSBanner />
      </AuthProvider>
    </QueryClientProvider>
  );
}