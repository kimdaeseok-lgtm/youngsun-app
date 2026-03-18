importScripts('https://www.gstatic.com/firebasejs/12.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.10.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAgWXbEJgOL-TRhNKmwyaCnH9aIzxqkYfE",
  authDomain: "youngsun-app.firebaseapp.com",
  projectId: "youngsun-app",
  storageBucket: "youngsun-app.firebasestorage.app",
  messagingSenderId: "544867791713",
  appId: "1:544867791713:web:2cb5c14f3911906d988b20",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw] background message', payload);
});
