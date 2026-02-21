import { useQueryClient } from "@tanstack/react-query";
import { Course } from "@/types";

const normalizeProgress = (progress?: number) => {
  if (typeof progress !== "number") return 0;
  return Math.min(100, Math.max(0, Math.round(progress)));
};

const updateCourseProgress = (
  courses: Course[],
  courseId: string,
  progress: number,
  completedModules: number
) => {
  const safeProgress = normalizeProgress(progress);

  return courses.map((c) =>
    c.id === courseId
      ? {
          ...c,
          progress: safeProgress,
          completedModules,
        }
      : c
  );
};

export const useProgressUpdate = () => {
  const queryClient = useQueryClient();

  const updateProgress = (
    courseId: string,
    progress: number,
    completedModules: number
  ) => {
    queryClient.setQueryData(["dashboard"], (old: any) => {
      if (!old) return old;

      return {
        ...old,
        courses: updateCourseProgress(
          old.courses,
          courseId,
          progress,
          completedModules
        ),
      };
    });

    if (progress === 100) {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  };

  return updateProgress;
};
