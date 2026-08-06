import { useNavigate } from "react-router";
import { useEffect } from "react";
import { useTheme } from "../hooks/useTheme";
import { useIsMobile } from "../app/components/ui/use-mobile";
import DotField from "../components/DotField";
import { JourneyMap } from "./JourneyMap";

const DOT_COLORS: Record<string, { dot: string; glow: string }> = {
  "default-dark":  { dot: "rgba(237, 233, 227, 0.07)", glow: "#111010" },
  "default-light": { dot: "rgba(26, 24, 22, 0.10)",    glow: "transparent" },
  "ocean-abyss":   { dot: "#2A3855",                   glow: "#0B1120" },
  "deep-forest":   { dot: "#152018",                   glow: "#040805" },
  "lemon-fizz":    { dot: "#E4DEC8",                   glow: "transparent" },
  "sakura":        { dot: "#E2E0E6",                   glow: "transparent" },
};

const THEME_BG_DESKTOP: Record<string, string> = {
  "lemon-fizz":  "/images/Theme%20assets/lemon_fizz_background.png",
  "ocean-abyss": "/images/Theme%20assets/ocean_abyss_background.png",
  "sakura":      "/images/Theme%20assets/sakura_background.png",
};
const THEME_BG_MOBILE: Record<string, string> = {
  "lemon-fizz":  "/images/Theme%20assets/lemon_fizz_mobile_background.png",
  "ocean-abyss": "/images/Theme%20assets/ocean_abyss_background.png",
  "sakura":      "/images/Theme%20assets/sakura_background.png",
};
const THEME_BG_POSITION: Record<string, string> = {
  "lemon-fizz": "left center",
};

export default function JourneyPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const bgImage = isMobile ? undefined : THEME_BG_DESKTOP[theme];

  useEffect(() => {
    document.title = "Sayan's Journey — Map | Sayan Chakraborty";
    return () => {
      document.title = "Sayan Chakraborty | UX & Product Designer";
    };
  }, []);

  const onClose = () => navigate("/");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        color: "var(--foreground)",
        position: "relative",
      }}
    >
      {/* Theme background image — same as homepage */}
      {bgImage && (
        <img src={bgImage} alt="" aria-hidden="true"
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: 0, width: "100%", height: "100%", objectFit: "cover",
            objectPosition: THEME_BG_POSITION[theme] ?? "center" }}
        />
      )}
      {/* Dot background */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0, opacity: bgImage ? 0.39 : 1 }}>
        <DotField
          dotRadius={1.8}
          dotSpacing={15.6}
          bulgeStrength={72}
          glowRadius={180}
          sparkle={false}
          waveAmplitude={0}
          gradientFrom={DOT_COLORS[theme]?.dot ?? DOT_COLORS["default-dark"].dot}
          gradientTo={DOT_COLORS[theme]?.dot ?? DOT_COLORS["default-dark"].dot}
          glowColor={DOT_COLORS[theme]?.glow ?? DOT_COLORS["default-dark"].glow}
        />
      </div>

      {/* On mobile: full-screen. On desktop: centred max-w-3xl card, same as project modals */}
      <div
        className="relative z-10 w-full"
        style={isMobile ? { height: "100vh" } : {
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          minHeight: "100vh",
          padding: "40px 16px",
        }}
      >
        <div
          style={isMobile ? { height: "100%" } : {
            width: "100%",
            maxWidth: "1200px",
            height: "calc(100vh - 80px)",
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid var(--border)",
            boxShadow: "var(--card-shadow)",
          }}
        >
          <JourneyMap onClose={onClose} pageMode />
        </div>
      </div>
    </div>
  );
}
