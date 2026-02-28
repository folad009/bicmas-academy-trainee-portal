import { isIOS, isStandalone } from "@/utils/pws";
import { useEffect, useState } from "react";

export function PWAIOSBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isIOS() && !isStandalone()) {
      const dismissed = localStorage.getItem("ios-install-dismissed");
      if (!dismissed) {
        setShow(true);
      }
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-slate-900 text-white p-4 rounded-xl shadow-lg z-50">
      <p className="text-sm">
        Install this app: Tap the <strong>Share</strong> icon and select{" "}
        <strong>Add to Home Screen</strong>.
      </p>

      <button
        className="mt-2 text-xs underline"
        onClick={() => {
          localStorage.setItem("ios-install-dismissed", "true");
          setShow(false);
        }}
      >
        Dismiss
      </button>
    </div>
  );
}
