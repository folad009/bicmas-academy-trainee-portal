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
        headers: { Authorization: `Bearer ${token}` },
      }
    ),
    fetch(
      "https://bicmas-academy-main-backend-production.up.railway.app/api/v1/scorm-packages/user/scorm-scores",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    ),
  ]);

  if (!dashboardRes.ok) throw new Error("Failed to load learner dashboard");
  if (!scormRes.ok) throw new Error("Failed to load SCORM scores");

  const raw: RawLearnerDashboardPayload = await dashboardRes.json();
  const scormJson = await scormRes.json();

  const scormData = scormJson?.data ?? [];

  /**
   * ---------------------------------------------------
   * 1) Build SCORM lookup by PACKAGE ID (single truth)
   * ---------------------------------------------------
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
    scormMap.set(item.scormPackageId, {
      completionPercentage: item.completionPercentage ?? 0,
      scaledScore: item.scormCloudScoreScaled ?? null,
      totalSeconds: item.cloudScore?.totalSecondsTracked ?? 0,
    });
  });

  /**
   * ---------------------------------------------------
   * 2) Helper: extract course-level packageId
   * (because backend doesn't provide it)
   * ---------------------------------------------------
   */
  const getCourseScormPackageId = (course: any): string | null => {
    if (!course?.modules) return null;

    for (const module of course.modules) {
      for (const lesson of module.lessons ?? []) {
        if (lesson.scormPackageId) {
          return lesson.scormPackageId;
        }
      }
    }

    return null;
  };

  /**
   * ---------------------------------------------------
   * 3) Current attempt fallback
   * ---------------------------------------------------
   */
  const currentAttempt = raw.currentCourse?.attempt;

  /**
   * ---------------------------------------------------
   * 4) Map assignments → Courses
   * Priority:
   *   SCORM score
   *   → current attempt
   *   → 0
   * ---------------------------------------------------
   */
  const courses: Course[] = (raw.unfinishedCourses ?? []).map((assignment) => {
    const course = assignment.course;

    const scormPackageId = getCourseScormPackageId(course);

    // Primary source: SCORM scores
    let progress = scormPackageId
      ? scormMap.get(scormPackageId)?.completionPercentage ?? 0
      : 0;

    // Fallback: current active attempt
    if (
      progress === 0 &&
      currentAttempt?.scormPackageId &&
      currentAttempt.scormPackageId === scormPackageId
    ) {
      progress = currentAttempt.completionPercentage ?? 0;
    }

    return {
      ...course,
      assignmentId: assignment.id,
      dueDate: assignment.dueDate,
      scormPackageId,
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
   * ---------------------------------------------------
   * 5) Stats from SCORM data
   * ---------------------------------------------------
   */
  const totalSeconds = scormData.reduce(
    (sum: number, item: any) =>
      sum + (item.cloudScore?.totalSecondsTracked ?? 0),
    0
  );

  const totalLearningHours = Math.round(totalSeconds / 3600);

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

  /**
   * ---------------------------------------------------
   * 6) Final ViewModel
   * ---------------------------------------------------
   */
  return {
    courses,

    learningPath: raw.learningPaths?.[0] ?? null,

    currentCourse: {
      course: raw.currentCourse?.course ?? null,
      attempt: currentAttempt ?? null,
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
  attemptId: string,
): Promise<LearnerDashboardViewModel> {
  const token = getAccessToken();

  const res = await fetch(
    `https://bicmas-academy-main-backend-production.up.railway.app/api/v1/attempts/${attemptId}/sync-progress`,
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
