import React, { useState, useMemo } from "react";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { ScormPlayer } from "./components/ScormPlayer";
import { LoginPage } from "./components/LoginPage";
import { CertificateModal } from "./components/CertificateModal";
import { Community } from "./components/Community";
import { Course, CourseStatus, User, UserStats } from "./types";
import { Search, Download, LogOut, Filter } from "lucide-react";
import { CourseCard } from "./components/CourseCard";

import { clearAuth, getAccessToken } from "./utils/auth";
import {
  getDownloadedCourses,
  markDownloaded,
  removeDownloaded,
} from "./utils/offlineCourses";

import { useDashboard } from "@/hooks/useDashboard";
import { useLibrary } from "@/hooks/useLibrary";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { useProgressUpdate } from "@/hooks/useProgressUpdate";
import { FieldAssessmentPage } from "./components/FieldAssessment";
import { PWAInstallBanner } from "./components/PWAInstallBanner";
import { PWAIOSBanner } from "./components/PWAIOSBanner";
import { useLearningPaths } from "@/hooks/useLearningPaths";
import { mapLearningPath } from "@/mappers/learningPathMapper";

type LibraryFilter = "ALL" | "MANDATORY" | "RECOMMENDED" | "COMPLETED";

const FILTERS: { label: string; value: LibraryFilter }[] = [
  { label: "All", value: "ALL" },
  { label: "Mandatory", value: "MANDATORY" },
  { label: "Recommended", value: "RECOMMENDED" },
  { label: "Completed", value: "COMPLETED" },
];

const DEFAULT_STATS: UserStats = {
  streakDays: 0,
  totalLearningHours: 0,
  bicmasCoins: 0,
  completedCourses: 0,
  averageScore: 0,
  weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
  scoreTrend: 0,
  completedCoursesTrend: 0,
  badges: [],
};

