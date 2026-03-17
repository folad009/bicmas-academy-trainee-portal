import { useEffect, useRef } from "react";
import {
  getAnnouncements,
  showAnnouncementNotification,
} from "../services/announcementService";

export const useAnnouncementNotifications = (enabled: boolean) => {
  const lastAnnouncementId = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const checkAnnouncements = async () => {
      try {
        const announcements = await getAnnouncements();

        if (!announcements?.length) return;

        const latest = announcements[0];

        if (lastAnnouncementId.current === latest.id) return;

        lastAnnouncementId.current = latest.id;

        await showAnnouncementNotification(latest.text);
      } catch (err) {
        console.error("Announcement polling failed:", err);
      }
    };

    checkAnnouncements();

    const interval = setInterval(checkAnnouncements, 60000);

    return () => clearInterval(interval);
  }, [enabled]);
};
