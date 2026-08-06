import { useEffect } from "react";
import { RouterProvider } from "react-router";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { router } from "./routes";
import { PHOTO_WAYPOINTS } from "../pages/JourneyMap";
import { useTheme } from "../hooks/useTheme";

// Convert lat/lng + zoom to tile x/y (OSM tile scheme)
function latLngToTile(lat: number, lng: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const x = Math.floor((lng + 180) / 360 * n);
  const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n);
  return { x, y };
}

// Generate all tile URLs visible in the default map viewport (center 18,82 zoom 4)
function getDefaultViewTileUrls(tileUrlTemplate: string): string[] {
  const zoom = 4;
  const subdomains = ["a", "b", "c", "d"];
  // Viewport spans roughly 8 tiles wide x 6 tiles tall at zoom 4
  const center = latLngToTile(18, 82, zoom);
  const urls: string[] = [];
  for (let dx = -4; dx <= 4; dx++) {
    for (let dy = -3; dy <= 3; dy++) {
      const x = center.x + dx;
      const y = center.y + dy;
      const s = subdomains[(x + y) % subdomains.length];
      urls.push(tileUrlTemplate
        .replace("{s}", s)
        .replace("{z}", String(zoom))
        .replace("{x}", String(x))
        .replace("{y}", String(y))
        .replace("{r}", "")
      );
    }
  }
  return urls;
}

// Silently preload all city cover images in the background on session start,
// so the map opens instantly without a loading delay.
function usePreloadJourney() {
  const { theme } = useTheme();

  useEffect(() => {
    const lightThemes = ["default-light", "lemon-fizz", "sakura"];
    const tileUrl = lightThemes.includes(theme)
      ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

    const tileUrls = getDefaultViewTileUrls(tileUrl);

    const covers = PHOTO_WAYPOINTS
      .map(pw => pw.photos[0])
      .filter(Boolean);

    // Interleave tiles first (visible immediately on open), then covers
    const queue = [...tileUrls, ...covers];

    let i = 0;
    function loadNext() {
      if (i >= queue.length) return;
      const url = queue[i];
      if (url.endsWith(".png")) {
        // Tile — use fetch so it lands in HTTP cache
        fetch(url, { mode: "cors" }).finally(() => { i++; loadNext(); });
      } else {
        // Photo cover — use Image so it lands in image cache
        const img = new Image();
        img.onload = img.onerror = () => { i++; loadNext(); };
        img.src = url;
      }
    }

    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => loadNext());
    } else {
      setTimeout(loadNext, 1000);
    }
  // Re-run if theme flips between light/dark (different tile set)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);
}

export default function App() {
  usePreloadJourney();
  return (
    <>
      <RouterProvider router={router} />
      <Analytics />
      <SpeedInsights />
    </>
  );
}
