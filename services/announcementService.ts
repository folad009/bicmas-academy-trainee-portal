const API_BASE =
  "https://bicmas-academy-main-backend-production.up.railway.app/api/v1";

export const getAnnouncements = async () => {
  const res = await fetch(`${API_BASE}/announcements`);
  const result = await res.json();
  return result.data;
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