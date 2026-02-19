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
  courses: Course[];
  stats: UserStats;

  currentCourse?: {
    course: any | null;
    attempt?: {
      id: string;
      courseId?: string | null;
      completionPercentage?: number;
      status?: string;
    } | null;
  };
  
  learningPath: LearningPath | null;
}

export interface RawScormScore {
  id: string;
  completionPercentage: number;
  scormCloudScoreScaled: number | null;
  displayTitle: string;
  cloudScore?: {
    totalSecondsTracked?: number;
  }
}


/**
 * Fetch dashboard and map backend → UI-friendly shape
 */
export async function fetchLearnerDashboard(): Promise<LearnerDashboardViewModel> {
  const token = getAccessToken();

  const [dashboardRes, scormRes] = await Promise.all([
    fetch(
      "https://bicmas-academy-main-backend-production.up.railway.app/api/v1/dashboard/learner",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    ),
    fetch(
      "https://bicmas-academy-main-backend-production.up.railway.app/api/v1/scorm-packages/user/scorm-scores",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    ),
  ]);

  if (!dashboardRes.ok) {
    throw new Error("Failed to load learner dashboard");
  }

  if (!scormRes.ok) {
    throw new Error("Failed to load SCORM scores");
  }

  const raw: RawLearnerDashboardPayload = await dashboardRes.json();
  const scormJson = await scormRes.json();

  const scormData = scormJson?.data ?? [];

  /**
   * Build lookup by title (case-insensitive)
   * SCORM displayTitle ≈ course.title in assignments
   */
  const scormMap = new Map<
    string,
    {
      completionPercentage: number;
      scaledScore: number | null;
      totalSeconds: number;
    }
  >();

  scormData.forEach((item: any) => {
    scormMap.set(item.displayTitle.toLowerCase(), {
      completionPercentage: item.completionPercentage ?? 0,
      scaledScore: item.scormCloudScoreScaled ?? null,
      totalSeconds: item.cloudScore?.totalSecondsTracked ?? 0,
    });
  });

  /**
   * Map unfinished assignments → Course[]
   * Progress priority:
   * 1) SCORM progress (if matched)
   * 2) currentCourse attempt (if same course)
   * 3) 0
   */
  const currentAttempt = raw.currentCourse?.attempt;

  const courses: Course[] = (raw.unfinishedCourses ?? []).map((assignment) => {
    const titleKey = assignment.course.title.toLowerCase();
    const scorm = scormMap.get(titleKey);

    let progress = scorm?.completionPercentage ?? 0;

    if (
      progress === 0 &&
      currentAttempt?.courseId === assignment.courseId
    ) {
      progress = currentAttempt.completionPercentage ?? 0;
    }

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
  });

  /**
   * Aggregate learning hours from SCORM time
   */
  const totalSeconds = scormData.reduce(
    (sum: number, item: any) =>
      sum + (item.cloudScore?.totalSecondsTracked ?? 0),
    0
  );

  const totalLearningHours = Math.round(totalSeconds / 3600);

  /**
   * Average scaled score (ignore nulls)
   */
  const scoredItems = scormData.filter(
    (item: any) => item.scormCloudScoreScaled != null
  );

  const averageScore =
    scoredItems.length > 0
      ? Math.round(
          scoredItems.reduce(
            (sum: number, item: any) =>
              sum + (item.scormCloudScoreScaled ?? 0),
            0
          ) / scoredItems.length
        )
      : raw.averageScore ?? 0;

  const activity = raw.learningActivity || {};

  return {
    courses,

    learningPath: raw.learningPaths?.[0] ?? null,

    currentCourse: {
      course: raw.currentCourse?.course ?? null,
      attempt: raw.currentCourse?.attempt ?? null,
    },

    stats: {
      streakDays: raw.streak ?? 0,
      bicmasCoins: raw.points ?? 0,
      totalLearningHours,
      completedCourses: raw.coursesDone ?? 0,
      averageScore,

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
