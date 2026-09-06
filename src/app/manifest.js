export default function manifest() {
  return {
      name: "BG Score",
      short_name: "BG Score",
      description: "Ứng dụng lưu điểm BoardGame",
      start_url: "/",
      scope: "/",
      display: "standalone",
      orientation: "portrait",
      theme_color: "#f5eedf",
      background_color: "#f5eedf",
      icons: [
          {
              src: "/icon-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
          },
          {
              src: "/icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
          },
          {
              src: "/icon-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "maskable",
          },
          {
              src: "/icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
          },
          {
              src: "/apple-touch-icon.png",
              sizes: "2000x2000",
              type: "image/png",
              purpose: "any",
          },
          {
              src: "/favicon.svg",
              sizes: "any",
              type: "image/svg+xml",
          },
      ],
  };
}


