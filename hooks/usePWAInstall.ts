import { useEffect, useState } from "react";

let deferredPrompt: any = null;

export function usePWAInstall() {
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      deferredPrompt = e;
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;

    if (result.outcome === "accepted") {
      deferredPrompt = null;
      setIsInstallable(false);
    }
  };

  return { isInstallable, promptInstall };
}
