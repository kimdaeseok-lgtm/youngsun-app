export const runtime = "nodejs";

export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "";
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "";
  const projectId =
    process.env.FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "";
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "";
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "";
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "";

  const js = `
importScripts('https://www.gstatic.com/firebasejs/12.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.10.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: ${JSON.stringify(apiKey)},
  authDomain: ${JSON.stringify(authDomain)},
  projectId: ${JSON.stringify(projectId)},
  storageBucket: ${JSON.stringify(storageBucket)},
  messagingSenderId: ${JSON.stringify(messagingSenderId)},
  appId: ${JSON.stringify(appId)},
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  // 개발용: payload 로그
  console.log('[firebase-messaging-sw] background message', payload);
});
`;

  return new Response(js, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

