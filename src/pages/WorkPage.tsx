import { useParams, useNavigate } from "react-router";
import { useEffect } from "react";
import { useTheme } from "../hooks/useTheme";
import { useIsMobile } from "../app/components/ui/use-mobile";
import { cn } from "../lib/utils";
import DotField from "../components/DotField";
import { projects } from "../data/projects";
import {
  TuskModal,
  IbmModal,
  IBMConnectorModal,
  InstanaModal,
  BusinessImpactModal,
  GenAITracesModal,
  ProjectModal,
} from "./Home";

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

// Lemon Fizz desktop bg uses left-aligned position (same as homepage)
const THEME_BG_POSITION: Record<string, string> = {
  "lemon-fizz": "left center",
};

// Per-route meta data for SEO / AEO
const META: Record<string, { title: string; description: string; ogImage: string }> = {
  "genai-traces": {
    title: "Gen AI Traces & Failures — IBM Instana | Sayan Chakraborty",
    description:
      "Full UX ownership on Gen AI observability inside IBM Instana — Task Hierarchy View, Trajectory, and Cycle Detection. By Sayan Chakraborty, UX Designer at IBM.",
    ogImage: "https://www.uxsayan.in/images/genai-traces/Hero.png",
  },
  "business-impact": {
    title: "Business Impact: Conversion Goals & Funnels — IBM Instana | Sayan Chakraborty",
    description:
      "UX and visual design for Conversion Goals and Funnels inside Instana's RUM Business Impact tab — correlating user drop-off with technical performance. By Sayan Chakraborty.",
    ogImage: "https://www.uxsayan.in/images/Business%20Impact%20EUM/Hero.png",
  },
  "instana-incident-remediation": {
    title: "Instana Incident Remediation — iF Design Award | Sayan Chakraborty",
    description:
      "Contributed to IBM Instana's agentic AI incident response — an iF Design Award submission. Autonomous agents surface root causes in seconds, cutting MTTR by up to 80%.",
    ogImage: "https://www.uxsayan.in/images/IBM%20IF%20Design%20Award/Hero.png",
  },
  "ibm-connector-workflow": {
    title: "Companion Panel — IBM Connector Content Workflow | Sayan Chakraborty",
    description:
      "Led design on a cross-functional workflow redesign for connector documentation across product, content, and engineering teams at IBM. By Sayan Chakraborty.",
    ogImage: "https://www.uxsayan.in/images/Companion%20panel/Hero.png",
  },
  "tusk": {
    title: "Tusk App — Smart Oral Care System | Sayan Chakraborty",
    description:
      "Full UX for a smart toothbrush companion app — AI bristle wear analysis, sensor-based usage tracking, family dashboards, and dentist access. By Sayan Chakraborty.",
    ogImage: "https://www.uxsayan.in/images/Tusk/Hero.png",
  },
  "ibm-design-challenge": {
    title: "Evo-connect — IBM Design Challenge (12-Hour Sprint) | Sayan Chakraborty",
    description:
      "IBM hiring design challenge: designed an iPhone app for a flagship EV with full vehicle control — research through final design in 12 hours. By Sayan Chakraborty.",
    ogImage: "https://www.uxsayan.in/images/Design%20challenge/Tata%20cover.png",
  },
};

