import React, { useState, useEffect } from "react";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { ScormPlayer } from "./components/ScormPlayer";
import { LoginPage } from "./components/LoginPage";
import { CertificateModal } from "./components/CertificateModal";
import { Community } from "./components/Community";
import { Course, CourseStatus, User, LearningPath, UserStats } from "./types";
import { Search, Filter, Download, LogOut } from "lucide-react";
import { CourseCard } from "./components/CourseCard";
import { clearAuth, getAccessToken } from "./utils/auth";

import { fetchLearnerDashboard } from "./api/dashboard";
import { fetchLearningPaths } from "@/api/learningPaths";
import { mapLearningPath } from "@/mappers/learningPathMapper";


export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [activeView, setActiveView] = useState("dashboard");
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);

  const [courses, setCourses] = useState<Course[]>([]);
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);

  // Initialize offline state based on navigator status
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [pendingSync, setPendingSync] = useState(0);
  const [selectedCertificate, setSelectedCertificate] = useState<Course | null>(
    null
  );

  // Filters for Library
  const [filter, setFilter] = useState<
    "All" | "Mandatory" | "Recommended" | "Completed"
  >("All");

  // Restore auth on refresh
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      setIsAuthenticated(true);
    }
  });

  // Network Detection & Auto-Sync
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Automatically attempt sync if there are pending items
      if (pendingSync > 0) {
        setTimeout(() => setPendingSync(0), 1500);
      }
    };
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [pendingSync]);

  useEffect(() => {
  if (!isAuthenticated || !user) return;

  const loadDashboard = async () => {
    try {
      setIsDashboardLoading(true);

      const [dashboard, paths] = await Promise.all([
        fetchLearnerDashboard(),
        fetchLearningPaths(),
      ]);

      setCourses(dashboard.courses);
      setStats(dashboard.stats);

      const publishedPath = paths.find(
        (p) => p.status === "PUBLISHED"
      );

      setLearningPath(
        publishedPath ? mapLearningPath(publishedPath) : null
      );
    } catch (err) {
      console.error("Dashboard load failed:", err);
    } finally {
      setIsDashboardLoading(false);
    }
  };

  loadDashboard();
}, [isAuthenticated, user]);


 const handleLogin = async (backendUser: any) => {
  setUser({
    id: backendUser.id,
    name: backendUser.email.split("@")[0],
    email: backendUser.email,
    role: backendUser.role,
    avatar: "https://picsum.photos/200",
  });

  setIsAuthenticated(true);
};


  const handleLogout = () => {
    clearAuth();
    setIsAuthenticated(false);
    setUser(null);
    setActiveView("dashboard");
  };

  const handleStartCourse = (id: string) => {
    setActiveCourseId(id);
  };

  const handleUpdateProgress = (
    courseId: string,
    progress: number,
    completedModules: number
  ) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id === courseId) {
          const newStatus =
            progress === 100 ? CourseStatus.Completed : CourseStatus.InProgress;
          return { ...c, progress, completedModules, status: newStatus };
        }
        return c;
      })
    );

    // Update stats simulation and award coins
    setStats((prev) => ({
      ...prev,
      totalLearningHours: prev.totalLearningHours + 0.1,
      bicmasCoins: prev.bicmasCoins + 10, // Award coins for progress
    }));

    // Simulate sync need if offline
    if (isOffline) {
      setPendingSync((prev) => prev + 1);
    }
  };

  const handleDownload = (courseId: string) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === courseId ? { ...c, isDownloaded: true } : c))
    );
  };

  const handleRemoveDownload = (courseId: string) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === courseId ? { ...c, isDownloaded: false } : c))
    );
  };

  const toggleOffline = () => {
    // Manual toggle for simulation/testing
    if (isOffline) {
      setTimeout(() => setPendingSync(0), 2000);
    }
    setIsOffline(!isOffline);
  };

  const filteredCourses = courses.filter((c) => {
    if (isOffline && !c.isDownloaded) return false; // In offline mode, only show downloaded
    if (filter === "All") return true;
    if (filter === "Completed") return c.status === CourseStatus.Completed;
    return c.category === filter;
  });

  const renderLibrary = () => (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search courses..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {["All", "Mandatory", "Recommended", "Completed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isOffline && (
        <div className="bg-orange-50 border border-orange-100 text-orange-800 p-4 rounded-xl flex items-center gap-3">
          <Download size={20} />
          <span>
            Showing only downloaded courses available for offline learning.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onStart={handleStartCourse}
              onDownload={handleDownload}
              onRemoveDownload={handleRemoveDownload}
              isOfflineMode={isOffline}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-20 text-slate-400">
            No courses found for this filter.
          </div>
        )}
      </div>
    </div>
  );

  const renderCertificates = () => (
    <div className="animate-in fade-in zoom-in duration-300">
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">My Certificates</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {courses
            .filter((c) => c.status === CourseStatus.Completed)
            .map((course) => (
              <div
                key={course.id}
                className="p-6 flex flex-col md:flex-row items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-yellow-50 rounded-lg flex items-center justify-center text-yellow-600">
                    <Filter size={32} /> {/* Mock Certificate Icon */}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{course.title}</h3>
                    <p className="text-sm text-slate-500">
                      Completed on {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCertificate(course)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  <Download size={16} /> Download PDF
                </button>
              </div>
            ))}
          {courses.filter((c) => c.status === CourseStatus.Completed).length ===
            0 && (
            <div className="p-12 text-center text-slate-500">
              Complete a course to earn your first certificate!
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in duration-300">
      <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center">
        <div className="relative inline-block">
          <img
            src={user.avatar}
            alt="Profile"
            className="w-32 h-32 rounded-full border-4 border-white shadow-lg mx-auto"
          />
          <div className="absolute bottom-2 right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-white"></div>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mt-4">{user.name}</h2>
        <p className="text-slate-500">
          {user.role} • {user.email}
        </p>
        <button
          onClick={handleLogout}
          className="mt-6 px-4 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 mx-auto"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">Account Settings</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Language Preference
            </label>
            <select className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800">
              <option>English (US)</option>
              <option>Spanish</option>
              <option>French</option>
            </select>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-slate-700">Email Notifications</span>
            <div className="w-11 h-6 bg-blue-600 rounded-full relative cursor-pointer">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isAuthenticated || !user) return <LoginPage onLogin={handleLogin} />;

  return (
    <>
      {activeCourseId ? (
        <ScormPlayer
          course={courses.find((c) => c.id === activeCourseId)!}
          onBack={() => setActiveCourseId(null)}
          onUpdateProgress={handleUpdateProgress}
          onViewCertificate={() =>
            setSelectedCertificate(
              courses.find((c) => c.id === activeCourseId) || null
            )
          }
        />
      ) : (
        <Layout
          activeView={activeView}
          onChangeView={setActiveView}
          user={user}
          isOffline={isOffline}
          toggleOffline={toggleOffline}
          pendingSync={pendingSync}
        >
          {activeView === "dashboard" &&
            (isDashboardLoading || !stats ? (
              <div className="p-10 text-center text-slate-500">
                Loading dashboard…
              </div>
            ) : (
              <Dashboard
                courses={courses}
                learningPath={learningPath}
                stats={stats}
                onStartCourse={handleStartCourse}
                onDownload={handleDownload}
                onRemoveDownload={handleRemoveDownload}
                isOfflineMode={isOffline}
                user={user}
              />
            ))}
          {activeView === "library" && renderLibrary()}
          {activeView === "community" && <Community user={user} />}
          {activeView === "certificates" && renderCertificates()}
          {activeView === "profile" && renderProfile()}
        </Layout>
      )}

      {/* Certificate Confirmation Modal */}
      <CertificateModal
        isOpen={!!selectedCertificate}
        onClose={() => setSelectedCertificate(null)}
        onConfirm={() => setSelectedCertificate(null)}
        courseTitle={selectedCertificate?.title || ""}
        recipientName={user.name}
        certificateUrl={selectedCertificate?.certificateUrl}
      />
    </>
  );
}
