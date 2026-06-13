export default function manifest() {
  return {
      name: "BG Score",
      short_name: "BG Score",
      description: "Board game score tracker",
      start_url: "/",
      scope: "/",
      display: "standalone",
      orientation: "portrait",
      theme_color: "#f5eedf",
      background_color: "#f5eedf",
      icons: [
          {
              src: "/favicon.svg",
              sizes: "any",
              type: "image/svg+xml",
          },
      ],
  };
}

