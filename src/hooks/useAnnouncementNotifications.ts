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

        try {
          await showAnnouncementNotification(latest.text);
          lastAnnouncementId.current = latest.id;
        } catch (err) {
          console.error("Failed to show announcement notification", err);
          // Do not advance the lastAnnouncementId so we can retry later
        }
      } catch (err) {
        console.error("Announcement polling failed:", err);
      }
    };

    checkAnnouncements();

    const interval = setInterval(checkAnnouncements, 60000);

    return () => clearInterval(interval);
  }, [enabled]);
};
