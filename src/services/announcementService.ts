import { getApiV1BaseUrl } from "@/config/api";
import { getAccessToken } from "@/utils/auth";
import { fetchWithAuthRetry } from "@/utils/fetchWithAuthRetry";

export const getAnnouncements = async () => {
  try {
    const token = getAccessToken();

    if (!token) {
      throw new Error("No access token available");
    }

    const res = await fetchWithAuthRetry(`${getApiV1BaseUrl()}/announcements`);

    if (!res.ok) {
      throw new Error(
        `Failed to fetch announcements: ${res.status} ${res.statusText}`,
      );
    }

    const result = await res.json();

    if (!result || typeof result !== "object") {
      throw new Error("Invalid announcements response format");
    }

    return Array.isArray(result.data) ? result.data : [];
  } catch (error) {
    console.error("getAnnouncements failed", error);
    throw error;
  }
};

export const showAnnouncementNotification = async (message: string) => {
  if (!("Notification" in window)) return;

  if (Notification.permission !== "granted") return;

  try {
    if (
      typeof navigator === "undefined" ||
      !("serviceWorker" in navigator)
    ) {
      // Fallback to plain Notifications API if no SW is available
      new Notification("BICMAS Announcement", {
        body: message,
        icon: "/logo.png",
        badge: "/logo.png",
        tag: "bicmas-announcement",
      });
      return;
    }

    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      // No active service worker registration
      new Notification("BICMAS Announcement", {
        body: message,
        icon: "/logo.png",
        badge: "/logo.png",
        tag: "bicmas-announcement",
      });
      return;
    }

    await registration.showNotification("BICMAS Announcement", {
      body: message,
      icon: "/logo.png",
      badge: "/logo.png",
      tag: "bicmas-announcement",
    });
  } catch (error) {
    console.error("Failed to show announcement notification", error);
  }
};
