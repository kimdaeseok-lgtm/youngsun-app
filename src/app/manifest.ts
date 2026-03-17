import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "영선일지",
    short_name: "영선일지",
    description: "영선일지 요청 접수",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#18181b",
    icons: [
      {
        src: "/repair.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/repair.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
  };
}

