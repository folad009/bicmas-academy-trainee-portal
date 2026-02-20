import { Course, CourseStatus } from "@/types";

function normalizeProgress(value?: number) {
  if (typeof value !== "number") return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function deriveStatus(progress: number): CourseStatus {
  if (progress >= 100) return CourseStatus.Completed;
  if (progress > 0) return CourseStatus.InProgress;
  return CourseStatus.NotStarted;
}

export function mapAssignedCourse(assignment: any): Course {
  const course = assignment.course;
  const modules = course.modules ?? [];

  // Single source of truth
  const progress = normalizeProgress(
    assignment.attempt?.completionPercentage ?? assignment.progress ?? 0,
  );

  return {
    id: assignment.course.id,

    title: course.title,
    description: course.description ?? "",
    thumbnail: "/course-placeholder.png",

    category: "Mandatory",

    // Status derived from SAME progress value
    status: deriveStatus(progress),

    progress,

    totalModules: modules.length,
    completedModules: 0,

    deadline: assignment.dueDate,
    isDownloaded: false,

    modules: modules.map((m: any) => ({
      id: m.id,
      title: m.name,
      lessons: m.lessons.map((l: any) => ({
        id: l.id,
        title: l.title,
        scormPackageId: l.scormPackageId,
      })),
    })),
  };
}
