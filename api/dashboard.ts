import { Course, LearningPath, UserStats } from "../types";
import { getAccessToken } from "../utils/auth";

export interface RawLearnerDashboardPayload {
  streak: number;
  points: number;
  learningHours: number;
  coursesDone: number;
  averageScore: number;
  learningPaths: LearningPath[];
  learningActivity: Record<string, number>;
  currentCourse: Course | null;
  unfinishedCourses: Course[];
}

export interface LearnerDashboardViewModel {
  courses: Course[];
  learningPath: LearningPath | null;
  stats: UserStats;
}

export async function fetchLearnerDashboard(): Promise<LearnerDashboardViewModel> {
  const token = getAccessToken();

  const res = await fetch(
    "https://bicmas-academy-main-backend-production.up.railway.app/api/v1/dashboard/learner",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error("Failed to load learner dashboard");
  }

  const raw: RawLearnerDashboardPayload = await res.json();

  return {
    courses: raw.unfinishedCourses ?? [],
    learningPath: raw.learningPaths?.[0] ?? null,
    stats: {
      streakDays: raw.streak,
      bicmasCoins: raw.points,
      totalLearningHours: raw.learningHours,
      completedCourses: raw.coursesDone,
      averageScore: raw.averageScore,
      weeklyActivity: [
        raw.learningActivity.Mon,
        raw.learningActivity.Tue,
        raw.learningActivity.Wed,
        raw.learningActivity.Thu,
        raw.learningActivity.Fri,
        raw.learningActivity.Sat,
        raw.learningActivity.Sun,
      ],
      scoreTrend: 0,
      completedCoursesTrend: 0,
      badges: [],
    },
  };
}
