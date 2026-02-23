import { useQueryClient } from "@tanstack/react-query";
import { syncCourseAttempt } from "@/api/attempts";
import { CourseStatus } from "@/types";

const mapStatus = (status: string, pct: number): CourseStatus => {
  if (pct >= 100 || status === "COMPLETED") return CourseStatus.Completed;
  if (pct > 0 || status === "IN_PROGRESS") return CourseStatus.InProgress;
  return CourseStatus.NotStarted;
};

export const useAttemptSync = () => {
  const queryClient = useQueryClient();

  const syncAttempt = async (attemptId: string, courseId: string) => {
    const data = await syncCourseAttempt(attemptId);

    const pct = data.completionPercentage ?? 0;
    const status = data.status;

    // Update dashboard cache immediately (single source of truth)
    queryClient.setQueryData(["dashboard"], (old: any) => {
      if (!old?.courses) return old;

      return {
        ...old,
        courses: old.courses.map((course: any) => {
          if (course.id !== courseId) return course;

          return {
            ...course,
            progress: pct,
            status: mapStatus(status, pct),
          };
        }),
      };
    });

    // ❗ Do NOT invalidate immediately
    // Backend may still be stale

    return data;
  };

  return syncAttempt;
};