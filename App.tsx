import React, { useState, useEffect, useMemo } from "react";
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
import { fetchAssignedCourses } from "@/api/assignedCourses";
import { mapAssignedCourse } from "@/mappers/assignedCourseMapper";
import { getDownloadedCourses } from "./utils/offlineCourses";
import {
  markDownloaded,
  removeDownloaded,
  addToQueue,
  getDownloadQueue,
  clearQueue
} from "./utils/offlineCourses";

type LibraryFilter = "ALL" | "MANDATORY" | "RECOMMENDED" | "COMPLETED";

const FILTERS: { label: string; value: LibraryFilter }[] = [
  { label: "All", value: "ALL" },
  { label: "Mandatory", value: "MANDATORY" },
  { label: "recommended", value: "RECOMMENDED" },
  { label: "completed", value: "COMPLETED" },
];

const DEFAULT_STATS: UserStats = {
  streakDays: 0,
  totalLearningHours: 0,
  bicmasCoins: 0,
  completedCourses: 0,
  averageScore: 0,
  weeklyActivity: [],
  scoreTrend: 0,
  completedCoursesTrend: 0,
  badges: []
};

const updateCourseProgress = (
  courses: Course[],
  courseId: string,
  progress: number,
  completedModules: number
): Course[] =>
  courses.map((c) => {
    if (c.id !== courseId) return c;
    const status =
      progress === 100 ? CourseStatus.Completed : CourseStatus.InProgress;
    return { ...c, progress, completedModules, status };
  });


export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [activeView, setActiveView] = useState("dashboard");
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);

 const [dashboardCourses, setDashboardCourses] = useState<Course[]>([]);
const [libraryCourses, setLibraryCourses] = useState<Course[]>([]);

const [isDashboardLoading, setIsDashboardLoading] = useState(false);
const [isLibraryLoading, setIsLibraryLoading] = useState(false);



  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS);


  

  // Initialize offline state based on navigator status
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [pendingSync, setPendingSync] = useState(0);
  const [selectedCertificate, setSelectedCertificate] = useState<Course | null>(
    null,
  );

  // Filters for Library
  const [filter, setFilter] = useState<LibraryFilter>("ALL");
  const [search, setSearch] = useState("");

  // Restore auth on refresh
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  // Network Detection & Auto-Sync
  useEffect(() => {
  const processQueue = async () => {
    const queue = getDownloadQueue();
    if (!queue.length) return;

    for (const courseId of queue) {
      try {
        await downloadCourseAssets(courseId);
      } catch {
        console.error("Queued download failed:", courseId);
      }
    }

    clearQueue();
  };

  const handleOnline = () => {
    setIsOffline(false);
    processQueue();

    if (pendingSync > 0) {
      setTimeout(() => setPendingSync(0), 1500);
    }
  };

  const handleOffline = () => setIsOffline(true);

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}, [pendingSync]);


  useEffect(() => {
  if (!isAuthenticated || !user) return;

  const loadLibrary = async () => {
    try {
      setIsLibraryLoading(true);

      const assignments = await fetchAssignedCourses();
      const downloadedIds = getDownloadedCourses();

      setLibraryCourses(assignments.map(mapAssignedCourse).map(course => ({
        ...course,
        isDownloaded: downloadedIds.includes(course.id)
      })));
    } catch (err) {
      console.error("Assigned courses load failed:", err);
    } finally {
      setIsLibraryLoading(false);
    }
  };

  loadLibrary();
}, [isAuthenticated, user]);


useEffect(() => {
  if (!isAuthenticated || !user) return;

  const loadDashboard = async () => {
    try {
      setIsDashboardLoading(true);

      const [dashboard, paths] = await Promise.all([
        fetchLearnerDashboard(),
        fetchLearningPaths(),
      ]);

      setDashboardCourses(dashboard.courses);
      setStats(dashboard.stats);

      const publishedPath = paths.find((p) => p.status === "PUBLISHED");
      setLearningPath(publishedPath ? mapLearningPath(publishedPath) : null);
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

  // Auth
  setIsAuthenticated(false);
  setUser(null);

  // App state reset (important)
  setActiveCourseId(null);
  setActiveView("dashboard");

  setDashboardCourses([]);
  setLibraryCourses([]);
  setLearningPath(null);
  setStats(DEFAULT_STATS);

  setPendingSync(0);
};


const handleStartCourse = async (id: string) => {
  setActiveCourseId(id);
};



const handleUpdateProgress = async (
  courseId: string,
  progress: number,
  completedModules: number
) => {
  // Update local UI state
  setDashboardCourses(prev =>
    updateCourseProgress(prev, courseId, progress, completedModules)
  );

  setLibraryCourses(prev =>
    updateCourseProgress(prev, courseId, progress, completedModules)
  );

  // No sync here — SCORM player handles backend syncing

  // Refresh stats when course completes
  if (progress === 100) {
    try {
      const dashboard = await fetchLearnerDashboard();
      setStats(dashboard.stats);
    } catch (err) {
      console.error("Failed to refresh dashboard stats", err);
    }
  }
};




const toggleDownloadFlag = (
  courses: Course[],
  courseId: string,
  isDownloaded: boolean
) =>
  courses.map((c) =>
    c.id === courseId ? { ...c, isDownloaded } : c
  );

const downloadCourseAssets = async (courseId: string) => {
  // Placeholder for real asset caching later
  // Example: fetch SCORM zip, videos, etc.
  await new Promise(res => setTimeout(res, 500));

  markDownloaded(courseId);

  setLibraryCourses(prev =>
    toggleDownloadFlag(prev, courseId, true)
  );
};

const handleDownload = async (courseId: string) => {
  if (!navigator.onLine) {
    addToQueue(courseId);
    return;
  }

  await downloadCourseAssets(courseId);
};

const handleRemoveDownload = (courseId: string) => {
  removeDownloaded(courseId);

  setLibraryCourses(prev =>
    toggleDownloadFlag(prev, courseId, false)
  );
};


  const toggleOffline = () => {
    // Manual toggle for simulation/testing
    if (isOffline) {
      setTimeout(() => setPendingSync(0), 2000);
    }
    setIsOffline(!isOffline);
  };

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
        return course.progress === 100;
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



  const renderLibrary = () => (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
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
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {FILTERS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === value
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-orange-50 border border-orange-100 text-orange-800 p-4 rounded-xl flex items-center gap-3">
          <Download size={20} />
          <span>
            Showing only downloaded courses available for offline learning.
          </span>
        </div>
      )}

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course) => (
            <CourseCard
              key={course.assignmentId ?? course.id}
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
          {[...dashboardCourses, ...libraryCourses]
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
          {[...dashboardCourses, ...libraryCourses].filter((c) => c.status === CourseStatus.Completed).length ===
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
          course={[...dashboardCourses, ...libraryCourses].find((c) => c.id === activeCourseId)!}
          onBack={() => setActiveCourseId(null)}
          onUpdateProgress={handleUpdateProgress}
          onViewCertificate={() =>
            setSelectedCertificate(
              [...dashboardCourses, ...libraryCourses].find((c) => c.id === activeCourseId) || null,
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
            (isDashboardLoading  ? (
              <div className="p-10 text-center text-slate-500">
                Loading dashboard…
              </div>
            ) : (
              <Dashboard
                courses={dashboardCourses}
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

