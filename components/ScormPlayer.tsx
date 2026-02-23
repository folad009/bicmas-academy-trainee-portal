import React, { useState, useEffect, useRef } from "react";
import { Course } from "../types";
import { Award, Download, ArrowLeft } from "lucide-react";
import { fetchScormLaunchUrl } from "@/api/scorm";
import { useAttemptSync } from "@/hooks/useAttemptSync";

const BASE_URL =
  "https://bicmas-academy-main-backend-production.up.railway.app/api/v1";

interface ScormPlayerProps {
  course: Course;
  onBack: () => void;
  onUpdateProgress: (
    courseId: string,
    progress: number,
    completedLessons: number
  ) => void;
  onViewCertificate: () => void;
}

export const ScormPlayer: React.FC<ScormPlayerProps> = ({
  course,
  onBack,
  onUpdateProgress,
  onViewCertificate,
}) => {
  // ----------------------------
  // UI state
  // ----------------------------
  const [launchUrl, setLaunchUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ----------------------------
  // SCORM state (source of truth)
  // ----------------------------
  const [scormAttemptId, setScormAttemptId] = useState<string | null>(null);
  const [scormProgress, setScormProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const scormAttemptIdRef = useRef<string | null>(null);
  const lastReportedProgress = useRef<number>(0);
  const lastSavedProgress = useRef<number>(0);
  const completionTriggered = useRef(false);

  const onUpdateProgressRef = useRef(onUpdateProgress);
  const syncTimeoutRef = useRef<number | null>(null);

  const syncAttempt = useAttemptSync();

  useEffect(() => {
    scormAttemptIdRef.current = scormAttemptId;
  }, [scormAttemptId]);

  useEffect(() => {
    onUpdateProgressRef.current = onUpdateProgress;
  }, [onUpdateProgress]);

  // ----------------------------
  // Helpers
  // ----------------------------
  const scheduleCloudSync = (attemptId: string) => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = window.setTimeout(() => {
      syncAttempt(attemptId, course.id).catch(console.error);
    }, 5000);
  };

  const triggerCompletion = () => {
    if (completionTriggered.current) return;
    completionTriggered.current = true;

    setIsCompleted(true);
  };

  const handleSessionEnded = async () => {
  try {
    if (scormAttemptIdRef.current) {
      const updated = await syncAttempt(scormAttemptIdRef.current, course.id);
      console.log("[PLAYER] Sync returned", updated);
       
      if (
        updated?.attemptId &&
        updated.attemptId !== scormAttemptIdRef.current
      ) {
        console.log("[SCORM] AttemptId updated (final)", {
          old: scormAttemptIdRef.current,
          new: updated.attemptId,
        });

        scormAttemptIdRef.current = updated.attemptId;
        setScormAttemptId(updated.attemptId);
      }
    }
  } catch (e) {
    console.error("Final sync failed", e);
  }

  triggerCompletion();
};
  // ----------------------------
  // Load SCORM launch URL
  // ----------------------------
  useEffect(() => {
    const load = async () => {
      if (!course.scormPackageId) {
        setError("No SCORM package configured for this course.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        completionTriggered.current = false;
        setIsCompleted(false);
        setScormProgress(0);
        lastReportedProgress.current = 0;
        lastSavedProgress.current = 0;

        const res = await fetchScormLaunchUrl(course.scormPackageId);

        setLaunchUrl(res.launchUrl);
        setScormAttemptId(res.scormAttemptId);
      } catch {
        setError("Failed to load SCORM package");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [course.id]);

  // ----------------------------
  // SCORM message listener
  // ----------------------------
  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      // Allow any scorm.com domain (cloud, engine, etc.)
      if (!event.origin.includes("scorm.com")) return;
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

      switch (data.messageType) {
        case "ScoProgress":
        case "CourseProgress": {
          const pct = Math.round((data.progress || 0) * 100);

          if (pct <= lastReportedProgress.current) return;

          lastReportedProgress.current = pct;
          setScormProgress(pct);

          onUpdateProgressRef.current(course.id, pct, 0);
          scheduleCloudSync(scormAttemptIdRef.current);
          break;
        }

        case "ScoCompleted":
        case "CourseCompleted":
        case "CoursePassed": {
          lastReportedProgress.current = 100;
          setScormProgress(100);

          onUpdateProgressRef.current(course.id, 100, 0);
          scheduleCloudSync(scormAttemptIdRef.current);

          triggerCompletion();
          break;
        }

        case "PlayerExit":
        case "SessionEnded": {
          await handleSessionEnded();
          break;
        }
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [course.id]);

  // ----------------------------
  // Save on tab close (important)
  // ----------------------------
  useEffect(() => {
    const onUnload = () => {
      if (!scormAttemptIdRef.current) return;

      const pct = lastReportedProgress.current;

      navigator.sendBeacon(
        `${BASE_URL}/attempts/${scormAttemptIdRef.current}`,
        JSON.stringify({
          completionPercentage: pct,
          status: pct >= 100 ? "COMPLETED" : "IN_PROGRESS",
        })
      );
    };

    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, []);

  // ----------------------------
  // Completion screen
  // ----------------------------
  if (isCompleted) {
    return (
      <div className="fixed inset-0 bg-slate-50 flex flex-col">
        <header className="bg-slate-900 text-white px-4 py-3 flex justify-between items-center">
          <button
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Back
          </button>

          <div className="font-medium">{course.title}</div>
          <div className="w-16" />
        </header>

        <main className="flex-1 flex items-center justify-center">
          <div className="bg-white p-12 rounded-xl shadow text-center">
            <Award size={64} className="mx-auto mb-6 text-green-600" />
            <h1 className="text-3xl font-bold mb-4">Course completed</h1>

            <button
              onClick={onViewCertificate}
              className="bg-blue-600 text-white px-6 py-3 rounded flex items-center gap-2"
            >
              <Download size={18} />
              Certificate
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
      <header className="bg-slate-900 text-white px-4 py-3 flex justify-between items-center">
        <button
          onClick={async () => {
            try {
              if (scormAttemptIdRef.current) {
                await syncAttempt(scormAttemptIdRef.current, course.id);
              }
            } catch (e) {
              console.error("Final sync failed", e);
            }

            onBack();
          }}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={20} />
          Back to Course Library
        </button>

        <div className="font-medium">{course.title}</div>
        <div className="w-16" />
      </header>

      <div className="flex-1 bg-black">
        {loading && (
          <div className="h-full flex items-center justify-center text-white">
            Loading lesson...
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
      </div>
    </div>
  );
};