import { Course, CourseStatus } from "@/types";

function normalizeProgress(value?: number) {
  if (typeof value !== "number") return 0;
  const percent = value > 0 && value <= 1 ? value * 100 : value;
  return Math.min(100, Math.max(0, Math.round(percent)));
}

function deriveStatus(
  progress: number,
  rawStatus?: string | null,
  hasAttempt?: boolean,
): CourseStatus {
  if (progress >= 100) return CourseStatus.Completed;
  if (progress > 0) return CourseStatus.InProgress;
  if (rawStatus === "COMPLETED") return CourseStatus.Completed;
  if (rawStatus === "IN_PROGRESS") return CourseStatus.InProgress;
  if (hasAttempt) return CourseStatus.InProgress;
  return CourseStatus.NotStarted;
}

export function mapAssignedCourse(assignment: any): Course {
  const course = assignment.course;
  const modules = course.modules ?? [];

  const progress = normalizeProgress(
    assignment.attempt?.completionPercentage ??
      assignment.completionPercentage ??
      assignment.scormCloudCompletion ??
      assignment.progress ??
      0,
  );
  const rawStatus =
    assignment.attempt?.status ??
    assignment.status ??
    assignment.progressStatus ??
    assignment.scormStatus;
  const hasAttempt = Boolean(
    assignment.attempt?.id ??
      assignment.attemptId ??
      assignment.scormCloudRegistrationId,
  );

  // 🔑 Extract a course-level scormPackageId
  const scormPackageId =
    assignment.scormPackageId ??
    assignment.scormPackage?.id ??
    assignment.attempt?.scormPackageId ??
    course.scormPackageId ??
    course.scormPackage?.id ??
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
    status: deriveStatus(progress, rawStatus, hasAttempt),
    progress,

    totalModules: modules.length,
    completedModules: 0,

    deadline: assignment.dueDate,
    isDownloaded: false,

    modules: modules.map((m: any) => ({
      id: m.id,
      title: m.name,
      lessons: (m.lessons ?? []).map((l: any) => ({
        id: l.id,
        title: l.title,
        scormPackageId: l.scormPackageId,
      })),
    })),
  };
}

