const API_BASE =
  "https://bicmas-academy-main-backend-production.up.railway.app/api/v1";

export const getAnnouncements = async () => {
  try {
    const res = await fetch(`${API_BASE}/announcements`);

    if (!res.ok) {
      throw new Error(
        `Failed to fetch announcements: ${res.status} ${res.statusText}`,
      );
    }

    const result = await res.json();

    if (!result || typeof result !== "object") {
      throw new Error("Invalid announcements response format");
    }

    return result.data;
  } catch (error) {
    console.error("getAnnouncements failed", error);
    throw error;
  }
};

export const showAnnouncementNotification = async (message: string) => {
  if (!("Notification" in window)) return;

  let permission = Notification.permission;

  if (permission === "default") {
    permission = await Notification.requestPermission();
  }

  if (permission !== "granted") return;

  const registration = await navigator.serviceWorker.ready;

  registration.showNotification("BICMAS Announcement", {
    body: message,
    icon: "/logo.png",
    badge: "/logo.png",
    tag: "bicmas-announcement",
  });
};