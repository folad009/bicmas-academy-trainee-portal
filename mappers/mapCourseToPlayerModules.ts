import { Course, PlayerModule } from "../types";

export function mapCourseToPlayerModules(course: Course): PlayerModule[] {
  return course.modules.map((module) => ({
    id: module.id,
    title: module.title,
    duration: module.duration || "5", // fallback
    isCompleted: module.isCompleted || false,
    lessons: module.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      isCompleted: lesson.isCompleted || false,

      estimatedDuration: lesson.estimatedDuration ?? 300,

      // 🔥 THE FIX: normalize the typo once and forever
      scormPackageId:
        (lesson as any).scormPackageId ||
        (lesson as any).scormPackegeId ||
        null,
    })),
  }));
}
