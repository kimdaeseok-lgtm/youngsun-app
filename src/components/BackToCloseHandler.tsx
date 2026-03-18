"use client";

import { useEffect } from "react";

/**
 * 메인(/)에서 뒤로가기 시 이전 화면 대신 앱(탭) 종료 시도.
 * history에 state를 넣어 두고, popstate(뒤로가기) 시 window.close() 호출.
 */
export default function BackToCloseHandler() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = "main-back-close";
    const state = { [key]: true };
    window.history.pushState(state, "", window.location.href);

    const onPopState = () => {
      window.close();
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return null;
}