export default function App() {
  // ---------------- Auth ----------------
  const [isAuthenticated, setIsAuthenticated] = useState(!!getAccessToken());
  const [user, setUser] = useState<User | null>(null);

  // ---------------- UI State ----------------
  const [activeView, setActiveView] = useState("dashboard");
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [selectedCertificate, setSelectedCertificate] = useState<Course | null>(
    null,
  );

  // Library UI controls
  const [filter, setFilter] = useState<LibraryFilter>("ALL");
  const [search, setSearch] = useState("");

  // ---------------- System Hooks ----------------
  const isOffline = useOfflineStatus();
  const updateProgress = useProgressUpdate();

  // ---------------- Data Queries ----------------
  const { data: dashboardData, isLoading: isDashboardLoading } = useDashboard();

  const dashboardCourses = dashboardData?.courses ?? [];
  const stats = dashboardData?.stats ?? DEFAULT_STATS;

  const { data: libraryCoursesRaw = [] } = useLibrary(dashboardCourses);
  const { data: learningPaths, isLoading: isPathsLoading } = useLearningPaths();

  // ---------------- Derived Data ----------------
  const libraryCourses = useMemo(() => {
    const downloadedIds = getDownloadedCourses();

    return libraryCoursesRaw.map((course) => ({
      ...course,
      isDownloaded: downloadedIds.includes(course.id),
    }));
  }, [libraryCoursesRaw]);

  const currentLearningPath = useMemo(() => {
    if (!learningPaths || learningPaths.length === 0) return null;

    const backendPath = learningPaths[0];

    return mapLearningPath(backendPath, libraryCourses);
  }, [learningPaths, libraryCourses]);

  const filteredCourses = useMemo(() => {
    return libraryCourses.filter((course) => {
      if (isOffline && !course.isDownloaded) return false;

      if (
        search &&
        !course.title.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }

      if (filter === "COMPLETED") {
        return course.status === CourseStatus.Completed;
      }

      if (filter === "MANDATORY") {
        return course.category === "Mandatory";
      }

      if (filter === "RECOMMENDED") {
        return course.category === "Recommended";
      }

      return true;
    });
  }, [libraryCourses, search, filter, isOffline]);

  const activeCourse =
    libraryCourses.find((c) => c.id === activeCourseId) ||
    dashboardCourses.find((c) => c.id === activeCourseId) ||
    null;

  // ---------------- Auth Handlers ----------------
  const handleLogin = (backendUser: any) => {
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
    setActiveCourseId(null);
    setActiveView("dashboard");
  };

  // ---------------- Course Actions ----------------
  const handleStartCourse = (id: string) => {
    setActiveCourseId(id);
  };

  const handleUpdateProgress = (
    courseId: string,
    progress: number,
    completedModules: number,
  ) => {
    updateProgress(courseId, progress, completedModules);
  };

  // Offline downloads (local only)
  const handleDownload = async (courseId: string) => {
    await new Promise((res) => setTimeout(res, 400));
    markDownloaded(courseId);
  };

  const handleRemoveDownload = (courseId: string) => {
    removeDownloaded(courseId);
  };

  // ---------------- Views ----------------
  const renderLibrary = () => (
    <div className="space-y-6">
      {/* Search + Filters */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={20}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {FILTERS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-4 py-2 rounded-full text-sm ${
                filter === value
                  ? "bg-slate-900 text-white"
                  : "bg-white border border-slate-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isOffline && (
        <div className="bg-orange-50 border border-orange-100 text-orange-800 p-4 rounded-xl flex items-center gap-3">
          <Download size={20} />
          Showing downloaded courses only.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              progress={course.progress}
              status={course.status}
              onStart={handleStartCourse}
              onDownload={handleDownload}
              onRemoveDownload={handleRemoveDownload}
              isOfflineMode={isOffline}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-20 text-slate-400">
            No courses found.
          </div>
        )}
      </div>
    </div>
  );

  const renderLearningPaths = () => {
    if (isPathsLoading) {
      return (
        <div className="p-10 text-center text-slate-500">
          Loading learning paths…
        </div>
      );
    }

    if (!learningPaths.length) {
      return (
        <div className="p-10 text-center text-slate-400">
          No learning paths available.
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {learningPaths.map((path) => {
          const pathCourses = libraryCourses.filter((course) =>
            path.curriculumSequence.includes(course.id),
          );

          return (
            <div key={path.id} className="space-y-4">
              <div>
                <h2 className="text-xl font-bold">{path.title}</h2>
                <p className="text-slate-500 text-sm">{path.description}</p>
              </div>

              {pathCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pathCourses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      progress={course.progress}
                      status={course.status}
                      onStart={handleStartCourse}
                      onDownload={handleDownload}
                      onRemoveDownload={handleRemoveDownload}
                      isOfflineMode={isOffline}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-slate-400 text-sm">
                  No courses found for this path.
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderProfile = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-8 border text-center">
        <img
          src={user?.avatar}
          alt="Profile"
          className="w-32 h-32 rounded-full mx-auto"
        />
        <h2 className="text-2xl font-bold mt-4">{user?.name}</h2>
        <p className="text-slate-500">
          {user?.role} • {user?.email}
        </p>

        <button
          onClick={handleLogout}
          className="mt-6 px-4 py-2 bg-slate-100 rounded-lg flex items-center gap-2 mx-auto"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );

  // ---------------- Guards ----------------
  if (!isAuthenticated || !user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // ---------------- Course Player ----------------
  if (activeCourseId && activeCourse) {
    return (
      <ScormPlayer
        course={activeCourse}
        onBack={() => setActiveCourseId(null)}
        onUpdateProgress={handleUpdateProgress}
        onViewCertificate={() => setSelectedCertificate(activeCourse)}
      />
    );
  }

  // ---------------- Main Layout ----------------
  return (
    <>
      <Layout
        activeView={activeView}
        onChangeView={setActiveView}
        user={user}
        isOffline={isOffline}
      >
        {activeView === "dashboard" &&
          (isDashboardLoading ? (
            <div className="p-10 text-center">Loading dashboard…</div>
          ) : (
            <Dashboard
              courses={dashboardCourses}
              stats={stats}
              learningPath={currentLearningPath}
              onStartCourse={handleStartCourse}
              onDownload={handleDownload}
              onRemoveDownload={handleRemoveDownload}
              isOfflineMode={isOffline}
              user={user}
            />
          ))}

        {activeView === "learning-paths" && renderLearningPaths()}

        {activeView === "library" && renderLibrary()}
        {activeView === "assessment" && (
          <FieldAssessmentPage userId={user.id} />
        )}
        {activeView === "community" && <Community user={user} />}
        {activeView === "profile" && renderProfile()}
      </Layout>

      {!activeCourse && (
        <>
          {" "}
          <PWAInstallBanner />
          <PWAIOSBanner />
        </>
      )}

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