export default function WorkPage() {
  const { slug } = useParams<{ slug: string }>();
  const { dark, theme } = useTheme();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const project = projects.find((p) => p.slug === slug);

  // Inject per-page <title>, <meta description>, <link canonical>, and JSON-LD
  useEffect(() => {
    const meta = slug ? META[slug] : undefined;
    if (!meta) return;

    // Title
    document.title = meta.title;

    // Meta description
    let descEl = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (descEl) descEl.setAttribute("content", meta.description);

    // Canonical
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical) canonical.setAttribute("href", `https://www.uxsayan.in/work/${slug}`);

    // OG tags
    const setOg = (property: string, value: string) => {
      const el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
      if (el) el.setAttribute("content", value);
    };
    setOg("og:title", meta.title);
    setOg("og:description", meta.description);
    setOg("og:url", `https://www.uxsayan.in/work/${slug}`);
    setOg("og:image", meta.ogImage);

    // Twitter tags
    const setTw = (name: string, value: string) => {
      const el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
      if (el) el.setAttribute("content", value);
    };
    setTw("twitter:title", meta.title);
    setTw("twitter:description", meta.description);
    setTw("twitter:image", meta.ogImage);

    // CreativeWork JSON-LD
    const existingLd = document.getElementById("ld-creative-work");
    if (existingLd) existingLd.remove();
    if (project) {
      const script = document.createElement("script");
      script.id = "ld-creative-work";
      script.type = "application/ld+json";
      script.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        "name": project.title,
        "description": project.summary,
        "author": {
          "@type": "Person",
          "name": "Sayan Chakraborty",
          "url": "https://www.uxsayan.in",
        },
        "dateCreated": project.year,
        "keywords": project.tags.join(", "),
        "url": `https://www.uxsayan.in/work/${slug}`,
        "isPartOf": {
          "@type": "WebSite",
          "name": "Sayan Chakraborty — UX & Product Designer",
          "url": "https://www.uxsayan.in",
        },
      });
      document.head.appendChild(script);
    }

    // Restore defaults on unmount (back to homepage)
    return () => {
      document.title = "Sayan Chakraborty | UX & Product Designer";
      descEl?.setAttribute("content", "Hey, it's Sayan — UX & Product Designer (UXsayan). I turn messy enterprise problems into experiences that just make sense. Currently designing at IBM, occasionally teaching as Visiting Faculty, and generally the guy you want in the room when things get complicated.");
      canonical?.setAttribute("href", "https://www.uxsayan.in/");
      setOg("og:title", "Sayan Chakraborty | UX & Product Designer");
      setOg("og:description", "Hey, it's Sayan — UX & Product Designer (UXsayan). I turn messy enterprise problems into experiences that just make sense. Currently designing at IBM, occasionally teaching as Visiting Faculty, and generally the guy you want in the room when things get complicated.");
      setOg("og:url", "https://www.uxsayan.in/");
      setTw("twitter:title", "Sayan Chakraborty | UX & Product Designer");
      setTw("twitter:description", "Sayan Chakraborty (UXsayan) is a UX and Product Designer specializing in enterprise SaaS, GenAI-driven products, and design systems. Currently at IBM.");
      document.getElementById("ld-creative-work")?.remove();
    };
  }, [slug, project]);

  const onBack = () => navigate("/");
  const onOpen = (s: string) => navigate(`/work/${s}`);

  const content = (() => {
    if (slug === "tusk")                   return <TuskModal           onClose={onBack} onOpen={onOpen} dark={dark} pageMode />;
    if (slug === "ibm-design-challenge")   return <IbmModal            onClose={onBack} onOpen={onOpen} dark={dark} pageMode />;
    if (slug === "ibm-connector-workflow") return <IBMConnectorModal   onClose={onBack} onOpen={onOpen} dark={dark} pageMode />;
    if (slug === "instana-incident-remediation") return <InstanaModal  onClose={onBack} onOpen={onOpen} dark={dark} pageMode />;
    if (slug === "business-impact")        return <BusinessImpactModal onClose={onBack} onOpen={onOpen} dark={dark} pageMode />;
    if (slug === "genai-traces")           return <GenAITracesModal    onClose={onBack} onOpen={onOpen} dark={dark} pageMode />;
    if (project)                           return <ProjectModal        project={project} onClose={onBack} onOpen={onOpen} dark={dark} pageMode />;
    return null;
  })();

  if (!content) {
    return (
      <div
        className={cn("min-h-screen flex flex-col items-center justify-center font-sans", dark ? "dark" : "")}
        style={{ background: "var(--background)", color: "var(--foreground)" }}
      >
        <p className="font-mono text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>
          // 404: project not found
        </p>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 font-mono text-xs"
          style={{ color: "var(--primary)", background: "none", border: "none", cursor: "pointer" }}
        >
          ← back to pipeline
        </button>
      </div>
    );
  }

  const bgImage = isMobile ? undefined : THEME_BG_DESKTOP[theme];

  return (
    <div
      className={cn("min-h-screen font-sans relative", dark ? "dark" : "")}
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      {/* Theme background image — same as homepage (Ocean Abyss, Lemon Fizz, Sakura) */}
      {bgImage && (
        <img src={bgImage} alt="" aria-hidden="true"
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: 0, width: "100%", height: "100%", objectFit: "cover",
            objectPosition: THEME_BG_POSITION[theme] ?? "center" }}
        />
      )}
      {/* Dot field background */}
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

      {/* Page content — centered box, same visual as modal box */}
      <div className="relative z-10 flex justify-center w-full min-h-screen items-start">
        {content}
      </div>
    </div>
  );
}
