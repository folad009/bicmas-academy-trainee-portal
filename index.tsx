import React from "react";
import ReactDOM from "react-dom/client";

import App from "./src/app/App";


const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    if (import.meta.env.DEV) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          registrations.forEach((registration) => {
            registration.unregister().catch((error) => {
              console.error("Service Worker unregister failed:", error);
            });
          });
        })
        .catch((error) => {
          console.error("Service Worker registrations retrieval failed:", error);
        });

      if ("caches" in window) {
        caches
          .keys()
          .then((keys) => {
            keys.forEach((key) => {
              caches.delete(key).catch((error) => {
                console.error("Cache delete failed:", error);
              });
            });
          })
          .catch((error) => {
            console.error("Caches keys retrieval failed:", error);
          });
      }

      return;
    }

    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log("Service Worker registered:", registration);
      })
      .catch((err) => {
        console.error("Service Worker registration failed:", err);
      });
  });
}
