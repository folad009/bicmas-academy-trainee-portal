import { useEffect } from "react";

const QUEUE_KEY = "pendingDownloads";

const getQueue = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
};

const saveQueue = (queue: string[]) => {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
};

export const useOfflineDownloads = (
  downloadCourseAssets: (courseId: string) => Promise<void>
) => {
  const addToQueue = (courseId: string) => {
    const queue = getQueue();
    if (!queue.includes(courseId)) {
      queue.push(courseId);
      saveQueue(queue);
    }
  };

  const processQueue = async () => {
    const queue = getQueue();
    if (!queue.length) return;

    const remaining: string[] = [];

    for (const courseId of queue) {
      try {
        await downloadCourseAssets(courseId);
      } catch {
        remaining.push(courseId);
      }
    }

    saveQueue(remaining);
  };

  useEffect(() => {
    if (navigator.onLine) {
      processQueue();
    }

    const handleOnline = () => processQueue();
    window.addEventListener("online", handleOnline);

    return () => window.removeEventListener("online", handleOnline);
  }, []);

  const download = async (courseId: string) => {
    if (!navigator.onLine) {
      addToQueue(courseId);
      return { queued: true };
    }

    await downloadCourseAssets(courseId);
    return { queued: false };
  };

  return { download };
};
