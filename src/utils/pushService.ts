const NOTIFICATIONS_ENABLED_KEY = "notificationsEnabled";

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const normalized = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(normalized);

  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
};

const canUsePushNotifications = () =>
  typeof window !== "undefined" &&
  typeof navigator !== "undefined" &&
  window.isSecureContext &&
  "Notification" in window &&
  "serviceWorker" in navigator &&
  "PushManager" in window;

export const getNotificationPermission = () =>
  typeof window !== "undefined" && "Notification" in window
    ? Notification.permission
    : "unsupported";

export const hasEnabledNotifications = () => {
  if (typeof window === "undefined") return false;

  try {
    return localStorage.getItem(NOTIFICATIONS_ENABLED_KEY) === "true";
  } catch {
    return false;
  }
};

const setNotificationsEnabled = (enabled: boolean) => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, String(enabled));
  } catch {
    // Ignore storage failures and rely on runtime permission state.
  }
};

export const registerPushNotifications = async () => {
  if (!canUsePushNotifications()) return null;

  try {
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

    if (!vapidPublicKey) {
      console.warn("Push notifications are disabled: missing VITE_VAPID_PUBLIC_KEY.");
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    const existingSubscription = await registration.pushManager.getSubscription();

    if (existingSubscription) {
      setNotificationsEnabled(true);
      return existingSubscription;
    }

    let permission = Notification.permission;

    if (permission === "default") {
      permission = await Notification.requestPermission();
    }

    if (permission !== "granted") {
      setNotificationsEnabled(false);
      return null;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    setNotificationsEnabled(true);
    return subscription;
  } catch (error) {
    console.error("Failed to register push notifications", error);
    return null;
  }
};
