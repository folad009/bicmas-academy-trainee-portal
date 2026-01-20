import { Course, PlayerModule } from "@/types";



export function mapCourseToPlayerModules(course:Course): PlayerModule[] {
    return course.modules.map((module) => ({
        id: module.id,
        title: module.title,
        lessons: module.lessons.map((lesson) => ({
            id: lesson.id,
            title: lesson.title,
            scormPackegeId: lesson.scormPackageId,
            isCompleted: false
        }))
    }))
}