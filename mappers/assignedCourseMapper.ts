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

  const progress = normalizeProgress(
    assignment.attempt?.completionPercentage ?? assignment.progress ?? 0,
  );

  // 🔑 Extract a course-level scormPackageId
  const scormPackageId =
    modules
      ?.flatMap((m: any) => m.lessons ?? [])
      ?.find((l: any) => l.scormPackageId)
      ?.scormPackageId ?? null;

  return {
    id: assignment.course.id,
    scormPackageId, // <-- CRITICAL

    title: course.title,
    description: course.description ?? "",
    thumbnail: course.imageUrl ?? null,

    category: "Mandatory",
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

