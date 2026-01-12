import { LearningPath, LearningPathStep } from "@/types";
import { BackendLearningPath } from "@/api/learningPaths";

export function mapLearningPath(
  backendPath: BackendLearningPath
): LearningPath {
  const steps: LearningPathStep[] = backendPath.curriculumSequence.map(
    (courseId, index) => ({
      id: `${backendPath.id}-${courseId}`,
      courseId,
      title: `Step ${index + 1}`,
      description: "Part of this learning path",
      type: "course",
      status: index === 0 ? "in-progress" : "locked",
      estimatedTime: undefined,
    })
  );

  return {
    id: backendPath.id,
    title: backendPath.title,
    description: backendPath.description,
    progress: 0,
    totalSteps: steps.length,
    completedSteps: 0,
    steps,
  };
}
