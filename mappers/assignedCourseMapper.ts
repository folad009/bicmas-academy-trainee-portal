import { Course, CourseStatus } from "@/types";

export function mapAssignedCourse(assignment: any): Course {
  const course = assignment.course;
  const modules = course.modules ?? [];

  return {
    id: course.id,

    title: course.title,
    description: course.description ?? "",
    thumbnail: "/course-placeholder.png",

    category: "Mandatory", // backend does not classify yet
    status:
      assignment.progress === 100
        ? CourseStatus.Completed
        : assignment.progress > 0
        ? CourseStatus.InProgress
        : CourseStatus.NotStarted,

    progress: assignment.attempt?.completionPercentage ?? 0,

    totalModules: modules.length,
    completedModules: 0, // backend does not provide this yet

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
