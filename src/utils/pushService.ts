import { Capacitor } from "@capacitor/core";

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

/**
 * Native FCM on Android calls FirebaseMessaging.getInstance(), which requires
 * `google-services.json` + Firebase setup. Without it the app can crash.
 * We only use the native plugin when explicitly enabled.
 *
 * If `VITE_VAPID_PUBLIC_KEY` is set, we use Web Push inside the WebView instead
 * (no Firebase needed on the device).
 */
function shouldUseNativeCapacitorPush(): boolean {
  if (!Capacitor.isNativePlatform()) return false;

  const platform = Capacitor.getPlatform();

  if (platform === "android") {
    if (import.meta.env.VITE_VAPID_PUBLIC_KEY) {
      return false;
    }
    return import.meta.env.VITE_ANDROID_USE_NATIVE_FCM === "true";
  }

  return true;
}

let capacitorListenersRegistered = false;

const registerCapacitorPushNotifications = async () => {
  const { PushNotifications } = await import("@capacitor/push-notifications");

  const permission = await PushNotifications.requestPermissions();

  if (permission.receive !== "granted") {
    console.warn("Push notification permissions not granted");
    setNotificationsEnabled(false);
    return null;
  }

  if (!capacitorListenersRegistered) {
    PushNotifications.addListener("pushNotificationReceived", (notification) => {
      console.log("Push notification received:", notification);
    });

    PushNotifications.addListener("pushNotificationActionPerformed", (notification) => {
      console.log("Push notification action performed:", notification);
    });

    capacitorListenersRegistered = true;
  }

  await PushNotifications.register();

  setNotificationsEnabled(true);
  return { registered: true as const };
};

const registerWebPushNotifications = async () => {
  if (!canUsePushNotifications()) return null;

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

  import.meta.env.DEV && console.debug("[Push] Web Push subscription OK:", subscription.endpoint);

  setNotificationsEnabled(true);
  return subscription;
};

export const registerPushNotifications = async () => {
  try {
    if (shouldUseNativeCapacitorPush()) {
      return await registerCapacitorPushNotifications();
    }

    return await registerWebPushNotifications();
  } catch (error) {
    console.error("Failed to register push notifications", error);
    setNotificationsEnabled(false);
    return null;
  }
};

/** User-facing hint when Android cannot enable push (no Firebase + no VAPID). */
export const getPushUnavailableHint = (): string | null => {
  if (!Capacitor.isNativePlatform()) return null;
  if (Capacitor.getPlatform() !== "android") return null;
  if (import.meta.env.VITE_VAPID_PUBLIC_KEY) return null;
  if (import.meta.env.VITE_ANDROID_USE_NATIVE_FCM === "true") return null;
  return "To enable push: add Firebase (google-services.json) and set VITE_ANDROID_USE_NATIVE_FCM=true, or set VITE_VAPID_PUBLIC_KEY for web-style push.";
};
