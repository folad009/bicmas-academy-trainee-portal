import React, { useState, useEffect, useRef } from "react";
import { Course, PlayerModule } from "../types";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  CheckCircle,
  X,
  Sparkles,
  Lock,
  Award,
  Download,
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
    completedModules: number,
  ) => void;
  onViewCertificate: () => void;
}

export const ScormPlayer: React.FC<ScormPlayerProps> = ({
  course,
  onBack,
  onUpdateProgress,
  onViewCertificate,
}) => {
  const [modules, setModules] = useState<PlayerModule[]>(
    mapCourseToPlayerModules(course),
  );
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const activeModule = modules[activeModuleIndex];
  const activeLesson = activeModule?.lessons[activeLessonIndex];

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCourseCompleted, setIsCourseCompleted] = useState(false);

  const [launchUrl, setLaunchUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const lastReportedProgress = useRef<number | null>(null);

  const isLessonCompleted = !!activeLesson?.isCompleted;


 const { totalLessons, completedLessons, progress } = React.useMemo(() => {
  const total = modules.reduce(
    (sum, m) => sum + m.lessons.length,
    0
  );

  const completed = modules.reduce(
    (sum, m) => sum + m.lessons.filter((l) => l.isCompleted).length,
    0
  );

  const pct = total ? Math.round((completed / total) * 100) : 0;

  return {
    totalLessons: total,
    completedLessons: completed,
    progress: pct,
  };
}, [modules]);



  // Load SCORM
  useEffect(() => {
    if (!activeLesson) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const { launchUrl } = await fetchScormLaunchUrl(
          activeLesson.scormPackageId,
        );
        setLaunchUrl(launchUrl);
      } catch {
        setError("Failed to load SCORM package");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [activeLesson]);

  const handleMarkLessonComplete = () => {
    setModules((prev) =>
      prev.map((m, mi) => {
        if (mi !== activeModuleIndex) return m;

        const updatedLessons = m.lessons.map((l, li) =>
          li === activeLessonIndex ? { ...l, isCompleted: true } : l,
        );

        return {
          ...m,
          lessons: updatedLessons,
          isCompleted: updatedLessons.every((l) => l.isCompleted),
        };
      }),
    );
  };

  // Listen to SCORM messages
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (!event.data?.type) return;

      if (event.data.type === "SCORM_COMPLETED") {
        handleMarkLessonComplete();
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [activeModuleIndex, activeLessonIndex]);

  useEffect(() => {
    if (course.status === "COMPLETED") return;

    if (lastReportedProgress.current === progress) return;
    lastReportedProgress.current = progress;

    onUpdateProgress(course.id, progress, completedLessons);

    syncCourseAttempt(course.id, progress).catch(console.error);
  }, [progress, completedLessons]);

  useEffect(() => {
    const onUnload = () => {
      if (lastReportedProgress.current != null) {
        syncCourseAttempt(course.id, lastReportedProgress.current);
      }
    };

    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [course.id]);

  useEffect(() => {
  if (progress === 100) {
    setIsCourseCompleted(true);
  }
}, [progress]);

  const canGoNext = isLessonCompleted;
  const canGoPrev =
    isLessonCompleted && (activeLessonIndex > 0 || activeModuleIndex > 0);

  const handlePrev = () => {
    if (!canGoPrev) return;

    if (activeLessonIndex > 0) {
      setActiveLessonIndex((i) => i - 1);
      return;
    }

    if (activeModuleIndex > 0) {
      const prevModuleIndex = activeModuleIndex - 1;
      const prevModule = modules[prevModuleIndex];
      setActiveModuleIndex(prevModuleIndex);
      setActiveLessonIndex(prevModule.lessons.length - 1);
    }
  };

  const handleNext = () => {
    if (!canGoNext) return;

    if (activeLessonIndex < activeModule.lessons.length - 1) {
      setActiveLessonIndex((i) => i + 1);
      return;
    }

    if (activeModuleIndex < modules.length - 1) {
      setActiveModuleIndex((i) => i + 1);
      setActiveLessonIndex(0);
      return;
    }

    setIsCourseCompleted(true);
  };

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
                const locked =
                  mi > activeModuleIndex ||
                  (mi === activeModuleIndex && li > activeLessonIndex);

                return (
                  <button
                    key={l.id}
                    disabled={locked}
                    onClick={() => {
                      setActiveModuleIndex(mi);
                      setActiveLessonIndex(li);
                    }}
                    className="block w-full text-left px-6 py-2 disabled:opacity-40"
                  >
                    {l.isCompleted ? "✔" : locked ? "🔒" : "•"} {l.title}
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

      <footer className="p-4 border-t flex justify-between">
        {!isLessonCompleted && (
          <button
            onClick={handleMarkLessonComplete}
            className="px-6 py-2 rounded bg-green-600 text-white flex items-center gap-2"
          >
            <CheckCircle size={18} />
            Mark as complete
          </button>
        )}

        {isLessonCompleted && (
          <div className="flex gap-2">
            <button
              onClick={handlePrev}
              disabled={!canGoPrev}
              className="px-6 py-2 rounded bg-gray-600 text-white disabled:opacity-40"
            >
              Previous
            </button>

            <button
              onClick={handleNext}
              className="px-6 py-2 rounded bg-blue-600 text-white"
            >
              {progress === 100 ? "Complete Course" : "Next Lesson"}
            </button>
          </div>
        )}
      </footer>
    </div>
  );
};
