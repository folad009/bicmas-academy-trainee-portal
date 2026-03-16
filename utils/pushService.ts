const API_BASE =
  "https://bicmas-academy-main-backend-production.up.railway.app/api/v1";

export const registerPushNotifications = async () => {
  if (!("serviceWorker" in navigator)) return;

  const registration = await navigator.serviceWorker.ready;

  const permission = await Notification.requestPermission();

  if (permission !== "granted") return;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
  });

  await fetch(`${API_BASE}/push/subscribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(subscription),
  });
};