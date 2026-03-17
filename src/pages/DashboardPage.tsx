import { Dashboard } from "@/components/Dashboard";
import { useDashboard } from "@/hooks/useDashboard";
import { useLearningPaths } from "@/hooks/useLearningPaths";
import { mapLearningPath } from "@/mappers/learningPathMapper";
import { useDownloadStore } from "@/store/downloadStore";
import { useAuth } from "@/context/AuthContext";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { UserStats } from "@/types";
import { Navigate, useNavigate } from "react-router-dom";
import { useMemo } from "react";

const DEFAULT_STATS: UserStats = {
  streakDays: 0,
  totalLearningHours: 0,
  completedCourses: 0,
  averageScore: 0,
  weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
  scoreTrend: 0,
  completedCoursesTrend: 0,
  bicmasCoins: 0,
  badges: [],
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useDashboard();
  const { data: learningPaths = [] } = useLearningPaths();
  const { download, remove } = useDownloadStore();
  const navigate = useNavigate();
  const courses = data?.courses ?? [];
  const isOnline = useOnlineStatus();

  const learningPath = useMemo(() => {
    if (!learningPaths.length) return null;
    return mapLearningPath(learningPaths[0], courses);
  }, [learningPaths, courses]);

  if (!user) return <Navigate to="/login" replace />;
  if (isLoading) return <div>Loading dashboard...</div>;
  if (isError) return <div>We could not load your dashboard right now.</div>;

  return (
    <Dashboard
      courses={courses}
      stats={data?.stats ?? DEFAULT_STATS}
      user={user}
      learningPath={learningPath}
      onStartCourse={(courseId) => navigate(`/course/${courseId}`)}
      onDownload={download}
      onRemoveDownload={remove}
      isOfflineMode={!isOnline}
    />
  );
}
