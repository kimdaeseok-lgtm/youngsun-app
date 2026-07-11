import type { Metadata } from "next";
import IntranetLauncher from "./IntranetLauncher";

// 쉼터 인트라넷(구글 앱스스크립트) 실제 주소
const INTRANET_URL =
  "https://script.google.com/a/macros/shimteo.org/s/AKfycbyur8YJf3NQ7UhE1J-ThyOf_y4X9FcYKA84HlClQTxHvgdGI4LkjapTisirqxeLWxwk3w/exec";

// 이 페이지를 홈 화면에 추가하면 아래 아이콘(쉼터 CI)이 잡힘
export const metadata: Metadata = {
  title: "쉼터 인트라넷",
  manifest: "/intranet.webmanifest",
  icons: {
    icon: "/shimteo-ci.png",
    shortcut: "/shimteo-ci.png",
    apple: "/shimteo-ci.png",
  },
};

export default function IntranetLauncherPage() {
  return <IntranetLauncher url={INTRANET_URL} />;
}
