import { useQuery } from "@tanstack/react-query";
import { fetchAssignedCourses } from "@/api/assignedCourses";
import { mapAssignedCourse } from "@/mappers/assignedCourseMapper";
import { getDownloadedCourses } from "@/utils/offlineCourses";
import { Course, CourseStatus } from "@/types";

const normalizeProgress = (progress?: number) => {
  if (typeof progress !== "number") return 0;
  return Math.min(100, Math.max(0, Math.round(progress)));
};

const deriveStatus = (progress: number): CourseStatus => {
  if (progress >= 100) return CourseStatus.Completed;
  if (progress > 0) return CourseStatus.InProgress;
  return CourseStatus.NotStarted;
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
    queryFn: fetchAssignedCourses,
    enabled: dashboardCourses.length > 0,
    select: (assignments) => {
      const downloadedIds = getDownloadedCourses();
      return assignments.map(mapAssignedCourse).map((course) => {
        const match = dashboardCourses.find((c) => c.id === course.id);
        
        const progress = normalizeProgress(match?.progress ?? 0);

        return {
          ...course,
          progress,
          status: deriveStatus(progress),
          isDownloaded: downloadedIds.includes(course.id),
        };
      });
    },
  });
};
