import { useEffect, Suspense } from "react";
import { RouterProvider } from "react-router";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { router } from "./routes";
import { PHOTO_WAYPOINTS } from "../pages/JourneyMap";
import { projects } from "../data/projects";
import { useTheme } from "../hooks/useTheme";

// ─── Tile URL helpers ─────────────────────────────────────────────────────────

function latLngToTile(lat: number, lng: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const x = Math.floor((lng + 180) / 360 * n);
  const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n);
  return { x, y };
}

function getDefaultViewTileUrls(tileUrlTemplate: string): string[] {
  const zoom = 4;
  const subdomains = ["a", "b", "c", "d"];
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

// ─── Prioritised background preloader ────────────────────────────────────────
//
// Load order (sequential within each tier, next tier starts after previous):
//
//  Tier 1 — project cover images  (visible above the fold in the canvas)
//  Tier 2 — theme hero intro imgs  (forest_intro / ocean_intro shown in HeroContent)
//  Tier 3 — journey map city photos (first photo of each waypoint)
//  Tier 4 — map tiles              (background tiles for the journey page)
//
// Tier 1 starts immediately (no requestIdleCallback) so covers are ready
// before the user finishes reading the loading screen.
// Tiers 3–4 run on requestIdleCallback so they never compete with page paint.

function usePreloadAssets() {
  const { theme } = useTheme();

  useEffect(() => {
    // Tier 1: project covers + active theme intro — load immediately, in parallel.
    // Both are above the fold on first paint (canvas cards + hero node overlay).
    const heroIntros: Record<string, string[]> = {
      "deep-forest":  ["/images/Theme%20assets/forest_intro.png"],
      "ocean-abyss":  ["/images/Theme%20assets/ocean_abyss_background.png",
                       "/images/Theme%20assets/ocean_intro.png"],
      "sakura":       ["/images/Theme%20assets/sakura_background.png",
                       "/images/Theme%20assets/sakura_intro.png"],
      "lemon-fizz":   ["/images/Theme%20assets/lemon_fizz_background.png"],
    };

    const projectCovers = projects
      .map(p => p.imageSrc)
      .filter((src): src is string => typeof src === "string");

    const immediateImages = [
      ...projectCovers,
      ...(heroIntros[theme] ?? []),
    ];

    immediateImages.forEach(src => {
      const img = new Image();
      img.src = src;
    });

    // Tier 2 + 3: journey map photos and tiles — at idle time
    const schedule = () => {
      const lightThemes = ["default-light", "lemon-fizz", "sakura"];
      const tileUrl = lightThemes.includes(theme)
        ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

      const tileUrls = getDefaultViewTileUrls(tileUrl);

      const journeyCovers = PHOTO_WAYPOINTS
        .map(pw => pw.photos[0])
        .filter(Boolean);

      // Inactive theme intros — load them too so switching feels instant
      const allIntroSrcs = Object.values(heroIntros).flat();
      const activeIntroSrcs = heroIntros[theme] ?? [];
      const otherIntros = allIntroSrcs.filter(src => !activeIntroSrcs.includes(src));

      // Queue: journey covers first (more impactful), then tiles, then other intros
      const queue: string[] = [...journeyCovers, ...tileUrls, ...otherIntros];

      let i = 0;
      function loadNext() {
        if (i >= queue.length) return;
        const url = queue[i];
        if (url.startsWith("https://")) {
          // Remote tile — fetch into HTTP cache
          fetch(url, { mode: "cors" }).finally(() => { i++; loadNext(); });
        } else {
          const img = new Image();
          img.onload = img.onerror = () => { i++; loadNext(); };
          img.src = url;
        }
      }

      loadNext();
    };

    if ("requestIdleCallback" in window) {
      requestIdleCallback(schedule);
    } else {
      setTimeout(schedule, 1000);
    }
  // Re-run if theme changes (different tile set + active intro image)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  usePreloadAssets();
  return (
    <>
      <Suspense fallback={null}>
        <RouterProvider router={router} />
      </Suspense>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
