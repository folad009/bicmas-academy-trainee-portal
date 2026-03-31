import { useQuery } from "@tanstack/react-query";
import { fetchAssignedCourses } from "@/api/assignedCourses";
import { getApiV1BaseUrl } from "@/config/api";
import { mapAssignedCourse } from "@/mappers/assignedCourseMapper";
import { getDownloadedCourses } from "@/utils/offlineCourses";
import { fetchWithAuthRetry } from "@/utils/fetchWithAuthRetry";
import { Course, CourseStatus } from "@/types";

const BASE_URL = getApiV1BaseUrl();

const normalizeProgress = (progress?: number) => {
  if (typeof progress !== "number") return 0;
  const percent = progress > 0 && progress <= 1 ? progress * 100 : progress;
  return Math.min(100, Math.max(0, Math.round(percent)));
};

const deriveStatus = (progress: number): CourseStatus => {
  if (progress >= 100) return CourseStatus.Completed;
  if (progress > 0) return CourseStatus.InProgress;
  return CourseStatus.NotStarted;
};

const statusRank: Record<CourseStatus, number> = {
  [CourseStatus.NotStarted]: 0,
  [CourseStatus.InProgress]: 1,
  [CourseStatus.Completed]: 2,
};

const pickMostAdvancedStatus = (
  ...statuses: Array<CourseStatus | undefined>
): CourseStatus => {
  let best = CourseStatus.NotStarted;
  for (const status of statuses) {
    if (status && statusRank[status] > statusRank[best]) {
      best = status;
    }
  }
  return best;
};

export const useLibrary = (dashboardCourses: Course[]) => {
  return useQuery({
    queryKey: [
      "assignedCourses",
      dashboardCourses.map((c) => ({
        id: c.id,
        progress: c.progress,
      })),
    ],
    queryFn: async () => {
      const assignments = await fetchAssignedCourses();

      let scormScores: any[] = [];
      try {
        const scormRes = await fetchWithAuthRetry(
          `${BASE_URL}/scorm-packages/user/scorm-scores`,
        );
        if (scormRes.ok) {
          const scormJson = await scormRes.json();
          const raw = scormJson?.data;
          scormScores = Array.isArray(raw) ? raw : raw ? [raw] : [];
        }
      } catch {
        // Keep library usable even if SCORM scores endpoint fails.
      }

      return { assignments, scormScores };
    },
    enabled: dashboardCourses.length > 0,
    select: ({ assignments, scormScores }) => {
      const downloadedIds = getDownloadedCourses();
      const scormByPackageId = new Map<string, number>();
      const scormByCourseId = new Map<string, number>();
      const scormByTitle = new Map<string, number>();

      scormScores.forEach((item: any) => {
        const score = normalizeProgress(
          item?.completionPercentage ?? item?.scormCloudCompletion ?? 0,
        );
        if (item?.scormPackageId) {
          scormByPackageId.set(item.scormPackageId, score);
        }
        if (item?.courseId) {
          scormByCourseId.set(item.courseId, score);
        }
        const titleKey = String(item?.displayTitle ?? "")
          .trim()
          .toLowerCase();
        if (titleKey) {
          scormByTitle.set(titleKey, score);
        }
      });

      return assignments.map(mapAssignedCourse).map((course) => {
        const match = dashboardCourses.find((c) => c.id === course.id);
        const scormProgressByPackage = course.scormPackageId
          ? scormByPackageId.get(course.scormPackageId) ?? 0
          : 0;
        const scormProgressByCourse = scormByCourseId.get(course.id) ?? 0;
        const scormProgressByTitle = scormByTitle.get(course.title.trim().toLowerCase()) ?? 0;

        // Keep the highest known progress from both APIs.
        const progress = normalizeProgress(
          Math.max(
            course.progress ?? 0,
            match?.progress ?? 0,
            scormProgressByPackage,
            scormProgressByCourse,
            scormProgressByTitle,
          ),
        );
        const status = pickMostAdvancedStatus(
          course.status,
          match?.status,
          deriveStatus(progress),
        );

        return {
          ...course,
          progress,
          status,
          isDownloaded: downloadedIds.includes(course.id),
        };
      });
    },
  });
};
