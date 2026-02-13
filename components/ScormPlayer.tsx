import React, { useState, useEffect, useRef } from "react";
import { Course, PlayerModule } from "../types";
import {
  ChevronLeft,
  Menu,
  CheckCircle,
  X,
  Award,
  Download,
  LockIcon,
  BookAIcon,
} from "lucide-react";
import { mapCourseToPlayerModules } from "@/mappers/mapCourseToPlayerModules";
import { fetchScormLaunchUrl } from "@/api/scorm";
import { syncCourseAttempt } from "@/api/attempts";

interface ScormPlayerProps {
  course: Course;
  onBack: () => void;
  onUpdateProgress: (
    courseId: string,
    progress: number,
    completedLessons: number,
  ) => void;
  onViewCertificate: () => void;
}

// Change to your actual SCORM Cloud origin if different
const SCORM_ORIGIN = "https://cloud.scorm.com";

export const ScormPlayer: React.FC<ScormPlayerProps> = ({
  course,
  onBack,
  onUpdateProgress,
  onViewCertificate,
}) => {
  // ----------------------------
  // Core state
  // ----------------------------
  const [modules, setModules] = useState<PlayerModule[]>(
    mapCourseToPlayerModules(course),
  );

  useEffect(() => {
    setModules(mapCourseToPlayerModules(course));
  }, [course]);

  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);

  const activeModule = modules[activeModuleIndex];
  const activeLesson = activeModule?.lessons[activeLessonIndex];

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCourseCompleted, setIsCourseCompleted] = useState(false);

  const [launchUrl, setLaunchUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // SCORM identity
  const [scormAttemptId, setScormAttemptId] = useState<string | null>(null);

  // ----------------------------
  // Refs (event-safe state)
  // ----------------------------
  const scormAttemptIdRef = useRef<string | null>(null);
  const lastReportedProgress = useRef<number | null>(null);

  const isLessonUnlocked = (moduleIndex: number, lessonIndex: number) => {
    const module = modules[moduleIndex];
    const lesson = module.lessons[lessonIndex];

    let reason = "LOCKED";

    // First lesson of first module
    if (moduleIndex === 0 && lessonIndex === 0) {
      reason = "First lesson";
      console.log(`[UNLOCK] ${lesson.title} → ${reason}`);
      return true;
    }

    // Already completed
    if (lesson.isCompleted) {
      reason = "Already completed";
      console.log(`[UNLOCK] ${lesson.title} → ${reason}`);
      return true;
    }

    // Previous lesson in same module
    if (lessonIndex > 0) {
      const prevCompleted = module.lessons[lessonIndex - 1].isCompleted;
      reason = prevCompleted
        ? "Previous lesson completed"
        : "Previous lesson NOT completed";

      console.log(`[CHECK] ${lesson.title} → ${reason}`, {
        moduleIndex,
        lessonIndex,
        prevCompleted,
      });

      return prevCompleted;
    }

    // First lesson of module → check previous module
    const prevModule = modules[moduleIndex - 1];
    if (!prevModule) return false;

    const prevModuleCompleted = prevModule.lessons.every((l) => l.isCompleted);

    reason = prevModuleCompleted
      ? "Previous module completed"
      : "Previous module NOT completed";

    console.log(`[CHECK] ${lesson.title} → ${reason}`, {
      moduleIndex,
      lessonIndex,
      prevModuleCompleted,
    });

    return prevModuleCompleted;
  };

  const lessonStartTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    lessonStartTimeRef.current = Date.now();
  }, [activeLessonIndex, activeModuleIndex]);

  const MIN_LESSON_TIME = 1 * 60 * 1000; // 6 minutes in ms

  const completePreviousLessonIfEligible = (
    targetModuleIndex: number,
    targetLessonIndex: number,
  ) => {
    const timeSpent = Date.now() - lessonStartTimeRef.current;

    // Only care if user is moving forward
    const isMovingForward =
      targetModuleIndex > activeModuleIndex ||
      (targetModuleIndex === activeModuleIndex &&
        targetLessonIndex > activeLessonIndex);

    if (!isMovingForward) return;

    if (timeSpent < MIN_LESSON_TIME) {
      console.log(
        "[TIME RULE] Not enough time spent:",
        Math.round(timeSpent / 6000),
        "sec",
      );
      return;
    }

    console.log(
      "[TIME RULE] Completing lesson after",
      Math.round(timeSpent / 60000),
      "minutes",
    );

    console.log("[TIME RULE] timeSpent:", Math.round(timeSpent / 1000), "sec");

    setModules((prevModules) =>
      prevModules.map((m, mi) => {
        if (mi !== activeModuleIndex) return m;

        return {
          ...m,
          lessons: m.lessons.map((l, li) =>
            li === activeLessonIndex ? { ...l, isCompleted: true } : l,
          ),
        };
      }),
    );
  };

  useEffect(() => {
    scormAttemptIdRef.current = scormAttemptId;
  }, [scormAttemptId]);

  // ----------------------------
  // Progress calculation (UI only)
  // ----------------------------
  const { completedLessons, progress } = React.useMemo(() => {
    const total = modules.reduce((sum, m) => sum + m.lessons.length, 0);
    const completed = modules.reduce(
      (sum, m) => sum + m.lessons.filter((l) => l.isCompleted).length,
      0,
    );

    const pct = total ? Math.round((completed / total) * 100) : 0;

    return {
      completedLessons: completed,
      progress: pct,
    };
  }, [modules]);

  // Refs to avoid stale closures
  const completedLessonsRef = useRef(completedLessons);
  const onUpdateProgressRef = useRef(onUpdateProgress);

  useEffect(() => {
    completedLessonsRef.current = completedLessons;
  }, [completedLessons]);

  useEffect(() => {
    onUpdateProgressRef.current = onUpdateProgress;
  }, [onUpdateProgress]);

  // ----------------------------
  // Load SCORM launch URL
  // ----------------------------
  useEffect(() => {
    if (!activeLesson) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        // Reset identity when lesson changes
        setScormAttemptId(null);
        lastReportedProgress.current = null;

        const res = await fetchScormLaunchUrl(activeLesson.scormPackageId);

        setLaunchUrl(res.launchUrl);
        setScormAttemptId(res.scormAttemptId);
      } catch {
        setError("Failed to load SCORM package");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [activeLesson]);

  // ----------------------------
  // Lesson completion logic
  // ----------------------------
  const markLessonCompletedAndAdvance = () => {
    setModules((prevModules) => {
      const newModules = prevModules.map((m, mi) => {
        if (mi !== activeModuleIndex) return m;

        const lessons = m.lessons.map((l, li) =>
          li === activeLessonIndex ? { ...l, isCompleted: true } : l,
        );

        return {
          ...m,
          lessons,
          isCompleted: lessons.every((l) => l.isCompleted),
        };
      });

      const currentModule = newModules[activeModuleIndex];

      if (activeLessonIndex < currentModule.lessons.length - 1) {
        setActiveLessonIndex((i) => i + 1);
      } else if (activeModuleIndex < newModules.length - 1) {
        setActiveModuleIndex((i) => i + 1);
        setActiveLessonIndex(0);
      } else {
        setIsCourseCompleted(true);
      }

      return newModules;
    });
    console.log("[STATE] Marking lesson completed", {
      moduleIndex: activeModuleIndex,
      lessonIndex: activeLessonIndex,
      lesson: modules[activeModuleIndex]?.lessons[activeLessonIndex]?.title,
    });
  };

  useEffect(() => {
    console.log(
      "[MODULE STATE]",
      modules.map((m) => ({
        module: m.title,
        lessons: m.lessons.map((l) => ({
          title: l.title,
          completed: l.isCompleted,
        })),
      })),
    );
  }, [modules]);

  // ----------------------------
  // SCORM message listener
  // Single source of truth
  // ----------------------------
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== SCORM_ORIGIN) return;
      if (!event.data) return;
      if (!scormAttemptIdRef.current) return;

      let data = event.data;
      console.log("[SCORM RAW MESSAGE]", event.data);

      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }

      if (!data.messageType) return;

      switch (data.messageType) {
        case "ScoCompleted":
        case "CourseCompleted":
        case "CoursePassed":
          console.log("[SCORM EVENT] Completion received", data.messageType);
          markLessonCompletedAndAdvance();
          break;

        case "ScoProgress":
        case "CourseProgress": {
          const pct = Math.round((data.progress || 0) * 100);

          lastReportedProgress.current = pct;

          if (pct >= 99) {
            markLessonCompletedAndAdvance();
          }

          onUpdateProgressRef.current(
            course.id,
            pct,
            completedLessonsRef.current,
          );

          syncCourseAttempt(scormAttemptIdRef.current).catch(console.error);
          break;
        }

        case "PlayerExit":
          if (lastReportedProgress.current >= 80) {
            markLessonCompletedAndAdvance();
          }

          syncCourseAttempt(scormAttemptIdRef.current).catch(console.error);
          break;
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [course.id]);

  // ----------------------------
  // Save on tab close
  // ----------------------------
  useEffect(() => {
    const onUnload = () => {
      if (scormAttemptIdRef.current) {
        syncCourseAttempt(scormAttemptIdRef.current);
      }
    };

    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [course.id]);

  // SCORM can send 99 after 100
  useEffect(() => {
    if (progress >= 100) {
      setIsCourseCompleted(true);
    }
  }, [progress]);

  // ----------------------------
  // Completion screen
  // ----------------------------
  if (isCourseCompleted) {
    return (
      <div className="fixed inset-0 bg-slate-50 flex flex-col">
        <header className="bg-white border-b px-6 py-4 flex justify-between">
          <button onClick={onBack}>
            <ChevronLeft size={20} /> Back
          </button>
          <div>{course.title}</div>
          <div />
        </header>

        <main className="flex-1 flex items-center justify-center">
          <div className="bg-white p-12 rounded-xl shadow text-center">
            <Award size={64} className="mx-auto mb-6 text-green-600" />
            <h1 className="text-3xl font-bold mb-4">Course completed</h1>
            <button
              onClick={onViewCertificate}
              className="bg-blue-600 text-white px-6 py-3 rounded"
            >
              <Download size={18} /> Certificate
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ----------------------------
  // Player UI
  // ----------------------------
  return (
    <div className="fixed inset-0 flex flex-col">
      <header className="bg-slate-900 text-white px-4 py-3 flex justify-between">
        <button onClick={onBack}>
          <X size={20} />
        </button>
        <div>{course.title}</div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          <Menu size={20} />
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className={`w-80 border-r ${!isSidebarOpen && "hidden"}`}>
          {modules.map((m, mi) => (
            <div key={m.id}>
              <div className="font-semibold px-3 py-2">{m.title}</div>
              {m.lessons.map((l, li) => {
                const isNextLesson =
                  mi === activeModuleIndex && li === activeLessonIndex + 1;

                const locked = !isLessonUnlocked(mi, li) && !isNextLesson;

                return (
                  <button
                    key={l.id}
                    disabled={locked}
                    onClick={() => {
                      completePreviousLessonIfEligible(mi, li);
                      setActiveModuleIndex(mi);
                      setActiveLessonIndex(li);
                    }}
                    className="block w-full text-left px-6 py-2 disabled:opacity-40 flex items-center gap-2 hover:bg-slate-100 text-[15px]"
                  >
                    {l.isCompleted ? (
                      <CheckCircle size={20} className="text-green-500" />
                    ) : locked ? (
                      <LockIcon size={20} className="text-gray-500" />
                    ) : (
                      <BookAIcon size={20} className="text-gray-400" />
                    )}
                    {l.title}
                  </button>
                );
              })}
            </div>
          ))}
        </aside>

        <main className="flex-1 bg-black">
          {loading && (
            <div className="h-full flex items-center justify-center text-white">
              Loading SCORM...
            </div>
          )}

          {error && (
            <div className="h-full flex items-center justify-center text-red-500">
              {error}
            </div>
          )}

          {!loading && !error && launchUrl && (
            <iframe
              src={launchUrl}
              className="w-full h-full border-0"
              allow="autoplay; fullscreen"
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          )}
        </main>
      </div>

      <footer className="p-4 border-t text-sm text-gray-500 text-center">
        Progress is tracked automatically by the course.
      </footer>
    </div>
  );
};
