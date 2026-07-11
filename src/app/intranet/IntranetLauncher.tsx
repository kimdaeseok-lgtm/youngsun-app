"use client";

import { useEffect, useState } from "react";

/**
 * 쉼터 인트라넷 "시작 페이지".
 * - 홈 화면 아이콘으로 실행되면(?launch=1 또는 standalone) 곧바로 인트라넷으로 이동.
 * - 브라우저에서 그냥 열면(처음 방문) 안내 + "인트라넷 열기" 버튼을 보여줘,
 *   이 화면을 "홈 화면에 추가"하면 쉼터 아이콘으로 바로가기가 생기게 함.
 */
export default function IntranetLauncher({ url }: { url: string }) {
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    let launched = false;
    try {
      const qs = new URLSearchParams(window.location.search);
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      launched = qs.get("launch") === "1" || standalone;
    } catch {
      launched = false;
    }
    if (launched) {
      setRedirecting(true);
      window.location.replace(url);
    }
  }, [url]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "20px",
        background: "#ffffff",
        fontFamily: "'Malgun Gothic', sans-serif",
        padding: "24px",
        textAlign: "center",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/shimteo_ci.png"
        alt="쉼터"
        style={{ width: "140px", height: "140px", objectFit: "contain" }}
      />
      <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#1a5c3a", margin: 0 }}>
        쉼터 인트라넷
      </h1>
      <a
        href={url}
        style={{
          background: "#1a5c3a",
          color: "#fff",
          textDecoration: "none",
          borderRadius: "12px",
          padding: "14px 28px",
          fontSize: "17px",
          fontWeight: 600,
        }}
      >
        {redirecting ? "이동 중…" : "인트라넷 열기"}
      </a>
      <p style={{ fontSize: "13px", color: "#667085", maxWidth: "320px", lineHeight: 1.5, margin: 0 }}>
        이 화면을 <b>홈 화면에 추가</b>하면 쉼터 아이콘으로 인트라넷 바로가기가
        만들어집니다. (크롬 메뉴 ⋮ → &quot;홈 화면에 추가&quot;)
      </p>
    </main>
  );
}
