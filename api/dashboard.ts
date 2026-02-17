import { Course, CourseStatus, LearningPath, UserStats } from "../types";
import { getAccessToken } from "../utils/auth";

/**
 * Raw backend shapes
 * Note: unfinishedCourses are ASSIGNMENTS, not pure courses
 */
interface RawAssignment {
  id: string;
  courseId: string;
  dueDate: string | null;
  course: Course;
}

export interface RawLearnerDashboardPayload {
  streak: number;
  points: number;
  learningHours: number;
  coursesDone: number;
  averageScore: number;
  learningPaths: LearningPath[];
  learningActivity: Record<string, number>;
  currentCourse: any; // backend returns a complex object, not just Course
  unfinishedCourses: RawAssignment[];
}

export interface LearnerDashboardViewModel {
  courses: (Course & {
    assignmentId: string;
    dueDate: string | null;
  })[];
  learningPath: LearningPath | null;
  stats: UserStats;
}

/**
 * Fetch dashboard and map backend → UI-friendly shape
 */
export async function fetchLearnerDashboard(): Promise<LearnerDashboardViewModel> {
  const token = getAccessToken();

  const res = await fetch(
    "https://bicmas-academy-main-backend-production.up.railway.app/api/v1/dashboard/learner",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) {
    throw new Error("Failed to load learner dashboard");
  }

  const raw: RawLearnerDashboardPayload = await res.json();

  const activity = raw.learningActivity || {};

  const currentAttempt = raw.currentCourse?.attempt;

  const attemptProgress =
  raw.currentCourse?.attempt?.completionPercentage ?? 0;

  return {
    courses: (raw.unfinishedCourses ?? []).map((assignment, index) => {
      const progress = index === 0 ? attemptProgress : 0;

    return {
      ...assignment.course,
      assignmentId: assignment.id,
      dueDate: assignment.dueDate,
      progress,
      status:
        progress >= 100
          ? CourseStatus.Completed
          : progress > 0
          ? CourseStatus.InProgress
          : CourseStatus.NotStarted,
    };
  }),

    learningPath: raw.learningPaths?.[0] ?? null,

    stats: {
      streakDays: raw.streak ?? 0,
      bicmasCoins: raw.points ?? 0,
      totalLearningHours: raw.learningHours ?? 0,
      completedCourses: raw.coursesDone ?? 0,
      averageScore: raw.averageScore ?? 0,

      // Monday-first defensive mapping
      weeklyActivity: [
        activity.Mon || 0,
        activity.Tue || 0,
        activity.Wed || 0,
        activity.Thu || 0,
        activity.Fri || 0,
        activity.Sat || 0,
        activity.Sun || 0,
      ],

      scoreTrend: 0,
      completedCoursesTrend: 0,
      badges: [],
    },
  };
}

/**
 * Sync SCORM progress, then reload dashboard
 */
export async function syncProgressAndRefresh(
  progressId: string,
): Promise<LearnerDashboardViewModel> {
  const token = getAccessToken();

  const res = await fetch(
    `https://bicmas-academy-main-backend-production.up.railway.app/api/v1/attempts/${progressId}/sync-progress`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) {
    throw new Error("Failed to sync progress");
  }

  // After sync, refetch dashboard so aggregates update
  return fetchLearnerDashboard();
}
