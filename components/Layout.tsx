import React, { useState } from "react";
import { User } from "../types";
import {
  LayoutDashboard,
  BookOpen,
  UserCircle,
  Wifi,
  WifiOff,
  Award,
  MessageCircle,
  X,
  Download,
} from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  onChangeView: (view: string) => void;
  user: User;
  isOffline: boolean;
  toggleOffline: () => void;
  pendingSync: number;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  activeView,
  onChangeView,
  user,
  isOffline,
  toggleOffline,
  pendingSync,
}) => {
  const NavItem = ({
    id,
    icon: Icon,
    label,
  }: {
    id: string;
    icon: any;
    label: string;
  }) => (
    <button
      onClick={() => onChangeView(id)}
      className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
        activeView === id
          ? "text-[#008080] bg-[#008080]/10"
          : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
      }`}
    >
      <Icon size={24} className="mb-1" />
      <span className="text-[10px] font-medium uppercase tracking-wide">
        {label}
      </span>
    </button>
  );
  const { isInstallable, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {isInstallable && !dismissed && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-slate-900 text-white rounded-xl shadow-lg p-4 flex items-center gap-3 z-50">
          <Download size={20} />
          <div className="flex-1">
            <p className="font-semibold text-sm">Install BICMAS Academy</p>
            <p className="text-xs text-slate-300">
              Learn offline. Faster access. No browser needed.
            </p>
          </div>

          <button
            onClick={promptInstall}
            className="bg-[#008080] hover:bg-[#004c4c] px-3 py-1.5 rounded-lg text-sm font-medium"
          >
            Install
          </button>

          <button
            onClick={() => setDismissed(true)}
            className="text-slate-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex w-24 bg-white border-r border-slate-200 flex-col items-center py-6 shrink-0 fixed h-full z-10">
        <div className="w-12 h-12  flex items-center justify-center  mb-8">
          <img src="/img/BICMAS-logo.png" />
        </div>

        <nav className="flex-1 flex flex-col gap-6 w-full px-2">
          <NavItem id="dashboard" icon={LayoutDashboard} label="Home" />
          <NavItem id="library" icon={BookOpen} label="Courses" />
          <NavItem id="community" icon={MessageCircle} label="Forum" />
          <NavItem id="certificates" icon={Award} label="Awards" />
          <NavItem id="profile" icon={UserCircle} label="Profile" />
        </nav>

        <div className="mt-auto flex flex-col items-center gap-4 w-full">
          <button
            onClick={toggleOffline}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              isOffline
                ? "bg-orange-100 text-orange-600"
                : "bg-slate-100 text-green-600"
            }`}
            title={isOffline ? "Currently Offline" : "Online"}
          >
            {isOffline ? <WifiOff size={20} /> : <Wifi size={20} />}
          </button>
          <img
            src={user.avatar}
            alt="User"
            className="w-10 h-10 rounded-full border-2 border-slate-100"
          />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-24 pb-20 md:pb-0">
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-20 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h1 className="text-xl font-bold text-slate-800">
            {activeView === "dashboard" && "My Dashboard"}
            {activeView === "library" && "Course Library"}
            {activeView === "certificates" && "My Certificates"}
            {activeView === "profile" && "User Profile"}
            {activeView === "community" && "Community"}
          </h1>

          {/* Mobile Header Elements */}
          <div className="flex md:hidden items-center gap-3">
            <button
              onClick={toggleOffline}
              className={`p-2 rounded-full ${
                isOffline
                  ? "bg-orange-100 text-orange-600"
                  : "bg-green-50 text-green-600"
              }`}
            >
              {isOffline ? <WifiOff size={18} /> : <Wifi size={18} />}
            </button>
            <img
              src={user.avatar}
              alt="User"
              className="w-8 h-8 rounded-full bg-slate-200"
            />
          </div>

          {/* Desktop Sync Status */}
          <div className="hidden md:flex items-center gap-4">
            {!isOffline && pendingSync > 0 && (
              <div className="text-xs text-blue-600 flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full animate-pulse">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                Syncing {pendingSync} items...
              </div>
            )}
            {isOffline && (
              <div className="text-xs text-orange-600 font-medium px-3 py-1 bg-orange-50 rounded-full border border-orange-100">
                Offline Mode
              </div>
            )}
          </div>
        </header>

        <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-80px)] overflow-y-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-2 z-40 pb-safe">
        <NavItem id="dashboard" icon={LayoutDashboard} label="Home" />
        <NavItem id="library" icon={BookOpen} label="Courses" />
        <NavItem id="community" icon={MessageCircle} label="Forum" />
        <NavItem id="certificates" icon={Award} label="Awards" />
        <NavItem id="profile" icon={UserCircle} label="Profile" />
      </nav>
    </div>
  );
};
