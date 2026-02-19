import React, { useState, useEffect, useRef } from "react";
import { Course, PlayerModule } from "../types";
import {
  ChevronLeft,
  Menu,
  X,
  Award,
  Download,
  BookAIcon,
  ArrowBigLeft,
  ArrowLeft,
  ArrowLeftCircle,
  CheckCircle,
} from "lucide-react";
import { mapCourseToPlayerModules } from "@/mappers/mapCourseToPlayerModules";
import { fetchScormLaunchUrl } from "@/api/scorm";
import { syncCourseAttempt, updateCourseAttempt } from "@/api/attempts";

const BASE_URL =
  "https://bicmas-academy-main-backend-production.up.railway.app/api/v1";

interface ScormPlayerProps {
  course: Course;
  onBack: () => void;
  onUpdateProgress: (
    courseId: string,
    progress: number,
    completedLessons: number,
  ) => void;
  onViewCertificate: () => void;
  onRefreshDashboard?: () => Promise<void>;
}

const SCORM_ORIGIN = "https://cloud.scorm.com";

export const ScormPlayer: React.FC<ScormPlayerProps> = ({
  course,
  onBack,
  onUpdateProgress,
  onViewCertificate,
  onRefreshDashboard,
}) => {
  // ----------------------------
  // Course structure (navigation only)
  // ----------------------------

  const navigationTriggeredRef = useRef(false);

  const [modules, setModules] = useState<PlayerModule[]>([]);

  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);

  const activeModule = modules[activeModuleIndex];
  const activeLesson = activeModule?.lessons[activeLessonIndex];

  // ----------------------------
  // UI state
  // ----------------------------
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [launchUrl, setLaunchUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ----------------------------
  // SCORM state (source of truth)
  // ----------------------------
  const [scormAttemptId, setScormAttemptId] = useState<string | null>(null);
  const [scormProgress, setScormProgress] = useState(0);

  const scormAttemptIdRef = useRef<string | null>(null);
  const lastReportedProgress = useRef<number>(0);
  const onUpdateProgressRef = useRef(onUpdateProgress);
  const syncTimeoutRef = useRef<number | null>(null);

  const lastSavedProgress = useRef<number>(0);
  const saveTimeoutRef = useRef<number | null>(null);

  const [completedModules, setCompletedModules] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    if (!course?.modules) {
      console.warn("Course has no modules. Full course data required.");
      setModules([]);
      return;
    }

    setModules(mapCourseToPlayerModules(course));
  }, [course]);

  useEffect(() => {
    scormAttemptIdRef.current = scormAttemptId;
  }, [scormAttemptId]);

  useEffect(() => {
    onUpdateProgressRef.current = onUpdateProgress;
  }, [onUpdateProgress]);

  useEffect(() => {
    setActiveModuleIndex(0);
    setActiveLessonIndex(0);
  }, [course]);

  useEffect(() => {
    console.log("COURSE PASSED TO PLAYER:", course);
  }, [course]);

  // ----------------------------
  // Debounced sync (important)
  // ----------------------------
  const scheduleSaveProgress = (pct: number) => {
    if (pct <= lastSavedProgress.current) return;

    lastSavedProgress.current = pct;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(async () => {
      try {
        console.log("Saving LMS progress:", pct);
        await updateCourseAttempt(course.id, pct);
      } catch (e) {
        console.error("Progress save failed", e);
      }
    }, 1000);
  };

  const scheduleCloudSync = (attemptId: string) => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = window.setTimeout(() => {
      syncCourseAttempt(attemptId).catch(console.error);
    }, 5000);
  };

  const markModuleCompletedIfFinished = (moduleIndex: number) => {
    const module = modules[moduleIndex];
    if (!module) return;

    setCompletedModules((prev) => {
      if (prev.has(module.id)) return prev;
      const next = new Set(prev);
      next.add(module.id);
      return next;
    });
  };

  const handleNextNavigation = () => {
    const module = modules[activeModuleIndex];
    if (!module) return;

    if (activeLessonIndex < module.lessons.length - 1) {
      setActiveLessonIndex((i) => i + 1);
      return;
    }

    markModuleCompletedIfFinished(activeModuleIndex);

    if (activeModuleIndex < modules.length - 1) {
      setActiveModuleIndex((i) => i + 1);
      setActiveLessonIndex(0);
      return;
    }

    onViewCertificate();
  };

  const goToModule = (moduleIndex: number, lessonIndex: number) => {
    if (moduleIndex > activeModuleIndex) {
      markModuleCompletedIfFinished(activeModuleIndex);
    }
    setActiveModuleIndex(moduleIndex);
    setActiveLessonIndex(lessonIndex);
  };

  const handleSessionEnded = async () => {
    // console.log("[SCORM] Session ended");

    const pct = lastReportedProgress.current;

    try {
      await updateCourseAttempt(course.id, pct);

      if (scormAttemptIdRef.current) {
        await syncCourseAttempt(scormAttemptIdRef.current);
      }

      await onRefreshDashboard();
    } catch (e) {
      console.error("Final save failed", e);
    }

    handleNextNavigation();
  };

  // ----------------------------
  // Load SCORM launch URL
  // ----------------------------
  useEffect(() => {
    if (!activeLesson) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        setScormAttemptId(null);
        setScormProgress(0);
        lastReportedProgress.current = 0;
        lastSavedProgress.current = 0;

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
  // SCORM message listener
  // Observer only – no completion logic
  // ----------------------------
  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      if (event.data?.type === "SCORM_SESSION_ENDED") {
        await handleSessionEnded();
        return;
      }

      if (event.origin !== SCORM_ORIGIN) return;
      if (!event.data) return;
      if (!scormAttemptIdRef.current) return;

      let data = event.data;

      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }

      if (!data.messageType) return;

      console.log("[SCORM EVENT]", data.messageType, data);

      switch (data.messageType) {
        case "ScoProgress":
        case "CourseProgress": {
          const pct = Math.round((data.progress || 0) * 100);

          if (pct <= lastReportedProgress.current) return;

          lastReportedProgress.current = pct;
          setScormProgress(pct);

          onUpdateProgressRef.current(course.id, pct, 0);
          scheduleSaveProgress(pct);
          scheduleCloudSync(scormAttemptIdRef.current!);
          break;
        }

        case "ScoCompleted":
        case "CourseCompleted":
        case "CoursePassed": {
          lastReportedProgress.current = 100;
          setScormProgress(100);

          onUpdateProgressRef.current(course.id, 100, 0);

          scheduleSaveProgress(100);
          scheduleCloudSync(scormAttemptIdRef.current!);

          if (!navigationTriggeredRef.current) {
            navigationTriggeredRef.current = true;
            handleNextNavigation();
          }
          break;
        }

        case "PlayerExit": {
          //const pct = lastReportedProgress.current;
          //scheduleSaveProgress(pct);
          //scheduleCloudSync(scormAttemptIdRef.current!);

          // NOTE: Fallback if redirect-based session end doesn't work. Should be rare.
          await handleSessionEnded();
          break;
        }
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [course.id, modules, activeModuleIndex, activeLessonIndex]);

  useEffect(() => {
    navigationTriggeredRef.current = false;
  }, [activeLesson]);

  // ----------------------------
  // Save on tab close
  // ----------------------------
  useEffect(() => {
    const onUnload = () => {
      const pct = lastReportedProgress.current;

      if (pct > 0) {
        navigator.sendBeacon(
          `${BASE_URL}/attempts/${course.id}`,
          JSON.stringify({
            completionPercentage: pct,
            status: pct >= 100 ? "COMPLETED" : "IN_PROGRESS",
          }),
        );
      }
    };

    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [course.id]);

  const isLastModule = activeModuleIndex === modules.length - 1;

  const isLastLesson =
    modules[activeModuleIndex] &&
    activeLessonIndex === modules[activeModuleIndex].lessons.length - 1;

  const isCourseCompleted =
    isLastModule && isLastLesson && scormProgress === 100;

  // ----------------------------
  // Completion screen
  // ----------------------------
  if (isCourseCompleted) {
    return (
      <div className="fixed inset-0 bg-slate-50 flex flex-col">
        <header className="bg-white border-b px-6 py-4 flex justify-between">
          <button
            onClick={async () => {
              const pct = lastReportedProgress.current;

              try {
                await updateCourseAttempt(course.id, pct);

                if (scormAttemptIdRef.current) {
                  await syncCourseAttempt(scormAttemptIdRef.current);
                }
              } catch (e) {
                console.error("Final save failed", e);
              }

              onBack();
            }}
          >
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
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="flex items-center gap-2"
        >
          <ArrowLeftCircle size={20} /> Close Sidebar
        </button>
        <div>{course.title}</div>

        <button
          onClick={async () => {
            const pct = lastReportedProgress.current;

            try {
              await updateCourseAttempt(course.id, pct);

              if (scormAttemptIdRef.current) {
                await syncCourseAttempt(scormAttemptIdRef.current);
              }
            } catch (e) {
              console.error("Final save failed", e);
            }

            onBack();
          }}
        >
          <X size={20} />
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className={`w-80 border-r ${!isSidebarOpen && "hidden"}`}>
          {modules.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">
              Course content is not available.
            </div>
          ) : (
            modules.map((m, moduleIndex) => (
              <div key={m.id}>
                <div className="font-semibold px-3 py-2 flex justify-between">
                  {m.title}
                  {completedModules.has(m.id) && (
                    <CheckCircle size={16} className="text-green-500" />
                  )}
                </div>

                {m.lessons.map((l, lessonIndex) => (
                  <button
                    key={l.id}
                    onClick={() => goToModule(moduleIndex, lessonIndex)}
                    className={`block w-full text-left px-6 py-2 flex items-center gap-2 hover:bg-slate-100 text-[15px]
              ${
                moduleIndex === activeModuleIndex &&
                lessonIndex === activeLessonIndex
                  ? "bg-slate-100 font-medium"
                  : ""
              }`}
                  >
                    <BookAIcon size={20} className="text-gray-400" />
                    {l.title}
                  </button>
                ))}
              </div>
            ))
          )}
        </aside>

        <main className="flex-1 bg-black">
          {loading && (
            <div className="h-full flex items-center justify-center text-white">
              Lesson loading...
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
    </div>
  );
};
