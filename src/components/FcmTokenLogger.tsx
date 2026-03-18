"use client";

import { useEffect } from "react";

export default function FcmTokenLogger() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (!("serviceWorker" in navigator)) return;

    (async () => {
      try {
        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        if (!vapidKey) {
          console.warn("NEXT_PUBLIC_FIREBASE_VAPID_KEY 가 설정되지 않았습니다.");
          return;
        }

        let permission = Notification.permission;
        if (permission !== "granted") {
          permission = await Notification.requestPermission();
        }
        if (permission !== "granted") {
          console.warn("알림 권한이 허용(granted)이 아니라서 FCM 토큰을 가져오지 않습니다.");
          return;
        }

        const [{ getToken }, { getFirebaseMessaging }] = await Promise.all([
          import("firebase/messaging"),
          import("@/firebase/clientApp"),
        ]);

        const messaging = getFirebaseMessaging();
        if (!messaging) {
          console.warn("Firebase가 설정되지 않았습니다. 환경변수를 확인하세요.");
          return;
        }

        const registration = await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js"
        );

        const token = await getToken(messaging, {
          vapidKey,
          serviceWorkerRegistration: registration,
        });

        if (token) {
          console.log("FCM_TOKEN:", token);
        } else {
          console.warn("FCM 토큰을 가져오지 못했습니다.");
        }
      } catch (e) {
        console.error("FCM token error:", e);
      }
    })();
  }, []);

  return null;
}

