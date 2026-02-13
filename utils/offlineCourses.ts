const KEY = "downloadedCourses";
const QUEUE_KEY = "downloadQueue";

export const getDownloadedCourses = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
};

export const saveDownloadedCourses = (ids: string[]) => {
  localStorage.setItem(KEY, JSON.stringify(ids));
};

export const markDownloaded = (courseId: string) => {
  const ids = getDownloadedCourses();
  if (!ids.includes(courseId)) {
    ids.push(courseId);
    saveDownloadedCourses(ids);
  }
};

export const removeDownloaded = (courseId: string) => {
  const ids = getDownloadedCourses().filter(id => id !== courseId);
  saveDownloadedCourses(ids);
};

export const getDownloadQueue = (): string[] => {
  return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
};

export const addToQueue = (courseId: string) => {
  const queue = getDownloadQueue();
  if (!queue.includes(courseId)) {
    queue.push(courseId);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }
};

export const clearQueue = () => {
  localStorage.removeItem(QUEUE_KEY);
};
