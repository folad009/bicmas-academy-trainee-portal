import { useEffect } from "react";
import {
  addToQueue,
  getDownloadQueue,
  saveDownloadQueue,
} from "@/utils/offlineCourses";

export const useOfflineDownloads = (
  downloadCourseAssets: (courseId: string) => Promise<void>
) => {
  const processQueue = async () => {
    const queue = getDownloadQueue();
    if (!queue.length) return;

    const remaining: string[] = [];

    for (const courseId of queue) {
      try {
        await downloadCourseAssets(courseId);
      } catch {
        remaining.push(courseId);
      }
    }

    saveDownloadQueue(remaining);
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
