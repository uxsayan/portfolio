import { useState, useRef, useCallback, useEffect } from "react";
import DotField from "../components/DotField";
import { motion, AnimatePresence } from "motion/react";
import { Mail, ExternalLink, Download, ArrowRight, X, ArrowLeft, ChevronRight, Lock, Unlock } from "lucide-react";
import { projects, testimonials } from "../data/projects";
import { useTheme } from "../hooks/useTheme";
import { useIsMobile } from "../app/components/ui/use-mobile";
import { cn } from "../lib/utils";
import { useNavigate } from "react-router";

// ─── Canvas layout (4 columns) ───────────────────────────────────────────────
//
//  col1 hero:   x=24–354    w=330
//  col2:        x=454–734   w=280   IBM → Indep
//  col3:        x=834–1110  w=276   Projects → Quotes
//  col4:        x=1210–1486 w=276   About → Output
//
const COL_GAP = 100;
const CW = 1506;
const CH = 1320;
const SHOW = 6;

// ── col2 ─────────────────────────────────────────────────────────────────────
const COL2_X      = 354 + COL_GAP;      // 454
const COL2_W      = 280;
const COL2_CX     = COL2_X + COL2_W / 2; // 594
const COL2_RIGHT  = COL2_X + COL2_W;     // 734

const IBM_TOP     = 20;
const IBM_H       = 270;
const IBM_CY      = IBM_TOP + IBM_H / 2;
const IBM_BOT     = IBM_TOP + IBM_H;

const INDEP_TOP   = IBM_BOT + 80;
const INDEP_H     = 280;
const INDEP_CY    = INDEP_TOP + INDEP_H / 2;
const INDEP_BOT   = INDEP_TOP + INDEP_H;

// ── col3 — Projects → Quotes ──────────────────────────────────────────────────
const COL3_X      = COL2_RIGHT + COL_GAP; // 834
const COL3_W      = 276;
const COL3_RIGHT  = COL3_X + COL3_W;      // 1110
const COL3_CX     = COL3_X + COL3_W / 2;  // 972

const PROJ_TOP    = 60;
const PROJ_CARD_H = 68;
const PROJ_GAP    = 6;
const PROJ_H      = SHOW * PROJ_CARD_H + (SHOW - 1) * PROJ_GAP;
const PROJ_SHELL_H = PROJ_H + 72; // header(32) + padding(12+12) + extra for 4th item
const PROJ_BOT    = PROJ_TOP + PROJ_SHELL_H;
const PROJ_CY     = PROJ_TOP + PROJ_SHELL_H / 2;

const QUOTES_TOP  = PROJ_BOT + 104;
const QUOTES_H    = 540;
const QUOTES_CY   = QUOTES_TOP + QUOTES_H / 2;

// ── col4 — About + Output ─────────────────────────────────────────────────────
const COL4_X      = COL3_RIGHT + COL_GAP; // 1210
const COL4_W      = 276;
const COL4_CX     = COL4_X + COL4_W / 2;

const ABOUT_TOP   = 100;
const ABOUT_H     = 320;
const ABOUT_BOT   = ABOUT_TOP + ABOUT_H;
const ABOUT_CY    = ABOUT_TOP + ABOUT_H / 2;

const OUTPUT_TOP  = ABOUT_BOT + 80;

// ── Bezier midpoints ─────────────────────────────────────────────────────────
const MID_H1_C2  = Math.round((354 + COL2_X) / 2);
const MID_C2_C3  = Math.round((COL2_RIGHT + COL3_X) / 2);
const MID_C3_C4  = Math.round((COL3_RIGHT + COL4_X) / 2);

// ── SVG paths ────────────────────────────────────────────────────────────────
// 0: Hero → IBM (bezier)
// 1: IBM → Indep (vertical)
// 2: Indep → Projects (bezier, col2 → col3)
// 3: Projects → Quotes (vertical, col3)
// 4: Projects → About (bezier, col3 → col4)
// 5: About → Output (vertical)
const PATHS = [
  { d: `M 354,200 C ${MID_H1_C2},200 ${MID_H1_C2},${IBM_CY} ${COL2_X},${IBM_CY}`, label: "career_path" },
  { d: `M ${COL2_CX},${IBM_BOT + 19} L ${COL2_CX},${INDEP_TOP}`, label: "" },
  { d: `M ${COL2_RIGHT},${INDEP_CY} C ${MID_C2_C3},${INDEP_CY} ${MID_C2_C3},${PROJ_CY} ${COL3_X},${PROJ_CY}`, label: "selected_work" },
  { d: `M ${COL3_CX},${PROJ_BOT + 40} L ${COL3_CX},${QUOTES_TOP}`, label: "" },
  { d: `M ${COL3_RIGHT},${PROJ_CY} C ${MID_C3_C4},${PROJ_CY} ${MID_C3_C4},${ABOUT_CY} ${COL4_X},${ABOUT_CY}`, label: "profile" },
  { d: `M ${COL4_CX},${ABOUT_BOT + 52} L ${COL4_CX},${OUTPUT_TOP}`, label: "" },
];

const PORTS: [number, number, "out" | "in"][] = [
  [354,          200,           "out"], [COL2_X,  IBM_CY,      "in"],
  [COL2_CX,      IBM_BOT + 19,  "out"], [COL2_CX, INDEP_TOP,   "in"],
  [COL2_RIGHT,   INDEP_CY,      "out"], [COL3_X,  PROJ_CY,     "in"],
  [COL3_CX,      PROJ_BOT + 40, "out"], [COL3_CX, QUOTES_TOP,  "in"],
  [COL3_RIGHT,   PROJ_CY,       "out"], [COL4_X,  ABOUT_CY,    "in"],
  [COL4_CX,      ABOUT_BOT + 52, "out"], [COL4_CX, OUTPUT_TOP,  "in"],
];

const PATH_LABELS = [
  { text: "career_path",   x: MID_H1_C2,    y: 170 },
  { text: "selected_work", x: MID_C2_C3,    y: Math.round((INDEP_CY + PROJ_CY) / 2) },
  { text: "profile",       x: MID_C3_C4,    y: Math.round((PROJ_CY + ABOUT_CY) / 2) },
];

const TIMING = [
  [2.0, 0.0],  // hero→ibm
  [0.6, 0.0],  // ibm→indep
  [2.0, 0.2],  // indep→proj (bezier)
  [0.6, 0.2],  // proj→quotes
  [2.0, 0.2],  // proj→about (bezier)
  [0.6, 0.5],  // about→output
];

// ─── Sequential reveal timing ─────────────────────────────────────────────────
// Flow: sender appears → connector draws gently → receiver appears
// Total sequence: ~2.5s

const SEQ = {
  // Node appear delays (seconds)
  hero:     0,
  ibm:      0.55,
  indep:    1.05,
  proj:     1.55,
  quotes:   2.1,
  about:    2.1,
  output:   2.45,
  // Connector draw start delays and durations [startDelay, duration]
  conn: [
    [0.25, 0.45],  // 0: hero→ibm
    [0.75, 0.35],  // 1: ibm→indep
    [1.25, 0.45],  // 2: indep→proj (bezier)
    [1.75, 0.4],   // 3: proj→quotes
    [1.75, 0.5],   // 4: proj→about (bezier)
    [2.3,  0.3],   // 5: about→output
  ] as [number, number][],
};

// ─── Primitives ───────────────────────────────────────────────────────────────

function NodeHeader({ icon, type, id }: { icon: string; type: string; id: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2"
      style={{ background: "var(--node-header)", borderBottom: "1px solid var(--border)" }}>
      <div className="flex items-center gap-1.5">
        <span className="text-[11px]" style={{ color: "var(--primary)" }}>{icon}</span>
        <span className="font-mono text-[9px] tracking-[0.2em] uppercase"
          style={{ color: "var(--muted-foreground)", fontWeight: 500 }}>{type}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[9px]"
          style={{ color: "var(--muted-foreground)", opacity: 0.38 }}>{id}</span>
        <span className="w-1.5 h-1.5 rounded-full inline-block"
          style={{ background: "var(--primary)", opacity: 0.7 }} />
      </div>
    </div>
  );
}

function Tag({ s }: { s: string }) {
  return (
    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded"
      style={{ background: "var(--muted)", color: "var(--muted-foreground)",
        border: "1px solid var(--border)", lineHeight: 1.8 }}>{s}</span>
  );
}

function Pill({ label, color }: { label: string; color?: string }) {
  const c = color || "var(--primary)";
  return (
    <span className="font-mono text-[9px] px-2 py-0.5 rounded-full"
      style={{ background: `${c}18`, color: c, border: `1px solid ${c}33` }}>{label}</span>
  );
}

function ReadTime({ minutes, className = "" }: { minutes: number; className?: string }) {
  return (
    <span className={`font-mono text-[9px] px-2 py-0.5 rounded flex-shrink-0 ${className}`}
      style={{ background: "var(--muted)", color: "var(--muted-foreground)",
        border: "1px solid var(--border)", lineHeight: 1.8, opacity: 0.7 }}>
      ~{minutes} min read
    </span>
  );
}

function NodeShell({ icon, type, id, children, dark, style = {} }: {
  icon: string; type: string; id: string;
  children: React.ReactNode; dark: boolean; style?: React.CSSProperties;
}) {
  return (
    <div className="overflow-hidden rounded-lg" style={{
      background: "var(--card)",
      backdropFilter: "blur(80px) saturate(1.9)",
      WebkitBackdropFilter: "blur(80px) saturate(1.9)",
      border: "1px solid var(--border)",
      boxShadow: dark
        ? "0 4px 28px rgba(0,0,0,0.45), inset 0 1px 0 rgba(237,233,227,0.07)"
        : "0 4px 24px rgba(26,24,22,0.09), inset 0 1px 0 rgba(255,255,255,0.9)",
      ...style,
    }}>
      <NodeHeader icon={icon} type={type} id={id} />
      {children}
    </div>
  );
}

function IbmShell({ children, dark }: { children: React.ReactNode; dark: boolean }) {
  return (
    <div className="overflow-hidden rounded-lg" style={{
      background: "var(--card)",
      backdropFilter: "blur(80px) saturate(1.9)",
      WebkitBackdropFilter: "blur(80px) saturate(1.9)",
      border: "1.5px solid var(--primary)",
      boxShadow: dark
        ? "0 0 32px rgba(224,149,74,0.22), 0 4px 28px rgba(0,0,0,0.45), inset 0 1px 0 rgba(237,233,227,0.07)"
        : "0 0 24px rgba(199,123,50,0.14), 0 4px 24px rgba(26,24,22,0.09), inset 0 1px 0 rgba(255,255,255,0.85)",
    }}>
      <div className="flex items-center justify-between px-3 py-2"
        style={{ background: "rgba(199,123,50,0.06)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px]" style={{ color: "var(--primary)" }}>◆</span>
          <span className="font-mono text-[9px] tracking-[0.2em] uppercase"
            style={{ color: "var(--primary)", fontWeight: 500 }}>experience · active</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px]"
            style={{ color: "var(--muted-foreground)", opacity: 0.38 }}>exp_ibm</span>
          <span className="flex items-center gap-1 font-mono text-[8px]" style={{ color: "#16a34a" }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#16a34a" }} />
            running
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── Loading screen ───────────────────────────────────────────────────────────

const GREETINGS = [
  { text: "नमस्ते"      },
  { text: "নমস্কার"     },
  { text: "નમસ્તે"      },
  { text: "ನಮಸ್ಕಾರ"    },
  { text: "നമസ്കാരം"   },
  { text: "Hello"       },
];

// Timing budget: 4000ms total (incl. 500ms exit fade)
// 5 transitions × (140 in + 150 hold + 110 out) = 5 × 400 = 2000ms
// last word: 140 in + 860 hold = 1000ms → total ≈ 3000ms cycling + 500ms fade = ~3500ms
function LoadingScreen({ dark, onDone }: { dark: boolean; onDone: () => void }) {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    if (phase === "in")   t = setTimeout(() => setPhase("hold"), 140);
    else if (phase === "hold") {
      if (idx < GREETINGS.length - 1) {
        t = setTimeout(() => setPhase("out"), 150);
      } else {
        t = setTimeout(() => onDone(), 860);
      }
    }
    else if (phase === "out") {
      t = setTimeout(() => {
        setIdx(i => i + 1);
        setPhase("in");
      }, 110);
    }
    return () => clearTimeout(t);
  }, [phase, idx, onDone]);

  const g = GREETINGS[idx] as { text: string };

  return (
    <motion.div
      key="loader"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="fixed inset-0 z-[500] flex flex-col items-center justify-center"
      style={{ background: dark ? "#111010" : "#F5F2EC" }}
    >
      {/* Interactive dot field */}
      <div className="absolute inset-0 pointer-events-none">
        <DotField
          dotRadius={1.836}
          dotSpacing={17.16}
          bulgeStrength={72}
          glowRadius={180}
          sparkle={false}
          waveAmplitude={0}
          gradientFrom={dark ? "rgba(237, 233, 227, 0.07)" : "rgba(26, 24, 22, 0.10)"}
          gradientTo={dark   ? "rgba(237, 233, 227, 0.07)" : "rgba(26, 24, 22, 0.10)"}
          glowColor={dark    ? "#111010"                   : "transparent"}
        />
      </div>

      {/* Word */}
      <div className="relative flex flex-col items-center gap-3">
        <motion.p
          key={`word-${idx}`}
          initial={{ opacity: 0, y: 14 }}
          animate={phase === "in" ? { opacity: 1, y: 0 } : phase === "out" ? { opacity: 0, y: -14 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          style={{
            fontFamily: idx === GREETINGS.length - 1
              ? "\"Instrument Serif\", serif"
              : "system-ui, -apple-system, sans-serif",
            fontSize: "clamp(2.4rem, 8vw, 5rem)",
            color: idx === GREETINGS.length - 1 ? "var(--primary)" : "var(--foreground)",
            lineHeight: 1.2,
            letterSpacing: 0,
            fontWeight: 400,
          }}
        >
          {g.text}
        </motion.p>
      </div>

      {/* Top-left branding */}
      <button
        onClick={() => window.location.reload()}
        className="absolute top-4 left-5 flex items-center gap-2 transition-opacity hover:opacity-70"
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
        <span className="font-mono text-[9px] tracking-[0.2em] uppercase"
          style={{ color: "var(--muted-foreground)", opacity: 0.4 }}>sayan_portfolio</span>
        <span style={{ color: "var(--border)" }}>/</span>
        <span className="font-mono text-[9px]"
          style={{ color: "var(--primary)", opacity: 0.6 }}>v3</span>
      </button>
    </motion.div>
  );
}

// ─── Hero content ─────────────────────────────────────────────────────────────

function HeroContent({ compact }: { compact?: boolean }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const json = `{\n  "visitor":   "you",\n  "date":      "${new Date().toISOString().slice(0, 10)}",\n  "intent":    "hiring | collab | curious",\n  "status":    "open_to_work"\n}`;
  return (
    <div className={compact ? "p-4" : "p-6"}>
      <p className={`font-mono tracking-[0.2em] uppercase mb-3 ${compact ? "text-[9px]" : "text-[12px]"}`}
        style={{ color: "var(--primary)" }}>
        ux / product designer
      </p>
      <h1 className="font-serif leading-none tracking-tight mb-0.5"
        style={{ fontSize: compact ? "clamp(2rem,5vw,2.8rem)" : "clamp(2.4rem,4vw,3.2rem)",
          color: "var(--foreground)", lineHeight: 1 }}>Sayan</h1>
      <h1 className="font-serif leading-none italic mb-4"
        style={{ fontSize: compact ? "clamp(2rem,5vw,2.8rem)" : "clamp(2.4rem,4vw,3.2rem)",
          color: "var(--primary)", lineHeight: 1 }}>Chakraborty</h1>
      <p className="font-sans text-xs leading-relaxed mb-4" style={{ color: "var(--muted-foreground)" }}>
        I&apos;m a Product Designer at IBM, where I&apos;ve spent the past two and a half years designing enterprise observability products, most recently shaping experiences for GenAI Observability. Alongside that, I partner with startups through my independent design practice to turn ideas into thoughtful digital products.
      </p>
      <div className="rounded p-3 mb-4"
        style={{ background: "var(--node-header)", border: "1px solid var(--border)" }}>
        <pre className="font-mono text-[10px] leading-relaxed"
          style={{ color: "var(--muted-foreground)" }}>{json}</pre>
      </div>
      <div className="flex flex-wrap gap-1 mb-4">
        {["UX Design", "Product", "Figma", "Design Systems", "Enterprise SaaS", "GenAI"].map(s => <Tag key={s} s={s} />)}
      </div>
      <div className="space-y-1.5">
        <a href="mailto:ux.sayan@gmail.com"
          className="flex items-center gap-1.5 font-mono text-[10px] transition-opacity hover:opacity-70"
          style={{ color: "var(--primary)" }}>
          <Mail size={9} /> ux.sayan@gmail.com
        </a>
        <a href="https://linkedin.com/in/sayanoriginals" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 font-mono text-[10px] transition-opacity hover:opacity-70"
          style={{ color: "var(--muted-foreground)" }}>
          <ExternalLink size={9} /> linkedin.com/in/sayanoriginals
        </a>
      </div>
      {/* Separator + footer */}
      <div className="mt-4 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px]" style={{ color: "var(--muted-foreground)", opacity: 0.6 }}>
            Made with <span style={{ color: "var(--primary)", fontSize: 11 }}>♥</span> in India
          </span>
          <span className="font-mono text-[9px]" style={{ color: "var(--muted-foreground)", opacity: 0.6 }}>
            {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZoneName: "short" })}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Project mini-card ────────────────────────────────────────────────────────

function ProjCard({ p, dark, mobile }: {
  p: typeof projects[0]; dark: boolean; onOpen?: (p: typeof projects[0]) => void; mobile?: boolean;
}) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const filteredTags = p.tags.filter(t => t !== "UX Design" && t !== "iF Design Award").slice(0, 2);
  const hasAward = p.tags.includes("iF Design Award");
  return (
    <button onClick={() => navigate(`/work/${p.slug}`)}
      className="block w-full text-left py-2 transition-opacity hover:opacity-80"
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div className="flex items-center justify-between mb-1">
        <p className="font-sans font-semibold leading-tight"
          style={{ fontSize: mobile ? 14 : 12, color: hovered ? "var(--primary)" : "var(--foreground)", transition: "color 0.15s" }}>{p.title}</p>
        <span className="font-mono text-[9px] flex items-center gap-0.5 flex-shrink-0"
          style={{ color: "var(--primary)" }}>{p.number} <ArrowRight size={7} /></span>
      </div>
      <p className="font-mono text-[9px] mb-1.5"
        style={{ color: "var(--muted-foreground)", opacity: 0.65 }}>
        {p.subtitle.split("—")[0].trim()}
      </p>
      <div className="flex gap-1 flex-wrap">
        {hasAward && (
          <span className="flex items-center gap-1 font-mono text-[9px] px-1.5 py-0.5 rounded"
            style={{ background: "var(--muted)", color: "var(--muted-foreground)", border: "1px solid var(--border)", lineHeight: 1.8 }}>
            <img src="/images/IBM IF Design Award/IF images/IF design award icon.jpg" alt="iF" style={{ width: 11, height: 11, borderRadius: 2, objectFit: "cover" }} />
            iF Award
          </span>
        )}
        {filteredTags.map(t => <Tag key={t} s={t} />)}
      </div>
    </button>
  );
}

// ─── Resume bottom sheet (mobile) ────────────────────────────────────────────

function ResumeSheet({ onClose, dark }: { onClose: () => void; dark: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const PDF = "/Sayan_Chakraborty_Resume_2026.pdf";

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[200] flex items-end justify-center"
      style={{ background: dark ? "rgba(10,9,8,0.6)" : "rgba(40,36,32,0.4)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ duration: 0.32, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative w-full flex flex-col rounded-t-xl overflow-hidden"
        style={{
          height: "90dvh",
          background: "var(--card)",
          backdropFilter: "blur(80px) saturate(1.9)",
          WebkitBackdropFilter: "blur(80px) saturate(1.9)",
          borderTop: "1px solid var(--border)",
          boxShadow: dark ? "0 -24px 80px rgba(0,0,0,0.6)" : "0 -24px 80px rgba(26,24,22,0.15)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--border)" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
          style={{ background: "var(--node-header)", borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2">
            <span className="text-[11px]" style={{ color: "var(--primary)" }}>▤</span>
            <span className="font-mono text-[9px] tracking-[0.2em] uppercase"
              style={{ color: "var(--muted-foreground)", fontWeight: 500 }}>document</span>
            <span className="font-mono text-[9px]"
              style={{ color: "var(--muted-foreground)", opacity: 0.38 }}>doc_resume</span>
          </div>
          <div className="flex items-center gap-2">
            <a href={PDF} download="Sayan_Chakraborty_Resume_2026.pdf"
              className="flex items-center gap-1.5 font-mono text-[9px] px-2.5 py-1 rounded transition-opacity hover:opacity-80"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
              <Download size={9} /> download
            </a>
            <button onClick={onClose}
              className="flex items-center justify-center w-6 h-6 rounded transition-opacity hover:opacity-60"
              style={{ color: "var(--muted-foreground)" }}>
              <X size={13} />
            </button>
          </div>
        </div>

        {/* PDF viewer */}
        <div className="flex-1 relative overflow-hidden">
          <iframe src={PDF} title="Sayan Chakraborty — Resume"
            className="absolute inset-0 w-full h-full" style={{ border: "none" }} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
          style={{ borderTop: "1px solid var(--border)", background: "var(--node-header)" }}>
          <span className="font-mono text-[9px]"
            style={{ color: "var(--muted-foreground)", opacity: 0.38 }}>
            // sayan_chakraborty · resume
          </span>
          <button onClick={onClose}
            className="font-mono text-[9px] transition-opacity hover:opacity-60"
            style={{ color: "var(--muted-foreground)" }}>
            tap outside to close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Resume drawer ────────────────────────────────────────────────────────────

function ResumeDrawer({ onClose, dark }: { onClose: () => void; dark: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const PDF = "/Sayan_Chakraborty_Resume_2026.pdf";

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[200] flex justify-end"
      style={{ background: dark ? "rgba(10,9,8,0.6)" : "rgba(40,36,32,0.4)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ duration: 0.32, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative h-full flex flex-col"
        style={{
          width: "min(640px, 100vw)",
          background: "var(--card)",
          backdropFilter: "blur(80px) saturate(1.9)",
          WebkitBackdropFilter: "blur(80px) saturate(1.9)",
          borderLeft: "1px solid var(--border)",
          boxShadow: dark ? "-24px 0 80px rgba(0,0,0,0.6)" : "-24px 0 80px rgba(26,24,22,0.15)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
          style={{ background: "var(--node-header)", borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2">
            <span className="text-[11px]" style={{ color: "var(--primary)" }}>▤</span>
            <span className="font-mono text-[9px] tracking-[0.2em] uppercase"
              style={{ color: "var(--muted-foreground)", fontWeight: 500 }}>document</span>
            <span className="font-mono text-[9px]"
              style={{ color: "var(--muted-foreground)", opacity: 0.38 }}>doc_resume</span>
          </div>
          <div className="flex items-center gap-2">
            <a href={PDF} download="Sayan_Chakraborty_Resume_2026.pdf"
              className="flex items-center gap-1.5 font-mono text-[9px] px-2.5 py-1 rounded transition-opacity hover:opacity-80"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
              <Download size={9} /> download
            </a>
            <button onClick={onClose}
              className="flex items-center justify-center w-6 h-6 rounded transition-opacity hover:opacity-60"
              style={{ color: "var(--muted-foreground)" }}>
              <X size={13} />
            </button>
          </div>
        </div>

        {/* PDF viewer */}
        <div className="flex-1 relative overflow-hidden">
          <iframe src={PDF} title="Sayan Chakraborty — Resume"
            className="absolute inset-0 w-full h-full" style={{ border: "none" }} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
          style={{ borderTop: "1px solid var(--border)", background: "var(--node-header)" }}>
          <span className="font-mono text-[9px]"
            style={{ color: "var(--muted-foreground)", opacity: 0.38 }}>
            // sayan_chakraborty · resume
          </span>
          <button onClick={onClose}
            className="font-mono text-[9px] transition-opacity hover:opacity-60"
            style={{ color: "var(--muted-foreground)" }}>
            esc to close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── TUSK modal ───────────────────────────────────────────────────────────────

const TUSK_IMG = (file: string) => `/images/Tusk/${file}`;

export function TuskModal({ onClose, onOpen, dark, pageMode }: { onClose: () => void; onOpen: (slug: string) => void; dark: boolean; pageMode?: boolean }) {
  useEffect(() => {
    if (pageMode) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose, pageMode]);

  const [lightbox, setLightbox] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const SectionLabel = ({ label }: { label: string }) => (
    <p className="font-mono text-[9px] uppercase tracking-widest mb-3"
      style={{ color: "var(--primary)" }}>// {label}</p>
  );

  const Img = ({ file, alt, expandable = false, className = "" }: {
    file: string; alt: string; expandable?: boolean; className?: string;
  }) => (
    <figure className={`overflow-hidden rounded-lg m-0 ${className}`}
      style={{ border: "1px solid var(--border)", background: "transparent",
        cursor: expandable ? "zoom-in" : "default" }}
      onClick={expandable ? () => setLightbox(TUSK_IMG(file)) : undefined}>
      <img src={TUSK_IMG(file)} alt={alt} loading="lazy"
        style={{ width: "100%", height: "auto", display: "block" }} />
      {expandable && (
        <figcaption className="px-3 py-1.5 font-mono text-[9px] flex items-center gap-1"
          style={{ color: "var(--muted-foreground)", opacity: 0.5, borderTop: "1px solid var(--border)" }}>
          <span>⊕</span> click to expand
        </figcaption>
      )}
    </figure>
  );

  const shell = dark
    ? "rgba(22,20,18,0.96)"
    : "#FAF8F4";

  return (
    <>
      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(8px)" }}
          onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="expanded"
            style={{ maxWidth: "92vw", maxHeight: "90vh", width: "auto", height: "auto",
              borderRadius: 8, border: "1px solid var(--border)" }} />
          <button className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full"
            style={{ background: "rgba(0,0,0,0.5)", color: "#fff" }}
            onClick={() => setLightbox(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={pageMode ? "w-full flex items-start justify-center" : "fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto"}
        style={pageMode ? {} : { background: dark ? "rgba(10,9,8,0.9)" : "rgba(40,36,32,0.6)", backdropFilter: "blur(10px)" }}
        onClick={pageMode ? undefined : onClose}>

        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className={pageMode && isMobile ? "relative w-full overflow-hidden flex flex-col" : "relative w-full max-w-3xl mx-4 my-10 rounded-xl overflow-hidden flex flex-col"}
          style={pageMode && isMobile ? {} : { background: shell, border: "1px solid var(--border)", boxShadow: dark ? "0 24px 80px rgba(0,0,0,0.75), inset 0 1px 0 rgba(237,233,227,0.06)" : "0 24px 80px rgba(26,24,22,0.13), inset 0 1px 0 rgba(255,255,255,1)" }}
          onClick={e => e.stopPropagation()}>

          {/* ── Node header bar ── */}
          <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
            style={{ background: "var(--node-header)", borderBottom: "1px solid var(--border)" }}>
            {pageMode ? (
              <div className="flex items-center gap-2 min-w-0">
                <button onClick={onClose}
                  className="flex items-center gap-1.5 font-mono text-[9px] transition-opacity hover:opacity-60 flex-shrink-0"
                  style={{ color: "var(--muted-foreground)", background: "none", border: "none", cursor: "pointer" }}>
                  <ArrowLeft size={11} />
                  <span className="hidden sm:inline">back</span>
                </button>
                <span className="font-mono text-[9px]" style={{ color: "var(--border)", opacity: 0.6, flexShrink: 0 }}>|</span>
                <span style={{ color: "var(--primary)", flexShrink: 0 }}>▤</span>
                <span className="font-mono text-[9px] tracking-[0.2em] uppercase truncate"
                  style={{ color: "var(--primary)", fontWeight: 500 }}>project · case study</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span style={{ color: "var(--primary)" }}>▤</span>
                <span className="font-mono text-[9px] tracking-[0.2em] uppercase"
                  style={{ color: "var(--primary)", fontWeight: 500 }}>project · case study</span>
                <span className="font-mono text-[9px]"
                  style={{ color: "var(--muted-foreground)", opacity: 0.38 }}>prj_tusk</span>
              </div>
            )}
            <div className="flex items-center gap-2 flex-shrink-0">
              {pageMode ? (
                <span className="font-mono text-[9px] flex-shrink-0"
                  style={{ color: "var(--muted-foreground)", opacity: 0.38 }}>prj_tusk</span>
              ) : (
                <button onClick={onClose}
                  className="flex items-center justify-center w-6 h-6 rounded transition-opacity hover:opacity-60"
                  style={{ color: "var(--muted-foreground)" }}>
                  <X size={13} />
                </button>
              )}
              <ReadTime minutes={8} className="hidden sm:inline" />
            </div>
          </div>

          {/* ── Scrollable body ── */}
          <div className={pageMode ? undefined : "overflow-y-auto flex-1"}>

          {/* HERO */}
          <div>
            <img src={TUSK_IMG("Hero.png")} alt="TUSK hero"
              style={{ width: "100%", height: "auto", display: "block" }} />
          </div>

            <div className="p-6" style={{ display: "flex", flexDirection: "column", gap: 36 }}>

              {/* TITLE */}
              <div>
                <p className="font-mono text-[9px] tracking-[0.2em] uppercase mb-2"
                  style={{ color: "var(--primary)" }}>UX Design · Product Design · AI/ML · Research</p>
                <h2 className="font-serif mb-1"
                  style={{ fontSize: "clamp(2rem,5vw,3rem)", color: "var(--foreground)", lineHeight: 1 }}>
                  TUSK
                </h2>
                <p className="font-serif italic text-base mb-4"
                  style={{ color: "var(--muted-foreground)", lineHeight: 1.5 }}>
                  Application Design for a Smart Toothbrush System
                </p>
                <div className="flex flex-wrap gap-4 mb-4">
                  {[{ label: "year", value: "2023" }, { label: "role", value: "UX Designer — Individual Project" }]
                    .map(({ label, value }) => (
                      <div key={label}>
                        <p className="font-mono text-[9px] uppercase tracking-widest mb-0.5"
                          style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>{label}</p>
                        <p className="font-mono text-[11px]" style={{ color: "var(--foreground)" }}>{value}</p>
                      </div>
                    ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["UX Design", "Product Design", "AI/ML", "Research"].map(t => <Tag key={t} s={t} />)}
                </div>
                <div className="mt-2 sm:hidden">
                  <ReadTime minutes={8} />
                </div>
              </div>

              {/* OVERVIEW */}
              <div>
                <SectionLabel label="overview" />
                <div className="p-4 rounded-lg space-y-3"
                  style={{ background: "var(--node-header)", border: "1px solid var(--border)" }}>
                  <p className="font-sans text-sm leading-relaxed"
                    style={{ color: "var(--muted-foreground)" }}>
                    A sophisticated electric toothbrush system integrated with a mobile app, using AI for bristle wear analysis — sensor tracking, a magnetic wall mount for data collection, and a subscription service for automated brush head replacement, powered by machine learning and usage-pattern analysis.
                  </p>
                  <p className="font-sans text-sm leading-relaxed"
                    style={{ color: "var(--muted-foreground)" }}>
                    We understood the challenge users face navigating oral care products and dental complexity. TUSK simplifies product choices and enables seamless communication between users and dental professionals.
                  </p>
                </div>
              </div>

              {/* PROCESS */}
              <div>
                <SectionLabel label="design process" />
                {/* Step tracker */}
                <div className="flex items-start gap-0 mb-4 overflow-x-auto pb-1">
                  {[
                    { step: "01", label: "Explore the Problem" },
                    { step: "02", label: "Decide What to Fix" },
                    { step: "03", label: "Test Potential Solutions" },
                    { step: "04", label: "Refine Final Solution" },
                  ].map(({ step, label }, i, arr) => (
                    <div key={step} className="flex items-center flex-shrink-0">
                      <div className="flex flex-col items-center" style={{ minWidth: 110 }}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center font-mono text-[9px] mb-1.5 flex-shrink-0"
                          style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                          {step}
                        </div>
                        <p className="font-mono text-[9px] text-center leading-tight"
                          style={{ color: "var(--foreground)", maxWidth: 90 }}>{label}</p>
                      </div>
                      {i < arr.length - 1 && (
                        <div style={{ width: 32, height: 1, background: "var(--primary)", opacity: 0.4, flexShrink: 0, marginBottom: 20 }} />
                      )}
                    </div>
                  ))}
                </div>
                <Img file="Design process.png" alt="Double diamond design process" expandable />
              </div>

              {/* RESEARCH */}
              <div>
                <SectionLabel label="research — competitors & target market" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Img file="Demographic.png" alt="Competitors and demographic overview" expandable />
                  </div>
                  <div className="space-y-2">
                    <p className="font-mono text-[9px] uppercase tracking-widest mb-2"
                      style={{ color: "var(--muted-foreground)", opacity: 0.6 }}>observed problems</p>
                    {[
                      "Inadequate bristle wear monitoring — users don't know when to replace heads",
                      "Generic brushing habits — no adaptation to individual patterns",
                      "Limited health tracking — no long-term oral data analysis",
                      "Inaccessible dental guidance — hard to find reliable, timely advice",
                    ].map((b, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <span className="font-mono text-[10px] flex-shrink-0 mt-0.5"
                          style={{ color: "var(--primary)" }}>→</span>
                        <p className="font-sans text-xs leading-relaxed"
                          style={{ color: "var(--muted-foreground)" }}>{b}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Survey stat callouts */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  {[
                    { stat: "40", label: "survey respondents" },
                    { stat: "67.5%", label: "never used a smart toothbrush" },
                    { stat: "65%", label: "want an Oral Toxicity Report" },
                  ].map(({ stat, label }) => (
                    <div key={label} className="p-3 rounded-lg text-center"
                      style={{ background: "var(--node-header)", border: "1px solid var(--border)" }}>
                      <p className="font-serif mb-0.5"
                        style={{ fontSize: "clamp(1.2rem,3vw,1.6rem)", color: "var(--primary)", lineHeight: 1 }}>
                        {stat}
                      </p>
                      <p className="font-mono text-[9px] leading-tight"
                        style={{ color: "var(--muted-foreground)" }}>{label}</p>
                    </div>
                  ))}
                </div>
                <Img file="Survey results.png" alt="Survey results breakdown" expandable />
              </div>

              {/* COMPETITIVE LANDSCAPE / INSPIRATION */}
              <div>
                <SectionLabel label="competitive landscape & inspiration" />
                <p className="font-sans text-xs leading-relaxed mb-4"
                  style={{ color: "var(--muted-foreground)" }}>
                  Benchmarked against direct competitors (Oral-B iO, quip, blu) alongside cross-industry references — plant care apps, supplement scanners, fitness trackers. Research breadth beyond oral care shaped the final interaction model.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Img file="Inspiration.png" alt="Competitor app references" expandable />
                  <Img file="Inspirations.png" alt="Cross-industry inspiration board" expandable />
                </div>
              </div>

              {/* PERSONAS */}
              <div>
                <SectionLabel label="personas" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Img file="Persona One.png" alt="Persona — Daniela Kuasaki, 29, IT Professional, Amsterdam" expandable />
                  <Img file="Persona One-1.png" alt="Persona — Mathew Thomas, 27, grad student, Boston" expandable />
                </div>
              </div>

              {/* USER JOURNEY */}
              <div>
                <SectionLabel label="user journey — mathew's oral care" />
                <p className="font-sans text-xs leading-relaxed mb-3"
                  style={{ color: "var(--muted-foreground)" }}>
                  Mapped across a full day. Key struggles: morning fatigue causing rushed brushing, distraction mid-routine, evening lethargy leading to skipped sessions. Emotional arc: groggy → mildly accomplished → tired → unmotivated — a clear signal the app needed to make the routine feel rewarding.
                </p>
                {/* Struggle callouts */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                  {[
                    { time: "morning", issue: "Rushed, incomplete brushing due to fatigue" },
                    { time: "midday", issue: "Feeling oral care wasn't thorough due to distraction" },
                    { time: "evening", issue: "Lethargy leading to rushed or skipped sessions" },
                  ].map(({ time, issue }) => (
                    <div key={time} className="p-2.5 rounded-lg"
                      style={{ background: "var(--node-header)", border: "1px solid var(--border)" }}>
                      <p className="font-mono text-[8px] uppercase tracking-widest mb-1"
                        style={{ color: "var(--primary)" }}>{time}</p>
                      <p className="font-sans text-[10px] leading-snug"
                        style={{ color: "var(--muted-foreground)" }}>{issue}</p>
                    </div>
                  ))}
                </div>
                <Img file="Journey Map.png" alt="User journey map — Mathew's oral care routine" expandable />
              </div>

              {/* INFORMATION ARCHITECTURE */}
              <div>
                <SectionLabel label="information architecture" />
                <p className="font-sans text-xs leading-relaxed mb-3"
                  style={{ color: "var(--muted-foreground)" }}>
                  Full app structure from entry point through every destination. Four core tabs — <span style={{ color: "var(--foreground)", fontWeight: 600 }}>Home</span> (brush status, health reports, AI product scanning), <span style={{ color: "var(--foreground)", fontWeight: 600 }}>Rewards</span> (streaks, gift boxes, free checkups), <span style={{ color: "var(--foreground)", fontWeight: 600 }}>Shop</span> (subscriptions, personalised plans), <span style={{ color: "var(--foreground)", fontWeight: 600 }}>Care</span> (dentist discovery, community, direct chat).
                </p>
                <Img file="Information Architecture.png" alt="Full app information architecture" expandable />
              </div>

              {/* ITERATION */}
              <div>
                <SectionLabel label="ideation — homepage iterations" />
                <p className="font-sans text-xs leading-relaxed mb-3"
                  style={{ color: "var(--muted-foreground)" }}>
                  Three rounds of homepage exploration before locking the final direction.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3 text-center">
                  {[
                    { v: "V1", verdict: "Rejected", note: "Scroll unclear, needs polish" },
                    { v: "V2", verdict: "Rejected", note: "Same structure, visually flat" },
                    { v: "V3", verdict: "Almost there", note: "Too green & overwhelming" },
                  ].map(({ v, verdict, note }) => {
                    const accepted = verdict === "Almost there";
                    return (
                      <div key={v} className="p-2 rounded-lg"
                        style={{ border: `1px solid ${accepted ? "var(--primary)" : "var(--border)"}`,
                          background: accepted ? "var(--node-header)" : "transparent" }}>
                        <p className="font-mono text-[9px] mb-0.5"
                          style={{ color: "var(--foreground)" }}>{v}</p>
                        <p className="font-mono text-[8px] mb-1"
                          style={{ color: accepted ? "var(--primary)" : "var(--muted-foreground)" }}>
                          {verdict}
                        </p>
                        <p className="font-sans text-[9px] leading-snug"
                          style={{ color: "var(--muted-foreground)", opacity: 0.7 }}>{note}</p>
                      </div>
                    );
                  })}
                </div>
                <Img file="Home page, scratching the head.png" alt="Homepage V1, V2, V3 iterations" expandable />
              </div>

              {/* ONBOARDING */}
              <div>
                <SectionLabel label="onboarding flow" />
                <p className="font-sans text-xs leading-relaxed mb-3"
                  style={{ color: "var(--muted-foreground)" }}>
                  Screen-by-screen: splash → welcome/login (mobile, Google, Apple, email) → OTP verification → verified confirmation → profile setup → Bluetooth brush connection.
                </p>
                <div className="overflow-x-auto pb-2">
                  <div style={{ minWidth: "min-content" }}>
                    <Img file="Onboarding.png" alt="Onboarding flow — splash to Bluetooth connection" expandable />
                  </div>
                </div>
              </div>

              {/* KEY DECISIONS */}
              <div>
                <SectionLabel label="key decisions — 4 nodes" />
                <div className="space-y-2">
                  {[
                    {
                      id: "01", heading: "AI bristle wear as the core differentiator",
                      body: "Camera-based AR scanning gives users a specific, actionable signal for when to reorder — justifying the subscription model and making the hardware feel intelligent rather than passive.",
                    },
                    {
                      id: "02", heading: "Rewards and streaks as habit infrastructure",
                      body: "Streak-based unlocks, milestone discounts, and a gift box mechanism make the routine feel worth maintaining. Directly addresses Mathew's insight: brushing shouldn't feel like a chore.",
                    },
                    {
                      id: "03", heading: "Family tracking as household product expansion",
                      body: "Shared household dashboards increase product stickiness and expand the subscription model's footprint without requiring separate acquisition.",
                    },
                    {
                      id: "04", heading: "Dentist access within the app",
                      body: "Integrating dentist discovery, support chat, and report storage collapses the gap between daily habit and professional care. The path from 'my score dropped' to 'book a dentist' is two taps.",
                    },
                  ].map(d => (
                    <div key={d.id} className="p-4 rounded-lg"
                      style={{ background: dark ? "rgba(255,255,255,0.03)" : "rgba(26,24,22,0.03)",
                        border: "1px solid var(--border)" }}>
                      <p className="font-mono text-[9px] uppercase tracking-widest mb-1.5"
                        style={{ color: "var(--primary)", opacity: 0.8 }}>decision_{d.id}</p>
                      <h4 className="font-sans text-sm font-semibold mb-1.5"
                        style={{ color: "var(--foreground)" }}>{d.heading}</h4>
                      <p className="font-sans text-sm leading-relaxed"
                        style={{ color: "var(--muted-foreground)" }}>{d.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* FINAL DESIGN */}
              <div>
                <SectionLabel label="final design — components & screens" />
                <p className="font-sans text-xs leading-relaxed mb-3"
                  style={{ color: "var(--muted-foreground)" }}>
                  Component-level work assembled into a cohesive system: Home, Brush Health, Reports, Family & Friends, Rewards, Shop, and the AR brush scanning interface.
                </p>
                <Img file="Components.png" alt="Final design — all screens and components" expandable />
              </div>

              {/* WRAP */}
              <div>
                <SectionLabel label="wrap" />
                <Img file="That's a wrap. final ending image.png" alt="TUSK — final closing screen" expandable />
                <p className="font-sans text-sm leading-relaxed mt-4"
                  style={{ color: "var(--muted-foreground)" }}>
                  Design and prototyping concludes with TUSK's Gentle Pro toothbrush and companion app — connecting personalised oral care tracking, replenishment, family accountability, and professional dental access in one system.
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center gap-2 pt-3 overflow-hidden" style={{ borderTop: "1px solid var(--border)" }}>
                <button
                  onClick={() => onOpen("ibm-design-challenge")}
                  className="flex items-center gap-2 flex-1 min-w-0 px-3 py-2 rounded-lg transition-opacity hover:opacity-80"
                  style={{ background: "var(--node-header)", border: "1px solid var(--border)", textAlign: "left" }}>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-widest mb-0.5" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>next →</p>
                    <p className="font-mono text-[11px] font-medium truncate" style={{ color: "var(--foreground)" }}>EVO-CONNECT</p>
                    <p className="font-mono text-[10px] truncate" style={{ color: "var(--muted-foreground)", opacity: 0.6 }}>IBM Design Challenge · EV Safety</p>
                  </div>
                  <ChevronRight size={12} style={{ color: "var(--primary)", flexShrink: 0 }} />
                </button>
                <button
                  onClick={() => onOpen("instana-incident-remediation")}
                  className="hidden sm:flex items-center gap-2 flex-1 min-w-0 px-3 py-2 rounded-lg transition-opacity hover:opacity-80"
                  style={{ background: "var(--node-header)", border: "1px solid var(--border)", textAlign: "left" }}>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-widest mb-0.5" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>also →</p>
                    <p className="font-mono text-[11px] font-medium truncate" style={{ color: "var(--foreground)" }}>Instana Incident Remediation</p>
                    <p className="font-mono text-[10px] truncate" style={{ color: "var(--muted-foreground)", opacity: 0.6 }}>Agentic AI · iF Design Award 2025</p>
                  </div>
                  <ChevronRight size={12} style={{ color: "var(--primary)", flexShrink: 0 }} />
                </button>
                <button onClick={onClose}
                  className="flex items-center justify-center rounded-lg transition-opacity hover:opacity-70 w-9 flex-shrink-0"
                  style={{ border: "1px solid var(--border)", color: "var(--muted-foreground)", background: "var(--node-header)", alignSelf: "stretch" }}>
                  <X size={13} />
                </button>
              </div>

            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}

// ─── Slide carousel (reusable) ───────────────────────────────────────────────

function SlideCarousel({ slides, dark }: { slides: string[]; dark: boolean }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = slides.length;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const go = useCallback((n: number) => {
    setIdx(((n % total) + total) % total);
  }, [total]);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(() => go(idx + 1), 3500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [idx, paused, go]);

  if (!slides.length) return null;

  return (
    <div
      className="relative w-full overflow-hidden select-none"
      style={{ background: "#0a0a0a", aspectRatio: "16/9" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      {/* Slides — current + next eagerly loaded */}
      {slides.map((src, i) => {
        const active = i === idx;
        const next = i === (idx + 1) % total;
        if (!active && !next) return null;
        return (
          <img
            key={src}
            src={src}
            loading={active || next ? "eager" : "lazy"}
            alt={`Slide ${i + 1}`}
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              objectFit: "contain",
              opacity: active ? 1 : 0,
              transition: "opacity 0.55s ease",
              pointerEvents: "none",
            }}
          />
        );
      })}

      {/* Prev */}
      <button
        onClick={() => go(idx - 1)}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-7 h-7 rounded-full transition-opacity hover:opacity-90"
        style={{ background: "rgba(0,0,0,0.55)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)" }}
        aria-label="Previous slide"
      >
        <span style={{ fontSize: 12 }}>‹</span>
      </button>
      {/* Next */}
      <button
        onClick={() => go(idx + 1)}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-7 h-7 rounded-full transition-opacity hover:opacity-90"
        style={{ background: "rgba(0,0,0,0.55)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)" }}
        aria-label="Next slide"
      >
        <span style={{ fontSize: 12 }}>›</span>
      </button>

      {/* Counter */}
      <div className="absolute bottom-2.5 right-3 font-mono text-[9px] px-2 py-0.5 rounded"
        style={{ background: "rgba(0,0,0,0.55)", color: "rgba(255,255,255,0.75)",
          border: "1px solid rgba(255,255,255,0.12)" }}>
        {idx + 1} / {total}
      </div>

      {/* Pause indicator */}
      {paused && (
        <div className="absolute top-2.5 right-3 font-mono text-[8px] px-1.5 py-0.5 rounded"
          style={{ background: "rgba(0,0,0,0.5)", color: "rgba(255,255,255,0.5)" }}>
          ⏸
        </div>
      )}
    </div>
  );
}

// ─── IBM Design Challenge modal ──────────────────────────────────────────────

const IBM_IMG = (file: string) => `/images/Design challenge/${file}`;

// Pre-exported EVO-CONNECT playback slides (slides-01.png … slides-50.png)
// Place exported PNGs at: public/images/Design challenge/playback/slides-01.png … slides-50.png
const EVO_SLIDES = Array.from({ length: 50 }, (_, i) =>
  `/images/Design challenge/playback/slides-${String(i + 1).padStart(2, "0")}.png`
);

export function IbmModal({ onClose, onOpen, dark, pageMode }: { onClose: () => void; onOpen: (slug: string) => void; dark: boolean; pageMode?: boolean }) {
  useEffect(() => {
    if (pageMode) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose, pageMode]);

  const [lightbox, setLightbox] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const SectionLabel = ({ label }: { label: string }) => (
    <p className="font-mono text-[9px] uppercase tracking-widest mb-3"
      style={{ color: "var(--primary)" }}>// {label}</p>
  );

  // Standard image — natural ratio, transparent bg
  const Img = ({ file, alt, expandable = false, className = "" }: {
    file: string; alt: string; expandable?: boolean; className?: string;
  }) => (
    <figure className={`overflow-hidden rounded-lg m-0 ${className}`}
      style={{ border: "1px solid var(--border)", background: "transparent",
        cursor: expandable ? "zoom-in" : "default" }}
      onClick={expandable ? () => setLightbox(IBM_IMG(file)) : undefined}>
      <img src={IBM_IMG(file)} alt={alt} loading="lazy"
        style={{ width: "100%", height: "auto", display: "block" }} />
      {expandable && (
        <figcaption className="px-3 py-1.5 font-mono text-[9px] flex items-center gap-1"
          style={{ color: "var(--muted-foreground)", opacity: 0.5, borderTop: "1px solid var(--border)" }}>
          <span>⊕</span> click to expand
        </figcaption>
      )}
    </figure>
  );

  // Documentary image — thin accent border + caption strip for news photos
  const DocImg = ({ file, alt, caption }: { file: string; alt: string; caption: string }) => (
    <figure className="overflow-hidden rounded-lg m-0"
      style={{ border: "1px solid var(--primary)", background: "transparent" }}>
      <img src={IBM_IMG(file)} alt={alt} loading="lazy"
        style={{ width: "100%", height: "auto", display: "block" }} />
      <figcaption className="px-3 py-2 font-mono text-[9px]"
        style={{ borderTop: "1px solid var(--border)", color: "var(--muted-foreground)" }}>
        {caption}
      </figcaption>
    </figure>
  );

  const shell = dark ? "rgba(22,20,18,0.96)" : "#FAF8F4";

  return (
    <>
      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(8px)" }}
          onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="expanded"
            style={{ maxWidth: "92vw", maxHeight: "90vh", width: "auto", height: "auto",
              borderRadius: 8, border: "1px solid var(--border)" }} />
          <button className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full"
            style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}
            onClick={() => setLightbox(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={pageMode ? "w-full flex items-start justify-center" : "fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto"}
        style={pageMode ? {} : { background: dark ? "rgba(10,9,8,0.9)" : "rgba(40,36,32,0.6)", backdropFilter: "blur(10px)" }}
        onClick={pageMode ? undefined : onClose}>

        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className={pageMode && isMobile ? "relative w-full overflow-hidden flex flex-col" : "relative w-full max-w-3xl mx-4 my-10 rounded-xl overflow-hidden flex flex-col"}
          style={pageMode && isMobile ? {} : { background: shell, border: "1px solid var(--border)", boxShadow: dark ? "0 24px 80px rgba(0,0,0,0.75), inset 0 1px 0 rgba(237,233,227,0.06)" : "0 24px 80px rgba(26,24,22,0.13), inset 0 1px 0 rgba(255,255,255,1)" }}
          onClick={e => e.stopPropagation()}>

          {/* ── Node header bar ── */}
          <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
            style={{ background: "var(--node-header)", borderBottom: "1px solid var(--border)" }}>
            {pageMode ? (
              <div className="flex items-center gap-2 min-w-0">
                <button onClick={onClose}
                  className="flex items-center gap-1.5 font-mono text-[9px] transition-opacity hover:opacity-60 flex-shrink-0"
                  style={{ color: "var(--muted-foreground)", background: "none", border: "none", cursor: "pointer" }}>
                  <ArrowLeft size={11} />
                  <span className="hidden sm:inline">back</span>
                </button>
                <span className="font-mono text-[9px]" style={{ color: "var(--border)", opacity: 0.6, flexShrink: 0 }}>|</span>
                <span style={{ color: "var(--primary)", flexShrink: 0 }}>▤</span>
                <span className="font-mono text-[9px] tracking-[0.2em] uppercase truncate"
                  style={{ color: "var(--primary)", fontWeight: 500 }}>project · case study</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span style={{ color: "var(--primary)" }}>▤</span>
                <span className="font-mono text-[9px] tracking-[0.2em] uppercase"
                  style={{ color: "var(--primary)", fontWeight: 500 }}>project · case study</span>
                <span className="font-mono text-[9px]"
                  style={{ color: "var(--muted-foreground)", opacity: 0.38 }}>prj_ibm_evoconnect</span>
              </div>
            )}
            <div className="flex items-center gap-2 flex-shrink-0">
              {pageMode ? (
                <span className="font-mono text-[9px] flex-shrink-0"
                  style={{ color: "var(--muted-foreground)", opacity: 0.38 }}>prj_ibm_evoconnect</span>
              ) : (
                <button onClick={onClose}
                  className="flex items-center justify-center w-6 h-6 rounded transition-opacity hover:opacity-60"
                  style={{ color: "var(--muted-foreground)" }}>
                  <X size={13} />
                </button>
              )}
              <ReadTime minutes={5} className="hidden sm:inline" />
            </div>
          </div>

          {/* ── Scrollable body ── */}
          <div className={pageMode ? undefined : "overflow-y-auto flex-1"}>

            {/* HERO */}
            <img src={IBM_IMG("Tata cover.png")} alt="Evo-connect — Tata Motors EV App"
              style={{ width: "100%", height: "auto", display: "block" }} />

            <div className="p-6" style={{ display: "flex", flexDirection: "column", gap: 36 }}>

              {/* TITLE */}
              <div>
                <p className="font-mono text-[9px] tracking-[0.2em] uppercase mb-2"
                  style={{ color: "var(--primary)" }}>UX Design · Research · Rapid Prototyping</p>
                <h2 className="font-serif mb-1"
                  style={{ fontSize: "clamp(2rem,5vw,3rem)", color: "var(--foreground)", lineHeight: 1 }}>
                  EVO-CONNECT
                </h2>
                <p className="font-serif italic text-base mb-4"
                  style={{ color: "var(--muted-foreground)", lineHeight: 1.5 }}>
                  A TATA Motors Innovation — IBM Design Challenge
                </p>
                {/* Meta row */}
                <div className="flex items-center gap-3 mb-4">
                  {["12 HOURS", "SOLO", "RESEARCH TO DESIGN"].map((m, i) => (
                    <span key={m} className="flex items-center gap-3">
                      <span className="font-mono text-[9px] tracking-widest"
                        style={{ color: "var(--muted-foreground)" }}>{m}</span>
                      {i < 2 && <span style={{ color: "var(--border)" }}>·</span>}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["UX Design", "Research", "Rapid Prototyping"].map(t => <Tag key={t} s={t} />)}
                </div>
                <div className="mt-2 sm:hidden">
                  <ReadTime minutes={5} />
                </div>
              </div>

              {/* OVERVIEW */}
              <div>
                <SectionLabel label="overview — design prompt" />
                <div className="p-4 rounded-lg space-y-4"
                  style={{ background: "var(--node-header)", border: "1px solid var(--border)" }}>
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-widest mb-2"
                      style={{ color: "var(--primary)", opacity: 0.7 }}>problem statement</p>
                    <p className="font-sans text-sm leading-relaxed"
                      style={{ color: "var(--muted-foreground)" }}>
                      Create an iPhone application for a leading car manufacturing brand's upcoming flagship electric car. The new car will be connected to the app and fully accessible through it. Rationalise and design the most valuable scenarios the app can have, considering Desirability, Feasibility, and Viability.
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-widest mb-2"
                      style={{ color: "var(--primary)", opacity: 0.7 }}>design task</p>
                    <div className="space-y-1.5">
                      {[
                        "Optimise the design process",
                        "Document the process followed",
                        "Create an end-to-end interaction document (wireframes)",
                        "Design three unique screens, excluding login/signup",
                      ].map((t, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="font-mono text-[9px] flex-shrink-0 mt-0.5"
                            style={{ color: "var(--primary)" }}>0{i + 1}</span>
                          <p className="font-sans text-sm leading-relaxed"
                            style={{ color: "var(--muted-foreground)" }}>{t}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* PROCESS */}
              <div>
                <SectionLabel label="process" />
                <div className="flex items-center justify-center gap-0 mb-4">
                  {[
                    { step: "Observe", icon: "◎" },
                    { step: "Reflect", icon: "◈" },
                    { step: "Make",    icon: "◆" },
                  ].map(({ step, icon }, i, arr) => (
                    <div key={step} className="flex items-center flex-shrink-0">
                      <div className="flex flex-col items-center" style={{ minWidth: 100 }}>
                        <div className="w-9 h-9 rounded-full flex items-center justify-center mb-2"
                          style={{ background: "var(--primary)", color: "var(--primary-foreground)",
                            fontSize: 14 }}>
                          {icon}
                        </div>
                        <p className="font-mono text-[10px] tracking-widest uppercase"
                          style={{ color: "var(--foreground)" }}>{step}</p>
                      </div>
                      {i < arr.length - 1 && (
                        <div style={{ width: 40, height: 1, background: "var(--primary)",
                          opacity: 0.4, flexShrink: 0, marginBottom: 22 }} />
                      )}
                    </div>
                  ))}
                </div>
                <Img file="Design process.png" alt="Observe · Reflect · Make process diagram" expandable />
              </div>

              {/* RESEARCH — Vehicle Temperature */}
              <div>
                <SectionLabel label="research — vehicle temperature risk" />
                <p className="font-sans text-sm leading-relaxed mb-4"
                  style={{ color: "var(--muted-foreground)" }}>
                  India's extreme heat (April–June) creates real EV fire risk with no strict insurance coverage for EV fires. Cold climates in northern and north-eastern India drain batteries faster due to slowed chemical reactions. These aren't hypothetical edge cases — they were sourced from news reports and shaped every safety-related design decision.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <DocImg
                    file="Vehicle Temperature 1.png"
                    alt="EV fire — roadside incident"
                    caption="Roadside EV fire — April–June heat risk, India" />
                  <DocImg
                    file="Vehicle temprature 2.png"
                    alt="Large-scale EV parking fire"
                    caption="Large-scale EV parking lot fire — real documented incident" />
                </div>
              </div>

              {/* RESEARCH — App Feedback */}
              <div>
                <SectionLabel label="research — real user feedback on the existing app" />
                <Img file="Feedback on the app from customers.png"
                  alt="ZConnect app — 2.8/5 user rating and reviews" expandable />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  {[
                    {
                      quote: "Have to re-login every single time I open the app. It's exhausting.",
                      label: "multiple re-login complaint",
                    },
                    {
                      quote: "Data only shows last 3 months. What's the point of a history screen that cuts off?",
                      label: "3-month data cutoff complaint",
                    },
                  ].map(({ quote, label }) => (
                    <div key={label} className="p-3 rounded-lg"
                      style={{ background: "var(--node-header)", border: "1px solid var(--border)" }}>
                      <p className="font-mono text-[8px] uppercase tracking-widest mb-2"
                        style={{ color: "var(--primary)", opacity: 0.6 }}>{label}</p>
                      <p className="font-serif italic text-sm leading-snug"
                        style={{ color: "var(--foreground)" }}>&ldquo;{quote}&rdquo;</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* PERSONA */}
              <div>
                <SectionLabel label="persona" />
                <Img file="Persona.png"
                  alt="Persona — Shashwat Dongre, 31, IT Professional, Mumbai" expandable />
              </div>

              {/* EMPATHY MAP */}
              <div>
                <SectionLabel label="empathy map" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                  {[
                    {
                      q: "see & hear",
                      points: ["Infrastructure fears and charging anxiety", "Real EV fire incidents in the news"],
                    },
                    {
                      q: "think",
                      points: ["Better to keep a petrol car for long trips", "EV only reliable within city limits"],
                    },
                    {
                      q: "feel",
                      points: ["Fear of impromptu travel without pre-planned charging stops", "Anxiety about battery drain on highways"],
                    },
                    {
                      q: "say & do",
                      points: ["Avoids long-distance EV trips", "Resistant to buying a second TATA EV"],
                    },
                  ].map(({ q, points }) => (
                    <div key={q} className="p-3 rounded-lg"
                      style={{ background: "var(--node-header)", border: "1px solid var(--border)" }}>
                      <p className="font-mono text-[8px] uppercase tracking-widest mb-2"
                        style={{ color: "var(--primary)" }}>{q}</p>
                      {points.map((p, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <span className="font-mono text-[9px] flex-shrink-0 mt-0.5"
                            style={{ color: "var(--primary)", opacity: 0.5 }}>—</span>
                          <p className="font-sans text-[10px] leading-snug mb-1"
                            style={{ color: "var(--muted-foreground)" }}>{p}</p>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <Img file="Empathy Map.png" alt="Empathy map — Shashwat's EV experience" expandable />
              </div>

              {/* USER JOURNEY */}
              <div>
                <SectionLabel label="user journey — shashwat's drive" />
                <p className="font-sans text-sm leading-relaxed mb-3"
                  style={{ color: "var(--muted-foreground)" }}>
                  Five stages of a single journey — from starting the car to the emotional low point that makes this redesign necessary. This is the dramatic center of the project. Read it slowly.
                </p>
                {/* Stage timeline */}
                <div className="overflow-x-auto pb-2 mb-4">
                  <div className="flex items-start gap-0" style={{ minWidth: 540 }}>
                    {[
                      { stage: "01", label: "Starting the Car", emotion: "confident" },
                      { stage: "02", label: "Sitting in Car",   emotion: "comfortable" },
                      { stage: "03", label: "On Road",          emotion: "anxious" },
                      { stage: "04", label: "Lunch Stop",       emotion: "worried" },
                      { stage: "05", label: "Car Catches Fire", emotion: "crisis", accent: true },
                    ].map(({ stage, label, emotion, accent }, i, arr) => (
                      <div key={stage} className="flex items-center flex-shrink-0">
                        <div className="flex flex-col items-center" style={{ minWidth: 100 }}>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center font-mono text-[9px] mb-2 flex-shrink-0"
                            style={{
                              background: accent ? "var(--primary)" : "var(--node-header)",
                              color: accent ? "var(--primary-foreground)" : "var(--muted-foreground)",
                              border: `1px solid ${accent ? "var(--primary)" : "var(--border)"}`,
                            }}>
                            {stage}
                          </div>
                          <p className="font-mono text-[8px] text-center leading-tight mb-1"
                            style={{ color: accent ? "var(--primary)" : "var(--foreground)", maxWidth: 84, fontWeight: accent ? 600 : 400 }}>
                            {label}
                          </p>
                          <p className="font-mono text-[8px] text-center"
                            style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>{emotion}</p>
                        </div>
                        {i < arr.length - 1 && (
                          <div style={{ width: 24, height: 1, flexShrink: 0, marginBottom: 32,
                            background: i === 3 ? "var(--primary)" : "var(--border)", opacity: i === 3 ? 1 : 0.5 }} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Journey map image — full width, given space to breathe */}
                <div className="rounded-lg overflow-hidden"
                  style={{ border: "1.5px solid var(--primary)" }}>
                  <img src={IBM_IMG("USer journey.png")} alt="User journey map — Shashwat's drive"
                    loading="lazy"
                    style={{ width: "100%", height: "auto", display: "block" }} />
                </div>
              </div>

              {/* IDEATION — Low-fi */}
              <div>
                <SectionLabel label="ideation — low-fi sketches" />
                <p className="font-sans text-sm leading-relaxed mb-3"
                  style={{ color: "var(--muted-foreground)" }}>
                  Hand-sketched wireframes from the first hours of the sprint. Three core screens defined early: Home, Charging Map, System Status. The raw quality is part of the story — this is what 12-hour thinking looks like.
                </p>
                <Img file="First-draft.png" alt="Hand-sketched wireframes — Home, Charging map, System status" expandable />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
                  {[
                    { label: "Home", desc: "System status, quick controls, tyre pressure, temperature" },
                    { label: "Charging Map", desc: "Occupied/vacant ports, map view, nearby stations" },
                    { label: "System Status", desc: "Wheel-by-wheel data, body temp, past drives" },
                  ].map(({ label, desc }) => (
                    <div key={label} className="p-2.5 rounded-lg"
                      style={{ background: "var(--node-header)", border: "1px solid var(--border)" }}>
                      <p className="font-mono text-[9px] mb-1"
                        style={{ color: "var(--primary)" }}>{label}</p>
                      <p className="font-sans text-[9px] leading-snug"
                        style={{ color: "var(--muted-foreground)" }}>{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* FINAL DESIGN + WRAP */}
              <div>
                <SectionLabel label="final design — evo-connect" />
                <p className="font-sans text-sm leading-relaxed mb-3"
                  style={{ color: "var(--muted-foreground)" }}>
                  Two hero screens: Home (system status, temperature alerts, quick controls) and Charging Station Nearby (map view, occupied/vacant port status). Designed within the 12-hour window — research to hi-fi.
                </p>
                <Img file="Wrap up..png" alt="EVO-CONNECT — final screen grid" expandable />
                <p className="font-sans text-sm leading-relaxed mt-4"
                  style={{ color: "var(--muted-foreground)" }}>
                  Twelve hours, from a real, research-backed problem — a TATA EV catching fire, traced back to genuine user complaints and India-specific climate risk — to a working design system. EVO-CONNECT reimagines TATA's app not as a cosmetic refresh, but as the actual safety and connectivity layer the brand's EV ambitions were missing.
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center gap-2 pt-3 overflow-hidden" style={{ borderTop: "1px solid var(--border)" }}>
                <button
                  onClick={() => onOpen("ibm-connector-workflow")}
                  className="flex items-center gap-2 flex-1 min-w-0 px-3 py-2 rounded-lg transition-opacity hover:opacity-80"
                  style={{ background: "var(--node-header)", border: "1px solid var(--border)", textAlign: "left" }}>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-widest mb-0.5" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>next →</p>
                    <p className="font-mono text-[11px] font-medium truncate" style={{ color: "var(--foreground)" }}>Companion Panel</p>
                    <p className="font-mono text-[10px] truncate" style={{ color: "var(--muted-foreground)", opacity: 0.6 }}>IBM Patterns · Connector Workflow</p>
                  </div>
                  <ChevronRight size={12} style={{ color: "var(--primary)", flexShrink: 0 }} />
                </button>
                <button
                  onClick={() => onOpen("instana-incident-remediation")}
                  className="hidden sm:flex items-center gap-2 flex-1 min-w-0 px-3 py-2 rounded-lg transition-opacity hover:opacity-80"
                  style={{ background: "var(--node-header)", border: "1px solid var(--border)", textAlign: "left" }}>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-widest mb-0.5" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>also →</p>
                    <p className="font-mono text-[11px] font-medium truncate" style={{ color: "var(--foreground)" }}>Instana Incident Remediation</p>
                    <p className="font-mono text-[10px] truncate" style={{ color: "var(--muted-foreground)", opacity: 0.6 }}>Agentic AI · iF Design Award 2025</p>
                  </div>
                  <ChevronRight size={12} style={{ color: "var(--primary)", flexShrink: 0 }} />
                </button>
                <button onClick={onClose}
                  className="flex items-center justify-center rounded-lg transition-opacity hover:opacity-70 w-9 flex-shrink-0"
                  style={{ border: "1px solid var(--border)", color: "var(--muted-foreground)", background: "var(--node-header)", alignSelf: "stretch" }}>
                  <X size={13} />
                </button>
              </div>

            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}

// ─── IBM Connector Workflow modal (password-gated) ────────────────────────────

export function IBMConnectorModal({ onClose, onOpen, dark, pageMode }: { onClose: () => void; onOpen: (slug: string) => void; dark: boolean; pageMode?: boolean }) {
  useEffect(() => {
    if (pageMode) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose, pageMode]);

  const SESSION_KEY = "ibm_connector_unlocked";
  const [unlocked, setUnlocked] = useState(() => { try { return sessionStorage.getItem(SESSION_KEY) === "1"; } catch { return false; } });
  const [guess, setGuess] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setChecking(true);
    try {
      const res = await fetch("/api/check-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guess }),
      });
      if (!res.ok) throw new Error("api_error");
      const data = await res.json() as { ok?: boolean };
      if (data.ok === true) {
        try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* ignore */ }
        setUnlocked(true);
      } else {
        setError("Incorrect password.");
        setGuess("");
      }
    } catch {
      setError("Could not verify — please try again.");
      // stays locked on any failure
    } finally {
      setChecking(false);
    }
  };

  const shell = dark ? "rgba(22,20,18,0.96)" : "#FAF8F4";

  const SL = ({ label }: { label: string }) => (
    <p className="font-mono text-[12px] uppercase tracking-widest mb-3" style={{ color: "var(--primary)" }}>// {label}</p>
  );

  // ── Journey map data ────────────────────────────────────────────────────────
  const ASIS_PHASES = ["1. Initiate Communication", "2. Development", "3. Content Development", "4. Finalise Updates"];

  const ASIS_STEPS = [
    { phase: 0, role: "PM",                   label: "Stakeholder Alignment",       desc: "Initial coordination between service/product and platform teams." },
    { phase: 1, role: "Service Developer",     label: "Issue Creation",              desc: "Service teams create a GitHub issue requesting support for their service in a connector." },
    { phase: 1, role: "Service Developer",     label: "Compatibility Check",         desc: "Connectivity team contacts the service team to check if their service is compatible with a connector." },
    { phase: 1, role: "Connectivity Dev",      label: "Add to supported services",   desc: "Manually write code in the backend to add the requested service to the connector." },
    { phase: 1, role: "system",                label: "Service tag added",           desc: "A service tag gets assigned to the connector to indicate its compatibility with specific tools or services." },
    { phase: 1, role: "system",                label: "Connector instance created",  desc: "A new connector instance is created and registered in the interface to enable integration with the specified service or tool." },
    { phase: 2, role: "Connectivity Dev",      label: "Description Requested",       desc: "The connectivity team reaches out to the platform/service content designers to add a description to the connector tile." },
    { phase: 2, role: "Content Designer",      label: "Context Requested",           desc: "The content designer asks the service team for a short overview about the connector." },
    { phase: 2, role: "Service Developer",     label: "Context provided",            desc: "The product or service team provides functional and usage context to the content designer." },
    { phase: 2, role: "Content Designer",      label: "Writing connector description", desc: "After receiving the content, the description for the connector is finalised and prepared for handoff." },
    { phase: 2, role: "Content Designer",      label: "Description handoff",         desc: "The content designer hands off the finalized connector description to the connectivity team." },
    { phase: 3, role: "system",                label: "Description reflected",       desc: "The connector description is implemented and displayed in the user interface." },
  ];

  const ASIS_PAINS = [
    { phase: 0, text: "Lack of Clear Ownership Early On", desc: "Misalignment or delays in initial coordination can lead to unclear ownership and rework later in the process." },
    { phase: 1, text: "Inconsistent Request Details", desc: "GitHub issue creation lacks a standardized template, resulting in incomplete or inconsistent requests that require follow-ups." },
    { phase: 1, text: "Manual and Time-Consuming Communication", desc: "Compatibility checks are done manually and rely on back-and-forth communication, increasing lead time and chances of miscommunication." },
    { phase: 1, text: "High Manual Effort & Risk of Errors", desc: "Backend code changes are done manually, which is time-intensive and prone to human errors, especially as the number of supported services scales." },
    { phase: 1, text: "Lack of visibility into creation & updates", desc: "Limited transparency about when and by who a connector is created or updated, who is creating/leading to delays." },
    { phase: 2, text: "Disjointed Communication", desc: "The overall content development phase suffers from fragmented communication across teams with no central coordination." },
    { phase: 2, text: "Description request is untracked and manual", desc: "The process of reaching out to content designers is manual and ad hoc, with no clear system to track or prioritize requests." },
    { phase: 2, text: "Context gathering is iterative and time consuming", desc: "Content designers often need to chase multiple teams for context, leading to delays and back-and-forth communication." },
    { phase: 2, text: "Lack of standardized context format", desc: "Context shared with content designers may lack standardization or sufficient detail, impacting the quality and consistency of the final connector descriptions." },
    { phase: 2, text: "Inconsistent content quality", desc: "A standard content framework might not exist leading to inconsistent connector descriptions, terminologies, etc. Description may also vary in quality, clarity and style." },
    { phase: 2, text: "Unstructured Handoff", desc: "Handoffs often happen over email or chat, making it difficult to track versions or ensure the content is implemented as intended — resulting in inconsistencies and disjointed handoff between teams." },
    { phase: 3, text: "No audit trail on description updates", desc: "Once descriptions are reflected, there is no visibility into what changed, when, or by whom." },
  ];

  const ASIS_OPPS = [
    { phase: 0, text: "Single Source of Truth", desc: "Implement a centralized ownership tracking system that clearly assigns and displays responsibility from the start along with a single source of truth." },
    { phase: 1, text: "Standardized Request Templates", desc: "Introduce a standardized and mandatory GitHub issue template to ensure all necessary information is provided upfront." },
    { phase: 1, text: "Automated Compatibility Checks", desc: "Automate compatibility checks to reduce manual effort and minimize back-and-forth communication." },
    { phase: 1, text: "Automate backend code changes", desc: "Misalignment or delays in initial coordination can lead to unclear ownership and rework later in the process." },
    { phase: 1, text: "Connector Activity Audit Trail", desc: "Introduce a transparent activity log or audit trail that tracks when a connector is created or updated, and by whom, to improve accountability and reduce delays." },
    { phase: 2, text: "Centralized Request Management System", desc: "Establish a request tracking system to streamline, prioritize, and monitor content design requests." },
    { phase: 2, text: "Shared Context Repository", desc: "Create a centralized, self-serve repository where teams can upload relevant project context to reduce back-and-forth and empower content designers with upfront information." },
    { phase: 2, text: "Unified platform content strategy", desc: "Implement a content style guide and reusable description patterns to maintain consistency in tone, structure, and terminology across all connector descriptions." },
    { phase: 2, text: "Structured Handoff Workflow", desc: "Introduce a structured handoff process using version-controlled tools or documentation systems to ensure alignment and reduce implementation errors." },
    { phase: 3, text: "Auto-sync descriptions to UI", desc: "Enable automatic synchronization of finalized descriptions to the UI so that manual implementation steps are eliminated." },
  ];

  const TOBE_STEPS = [
    { phase: 0, role: "Service Team",        label: "Submit Request & Preview UI",      desc: "Teams submit connector support requests with initial description/details and have an option to preview the connector tile in the UI." },
    { phase: 0, role: "PM",                  label: "Request Notification",             desc: "PM is notified of the request to add new services to existing connectors." },
    { phase: 0, role: "Service Developer",   label: "Initial details from Service Team",desc: "Service team can give initial description/details which content will read to write description while requesting." },
    { phase: 1, role: "Connectivity Dev",    label: "Review Request",                   desc: "Connectivity developers review the request raised by service teams and all detailed info. They can add any comments/notes to the request." },
    { phase: 1, role: "Connectivity Dev",    label: "Preview UI & Approve",             desc: "The connectivity developers can preview the UI and then approve connector updates." },
    { phase: 1, role: "system",              label: "Service tag added",                desc: "A service tag gets assigned to the connector to indicate its compatibility with specific tools or services." },
    { phase: 1, role: "system",              label: "Auto-sync with documentation",     desc: "A new connector instance is created and registered in the interface to enable integration with the specified service or tool." },
    { phase: 2, role: "Content Designer",    label: "Notified for request",             desc: "Content Designers are notified through system triggers along with a trigger on their email when connector descriptions and documentation need to be updated." },
    { phase: 2, role: "Content Designer",    label: "Initial Details Received",         desc: "The content designer has all the context required from the service team's request and documentation." },
    { phase: 2, role: "Content Designer",    label: "Write Content and Preview",        desc: "They write the content and have the privilege to see the preview of the connector tile, before finalising it." },
    { phase: 2, role: "Content Designer",    label: "Content updated in UI",            desc: "The description gets published and reflected in the UI and gets auto-synced with documentation." },
    { phase: 3, role: "system",              label: "Service-specific instance created",desc: "A service specific instance of the connector gets created and displayed in a connector tile in the UI." },
    { phase: 3, role: "system",              label: "Description and Documentation reflected", desc: "The connector description is implemented and displayed in the UI and the CP4D documentation is updated." },
  ];

  const TOBE_THINKING = [
    { phase: 0, text: "Instant Clarity",          quote: "Nice, I can quickly check and manage connector status all in one place." },
    { phase: 0, text: "Single Source of Truth",   quote: "I can trust this portal to reflect the latest connector capabilities and support." },
    { phase: 0, text: "Streamlined Requests",     quote: "This is so much easier — no more back-and-forth emails or unclear forms." },
    { phase: 1, text: "Proactive Visibility",     quote: "Great, I'm immediately in the loop and can prioritize this efficiently." },
    { phase: 1, text: "No manual follow ups",     quote: "Perfect! I do not need to chase anyone. The updates go live automatically." },
    { phase: 2, text: "Prompt, not pinged",       quote: "Nice, I got notified at the right time — exactly when I needed it. No more last minute Slack messages and surprises." },
    { phase: 2, text: "All context in one place", quote: "Great — Everything I need is here. No more chasing people for the missing information." },
    { phase: 3, text: "Done and Dusted",          quote: "It is updated and reflected immediately — that was super quick and clean!" },
  ];

  const TOBE_FEELINGS = [
    { phase: 0, text: "Confident, In control" },
    { phase: 0, text: "Trust, Reassured" },
    { phase: 0, text: "Empowered, focused" },
    { phase: 1, text: "Relieved, efficient" },
    { phase: 1, text: "Relieved, confident" },
    { phase: 2, text: "Up-to-date, In the loop" },
    { phase: 2, text: "Satisfied" },
    { phase: 3, text: "Accomplished and Pleased" },
  ];

  // ── Sub-hill color helpers ───────────────────────────────────────────────────
  type HillSegment = { text: string; color: "blue" | "green" | "pink" | "none" };
  const HillText = ({ segments }: { segments: HillSegment[] }) => (
    <p className="font-sans text-sm leading-relaxed">
      {segments.map((seg, i) => {
        const colors: Record<string, string> = {
          blue:  "#3B82F6",
          green: "#22C55E",
          pink:  "#EC4899",
          none:  "var(--muted-foreground)",
        };
        return (
          <span key={i} style={{ color: colors[seg.color], fontStyle: seg.color === "green" ? "italic" : "normal" }}>
            {seg.text}
          </span>
        );
      })}
    </p>
  );

  const HILLS: { id: string; segments: HillSegment[] }[] = [
    {
      id: "Hill 01",
      segments: [
        { text: "Service team ", color: "blue" },
        { text: "can select and update status of supported connectors ", color: "none" },
        { text: "without having to depend on connectivity team ", color: "pink" },
        { text: "saving weeks ", color: "green" },
        { text: "worth of time.", color: "green" },
      ],
    },
    {
      id: "Hill 02",
      segments: [
        { text: "A single view ", color: "pink" },
        { text: "for content professionals ", color: "blue" },
        { text: "to receive relevant content and directly update UI descriptions & documentation ", color: "none" },
        { text: "eliminating the dependency on developers and reducing time to publish from weeks to days.", color: "green" },
      ],
    },
    {
      id: "Hill 03",
      segments: [
        { text: "The connectivity development team ", color: "blue" },
        { text: "can review and make final decisions on connector support requests raised by service teams in a unified view ", color: "none" },
        { text: "allowing them to step away from the constant coordination.", color: "green" },
      ],
    },
  ];

  // ── Timeline data ────────────────────────────────────────────────────────────
  const TIMELINE = [
    {
      week: "Week 1",
      items: [
        { label: "Meet & Greet with Sponsor", desc: "Connecting with the Sponsor team, Coach, and team introduction. Understanding the initial project objective summary." },
        { label: "Assumptions & Questions",   desc: "Researching within the documents & links shared, filtering meaningful findings, questions and discussing to gain clarity." },
        { label: "As-is flow & Personas",     desc: "Brainstorming with team, reaching out to Design SMEs, Dev SME, and incubator lead to receive clarity." },
        { label: "Playback 01",               desc: "Presenting our week one progress and receiving feedback from Coach and Team.", highlight: true },
      ],
    },
    {
      week: "Week 2",
      items: [
        { label: "Interview scheduling",          desc: "Connecting with the Sponsor team, Coach, and team introduction. Understanding the initial project objective summary." },
        { label: "Ask questions & get answers",   desc: "Researching within the documents & links shared, filtering meaningful findings, questions and discussing to gain clarity." },
        { label: "Summarise research documentation", desc: "Brainstorming with team, reaching out to Design SMEs, Dev SME, and incubator lead to receive clarity." },
        { label: "Synthesising data",             desc: "Through affinity mapping, empathy mapping, co-relating with personas, and identifying key painpoints across." },
        { label: "Playback 02",                   desc: "", highlight: true },
      ],
    },
    {
      week: "Week 3",
      items: [
        { label: "Redefine the Hills",            desc: "Rework on the hill statements as per feedback and rethink on the wow statements." },
        { label: "Ideations",                     desc: "Going big with ideas using How Might We's and prioritizing them using the impact vs feasibility matrix." },
        { label: "To Be scenario and Task Flows", desc: "Brainstorming from the As Is > To Be focussing on how we can improve the pain points and what can be the vision with a ready draft and foundation in the form of task flow." },
        { label: "Low Fidelity + Hi Fidelity wireframes", desc: "Through the task flow as our foundation, we then created the low fidelity designs, taking early feedback and then creating the high fidelity screens." },
        { label: "Playback 03",                   desc: "", highlight: true },
      ],
    },
  ];

  // ── Journey map sub-component ────────────────────────────────────────────────
  const JourneyMap = ({
    phases, steps, row2, row2Label, row2Color,
    row3, row3Label, row3Color,
  }: {
    phases: string[];
    steps: { phase: number; role: string; label: string; desc: string }[];
    row2: { phase: number; text: string; desc: string }[];
    row2Label: string; row2Color: string;
    row3: { phase: number; text: string; desc?: string }[];
    row3Label: string; row3Color: string;
  }) => {
    const roleColor = (role: string) => {
      if (role === "system") return "var(--border)";
      if (role.includes("PM")) return "#8B5CF6";
      if (role.includes("Service")) return "#3B82F6";
      if (role.includes("Connectivity")) return "#F59E0B";
      if (role.includes("Content")) return "#10B981";
      return "var(--primary)";
    };
    return (
      <div className="overflow-x-auto pb-2 -mx-2 px-2">
        <div style={{ minWidth: 720 }}>
          {/* Phase headers */}
          <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: `repeat(${phases.length}, 1fr)` }}>
            {phases.map((ph, i) => (
              <div key={i} className="px-2 py-1.5 rounded text-center font-mono text-[10px] uppercase tracking-widest"
                style={{ background: "var(--node-header)", border: "1px solid var(--border)", color: "var(--primary)" }}>
                {ph}
              </div>
            ))}
          </div>
          {/* Row 1 — Process/Doing */}
          <div className="mb-1">
            <p className="font-mono text-[10px] uppercase tracking-widest mb-1.5 px-1"
              style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>// process · doing</p>
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${phases.length}, 1fr)` }}>
              {phases.map((_, phaseIdx) => {
                const phaseSteps = steps.filter(s => s.phase === phaseIdx);
                return (
                  <div key={phaseIdx} className="flex flex-col gap-1">
                    {phaseSteps.map((s, i) => (
                      <div key={i} className="p-2 rounded"
                        style={{
                          background: s.role === "system"
                            ? (dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)")
                            : "var(--node-header)",
                          border: `1px solid ${s.role === "system" ? "var(--border)" : roleColor(s.role)}`,
                          borderStyle: s.role === "system" ? "dashed" : "solid",
                        }}>
                        <p className="font-mono text-[10px] mb-0.5" style={{ color: roleColor(s.role) }}>{s.role}</p>
                        <p className="font-sans text-[12px] font-semibold mb-0.5" style={{ color: "var(--foreground)" }}>{s.label}</p>
                        <p className="font-sans text-[9px]" style={{ color: "var(--muted-foreground)", lineHeight: 1.5 }}>{s.desc}</p>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
          {/* Row 2 — Pain / Thinking */}
          <div className="mb-1">
            <p className="font-mono text-[10px] uppercase tracking-widest mb-1.5 px-1"
              style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>// {row2Label}</p>
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${phases.length}, 1fr)` }}>
              {phases.map((_, phaseIdx) => {
                const items = row2.filter(r => r.phase === phaseIdx);
                return (
                  <div key={phaseIdx} className="flex flex-col gap-1">
                    {items.map((item, i) => {
                      const subText = ("quote" in item ? (item as { quote: string }).quote : null) ?? (item.desc ?? null);
                      const isQuote = "quote" in item;
                      return (
                      <div key={i} className="p-2 rounded"
                        style={{ background: `${row2Color}18`, border: `1px solid ${row2Color}55` }}>
                        <p className="font-sans text-[12px] font-semibold mb-0.5" style={{ color: row2Color }}>{item.text}</p>
                        {subText && (
                          <p className="font-sans text-[9px]" style={{ color: "var(--muted-foreground)", lineHeight: 1.5, fontStyle: isQuote ? "italic" : "normal" }}>
                            {isQuote ? `"${subText}"` : subText}
                          </p>
                        )}
                      </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
          {/* Row 3 — Opportunities / Feeling */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest mb-1.5 px-1"
              style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>// {row3Label}</p>
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${phases.length}, 1fr)` }}>
              {phases.map((_, phaseIdx) => {
                const items = row3.filter(r => r.phase === phaseIdx);
                return (
                  <div key={phaseIdx} className="flex flex-col gap-1">
                    {items.map((item, i) => (
                      <div key={i} className="p-2 rounded"
                        style={{ background: `${row3Color}18`, border: `1px solid ${row3Color}55` }}>
                        <p className="font-sans text-[12px] font-semibold mb-0.5" style={{ color: row3Color }}>{item.text}</p>
                        {"desc" in item && item.desc && <p className="font-sans text-[9px]" style={{ color: "var(--muted-foreground)", lineHeight: 1.5 }}>{item.desc}</p>}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
    {lightbox && (
      <div className="fixed inset-0 z-[400] flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(8px)" }}
        onClick={() => setLightbox(null)}>
        <img src={lightbox} alt="expanded"
          style={{ maxWidth: "92vw", maxHeight: "90vh", width: "auto", height: "auto", borderRadius: 8, border: "1px solid var(--border)" }} />
        <button className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full"
          style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}
          onClick={() => setLightbox(null)}>
          <X size={14} />
        </button>
      </div>
    )}
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={pageMode ? "w-full flex items-start justify-center" : "fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto"}
      style={pageMode ? {} : { background: dark ? "rgba(10,9,8,0.9)" : "rgba(40,36,32,0.6)", backdropFilter: "blur(10px)" }}
      onClick={pageMode ? undefined : onClose}>

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className={pageMode && isMobile ? "relative w-full overflow-hidden flex flex-col" : "relative w-full max-w-3xl mx-4 my-10 rounded-xl overflow-hidden flex flex-col"}
        style={pageMode && isMobile ? {} : { background: shell, border: "1px solid var(--border)", boxShadow: dark ? "0 24px 80px rgba(0,0,0,0.75), inset 0 1px 0 rgba(237,233,227,0.06)" : "0 24px 80px rgba(26,24,22,0.13), inset 0 1px 0 rgba(255,255,255,1)" }}
        onClick={e => e.stopPropagation()}>

        {/* ── Node header bar ── */}
        <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
          style={{ background: "var(--node-header)", borderBottom: "1px solid var(--border)" }}>
          {pageMode ? (
            <div className="flex items-center gap-2 min-w-0">
              <button onClick={onClose}
                className="flex items-center gap-1.5 font-mono text-[9px] transition-opacity hover:opacity-60 flex-shrink-0"
                style={{ color: "var(--muted-foreground)", background: "none", border: "none", cursor: "pointer" }}>
                <ArrowLeft size={11} />
                <span className="hidden sm:inline">back</span>
              </button>
              <span className="font-mono text-[9px]" style={{ color: "var(--border)", opacity: 0.6, flexShrink: 0 }}>|</span>
              <span style={{ color: "var(--primary)", flexShrink: 0 }}>▤</span>
              <span className="font-mono text-[9px] tracking-[0.2em] uppercase truncate"
                style={{ color: "var(--primary)", fontWeight: 500 }}>project · case study</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span style={{ color: "var(--primary)" }}>▤</span>
              <span className="font-mono text-[9px] tracking-[0.2em] uppercase"
                style={{ color: "var(--primary)", fontWeight: 500 }}>project · case study</span>
              <span className="font-mono text-[9px]"
                style={{ color: "var(--muted-foreground)", opacity: 0.38 }}>prj_ibm_connector</span>
            </div>
          )}
          <div className="flex items-center gap-2 flex-shrink-0">
            {pageMode ? (
              <span className="font-mono text-[9px] flex-shrink-0"
                style={{ color: "var(--muted-foreground)", opacity: 0.38 }}>prj_ibm_connector</span>
            ) : (
              <button onClick={onClose}
                className="flex items-center justify-center w-6 h-6 rounded transition-opacity hover:opacity-60"
                style={{ color: "var(--muted-foreground)" }}>
                <X size={13} />
              </button>
            )}
            <ReadTime minutes={7} className="hidden sm:inline" />
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className={pageMode ? undefined : "overflow-y-auto flex-1"}>

          {/* HERO — summary ending image */}
          <div className="w-full overflow-hidden" style={{ background: "#050D1A" }}>
            <img src="/images/Companion panel/Hero.png" alt="Companion Panel — IBM"
              style={{ width: "100%", height: "auto", display: "block" }} />
          </div>

          <div className="p-6" style={{ display: "flex", flexDirection: "column", gap: 32 }}>

            {/* ─── TIER 1 — always visible ─────────────────────────── */}

            {/* TITLE BLOCK */}
            <div>
              <p className="font-mono text-[9px] tracking-[0.2em] uppercase mb-2"
                style={{ color: "var(--primary)" }}>Workflow Design · Cross-functional · Systems Thinking</p>
              <h2 className="font-serif leading-tight mb-1"
                style={{ fontSize: "clamp(1.4rem,3.5vw,2.2rem)", color: "var(--foreground)", lineHeight: 1.15 }}>
                IBM Innovation Incubator — Connector Content Workflow
              </h2>
              <p className="font-serif italic text-base mb-1" style={{ color: "var(--muted-foreground)" }}>
                Patterns 2025 · 3-week cross-functional design initiative
              </p>
              <p className="font-mono text-[11px] mb-4" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>
                Visual & UX Designer — IBM Instana, Kochi
              </p>
              <div className="sm:hidden">
                <ReadTime minutes={7} />
              </div>
            </div>

            {/* OVERVIEW + SUMMARY */}
            <div>
              <SL label="summary" />
              <div className="p-4 rounded-lg mb-4"
                style={{ background: "var(--node-header)", border: "1px solid var(--border)" }}>
                <p className="font-sans text-sm leading-relaxed"
                  style={{ color: "var(--muted-foreground)" }}>
                  Led design on a workflow redesign for how connector documentation gets created, reviewed, and
                  published across product, content, and engineering teams — replacing a manual,
                  email-and-Slack-driven process with a structured, self-serve system.
                </p>
              </div>
            </div>

            {/* AS-IS high level */}
            <div>
              <SL label="as-is — the situation" />
              <div className="p-4 rounded-lg"
                style={{ background: "var(--node-header)", border: "1px solid var(--border)" }}>
                <p className="font-sans text-sm leading-relaxed"
                  style={{ color: "var(--muted-foreground)" }}>
                  Connector information lived in three disconnected places — platform documentation, a shared spreadsheet, and the backend itself — with no single source of truth. Updating or publishing a connector meant manually chasing four different roles across product, service, connectivity, and content teams, with no visibility into who owned a request or where it stood. What should've taken days routinely took weeks.
                </p>
              </div>
            </div>

            {/* TO-BE high level */}
            <div>
              <SL label="to-be — the redesign" />
              <div className="p-4 rounded-lg"
                style={{ background: "var(--node-header)", border: "1px solid var(--border)" }}>
                <p className="font-sans text-sm leading-relaxed"
                  style={{ color: "var(--muted-foreground)" }}>
                  Redesigned the flow so each team could act independently within a shared system — service teams request and preview changes directly, connectivity developers approve with full context already attached, and content updates publish and sync automatically. No more chasing people for status; every handoff is tracked instead of assumed.
                </p>
              </div>
            </div>

            {/* END GOAL high level */}
            <div>
              <SL label="end goal — outcome" />
              <div className="p-4 rounded-lg"
                style={{ border: "1px solid var(--primary)", background: "var(--node-header)" }}>
                <p className="font-sans text-sm leading-relaxed"
                  style={{ color: "var(--muted-foreground)" }}>
                  Cut connector publishing time from weeks to days, removed the dependency bottlenecks between four teams, and gave every stakeholder real-time visibility into a process that used to run entirely on manual follow-up.
                </p>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
              {["Workflow Design", "Cross-functional", "Systems Thinking"].map(t => (
                <span key={t} className="font-mono text-[12px] px-2 py-0.5 rounded"
                  style={{ background: "var(--muted)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}>{t}</span>
              ))}
            </div>

            {/* ─── PASSWORD GATE ──────────────────────────────────────── */}
            {!unlocked ? (
              <div className="rounded-lg overflow-hidden"
                style={{ border: "1px solid var(--border)" }}>
                <div className="px-4 py-3"
                  style={{ background: "var(--node-header)", borderBottom: "1px solid var(--border)" }}>
                  <p className="font-mono text-[10px] uppercase tracking-widest"
                    style={{ color: "var(--primary)" }}>// full case study</p>
                </div>
                <div className="p-5">
                  <p className="font-sans text-sm leading-relaxed font-semibold mb-2"
                    style={{ color: "var(--foreground)" }}>
                    Enter password to view the full case study.
                  </p>
                  <p className="font-sans text-xs leading-relaxed mb-4"
                    style={{ color: "var(--muted-foreground)", opacity: 0.6 }}>
                    This is real work from an internal IBM project — worth sharing, but too detailed to publish openly. If you're a hiring manager or collaborator who wants the full process, reach out via{" "}
                    <a href="mailto:ux.sayan@gmail.com" className="underline underline-offset-2 transition-opacity hover:opacity-80" style={{ color: "var(--primary)" }}>email</a>
                    {" "}or{" "}
                    <a href="https://linkedin.com/in/sayanoriginals" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 transition-opacity hover:opacity-80" style={{ color: "var(--primary)" }}>LinkedIn</a>
                    {" "}and I'll send the password.
                  </p>
                  <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <input
                      type="password"
                      value={guess}
                      onChange={e => setGuess(e.target.value)}
                      placeholder="Password"
                      autoComplete="off"
                      className="w-full px-3 py-2 rounded font-mono text-sm"
                      style={{
                        background: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                        border: `1px solid ${error ? "#EF4444" : "var(--border)"}`,
                        color: "var(--foreground)",
                        outline: "none",
                      }}
                    />
                    {error && (
                      <p className="font-mono text-[10px]" style={{ color: "#EF4444" }}>{error}</p>
                    )}
                    <button
                      type="submit"
                      disabled={checking || !guess}
                      className="w-full flex items-center justify-center gap-1.5 font-mono text-sm py-2 rounded transition-opacity hover:opacity-80 disabled:opacity-40"
                      style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                      {checking ? "Checking…" : <><Unlock size={13} /> unlock</>}
                    </button>
                  </form>
                </div>
              </div>
            ) : (

              /* ─── TIER 2 — unlocked ──────────────────────────────────── */
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                style={{ display: "flex", flexDirection: "column", gap: 32, width: "100%", minWidth: 0 }}>

                {/* PLAYBACK SLIDES CAROUSEL */}
                <div>
                  <SL label="final playback — slide deck" />
                  <SlideCarousel
                    slides={[
                      ...Array.from({ length: 58 }, (_, i) => `/images/Companion panel/${i + 1}.png`),
                      `/images/Companion panel/60.png`,
                      `/images/Companion panel/61 Closing.png`,
                    ]}
                    dark={dark}
                  />
                </div>

                {/* SPONSOR TEAM */}
                <div>
                  <SL label="sponsor team — cloud pak for data, connectivity team" />
                  <div className="p-4 rounded-lg mb-3"
                    style={{ background: "var(--node-header)", border: "1px solid var(--border)" }}>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-4">
                      {[
                        { group: "Use cases", items: ["Data integration", "Data intelligence", "Master data management", "Data observability"] },
                        { group: "Capabilities", items: ["Data access", "Self-service consumption", "Accumulated knowledge", "Collaborative innovation", "Governance and compliance", "Unified lifecycle"] },
                        { group: "Data sources", items: ["Data lakehouse", "Data warehouse", "Data lake", "Database", "Business applications"] },
                        { group: "Environments", items: ["Cloud", "On premises"] },
                      ].map(({ group, items }) => (
                        <div key={group}>
                          <p className="font-mono text-[10px] uppercase tracking-widest mb-2"
                            style={{ color: "var(--primary)" }}>{group}</p>
                          {items.map(item => (
                            <p key={item} className="font-sans text-[10px] mb-1"
                              style={{ color: "var(--muted-foreground)", lineHeight: 1.5 }}>· {item}</p>
                          ))}
                        </div>
                      ))}
                    </div>
                    <p className="font-sans text-xs leading-relaxed pt-3"
                      style={{ color: "var(--muted-foreground)", borderTop: "1px solid var(--border)" }}>
                      Allow service teams to define and manage the connectors they support in a self-serve UI. This reduces effort across multiple parties and ensures more accurate information with fewer chances for mistakes. (Ensuring that our customers have more reliable information on the supported connectors as well.)
                    </p>
                  </div>
                </div>

                {/* THE TEAM */}
                <div>
                  <SL label="the team" />
                  <div className="p-4 rounded-lg"
                    style={{ background: "var(--node-header)", border: "1px solid var(--border)" }}>
                    <p className="font-sans text-[13px] font-semibold mb-0.5"
                      style={{ color: "var(--foreground)" }}>Sayan Chakraborty</p>
                    <p className="font-mono text-[12px] mb-1" style={{ color: "var(--primary)" }}>Visual & UX Designer · IBM Instana · Kochi</p>
                    <p className="font-mono text-[12px] italic"
                      style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>Contributor</p>
                  </div>
                </div>

                {/* TIMELINE — Gantt chart (desktop) / week switcher (mobile) */}
                {(() => {
                  const TOTAL = 15;
                  const weekColors = ["#3B82F6", "#8B5CF6", "#10B981"];
                  const weekLabels = ["Week 1", "Week 2", "Week 3"];
                  const LABEL_W = 180;
                  const ganttRows: { label: string; desc: string; start: number; span: number; highlight: boolean; weekIdx: number }[] = [
                    { label: "Meet & Greet with Sponsor",          desc: "Connecting with the Sponsor team, Coach, and team introduction. Understanding the initial project objective summary.",                                                                         start: 0,  span: 3, highlight: false, weekIdx: 0 },
                    { label: "Assumptions & Questions",             desc: "Researching within the documents & links shared, filtering meaningful findings, questions and discussing to gain clarity.",                                                                   start: 1,  span: 3, highlight: false, weekIdx: 0 },
                    { label: "As-is flow & Personas",               desc: "Brainstorming with team, reaching out to Design SMEs, Dev SME, and incubator lead to receive clarity.",                                                                                    start: 2,  span: 2, highlight: false, weekIdx: 0 },
                    { label: "Playback 01",                         desc: "Presenting our week one progress and receiving feedback from Coach and Team.",                                                                                                              start: 4,  span: 1, highlight: true,  weekIdx: 0 },
                    { label: "Interview scheduling",                desc: "Connecting with the Sponsor team, Coach, and team introduction. Understanding the initial project objective summary.",                                                                        start: 5,  span: 2, highlight: false, weekIdx: 1 },
                    { label: "Ask questions & get answers",         desc: "Researching within the documents & links shared, filtering meaningful findings, questions and discussing to gain clarity.",                                                                   start: 6,  span: 2, highlight: false, weekIdx: 1 },
                    { label: "Summarise research documentation",    desc: "Brainstorming with team, reaching out to Design SMEs, Dev SME, and incubator lead to receive clarity.",                                                                                    start: 7,  span: 1, highlight: false, weekIdx: 1 },
                    { label: "Synthesising data",                   desc: "Through affinity mapping, empathy mapping, co-relating with personas, and identifying key painpoints across.",                                                                             start: 8,  span: 1, highlight: false, weekIdx: 1 },
                    { label: "Playback 02",                         desc: "",                                                                                                                                                                                          start: 9,  span: 1, highlight: true,  weekIdx: 1 },
                    { label: "Redefine the Hills",                  desc: "Rework on the hill statements as per feedback and rethink on the wow statements.",                                                                                                         start: 10, span: 1, highlight: false, weekIdx: 2 },
                    { label: "Ideations",                           desc: "Going big with ideas using How Might We's and prioritizing them using the impact vs feasibility matrix.",                                                                                  start: 10, span: 2, highlight: false, weekIdx: 2 },
                    { label: "To Be scenario and Task Flows",       desc: "Brainstorming from the As Is > To Be focussing on how we can improve the pain points and what can be the vision with a ready draft and foundation in the form of task flow.",              start: 11, span: 2, highlight: false, weekIdx: 2 },
                    { label: "Low Fidelity + Hi Fidelity wireframes", desc: "Through the task flow as our foundation, we then created the low fidelity designs, taking early feedback and then creating the high fidelity screens.",                                  start: 12, span: 2, highlight: false, weekIdx: 2 },
                    { label: "Playback 03",                         desc: "",                                                                                                                                                                                          start: 14, span: 1, highlight: true,  weekIdx: 2 },
                  ];

                  // Inner component so we can use useState for the mobile tab
                  const GanttChart = () => {
                    const [activeWeek, setActiveWeek] = useState(0);
                    const activeRows = ganttRows.filter(r => r.weekIdx === activeWeek);
                    const color = weekColors[activeWeek];

                    return (
                      <div>
                        <SL label="3-week incubator timeline" />
                        <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>

                          {/* ── MOBILE: week tab switcher ── */}
                          <div className="sm:hidden">
                            {/* Tab strip */}
                            <div className="flex" style={{ borderBottom: "1px solid var(--border)" }}>
                              {weekLabels.map((w, i) => (
                                <button key={w} onClick={() => setActiveWeek(i)}
                                  className="flex-1 py-2.5 font-mono text-[11px] uppercase tracking-widest transition-colors"
                                  style={{
                                    background: activeWeek === i ? `${weekColors[i]}20` : "transparent",
                                    color: activeWeek === i ? weekColors[i] : "var(--muted-foreground)",
                                    borderBottom: activeWeek === i ? `2px solid ${weekColors[i]}` : "2px solid transparent",
                                  }}>
                                  {`W${i + 1}`}
                                </button>
                              ))}
                            </div>

                            {/* Week label */}
                            <div className="px-4 pt-3 pb-1 font-mono text-[11px] uppercase tracking-widest"
                              style={{ color }}>
                              {weekLabels[activeWeek]}
                            </div>

                            {/* Task list for active week */}
                            <div className="px-3 pb-3 space-y-2">
                              {activeRows.map(({ label, desc, highlight }) => (
                                <div key={label} className="flex items-start gap-3 p-3 rounded-lg"
                                  style={{
                                    background: highlight ? `${color}12` : "var(--node-header)",
                                    border: `1px solid ${highlight ? color : "var(--border)"}`,
                                  }}>
                                  {/* Indicator */}
                                  <div className="flex-shrink-0 mt-1">
                                    {highlight ? (
                                      <div style={{ width: 10, height: 10, background: color, transform: "rotate(45deg)", borderRadius: 2 }} />
                                    ) : (
                                      <div className="rounded-full" style={{ width: 8, height: 8, background: color, opacity: 0.85, marginTop: 1 }} />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-sans text-[12px] font-semibold leading-snug"
                                      style={{ color: highlight ? color : "var(--foreground)" }}>
                                      {label}
                                    </p>
                                    {desc && (
                                      <p className="font-sans text-[11px] leading-snug mt-0.5"
                                        style={{ color: "var(--muted-foreground)" }}>
                                        {desc}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* ── DESKTOP: full Gantt ── */}
                          <div className="hidden sm:block">
                            {/* Week header */}
                            <div className="flex" style={{ borderBottom: "1px solid var(--border)" }}>
                              <div style={{ width: LABEL_W, flexShrink: 0 }} />
                              <div className="flex flex-1">
                                {weekLabels.map((w, i) => (
                                  <div key={w} className="flex-1 py-2 text-center font-mono text-[10px] uppercase tracking-widest"
                                    style={{ background: `${weekColors[i]}14`, color: weekColors[i] }}>
                                    {w}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Rows */}
                            <div className="py-2">
                              {ganttRows.map(({ label, start, span, highlight, weekIdx }) => {
                                const leftPct  = (start / TOTAL) * 100;
                                const widthPct = (span  / TOTAL) * 100;
                                const rowColor = highlight ? "var(--primary)" : weekColors[weekIdx];
                                return (
                                  <div key={label} className="flex items-center" style={{ height: 36, marginBottom: 2 }}>
                                    <div className="flex items-center px-3 flex-shrink-0" style={{ width: LABEL_W }}>
                                      <span className="font-sans text-[11px] leading-tight"
                                        style={{
                                          color: highlight ? rowColor : "var(--muted-foreground)",
                                          fontWeight: highlight ? 600 : 400,
                                          overflow: "hidden",
                                          display: "-webkit-box",
                                          WebkitLineClamp: 2,
                                          WebkitBoxOrient: "vertical",
                                        }}>
                                        {label}
                                      </span>
                                    </div>
                                    <div className="relative flex-1 h-full flex">
                                      {weekLabels.map((_, wi) => (
                                        <div key={wi} className="flex-1 h-full"
                                          style={{ background: `${weekColors[wi]}08` }} />
                                      ))}
                                      {highlight ? (
                                        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                                          style={{ left: `${leftPct + widthPct / 2}%`, zIndex: 2 }}>
                                          <div style={{ width: 11, height: 11, background: rowColor, transform: "rotate(45deg)", borderRadius: 2 }} />
                                        </div>
                                      ) : (
                                        <div className="absolute top-1/2 -translate-y-1/2 rounded-full"
                                          style={{ left: `${leftPct}%`, width: `${widthPct}%`, height: 10, background: rowColor, opacity: 0.85, zIndex: 2, minWidth: 8 }} />
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Legend */}
                            <div className="flex flex-wrap items-center gap-4 px-4 py-2.5"
                              style={{ borderTop: "1px solid var(--border)", background: "var(--node-header)" }}>
                              {weekLabels.map((w, i) => (
                                <div key={w} className="flex items-center gap-1.5">
                                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: weekColors[i] }} />
                                  <span className="font-mono text-[11px]" style={{ color: "var(--muted-foreground)" }}>{w}</span>
                                </div>
                              ))}
                              <div className="flex items-center gap-1.5">
                                <div style={{ width: 9, height: 9, background: "var(--primary)", transform: "rotate(45deg)", borderRadius: 2 }} />
                                <span className="font-mono text-[11px]" style={{ color: "var(--muted-foreground)" }}>Playback</span>
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>
                    );
                  };

                  return <GanttChart />;
                })()}

                {/* PROBLEM — 3 sources */}
                <div>
                  <SL label="problem — the three sources of truth" />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                    {[
                      { title: "Platform Documentation", owner: "by platform team" },
                      { title: "Excel File",             owner: "by PO" },
                      { title: "Backend",                owner: "by connectivity devs" },
                    ].map(({ title, owner }) => (
                      <div key={title} className="p-3 rounded-lg text-center"
                        style={{ background: dark ? "rgba(255,255,255,0.03)" : "rgba(26,24,22,0.04)", border: "1px solid var(--border)" }}>
                        <p className="font-sans text-sm font-semibold mb-0.5" style={{ color: "var(--foreground)" }}>{title}</p>
                        <p className="font-mono text-[12px]" style={{ color: "var(--muted-foreground)" }}>{owner}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 rounded-lg mb-2"
                    style={{ background: "#EF444418", border: "1px solid #EF444455" }}>
                    <p className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: "#EF4444" }}>pain point</p>
                    <p className="font-sans text-xs leading-snug" style={{ color: "var(--muted-foreground)" }}>
                      Scattered and varied information about connectors and supported services.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg"
                    style={{ background: "#22C55E18", border: "1px solid #22C55E55" }}>
                    <p className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: "#22C55E" }}>area of opportunity</p>
                    <p className="font-sans text-xs leading-snug" style={{ color: "var(--muted-foreground)" }}>
                      A centralised method of updating connector information, descriptions and supported services.
                    </p>
                  </div>
                </div>

                {/* PERSONAS */}
                <div>
                  <SL label="personas — 4 stakeholders" />
                  <div className="space-y-3">
                    {[
                      {
                        initial: "E", name: "Emma Brown", role: "Product Manager, Connectivity Team, CP4D", location: "New York",
                        bg: "A strategic thinker and empathetic leader who connects the dots between vision, execution, and user needs. Thrives in ambiguity, aligns cross-functional teams, and keeps everyone focused on delivering value. With a knack for prioritization and communication, they ensure the right things get built — at the right time.",
                        goals: ["Reduce time-to-market by minimizing dependencies on other teams.", "Improve operational efficiency by streamlining connector update processes.", "Enhance customer trust and satisfaction through accurate and reliable product experience."],
                        needs: ["Real-time visibility into connector lifecycle and support status.", "Automated workflows to reduce manual coordination.", "Customer-facing accuracy to reduce confusion and support load."],
                        pains: ["Reliance on multiple teams (development, content, support) for connector updates causes delays, leads to inefficiencies and missed deadlines.", "Inaccurate or outdated connector information confuses customers and increases support tickets."],
                        quote: "When connector data is outdated, it's not just a product issue — it becomes a customer trust issue.",
                        worksWithColors: "#8B5CF6",
                      },
                      {
                        initial: "P", name: "Priya Sharma", role: "Service Developer, Data Stage", location: "Kochi",
                        bg: "A problem-solver who thrives on building efficient, scalable systems. Loves diving into code, optimizing performance, and collaborating with others to bring ideas to life. Always thinking two steps ahead, they're the go-to for turning technical requirements into reality without losing sight of quality or speed.",
                        goals: ["Empower service teams to independently manage the connectors they support.", "Reduce dependency on connectivity team for updates and configurations.", "Ensure accurate, up-to-date information about supported connectors is always available to customers.", "Minimize errors and miscommunication across teams."],
                        needs: ["Prevent incorrect or incomplete data entry.", "Track changes and ensure accountability.", "Reflect real-time connector status."],
                        pains: ["Manual processes for updating connector information are time-consuming and error-prone.", "Coordination overhead with multiple teams to manage connector lifecycle.", "Difficulty ensuring consistency and reliability of connector data across systems."],
                        quote: "If I can manage my connectors without waiting on another team, I can ship faster and with fewer mistakes.",
                        worksWithColors: "#3B82F6",
                      },
                      {
                        initial: "B", name: "Brian Brady", role: "Technical Content Professional, Data Stage/CP4D", location: "Dublin",
                        bg: "A translator of complexity into clarity. Passionate about user experience, they craft documentation that's not just accurate but empowering. They ask the right questions, obsess over tone and structure, and ensure every piece of content helps users feel confident, informed, and supported.",
                        goals: ["Provide clear, structured and accurate connector descriptions.", "Maintain a single source of truth for connector information."],
                        needs: ["A reliable and accurate list of supported connectors.", "A single framework which guides them to provide and maintain connector descriptions.", "To understand how the service connects the various data sources to platforms."],
                        pains: ["High coordination efforts with connectivity developers.", "Lack of a centralized system for managing connector descriptions.", "No standardized product description format creates inconsistency for the platform."],
                        quote: "Having a single source of truth for connector descriptions ensures our content is always accurate and reliable.",
                        worksWithColors: "#10B981",
                      },
                      {
                        initial: "R", name: "Raghav Arora", role: "Connectivity Developer, Connectivity Team, CP4D", location: "Mumbai",
                        bg: "A backend integration expert who ensures services connect seamlessly. They're meticulous, systems-minded, and always ready to troubleshoot the toughest issues. Whether it's APIs, protocols, or platform quirks, they handle it with calm precision. They're the invisible force making sure everything \"just works.\"",
                        goals: ["Avoid redundant work with service teams for each connector.", "Reduce coordination efforts with content designers.", "Enable easy building, testing and validation of connectors."],
                        needs: ["Manage connector support status easily.", "Focus on development and scalability of the platform rather than support tasks.", "Integration with content management systems for accurate descriptions."],
                        pains: ["Manual confirmation with service teams is time-consuming due to the large number of services.", "Maintaining the list of supported connectors manually is error-prone.", "High coordination overhead with content designers due to multiple check-ins with multiple services and tools."],
                        quote: "Automating connector management allows me to focus on building integrations, not chasing updates.",
                        worksWithColors: "#F59E0B",
                      },
                    ].map(({ initial, name, role, location, bg, goals, needs, pains, quote, worksWithColors }) => (
                      <div key={name} className="p-4 rounded-lg"
                        style={{ background: "var(--node-header)", border: "1px solid var(--border)" }}>
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-serif text-base"
                            style={{ background: worksWithColors, color: "#fff" }}>
                            {initial}
                          </div>
                          <div>
                            <p className="font-sans text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>{name}</p>
                            <p className="font-mono text-[12px]" style={{ color: worksWithColors }}>{role}</p>
                            <p className="font-mono text-[12px]" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>{location}</p>
                          </div>
                        </div>
                        <p className="font-sans text-xs leading-relaxed mb-3"
                          style={{ color: "var(--muted-foreground)" }}>{bg}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                          {[
                            { label: "Goals", items: goals },
                            { label: "Needs", items: needs },
                            { label: "Pain Points", items: pains },
                          ].map(({ label, items }) => (
                            <div key={label}>
                              <p className="font-mono text-[10px] uppercase tracking-widest mb-1.5"
                                style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>{label}</p>
                              {items.map((item, i) => (
                                <div key={i} className="flex gap-1 mb-1">
                                  <span className="font-mono text-[10px] flex-shrink-0 mt-0.5" style={{ color: worksWithColors }}>·</span>
                                  <p className="font-sans text-[12px] leading-snug" style={{ color: "var(--muted-foreground)" }}>{item}</p>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                        <div className="p-2.5 rounded"
                          style={{ background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: `1px solid ${worksWithColors}44` }}>
                          <p className="font-serif italic text-xs leading-snug" style={{ color: "var(--foreground)" }}>
                            &ldquo;{quote}&rdquo;
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AS-IS JOURNEY MAP */}
                <div>
                  <SL label="as-is journey map" />
                  <figure className="overflow-hidden rounded-lg m-0 mb-4 cursor-zoom-in"
                    style={{ background: "var(--node-header)", border: "1px solid var(--border)" }}
                    onClick={() => setLightbox("/images/Companion panel/As-is.png")}>
                    <img src="/images/Companion panel/As-is.png" alt="As-is journey map"
                      style={{ width: "100%", height: "auto", display: "block" }} />
                    <figcaption className="px-3 py-2 flex items-center justify-between font-mono text-[9px]"
                      style={{ color: "var(--muted-foreground)", opacity: 0.55, borderTop: "1px solid var(--border)" }}>
                      <span>As-is journey map — overview</span>
                      <span style={{ opacity: 0.5 }}>⊕ click to expand</span>
                    </figcaption>
                  </figure>
                  <JourneyMap
                    phases={ASIS_PHASES}
                    steps={ASIS_STEPS}
                    row2={ASIS_PAINS}
                    row2Label="pain points"
                    row2Color="#EF4444"
                    row3={ASIS_OPPS}
                    row3Label="opportunities"
                    row3Color="#22C55E"
                  />
                </div>

                {/* DEFINE — Hills */}
                <div>
                  <SL label="define — major hill & sub-hills" />
                  <div className="p-4 rounded-lg mb-4"
                    style={{ background: "var(--node-header)", border: "1px solid var(--primary)" }}>
                    <p className="font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: "var(--primary)" }}>major hill</p>
                    <p className="font-sans text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                      Platform stakeholders can work together to support self-management, content contribution, and real-time connector & supported service visibility — reducing coordination efforts, speeding up content delivery, and improving visibility in connector rollouts.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {HILLS.map(({ id, segments }) => (
                      <div key={id} className="p-4 rounded-lg"
                        style={{ background: dark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.025)", border: "1px solid var(--border)" }}>
                        <p className="font-mono text-[10px] uppercase tracking-widest mb-2"
                          style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>{id}</p>
                        <HillText segments={segments} />
                        <div className="flex flex-wrap gap-2 mt-3">
                          {[
                            { label: "Who", color: "#3B82F6" },
                            { label: "What", color: "#22C55E" },
                            { label: "Wow", color: "#EC4899" },
                          ].map(({ label, color }) => (
                            <span key={label} className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                              style={{ background: `${color}18`, color, border: `1px solid ${color}44` }}>
                              {label}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* TO-BE JOURNEY MAP */}
                <div>
                  <SL label="to-be journey map" />
                  <figure className="overflow-hidden rounded-lg m-0 mb-4 cursor-zoom-in"
                    style={{ background: "var(--node-header)", border: "1px solid var(--border)" }}
                    onClick={() => setLightbox("/images/Companion panel/To be.png")}>
                    <img src="/images/Companion panel/To be.png" alt="To-be journey map"
                      style={{ width: "100%", height: "auto", display: "block" }} />
                    <figcaption className="px-3 py-2 flex items-center justify-between font-mono text-[9px]"
                      style={{ color: "var(--muted-foreground)", opacity: 0.55, borderTop: "1px solid var(--border)" }}>
                      <span>To-be journey map — overview</span>
                      <span style={{ opacity: 0.5 }}>⊕ click to expand</span>
                    </figcaption>
                  </figure>
                  <JourneyMap
                    phases={ASIS_PHASES}
                    steps={TOBE_STEPS}
                    row2={TOBE_THINKING}
                    row2Label="thinking"
                    row2Color="#F59E0B"
                    row3={TOBE_FEELINGS}
                    row3Label="feeling"
                    row3Color="#8B5CF6"
                  />
                </div>

                {/* WRAP */}
                <div className="p-4 rounded-lg"
                  style={{ background: "var(--node-header)", border: "1px solid var(--border)" }}>
                  <p className="font-mono text-[12px] uppercase tracking-widest mb-2" style={{ color: "var(--primary)" }}>// wrap</p>
                  <p className="font-sans text-sm leading-relaxed"
                    style={{ color: "var(--muted-foreground)" }}>
                    From scattered documentation across three disconnected sources to a unified, self-serve workflow — this project mapped exactly where four teams lost time to manual coordination, and redesigned the system so connector updates that once took weeks now take days, with every handoff tracked instead of chased.
                  </p>
                </div>

                {/* Lock again */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
                      setUnlocked(false);
                    }}
                    className="flex items-center gap-1.5 font-mono text-[12px] px-2.5 py-1 rounded transition-opacity hover:opacity-60"
                    style={{ border: "1px solid var(--border)", color: "var(--muted-foreground)", background: "var(--node-header)" }}>
                    <Lock size={9} /> lock case study
                  </button>
                </div>

              </motion.div>
            )}

            {/* Footer */}
            <div className="flex items-center gap-2 pt-3 overflow-hidden" style={{ borderTop: "1px solid var(--border)" }}>
              <button
                onClick={() => onOpen("tusk")}
                className="flex items-center gap-2 flex-1 min-w-0 px-3 py-2 rounded-lg transition-opacity hover:opacity-80"
                style={{ background: "var(--node-header)", border: "1px solid var(--border)", textAlign: "left" }}>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-widest mb-0.5" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>next →</p>
                  <p className="font-mono text-[11px] font-medium truncate" style={{ color: "var(--foreground)" }}>TUSK</p>
                  <p className="font-mono text-[10px] truncate" style={{ color: "var(--muted-foreground)", opacity: 0.6 }}>Oral Care App · Smart Toothbrush System</p>
                </div>
                <ChevronRight size={12} style={{ color: "var(--primary)", flexShrink: 0 }} />
              </button>
              <button
                onClick={() => onOpen("instana-incident-remediation")}
                className="hidden sm:flex items-center gap-2 flex-1 min-w-0 px-3 py-2 rounded-lg transition-opacity hover:opacity-80"
                style={{ background: "var(--node-header)", border: "1px solid var(--border)", textAlign: "left" }}>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-widest mb-0.5" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>also →</p>
                  <p className="font-mono text-[11px] font-medium truncate" style={{ color: "var(--foreground)" }}>IBM Instana</p>
                  <p className="font-mono text-[10px] truncate" style={{ color: "var(--muted-foreground)", opacity: 0.6 }}>Agentic AI · iF Design Award</p>
                </div>
                <ChevronRight size={12} style={{ color: "var(--primary)", flexShrink: 0 }} />
              </button>
              <button onClick={onClose}
                className="flex items-center justify-center rounded-lg transition-opacity hover:opacity-70 w-9 flex-shrink-0"
                style={{ border: "1px solid var(--border)", color: "var(--muted-foreground)", background: "var(--node-header)", alignSelf: "stretch" }}>
                <X size={13} />
              </button>
            </div>

          </div>
        </div>
      </motion.div>
    </motion.div>
    </>
  );
}


// ─── IBM Instana modal (iF Design Award, password-gated Tier 2) ──────────────

const INSTANA_IMG = (file: string) => `/images/IBM IF Design Award/${file}`;
const INSTANA_SLIDES = [
  INSTANA_IMG("Opening.png"),
  ...Array.from({ length: 12 }, (_, i) => INSTANA_IMG(`${i + 1}.png`)),
];

const SHARED_SESSION_KEY = "ibm_connector_unlocked"; // shared with CP4D case study

export function InstanaModal({ onClose, onOpen, dark, pageMode }: { onClose: () => void; onOpen: (slug: string) => void; dark: boolean; pageMode?: boolean }) {
  useEffect(() => {
    if (pageMode) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose, pageMode]);

  const [unlocked, setUnlocked] = useState(() => { try { return sessionStorage.getItem(SHARED_SESSION_KEY) === "1"; } catch { return false; } });
  const [guess, setGuess] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setChecking(true);
    try {
      const res = await fetch("/api/check-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guess }),
      });
      if (!res.ok) throw new Error("api_error");
      const data = await res.json() as { ok?: boolean };
      if (data.ok === true) {
        try { sessionStorage.setItem(SHARED_SESSION_KEY, "1"); } catch { /* ignore */ }
        setUnlocked(true);
      } else {
        setError("Incorrect password.");
        setGuess("");
      }
    } catch {
      setError("Could not verify — please try again.");
      // stays locked on any failure
    } finally {
      setChecking(false);
    }
  };

  const shell = dark ? "rgba(22,20,18,0.96)" : "#FAF8F4";

  const SL = ({ label }: { label: string }) => (
    <p className="font-mono text-[12px] uppercase tracking-widest mb-3" style={{ color: "var(--primary)" }}>// {label}</p>
  );

  const Screenshot = ({ file, caption }: { file: string; caption: string }) => (
    <figure className="overflow-hidden rounded-lg m-0 mt-4 cursor-zoom-in"
      style={{ background: "transparent", border: "1px solid var(--border)" }}
      onClick={() => setLightbox(INSTANA_IMG(file))}>
      <img src={INSTANA_IMG(file)} alt={caption}
        style={{ width: "100%", height: "auto", display: "block" }} />
      <figcaption className="px-3 py-2 flex items-center justify-between font-mono text-[9px]"
        style={{ color: "var(--muted-foreground)", opacity: 0.55, borderTop: "1px solid var(--border)" }}>
        <span>{caption}</span>
        <span style={{ opacity: 0.5 }}>⊕ click to expand</span>
      </figcaption>
    </figure>
  );

  return (
    <>
      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(8px)" }}
          onClick={() => setLightbox(null)}>
          {lightbox.endsWith(".mp4") ? (
            <video
              src={lightbox}
              autoPlay
              muted
              loop
              playsInline
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: "88vw", maxHeight: "88vh", width: "auto", height: "auto", borderRadius: 8, border: "1px solid var(--border)" }}
            />
          ) : (
            <img src={lightbox} alt="expanded"
              style={{ maxWidth: "92vw", maxHeight: "90vh", width: "auto", height: "auto", borderRadius: 8, border: "1px solid var(--border)" }} />
          )}
          <button className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full"
            style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}
            onClick={() => setLightbox(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={pageMode ? "w-full flex items-start justify-center" : "fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto"}
        style={pageMode ? {} : { background: dark ? "rgba(10,9,8,0.9)" : "rgba(40,36,32,0.6)", backdropFilter: "blur(10px)" }}
        onClick={pageMode ? undefined : onClose}>

        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className={pageMode && isMobile ? "relative w-full overflow-hidden flex flex-col" : "relative w-full max-w-3xl mx-4 my-10 rounded-xl overflow-hidden flex flex-col"}
          style={pageMode && isMobile ? {} : { background: shell, border: "1px solid var(--border)", boxShadow: dark ? "0 24px 80px rgba(0,0,0,0.75), inset 0 1px 0 rgba(237,233,227,0.06)" : "0 24px 80px rgba(26,24,22,0.13), inset 0 1px 0 rgba(255,255,255,1)" }}
          onClick={e => e.stopPropagation()}>

          {/* Node header */}
          <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
            style={{ background: "var(--node-header)", borderBottom: "1px solid var(--border)" }}>
            {pageMode ? (
              <div className="flex items-center gap-2 min-w-0">
                <button onClick={onClose}
                  className="flex items-center gap-1.5 font-mono text-[9px] transition-opacity hover:opacity-60 flex-shrink-0"
                  style={{ color: "var(--muted-foreground)", background: "none", border: "none", cursor: "pointer" }}>
                  <ArrowLeft size={11} />
                  <span className="hidden sm:inline">back</span>
                </button>
                <span className="font-mono text-[9px]" style={{ color: "var(--border)", opacity: 0.6, flexShrink: 0 }}>|</span>
                <span style={{ color: "var(--primary)", flexShrink: 0 }}>▤</span>
                <span className="font-mono text-[9px] tracking-[0.2em] uppercase truncate"
                  style={{ color: "var(--primary)", fontWeight: 500 }}>project · case study</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span style={{ color: "var(--primary)" }}>▤</span>
                <span className="font-mono text-[9px] tracking-[0.2em] uppercase"
                  style={{ color: "var(--primary)", fontWeight: 500 }}>project · case study</span>
                <span className="font-mono text-[9px]"
                  style={{ color: "var(--muted-foreground)", opacity: 0.38 }}>prj_instana_incident</span>
              </div>
            )}
            <div className="flex items-center gap-2 flex-shrink-0">
              {pageMode ? (
                <span className="font-mono text-[9px] flex-shrink-0"
                  style={{ color: "var(--muted-foreground)", opacity: 0.38 }}>prj_instana_incident</span>
              ) : (
                <button onClick={onClose}
                  className="flex items-center justify-center w-6 h-6 rounded transition-opacity hover:opacity-60"
                  style={{ color: "var(--muted-foreground)" }}>
                  <X size={13} />
                </button>
              )}
              <ReadTime minutes={6} className="hidden sm:inline" />
            </div>
          </div>

          {/* Scrollable body */}
          <div className={pageMode ? undefined : "overflow-y-auto flex-1"}>

            {/* Hero image */}
            <div className="w-full overflow-hidden" style={{ background: "#0A0F1E" }}>
              <img src={INSTANA_IMG("Hero.png")} alt="IBM Instana — Agentic AI Incident Response"
                style={{ width: "100%", height: "auto", display: "block" }} />
            </div>

            <div className="p-6" style={{ display: "flex", flexDirection: "column", gap: 32 }}>

              {/* ─── TIER 1 ─────────────────────────────────────── */}

              {/* Title block + plaque — side by side */}
              <div className="flex flex-col sm:flex-row gap-5 sm:items-start">

                {/* Left: text */}
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[9px] tracking-[0.2em] uppercase mb-2"
                    style={{ color: "var(--primary)" }}>Agentic AI Incident Response</p>
                  <h2 className="font-serif leading-tight mb-1"
                    style={{ fontSize: "clamp(1.4rem,3.5vw,2.2rem)", color: "var(--foreground)", lineHeight: 1.15 }}>
                    Instana Incident Remediation
                  </h2>
                  <p className="font-serif italic text-base mb-1" style={{ color: "var(--muted-foreground)" }}>
                    IBM · iF Design Awards
                  </p>
                  <p className="font-mono text-[11px] mb-4" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>
                    2025 · Visual & UX Designer — IBM Instana, Kochi
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <img src="/images/IBM IF Design Award/IF images/IF design award icon.jpg"
                      alt="iF Design Award"
                      style={{ width: 18, height: 18, borderRadius: 3, objectFit: "cover" }} />
                    {["iF Design Award", "Contributor", "Enterprise Design"].map(t => (
                      <span key={t} className="font-mono text-[10px] px-2 py-0.5 rounded"
                        style={{ background: "var(--muted)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}>{t}</span>
                    ))}
                  </div>
                  <div className="mt-2 sm:hidden">
                    <ReadTime minutes={6} />
                  </div>
                </div>

                {/* Right: plaque video — click to expand */}
                <div
                  className="flex-shrink-0 rounded-lg overflow-hidden cursor-zoom-in"
                  style={{ width: 180, border: "1px solid var(--border)", background: "transparent" }}
                  onClick={() => setLightbox(INSTANA_IMG("IF Design Award Plack.mp4"))}
                  title="Click to expand"
                >
                  <video
                    src={INSTANA_IMG("IF Design Award Plack.mp4")}
                    autoPlay
                    muted
                    loop
                    playsInline
                    style={{ width: "100%", height: "auto", display: "block" }}
                  />
                  <p className="font-mono text-[8px] px-2 py-1 text-center"
                    style={{ color: "var(--muted-foreground)", opacity: 0.45, borderTop: "1px solid var(--border)" }}>
                    iF Design Award 2025 · click to expand
                  </p>
                </div>

              </div>

              {/* ── iF AWARD CITATION ── */}
              <a
                href="https://ifdesign.com/en/winner-ranking/project/ibm-instana-observability/769312"
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none", display: "block" }}
              >
                <div
                  className="rounded-lg p-4 flex items-center gap-4 transition-opacity hover:opacity-80"
                  style={{ background: "var(--node-header)", border: "1px solid var(--primary)", cursor: "pointer" }}
                >
                  {/* iF icon */}
                  <img
                    src="/images/IBM IF Design Award/IF images/IF design award icon.jpg"
                    alt="iF Design Award"
                    style={{ width: 44, height: 44, borderRadius: 6, objectFit: "cover", flexShrink: 0 }}
                  />
                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] mb-0.5"
                      style={{ color: "var(--primary)" }}>🏆 iF Design Award 2025 — Winner</p>
                    <p className="font-sans text-sm font-semibold leading-snug"
                      style={{ color: "var(--foreground)" }}>Instana Incident Remediation</p>
                    <p className="font-sans text-xs mt-0.5 leading-snug"
                      style={{ color: "var(--muted-foreground)" }}>
                      Official winner listing on ifdesign.com — view the full award entry ↗
                    </p>
                  </div>
                  {/* External link icon — right edge, centred */}
                  <div className="flex-shrink-0 flex items-center justify-center"
                    style={{ color: "var(--primary)" }}>
                    <ExternalLink size={20} />
                  </div>
                </div>
              </a>

              {/* Overview */}
              <div>
                <SL label="overview" />
                <div className="p-4 rounded-lg" style={{ background: "var(--node-header)", border: "1px solid var(--border)" }}>
                  <p className="font-sans text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                    IBM Instana Observability is an enterprise platform offering full-stack visibility across cloud-native,
                    hybrid, and on-premises environments. Designed for speed and clarity, it uses AI and automation to help
                    DevOps and IT teams detect and resolve issues, monitor performance, and optimise operations in real time.
                    Our design simplifies complexity through intuitive workflows and smart visualizations, enabling rapid
                    understanding, faster decisions, simpler collaboration, and confident action — making observability
                    seamless, scalable, and user-focused.
                  </p>
                </div>
              </div>

              {/* The problem */}
              <div>
                <SL label="the problem, in brief" />
                <div className="p-4 rounded-lg" style={{ border: "1px solid var(--primary)", background: "var(--node-header)" }}>
                  <p className="font-sans text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                    Incident investigation in complex systems is often slow and overwhelming — engineers manually correlate
                    metrics, logs, and traces across fragmented tools. Using agentic AI, Instana surfaces the probable root
                    cause in seconds instead of hours, resolving incidents up to 80% faster.
                  </p>
                </div>
              </div>

              {/* Sustainability */}
              <div>
                <SL label="sustainability angle" />
                <div className="p-4 rounded-lg" style={{ background: "#22C55E10", border: "1px solid #22C55E44" }}>
                  <p className="font-sans text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                    Beyond operational gains, Instana contributes to sustainability — streamlining incident response and
                    minimizing downtime reduces unnecessary compute cycles and energy consumption across infrastructure.
                    Smarter operations mean fewer wasted resources and a smaller carbon footprint.
                  </p>
                </div>
              </div>

              {/* Testimonials */}
              <div>
                <SL label="what users say" />
                <div className="space-y-3">
                  {[
                    { quote: "We saw an issue raised in Instana, and pressed the button to run the AI investigation, the analysis was completely correct.", attr: "IT operations leader, finance company" },
                    { quote: "We're really excited by Probable Root Cause and the Agentic Incident Investigation in Instana. Already we can see it helping us to reduce downtime and we're looking forward to the coming enhancements.", attr: "Engineering Manager, Capitec Bank" },
                  ].map(({ quote, attr }) => (
                    <div key={attr} className="p-4 rounded-lg"
                      style={{ background: "var(--node-header)", border: "1px solid var(--border)" }}>
                      <p className="font-serif italic text-sm leading-relaxed mb-2" style={{ color: "var(--foreground)" }}>
                        &ldquo;{quote}&rdquo;
                      </p>
                      <p className="font-mono text-[10px]" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>
                        — {attr}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ─── PASSWORD GATE ──────────────────────────────── */}
              {!unlocked ? (
                <div className="rounded-lg overflow-hidden"
                  style={{ border: "1px solid var(--border)" }}>
                  <div className="px-4 py-3"
                    style={{ background: "var(--node-header)", borderBottom: "1px solid var(--border)" }}>
                    <p className="font-mono text-[10px] uppercase tracking-widest"
                      style={{ color: "var(--primary)" }}>// full case study</p>
                  </div>
                  <div className="p-5">
                    <p className="font-sans text-sm leading-relaxed font-semibold mb-2" style={{ color: "var(--foreground)" }}>
                      Enter password to view the full case study.
                    </p>
                    <p className="font-sans text-xs leading-relaxed mb-4" style={{ color: "var(--muted-foreground)", opacity: 0.6 }}>
                      This is real work from an internal IBM project — worth sharing, but too detailed to publish openly. If you're a hiring manager or collaborator who wants the full process, reach out via{" "}
                      <a href="mailto:ux.sayan@gmail.com" className="underline underline-offset-2 transition-opacity hover:opacity-80" style={{ color: "var(--primary)" }}>email</a>
                      {" "}or{" "}
                      <a href="https://linkedin.com/in/sayanoriginals" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 transition-opacity hover:opacity-80" style={{ color: "var(--primary)" }}>LinkedIn</a>
                      {" "}and I'll send the password.
                    </p>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                      <input
                        type="password"
                        value={guess}
                        onChange={e => setGuess(e.target.value)}
                        placeholder="Password"
                        autoComplete="off"
                        className="w-full px-3 py-2 rounded font-mono text-sm"
                        style={{
                          background: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                          border: `1px solid ${error ? "#EF4444" : "var(--border)"}`,
                          color: "var(--foreground)",
                          outline: "none",
                        }}
                      />
                      {error && <p className="font-mono text-[10px]" style={{ color: "#EF4444" }}>{error}</p>}
                      <button
                        type="submit"
                        disabled={checking || !guess}
                        className="w-full flex items-center justify-center gap-1.5 font-mono text-sm py-2 rounded transition-opacity hover:opacity-80 disabled:opacity-40"
                        style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                        {checking ? "Checking…" : <><Unlock size={13} /> unlock</>}
                      </button>
                    </form>
                  </div>
                </div>
              ) : (

                /* ─── TIER 2 — unlocked ──────────────────────── */
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                  style={{ display: "flex", flexDirection: "column", gap: 32, width: "100%", minWidth: 0 }}>

                  {/* ── SLIDE DECK ── */}
                  <div>
                    <SL label="final playback — slide deck" />
                    <SlideCarousel slides={INSTANA_SLIDES} dark={dark} />
                  </div>

                  {/* ── PERSONA — SAM ── */}
                  <div>
                    <SL label="persona — sam, site reliability engineer" />
                    <div className="p-4 rounded-lg" style={{ background: "var(--node-header)", border: "1px solid var(--border)" }}>
                      {/* Header row */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-serif text-base"
                          style={{ background: "#3B82F6", color: "#fff" }}>S</div>
                        <div>
                          <p className="font-sans text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>Sam</p>
                          <p className="font-mono text-[12px]" style={{ color: "#3B82F6" }}>Site Reliability Engineer · IBM Client</p>
                          <p className="font-mono text-[12px]" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>Enterprise Infrastructure · On-call 24/7</p>
                        </div>
                      </div>
                      <p className="font-sans text-xs leading-relaxed mb-3" style={{ color: "var(--muted-foreground)" }}>
                        I'm the one who gets the call when something breaks. Customers expect websites, applications, and services
                        to run smoothly — even a few seconds of downtime can cost thousands in lost revenue. Behind the scenes,
                        IT teams like mine are stretched thin, expected to maintain seamless performance across increasingly complex
                        systems. When an incident hits, the pressure is relentless.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                        {[
                          { label: "Goals", color: "#3B82F6", items: [
                            "Resolve incidents before customers notice.",
                            "Reduce mean time to resolution (MTTR).",
                            "Minimise cognitive load during high-pressure events.",
                            "Build institutional knowledge from every incident.",
                          ]},
                          { label: "Needs", color: "#3B82F6", items: [
                            "Immediate, actionable root-cause insights.",
                            "A single view across metrics, logs, and traces.",
                            "AI that reasons so I don't have to write queries.",
                            "Structured remediation steps I can execute fast.",
                          ]},
                          { label: "Pain Points", color: "#3B82F6", items: [
                            "Manually correlating fragmented tools takes hours.",
                            "Context switching between dashboards increases errors.",
                            "No reuse of past fixes — every incident starts from zero.",
                            "Handovers lose context, slowing down teammates.",
                          ]},
                        ].map(({ label, color, items }) => (
                          <div key={label}>
                            <p className="font-mono text-[10px] uppercase tracking-widest mb-1.5"
                              style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>{label}</p>
                            {items.map((item, i) => (
                              <div key={i} className="flex gap-1 mb-1">
                                <span className="font-mono text-[10px] flex-shrink-0 mt-0.5" style={{ color }}>·</span>
                                <p className="font-sans text-[12px] leading-snug" style={{ color: "var(--muted-foreground)" }}>{item}</p>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                      <div className="p-2.5 rounded"
                        style={{ background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: "1px solid #3B82F644" }}>
                        <p className="font-serif italic text-xs leading-snug" style={{ color: "var(--foreground)" }}>
                          &ldquo;The stakes are still high. But now, I'm solving problems faster, smarter — and breathing a little easier.&rdquo;
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ── SAM'S JOURNEY MAP ── */}
                  <div>
                    <SL label="sam's journey map — incident to resolution" />
                    <div className="overflow-x-auto pb-2 -mx-2 px-2">
                      <div style={{ minWidth: 680 }}>
                        {/* Phase headers */}
                        <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                          {["1. Alert & Triage", "2. Investigate", "3. Remediate", "4. Handover & Learn"].map((ph, i) => (
                            <div key={i} className="px-2 py-1.5 rounded text-center font-mono text-[10px] uppercase tracking-widest"
                              style={{ background: "var(--node-header)", border: "1px solid var(--border)", color: "var(--primary)" }}>
                              {ph}
                            </div>
                          ))}
                        </div>

                        {/* Row 1 — Doing */}
                        <div className="mb-1">
                          <p className="font-mono text-[10px] uppercase tracking-widest mb-1.5 px-1"
                            style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>// doing</p>
                          <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                            {[
                              [
                                { role: "Sam", label: "Receives alert", desc: "Paged by monitoring system — incident flagged on the events page." },
                                { role: "Sam", label: "Views event list", desc: "Opens Instana events view, sees affected services and severity." },
                              ],
                              [
                                { role: "Sam + AI", label: "Runs AI investigation", desc: "Presses 'Run investigation' — agentic AI observes patterns and reasons across dependencies." },
                                { role: "AI", label: "Surfaces root cause", desc: "Probable Root Cause identified: CONNECT service. Failure propagation chain shown: Payment → Connect → Discount." },
                                { role: "Sam", label: "Reviews reasoning", desc: "Opens investigation reasoning modal — reviews entity selection, change event analysis, and final report." },
                              ],
                              [
                                { role: "Sam + AI", label: "Generates remediation", desc: "Requests AI-generated remediation script. Structured steps produced with confidence scores." },
                                { role: "Sam", label: "Executes fix", desc: "Follows the step-by-step checklist to resolve the CONNECT service failure." },
                                { role: "Sam", label: "Verifies resolution", desc: "Reviews the summary dashboard — calls/sec, error rate, latency all confirm system health." },
                              ],
                              [
                                { role: "Sam + AI", label: "Generates summary", desc: "AI produces incident summary: timeline, root cause, steps taken, outcome." },
                                { role: "Sam", label: "Shares with team", desc: "Summary sent to teammates for context continuity and shift handover." },
                                { role: "System", label: "Stores to catalog", desc: "Remediation steps saved to recommended actions catalog with confidence scores for future reuse.", isSystem: true },
                              ],
                            ].map((phaseSteps, phaseIdx) => (
                              <div key={phaseIdx} className="flex flex-col gap-1">
                                {phaseSteps.map((s, i) => (
                                  <div key={i} className="p-2 rounded"
                                    style={{
                                      background: (s as {isSystem?: boolean}).isSystem ? (dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)") : "var(--node-header)",
                                      border: `1px solid ${(s as {isSystem?: boolean}).isSystem ? "var(--border)" : "#3B82F6"}`,
                                      borderStyle: (s as {isSystem?: boolean}).isSystem ? "dashed" : "solid",
                                    }}>
                                    <p className="font-mono text-[10px] mb-0.5" style={{ color: "#3B82F6" }}>{s.role}</p>
                                    <p className="font-sans text-[12px] font-semibold mb-0.5" style={{ color: "var(--foreground)" }}>{s.label}</p>
                                    <p className="font-sans text-[9px]" style={{ color: "var(--muted-foreground)", lineHeight: 1.5 }}>{s.desc}</p>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Row 2 — Thinking */}
                        <div className="mb-1">
                          <p className="font-mono text-[10px] uppercase tracking-widest mb-1.5 px-1"
                            style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>// thinking</p>
                          <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                            {[
                              [{ text: "Overwhelmed", quote: "Something's down. I need to find what's broken before customers start calling." }],
                              [{ text: "Focused", quote: "The AI is doing the correlation work. I just need to validate what it found." }],
                              [{ text: "Confident", quote: "I have a structured plan. Each step is clear — I'm not guessing anymore." }],
                              [{ text: "Relieved", quote: "Everything I did is documented. My team can pick this up without losing context." }],
                            ].map((items, phaseIdx) => (
                              <div key={phaseIdx} className="flex flex-col gap-1">
                                {items.map((item, i) => (
                                  <div key={i} className="p-2 rounded"
                                    style={{ background: "#F59E0B18", border: "1px solid #F59E0B55" }}>
                                    <p className="font-sans text-[12px] font-semibold mb-0.5" style={{ color: "#F59E0B" }}>{item.text}</p>
                                    <p className="font-sans text-[9px]" style={{ color: "var(--muted-foreground)", lineHeight: 1.5 }}>&ldquo;{item.quote}&rdquo;</p>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Row 3 — Feeling */}
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-widest mb-1.5 px-1"
                            style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>// feeling</p>
                          <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                            {[
                              [{ text: "Anxious, under pressure" }],
                              [{ text: "Focused, less overwhelmed" }],
                              [{ text: "Empowered, in control" }],
                              [{ text: "Satisfied, ready to learn" }],
                            ].map((items, phaseIdx) => (
                              <div key={phaseIdx} className="flex flex-col gap-1">
                                {items.map((item, i) => (
                                  <div key={i} className="p-2 rounded"
                                    style={{ background: "#8B5CF618", border: "1px solid #8B5CF655" }}>
                                    <p className="font-sans text-[12px] font-semibold" style={{ color: "#8B5CF6" }}>{item.text}</p>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── SECTION 1 ── */}
                  <div>
                    <SL label="01 — rapid insights in incident response" />
                    <p className="font-sans text-sm leading-relaxed mb-3" style={{ color: "var(--muted-foreground)" }}>
                      In complex systems, incident investigation is often slow and overwhelming. Instana's challenge was to design
                      an experience where engineers get investigation insights immediately — not hours later, but in seconds.
                      Using agentic AI, Instana observes patterns, reasons across dependencies, and surfaces the most likely root cause.
                      With AI as a partner, users like Sam aren't just reacting — they're evolving.
                    </p>
                    <Screenshot file="Rapid insights.png" caption="Events page — Probable root cause panel, Run investigation / View reasoning actions, topology graph" />
                  </div>

                  {/* ── SECTION 2 ── */}
                  <div>
                    <SL label="02 — instant clarity and understanding" />
                    <p className="font-sans text-sm leading-relaxed mb-3" style={{ color: "var(--muted-foreground)" }}>
                      When incidents occur, users like Sam need immediate clarity — not a maze of metrics. Using the topology graph
                      and agentic AI, Sam can see real-time relationships between services, applications, and infrastructure.
                      Instead of manually stitching together data, Sam gets a dynamic, self-updating map that highlights where the
                      issue is — and why it's happening.
                    </p>
                    <Screenshot file="Instant clarity.png" caption="Investigation reasoning modal — Entity Selection / Summary / Change event analysis / Final report tabs" />
                  </div>

                  {/* ── SECTION 3 ── */}
                  <div>
                    <SL label="03 — from clarity to action" />
                    <p className="font-sans text-sm leading-relaxed mb-3" style={{ color: "var(--muted-foreground)" }}>
                      After validating the AI-assisted investigation, engineers like Sam can generate a remediation script that
                      turns uncertainty into structured action. AI not only identifies the root cause — it guides users through
                      resolution, making incident response intuitive, intelligent, and reliable.
                    </p>
                    <Screenshot file="Action.png" caption="Incident overview — Triggered / Duration / Severity, Generate summary, Probable Root Cause, Recommended actions" />
                  </div>

                  {/* ── SECTION 4 ── */}
                  <div>
                    <SL label="04 — seamless handover with ai summaries" />
                    <p className="font-sans text-sm leading-relaxed mb-3" style={{ color: "var(--muted-foreground)" }}>
                      Incident response doesn't end with resolution — it continues with communication. By generating an AI-powered
                      summary report, users like Sam can quickly share incident context, investigation steps, and remediation actions
                      with teammates. This reduces onboarding time, improves continuity, and ensures every incident becomes a
                      learning opportunity.
                    </p>
                    <Screenshot file="Summary.png" caption="Generate action modal — Step 1 / Step 2 flow, investigation summary, 6-step remediation checklist" />
                  </div>

                  {/* ── SECTION 5 ── */}
                  <div>
                    <SL label="05 — building intelligence through reuse" />
                    <p className="font-sans text-sm leading-relaxed mb-3" style={{ color: "var(--muted-foreground)" }}>
                      After resolving an incident, teams often lose valuable remediation knowledge. Instana captures successful
                      actions and turns them into reusable recommendations — each stored in a growing catalog with confidence
                      scores to guide future decisions. Reactive fixes become proactive intelligence.
                    </p>
                    <Screenshot file="Reuse.png" caption="Recommended actions table — Name / Type / Description / Tags / Confidence columns" />
                  </div>

                  {/* ── SECTION 6 ── */}
                  <div>
                    <SL label="06 — confident closure through unified visibility" />
                    <p className="font-sans text-sm leading-relaxed mb-3" style={{ color: "var(--muted-foreground)" }}>
                      After remediation, engineers need to verify systems are healthy — quickly and confidently. Instana's unified
                      dashboard brings all critical metrics into one view, letting engineers like Sam confirm resolution without
                      switching tools. Every incident ends with clarity and confidence.
                    </p>
                    <Screenshot file="Unified visiblity.png" caption="Summary dashboard — Calls/sec, Erroneous call rate, Mean latency, Infrastructure issues, Top services, Processing time" />
                  </div>

                  {/* ── DESIGN SYSTEM ── */}
                  <div>
                    <SL label="carbon design system — design process" />
                    <div className="p-4 rounded-lg" style={{ background: "var(--node-header)", border: "1px solid var(--border)" }}>
                      <p className="font-sans text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                        Our designs are based on the latest version of the Carbon Design System, an open-source framework created
                        to build consistent experiences across IBM products by providing reusable elements such as components,
                        patterns, guidance, and code. It drives cohesion across all touchpoints, so that no matter where customers
                        engage with us, they feel like they are engaging with One IBM — freeing designers and developers to focus
                        on complex, unique problems instead of solving the same ones repeatedly.
                      </p>
                    </div>
                  </div>

                  {/* ── YOUTUBE ── */}
                  <div>
                    <SL label="product walkthrough" />
                    <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)", background: "#000", position: "relative", paddingTop: "56.25%" }}>
                      <iframe
                        src="https://www.youtube.com/embed/Bks3B32dB7E"
                        title="IBM Instana — Product Walkthrough"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                      />
                    </div>
                    <p className="font-mono text-[9px] mt-1.5" style={{ color: "var(--muted-foreground)", opacity: 0.45 }}>
                      Instana Incident Remediation — full product walkthrough
                    </p>
                  </div>

                  {/* ── WRAP ── */}
                  <div className="p-4 rounded-lg"
                    style={{ background: "var(--node-header)", border: "1px solid var(--border)" }}>
                    <p className="font-mono text-[12px] uppercase tracking-widest mb-2" style={{ color: "var(--primary)" }}>// wrap</p>
                    <p className="font-sans text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                      From fragmented tools and slow manual correlation to AI-driven investigation, guided remediation, and
                      reusable intelligence — this project reimagined incident response as something engineers partner with,
                      not fight alone.
                    </p>
                  </div>

                  {/* ── LOCK ── */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        try { sessionStorage.removeItem(SHARED_SESSION_KEY); } catch { /* ignore */ }
                        setUnlocked(false);
                      }}
                      className="flex items-center gap-1.5 font-mono text-[12px] px-2.5 py-1 rounded transition-opacity hover:opacity-60"
                      style={{ border: "1px solid var(--border)", color: "var(--muted-foreground)", background: "var(--node-header)" }}>
                      <Lock size={9} /> lock case study
                    </button>
                  </div>

                </motion.div>
              )}

              {/* Footer */}
              <div className="flex items-center gap-2 pt-3 overflow-hidden" style={{ borderTop: "1px solid var(--border)" }}>
                <button
                  onClick={() => onOpen("ibm-connector-workflow")}
                  className="flex items-center gap-2 flex-1 min-w-0 px-3 py-2 rounded-lg transition-opacity hover:opacity-80"
                  style={{ background: "var(--node-header)", border: "1px solid var(--border)", textAlign: "left" }}>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-widest mb-0.5" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>next →</p>
                    <p className="font-mono text-[11px] font-medium truncate" style={{ color: "var(--foreground)" }}>Companion Panel</p>
                    <p className="font-mono text-[10px] truncate" style={{ color: "var(--muted-foreground)", opacity: 0.6 }}>IBM Patterns · Connector Workflow</p>
                  </div>
                  <ChevronRight size={12} style={{ color: "var(--primary)", flexShrink: 0 }} />
                </button>
                <button
                  onClick={() => onOpen("tusk")}
                  className="hidden sm:flex items-center gap-2 flex-1 min-w-0 px-3 py-2 rounded-lg transition-opacity hover:opacity-80"
                  style={{ background: "var(--node-header)", border: "1px solid var(--border)", textAlign: "left" }}>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-widest mb-0.5" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>also →</p>
                    <p className="font-mono text-[11px] font-medium truncate" style={{ color: "var(--foreground)" }}>TUSK</p>
                    <p className="font-mono text-[10px] truncate" style={{ color: "var(--muted-foreground)", opacity: 0.6 }}>Oral Care App · Smart Toothbrush System</p>
                  </div>
                  <ChevronRight size={12} style={{ color: "var(--primary)", flexShrink: 0 }} />
                </button>
                <button onClick={onClose}
                  className="flex items-center justify-center rounded-lg transition-opacity hover:opacity-70 w-9 flex-shrink-0"
                  style={{ border: "1px solid var(--border)", color: "var(--muted-foreground)", background: "var(--node-header)", alignSelf: "stretch" }}>
                  <X size={13} />
                </button>
              </div>

            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}


// ─── Business Impact modal ───────────────────────────────────────────────────

const BI = (file: string) => `/images/Business Impact EUM/${file}`;

export function BusinessImpactModal({ onClose, onOpen, dark, pageMode }: { onClose: () => void; onOpen: (slug: string) => void; dark: boolean; pageMode?: boolean }) {
  useEffect(() => {
    if (pageMode) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose, pageMode]);

  const SESSION_KEY = "ibm_connector_unlocked";
  const [unlocked, setUnlocked] = useState(() => { try { return sessionStorage.getItem(SESSION_KEY) === "1"; } catch { return false; } });
  const [guess, setGuess] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setChecking(true);
    try {
      const res = await fetch("/api/check-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guess }),
      });
      if (!res.ok) throw new Error("api_error");
      const data = await res.json() as { ok?: boolean };
      if (data.ok === true) {
        try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* ignore */ }
        setUnlocked(true);
      } else {
        setError("Incorrect password.");
        setGuess("");
      }
    } catch {
      setError("Could not verify — please try again.");
      // stays locked on any failure
    } finally {
      setChecking(false);
    }
  };

  const SL = ({ label }: { label: string }) => (
    <p className="font-mono text-[12px] uppercase tracking-widest mb-3" style={{ color: "var(--primary)" }}>// {label}</p>
  );

  return (
    <>
      {lightbox && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(8px)" }}
          onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="expanded"
            style={{ maxWidth: "92vw", maxHeight: "90vh", width: "auto", height: "auto", borderRadius: 8, border: "1px solid var(--border)" }} />
          <button className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full"
            style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}
            onClick={() => setLightbox(null)}>
            <X size={14} />
          </button>
        </div>
      )}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={pageMode ? "w-full flex items-start justify-center" : "fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto"}
        style={pageMode ? {} : { background: dark ? "rgba(10,9,8,0.9)" : "rgba(40,36,32,0.6)", backdropFilter: "blur(10px)" }}
        onClick={pageMode ? undefined : onClose}>

        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className={pageMode && isMobile ? "relative w-full overflow-hidden flex flex-col" : "relative w-full max-w-3xl mx-4 my-10 rounded-xl overflow-hidden flex flex-col"}
          style={pageMode && isMobile ? {} : { background: dark ? "#0E0D0C" : "#FAFAF9", border: "1px solid var(--border)" }}
          onClick={e => e.stopPropagation()}>

          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
            style={{ background: "var(--node-header)", borderBottom: "1px solid var(--border)" }}>
            {pageMode ? (
              <div className="flex items-center gap-2 min-w-0">
                <button onClick={onClose}
                  className="flex items-center gap-1.5 font-mono text-[9px] transition-opacity hover:opacity-60 flex-shrink-0"
                  style={{ color: "var(--muted-foreground)", background: "none", border: "none", cursor: "pointer" }}>
                  <ArrowLeft size={11} />
                  <span className="hidden sm:inline">back</span>
                </button>
                <span className="font-mono text-[9px]" style={{ color: "var(--border)", opacity: 0.6, flexShrink: 0 }}>|</span>
                <span style={{ color: "var(--primary)", flexShrink: 0 }}>▤</span>
                <span className="font-mono text-[9px] tracking-[0.2em] uppercase truncate"
                  style={{ color: "var(--primary)", fontWeight: 500 }}>project · case study</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span style={{ color: "var(--primary)" }}>▤</span>
                <span className="font-mono text-[9px] tracking-[0.2em] uppercase"
                  style={{ color: "var(--primary)", fontWeight: 500 }}>project · case study</span>
                <span className="font-mono text-[9px]"
                  style={{ color: "var(--muted-foreground)", opacity: 0.38 }}>prj_ibm_business_impact</span>
              </div>
            )}
            <div className="flex items-center gap-2 flex-shrink-0">
              {pageMode ? (
                <span className="font-mono text-[9px] flex-shrink-0"
                  style={{ color: "var(--muted-foreground)", opacity: 0.38 }}>prj_ibm_business_impact</span>
              ) : (
                <button onClick={onClose}
                  className="flex items-center justify-center w-6 h-6 rounded transition-opacity hover:opacity-60"
                  style={{ color: "var(--muted-foreground)" }}>
                  <X size={13} />
                </button>
              )}
              <ReadTime minutes={7} className="hidden sm:inline" />
            </div>
          </div>

          {/* Scrollable body */}
          <div className={pageMode ? undefined : "overflow-y-auto flex-1"}>

            {/* Hero */}
            <div className="w-full overflow-hidden" style={{ background: dark ? "#050D1A" : "#E8EDF5" }}>
              <img src={BI("Hero.png")} alt="Business Impact — hero"
                style={{ width: "100%", height: "auto", display: "block" }} />
            </div>

            <div className="p-6" style={{ display: "flex", flexDirection: "column", gap: 32 }}>

              {/* ─── TIER 1 — always visible ─────────────────────────── */}

              {/* TITLE BLOCK */}
              <div>
                <p className="font-mono text-[9px] tracking-[0.2em] uppercase mb-2"
                  style={{ color: "var(--primary)" }}>2025 · Instana Business Monitoring &amp; RUM · UX Designer</p>
                <h2 className="font-serif leading-tight mb-1"
                  style={{ fontSize: "clamp(1.4rem,3.5vw,2.2rem)", color: "var(--foreground)", lineHeight: 1.15 }}>
                  Business Impact Analysis — Conversion Goals, Funnels &amp; User Journey
                </h2>
                <p className="font-mono text-[11px] mt-1 mb-3" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>
                  2025 · Visual &amp; UX Designer — IBM Instana, Kochi
                </p>
                <div className="sm:hidden">
                  <ReadTime minutes={7} />
                </div>
              </div>

              {/* SCOPE NOTE — prominent */}
              <div className="p-4 rounded-lg" style={{ background: "var(--node-header)", border: "1px solid var(--primary)" }}>
                <p className="font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: "var(--primary)" }}>scope</p>
                <p className="font-sans text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                  I designed <span style={{ color: "var(--foreground)", fontWeight: 600 }}>Conversion Goals</span> and <span style={{ color: "var(--foreground)", fontWeight: 600 }}>Funnels</span> end-to-end, from lo-fi concepting through the Carbon-compliant UI shipped below.{" "}
                  <span style={{ color: "var(--foreground)", fontWeight: 600 }}>User Journey</span> was owned by another designer on the team; it's included here only because all three ship under one NFI and the story doesn't make sense without it.
                </p>
              </div>

              {/* WHAT THIS NFI IS */}
              <div>
                <SL label="what this NFI is" />
                <div className="p-4 rounded-lg" style={{ background: "var(--node-header)", border: "1px solid var(--border)" }}>
                  <p className="font-sans text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                    A New Feature Introduction on Instana's Real User Monitoring product, built to close a gap that existed for every team running a website, mobile app, or API through Instana: business health and technical health lived in two different worlds. A product owner could see a business number move. An SRE could see a technical signal fire. Nobody had a fast way to connect the two. This NFI gives App Owners, SREs and DevOps a shared, single place to ask{" "}
                    <em>"is the business doing what it's supposed to,"</em>{" "}
                    <em>"where exactly is it breaking down,"</em>{" "}and{" "}
                    <em>"why"</em>{" "}
                    — without switching tools or teams to get there.
                  </p>
                </div>
              </div>

              {/* THE THREE INITIATIVES */}
              <div>
                <SL label="the three initiatives" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      n: "01", label: "Conversion Goals", owner: "owned by me", color: "#3B82F6",
                      desc: "Lets a team define what success actually means for their app, and turns that definition into an always-on, trending business metric they don't have to calculate by hand.",
                    },
                    {
                      n: "02", label: "Funnels", owner: "owned by me", color: "#22C55E",
                      desc: "Lets a team lay out the path they expect customers to take toward that success, and shows exactly where along that path people are falling away — and how sharply.",
                    },
                    {
                      n: "03", label: "User Journey", owner: "context only — not my design work", color: "#EC4899",
                      desc: "Surfaces the paths customers are actually taking, whether or not those match the path the team designed for — giving the other two initiatives a reality check.",
                    },
                  ].map(({ n, label, owner, color, desc }) => (
                    <div key={n} className="p-3 rounded-lg"
                      style={{ background: "var(--node-header)", border: `1px solid ${color}55` }}>
                      <p className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color }}>Initiative {n}</p>
                      <p className="font-sans text-sm font-semibold mb-0.5" style={{ color: "var(--foreground)" }}>{label}</p>
                      <p className="font-mono text-[9px] mb-2" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>({owner})</p>
                      <p className="font-sans text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* WHY IT MATTERS — through the people who use it */}
              <div>
                <SL label="why it matters — through the people who use it" />
                <div className="space-y-2 mb-4">
                  {[
                    {
                      role: "Product / Business Owner",
                      color: "#3B82F6",
                      body: "Opens this to answer one question at the start of their week: is the app doing its job? They don't want a dashboard full of technical noise — they want to know, in plain terms, whether something needs their attention, and whether it's worth escalating.",
                    },
                    {
                      role: "SRE",
                      color: "#22C55E",
                      body: "Gets pulled in the moment that answer is \"no.\" Their journey starts at an alert and ends at a root cause — and every minute spent jumping between disconnected tools before they even start diagnosing is a minute an incident stays unresolved.",
                    },
                    {
                      role: "DevOps Engineer",
                      color: "#EC4899",
                      body: "Lives on the other side of that same journey — every release they ship, and every business rule that changes underneath the product, is a potential explanation for a metric that just moved. Their job is making sure that explanation is visible the moment someone goes looking for it, not buried in a separate changelog.",
                    },
                  ].map(({ role, color, body }) => (
                    <div key={role} className="flex gap-3 p-3 rounded-lg"
                      style={{ background: "var(--node-header)", border: `1px solid ${color}44` }}>
                      <div className="w-1 rounded-full flex-shrink-0 self-stretch" style={{ background: color, opacity: 0.7 }} />
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color }}>{role}</p>
                        <p className="font-sans text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{body}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 rounded-lg" style={{ background: dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.025)", border: "1px solid var(--border)" }}>
                  <p className="font-sans text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                    Three different starting points, three different questions — but historically, three different tools. This NFI was built around the idea that all three should be answerable from the same screen, without anyone having to translate between systems to get there.
                  </p>
                </div>
              </div>

              {/* SUMMARY */}
              <div>
                <SL label="summary" />
                <div className="p-4 rounded-lg" style={{ background: "var(--node-header)", border: "1px solid var(--border)" }}>
                  <p className="font-sans text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                    Taken together, these three initiatives turn a single moving number into a full, traceable story — what changed, where it changed, and who needs to act on it. The detail of how each piece works, how they combine, and the actual interface behind them is covered in the gated section below.
                  </p>
                </div>
              </div>

              {/* PASSWORD GATE */}
              {!unlocked ? (
                <div className="rounded-lg overflow-hidden"
                  style={{ border: "1px solid var(--border)" }}>
                  <div className="px-4 py-3"
                    style={{ background: "var(--node-header)", borderBottom: "1px solid var(--border)" }}>
                    <p className="font-mono text-[10px] uppercase tracking-widest"
                      style={{ color: "var(--primary)" }}>// full case study</p>
                  </div>
                  <div className="p-5">
                    <p className="font-sans text-sm leading-relaxed font-semibold mb-2"
                      style={{ color: "var(--foreground)" }}>
                      Enter password to view the full case study.
                    </p>
                    <p className="font-sans text-xs leading-relaxed mb-4"
                      style={{ color: "var(--muted-foreground)", opacity: 0.6 }}>
                      This is real work from an internal IBM project — worth sharing, but too detailed to publish openly. If you're a hiring manager or collaborator who wants the full process, reach out via{" "}
                      <a href="mailto:ux.sayan@gmail.com" className="underline underline-offset-2 transition-opacity hover:opacity-80" style={{ color: "var(--primary)" }}>email</a>
                      {" "}or{" "}
                      <a href="https://linkedin.com/in/sayanoriginals" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 transition-opacity hover:opacity-80" style={{ color: "var(--primary)" }}>LinkedIn</a>
                      {" "}and I'll send the password.
                    </p>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                      <input
                        type="password"
                        value={guess}
                        onChange={e => setGuess(e.target.value)}
                        placeholder="Password"
                        autoComplete="off"
                        className="w-full px-3 py-2 rounded font-mono text-sm"
                        style={{
                          background: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                          border: `1px solid ${error ? "#EF4444" : "var(--border)"}`,
                          color: "var(--foreground)",
                          outline: "none",
                        }}
                      />
                      {error && <p className="font-mono text-[10px]" style={{ color: "#EF4444" }}>{error}</p>}
                      <button
                        type="submit"
                        disabled={checking || !guess}
                        className="w-full flex items-center justify-center gap-1.5 font-mono text-sm py-2 rounded transition-opacity hover:opacity-80 disabled:opacity-40"
                        style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                        {checking ? "Checking…" : <><Unlock size={13} /> unlock</>}
                      </button>
                    </form>
                  </div>
                </div>
              ) : (

                /* ─── TIER 2 — unlocked ────────────────────────────── */
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ display: "flex", flexDirection: "column", gap: 32, width: "100%", minWidth: 0 }}>

                  {/* ── PROCESS ── */}
                  <div>
                    <SL label="process" />
                    {/* Staircase Gantt — each bar shifts right by one unit, no time axis */}
                    <div className="rounded-lg overflow-hidden mb-4" style={{ border: "1px solid var(--border)" }}>
                      {[
                        { n: "01", label: "Scope",               desc: "Aligned with PM + UX lead on what \"conversion goal\" and \"funnel\" needed to mean for websites, mobile apps and APIs, not just e-commerce.", color: "#3B82F6", shift: 0 },
                        { n: "02", label: "Competitor scan",      desc: "Looked at how funnel/conversion tooling is framed elsewhere in analytics. No artifacts kept from this pass.",                                    color: "#8B5CF6", shift: 1 },
                        { n: "03", label: "Lo-fi concepting",     desc: "Paper-level wireframes for both epics, working through what data each step of a funnel needed to expose.",                                        color: "#10B981", shift: 2 },
                        { n: "04", label: "Build — Goals first",  desc: "Conversion Goals shipped as the baseline epic; it's the metric everything else correlates against.",                                               color: "#F59E0B", shift: 3 },
                        { n: "05", label: "Build — Funnels next", desc: "Built on top, reusing the goal-definition pattern for defining steps.",                                                                            color: "#EC4899", shift: 4 },
                      ].map(({ n, label, desc, color, shift }, i, arr) => {
                        const UNIT = 10;
                        const barWidth = 100 - shift * UNIT - (arr.length - 1 - shift) * 2;
                        return (
                          <div key={n}
                            style={{
                              borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none",
                              background: i % 2 === 0
                                ? (dark ? "rgba(255,255,255,0.015)" : "rgba(0,0,0,0.012)")
                                : "transparent",
                            }}>
                            <div className="flex items-center" style={{ height: 36, paddingLeft: 8, paddingRight: 8 }}>
                              <span className="font-mono text-[9px] flex-shrink-0 mr-2" style={{ color: "var(--muted-foreground)", opacity: 0.4, width: 18 }}>{n}</span>
                              <div className="relative flex-1" style={{ height: 20 }}>
                                <div
                                  className="absolute top-0 bottom-0 flex items-center px-3 rounded-full"
                                  style={{
                                    left: `${shift * UNIT}%`,
                                    width: `${barWidth}%`,
                                    background: `${color}22`,
                                    border: `1px solid ${color}66`,
                                  }}>
                                  <span className="font-mono text-[10px] font-medium truncate" style={{ color }}>{label}</span>
                                </div>
                              </div>
                            </div>
                            <div style={{ paddingLeft: `calc(26px + ${shift * UNIT}%)`, paddingRight: 8, paddingBottom: 8 }}>
                              <p className="font-sans text-[10px] leading-snug" style={{ color: "var(--muted-foreground)", opacity: 0.65 }}>{desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { file: "Low-fi/low-fi conversion goals.png", caption: "Conversion Goal — lo-fi" },
                        { file: "Low-fi/low-fi funnels.png",          caption: "Funnels — lo-fi" },
                      ].map(({ file, caption }) => (
                        <figure key={file} className="overflow-hidden rounded-lg m-0 cursor-zoom-in"
                          style={{ background: "var(--node-header)", border: "1px solid var(--border)" }}
                          onClick={() => setLightbox(BI(file))}>
                          <img src={BI(file)} alt={caption} style={{ width: "100%", height: "auto", display: "block" }} />
                          <figcaption className="px-3 py-2 font-mono text-[9px]"
                            style={{ color: "var(--muted-foreground)", opacity: 0.55, borderTop: "1px solid var(--border)" }}>
                            {caption}
                          </figcaption>
                        </figure>
                      ))}
                    </div>
                  </div>

                  {/* ── PERSONAS ── */}
                  <div>
                    <SL label="personas" />
                    <p className="font-sans text-sm leading-relaxed mb-4" style={{ color: "var(--muted-foreground)" }}>
                      The Aha brief named "App Owners/SRE" and "developers and SRE" as the audience, split into an executive lens and an engineer lens in the hills workshop. In the actual design work that became three overlapping-but-distinct personas — each opens the same Business Impact tab, scanning for something different.
                    </p>
                    <div className="space-y-4">
                      {[
                        {
                          initial: "P", name: "Priya", role: "Product Owner", type: "Business / App Owner",
                          color: "#3B82F6",
                          watches: "Conversion rate trend, AOV, funnel drop-off %",
                          goal: "Know, at a glance, whether the app is doing its job this week — and whether that's a normal seasonal dip or a real regression.",
                          frustration: "I can see the number moved. I can't see why, and I don't want to file a ticket every time it does.",
                          uses: ["Defines primary/secondary goals", "Reads funnel drop-off", "Compares journey vs. plan"],
                          quote: "Tell me if last quarter's checkout redesign actually worked — in numbers I can put in a deck.",
                        },
                        {
                          initial: "D", name: "Dev", role: "Site Reliability Engineer", type: "SRE",
                          color: "#22C55E",
                          watches: "Deviation alerts, common issues in dropped sessions",
                          goal: "When a business metric alert fires, get from \"conversion rate down 8%\" to \"root cause\" without switching tools.",
                          frustration: "Business dashboards and technical dashboards live in different tabs. By the time I've cross-referenced them, the incident's cold.",
                          uses: ["Investigates funnel step errors", "Correlates with JS errors / HTTP failures", "Checks release markers"],
                          quote: "Show me what the dropped sessions had in common — a slow request, a JS error, a 500 — before I start guessing.",
                        },
                        {
                          initial: "A", name: "Alex", role: "DevOps Engineer", type: "DevOps",
                          color: "#EC4899",
                          watches: "Release markers vs. metric charts, beacon configuration",
                          goal: "Make every release — frontend, backend, or a business-rule change — visible on the same timeline as the business metrics it might affect.",
                          frustration: "We only had release markers for backend deploys. A frontend-only release, or a pricing rule change, was invisible on these charts.",
                          uses: ["Configures funnel beacon filters", "Adds release / business-rule markers", "Owns instrumentation for goals"],
                          quote: "If a release caused this, I need it on the chart, not in a changelog I have to go dig up.",
                        },
                      ].map(({ initial, name, role, type, color, watches, goal, frustration, uses, quote }) => (
                        <div key={name} className="p-4 rounded-lg" style={{ background: "var(--node-header)", border: `1px solid ${color}55` }}>
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-serif text-base"
                              style={{ background: color, color: "#fff" }}>{initial}</div>
                            <div>
                              <p className="font-sans text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>{name}</p>
                              <p className="font-mono text-[11px]" style={{ color }}>{role}</p>
                              <p className="font-mono text-[10px]" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>{type}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                            <div>
                              <p className="font-mono text-[9px] uppercase tracking-widest mb-1" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>watches</p>
                              <p className="font-sans text-xs leading-snug" style={{ color: "var(--muted-foreground)" }}>{watches}</p>
                            </div>
                            <div>
                              <p className="font-mono text-[9px] uppercase tracking-widest mb-1" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>goal</p>
                              <p className="font-sans text-xs leading-snug" style={{ color: "var(--muted-foreground)" }}>{goal}</p>
                            </div>
                            <div>
                              <p className="font-mono text-[9px] uppercase tracking-widest mb-1" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>uses across NFI</p>
                              {uses.map((u, i) => (
                                <div key={i} className="flex gap-1 mb-0.5">
                                  <span className="font-mono text-[9px] flex-shrink-0" style={{ color }}>·</span>
                                  <p className="font-sans text-[11px]" style={{ color: "var(--muted-foreground)" }}>{u}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="p-2 rounded mb-2" style={{ background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", border: `1px solid ${color}33` }}>
                            <p className="font-mono text-[9px] mb-1" style={{ color, opacity: 0.7 }}>frustration</p>
                            <p className="font-sans text-xs italic" style={{ color: "var(--muted-foreground)" }}>&ldquo;{frustration}&rdquo;</p>
                          </div>
                          <div className="p-2.5 rounded" style={{ background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: `1px solid ${color}44` }}>
                            <p className="font-serif italic text-xs leading-snug" style={{ color: "var(--foreground)" }}>&ldquo;{quote}&rdquo;</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── THE WHY? ── */}
                  <div>
                    <SL label="the why?" />
                    <div className="space-y-3">
                      {[
                        "This NFI started from something we kept observing: a lot of our e-commerce customers had started reaching for separate, outside tools just to track business metrics on their own websites — a gap in what Instana covered. Looking at what those tools did well, the pattern was consistent: teams needed to track conversions, and understand how and when their customers were actually converting.",
                        "Conversion Goals alone couldn't answer that fully — it could tell you what needed to happen and how much of it was happening, but not where things were breaking down. That's where Funnels came in: tracking the drop-off rate across the flow a team expects their customers to move through.",
                        "But an expected flow doesn't always play out the way it's designed — hence the drop-offs. That gap was the opportunity: to help teams optimize their flows and find out where conversion is actually happening, if not where they assumed it was.",
                        "That's what User Journey adds. It tracks what the customer's own customer experiences — where conversion is really happening, and how the full flow plays out end to end, whether or not it matches the flow that was originally designed.",
                        "Together, these three don't just report a number — they explain it, and show what to do next.",
                      ].map((para, i) => (
                        <p key={i} className="font-sans text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{para}</p>
                      ))}
                    </div>
                  </div>

                  {/* ── AREA 1 — CONVERSION GOALS ── */}
                  <div>
                    <SL label="conversion goals — shipped" />
                    <p className="font-sans text-sm leading-relaxed mb-3" style={{ color: "var(--muted-foreground)" }}>
                      Lets a team define what "success" means for their app as a named, reusable goal, then removes all manual tracking — the conversion rate, trend, and time-to-convert are calculated automatically from that one definition. This is the baseline metric everything else in the NFI correlates against.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                      {([
                        { file: "create conversion goal.png",  caption: "Create conversion goal — beacon type + filter",                   callout: "Same beacon filter pattern whether it's an HTTP request or a page view — goal creation shouldn't feel like a different tool depending on the signal type." },
                        { file: "Conversion goal_list.png",     caption: "Conversion goals list — rate, sessions, users, avg time",        callout: "Primary sits as a pill next to the goal name, not buried in its own column — it's the first thing a Business Owner scans for." },
                        { file: "Conversion goal.png",          caption: "Drill-in — converted-sessions trend + avg time to convert",      callout: "Sessions % and Users % lead, ahead of the trend chart — 'how much' and 'how many' are the first questions, the trend is the follow-up." },
                        { file: "Business impact.png",          caption: "Business impact dashboard — Conversion Goals live",              callout: null },
                      ] as { file: string; caption: string; callout: string | null }[]).map(({ file, caption, callout }) => (
                        <figure key={file} className="overflow-hidden rounded-lg m-0 cursor-zoom-in"
                          style={{ background: "var(--node-header)", border: "1px solid var(--border)" }}
                          onClick={() => setLightbox(BI(file))}>
                          <img src={BI(file)} alt={caption} style={{ width: "100%", height: "auto", display: "block" }} />
                          <figcaption className="px-2 py-1.5 font-mono text-[9px]"
                            style={{ borderTop: "1px solid var(--border)" }}>
                            <span style={{ color: "var(--muted-foreground)", opacity: 0.55, display: "block" }}>{caption}</span>
                            {callout && (
                              <span className="font-sans text-[10px] leading-snug not-italic mt-1" style={{ color: "var(--muted-foreground)", opacity: 0.8, display: "block" }}>{callout}</span>
                            )}
                          </figcaption>
                        </figure>
                      ))}
                    </div>
                    {/* Journey Map 1 — Conversion Goals */}
                    <p className="font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: "#3B82F6" }}>journey map — conversion goals</p>
                    {(() => {
                      const steps = [
                        { n: "01", role: "Business Owner", label: "Define success",  doing: "Names the primary and secondary goals for the app and ties each to a beacon — a page view, transition, or HTTP request pattern.", thinking: "\"What does 'working' actually mean for this app — a purchase, a signup, a form fill?\"", feeling: "Focused, a little uncertain — this decision shapes everything measured afterward." },
                        { n: "02", role: "Business Owner", label: "Watch the rate",  doing: "Checks the conversion rate and average time to convert on a regular cadence, with no manual calculation required.", thinking: "\"Is this trending the way it should for this time of year?\"", feeling: "Reassured when it's flat or climbing; alert but not yet worried on a small dip." },
                        { n: "03", role: "SRE",            label: "Deviation alert", doing: "Receives an alert once the rate crosses a threshold or breaks from expected seasonal behavior.", thinking: "\"Is this real, or normal noise? How fast do I need to move?\"", feeling: "A jolt of urgency — the clock on resolution just started." },
                        { n: "04", role: "SRE / DevOps",   label: "Correlate",       doing: "Checks the conversion chart against release markers and business-rule-change markers on the same timeline.", thinking: "\"Did we ship something, or did the business change something, right before this moved?\"", feeling: "Focused and methodical — this moment decides whether the fix is fast or painful." },
                        { n: "05", role: "Business Owner", label: "Report impact",   doing: "Reports the confirmed cause (or a ruled-out list) upward, backed by the actual number and timeline.", thinking: "\"Can I explain this in one sentence, with a number, without hedging?\"", feeling: "Relief once the loop closes — even a bad answer beats an open question." },
                      ];
                      const cols = `repeat(${steps.length}, 1fr)`;
                      const minW = steps.length * 140;
                      return (
                        <div className="overflow-x-auto pb-2 -mx-2 px-2">
                          <div style={{ minWidth: minW }}>
                            {/* Phase headers */}
                            <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: cols }}>
                              {steps.map(s => (
                                <div key={s.n} className="px-2 py-1.5 rounded text-center"
                                  style={{ background: "#3B82F618", border: "1px solid #3B82F644" }}>
                                  <p className="font-mono text-[8px] uppercase tracking-widest" style={{ color: "#3B82F6", opacity: 0.7 }}>{s.role}</p>
                                  <p className="font-mono text-[8px]" style={{ color: "var(--muted-foreground)", opacity: 0.4 }}>{s.n}</p>
                                  <p className="font-sans text-[11px] font-semibold" style={{ color: "var(--foreground)" }}>{s.label}</p>
                                </div>
                              ))}
                            </div>
                            {/* Doing row */}
                            <p className="font-mono text-[9px] uppercase tracking-widest mb-1 px-1" style={{ color: "var(--muted-foreground)", opacity: 0.45 }}>// doing</p>
                            <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: cols }}>
                              {steps.map(s => (
                                <div key={s.n} className="p-2 rounded" style={{ background: "var(--node-header)", border: "1px solid #3B82F633" }}>
                                  <p className="font-sans text-[9px] leading-snug" style={{ color: "var(--muted-foreground)" }}>{s.doing}</p>
                                </div>
                              ))}
                            </div>
                            {/* Thinking row */}
                            <p className="font-mono text-[9px] uppercase tracking-widest mb-1 px-1" style={{ color: "var(--muted-foreground)", opacity: 0.45 }}>// thinking</p>
                            <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: cols }}>
                              {steps.map(s => (
                                <div key={s.n} className="p-2 rounded" style={{ background: "#3B82F610", border: "1px solid #3B82F633" }}>
                                  <p className="font-sans text-[9px] leading-snug italic" style={{ color: "var(--muted-foreground)" }}>{s.thinking}</p>
                                </div>
                              ))}
                            </div>
                            {/* Feeling row */}
                            <p className="font-mono text-[9px] uppercase tracking-widest mb-1 px-1" style={{ color: "var(--muted-foreground)", opacity: 0.45 }}>// feeling</p>
                            <div className="grid gap-1" style={{ gridTemplateColumns: cols }}>
                              {steps.map(s => (
                                <div key={s.n} className="p-2 rounded" style={{ background: "#3B82F618", border: "1px solid #3B82F644" }}>
                                  <p className="font-sans text-[9px] leading-snug" style={{ color: "#3B82F6" }}>{s.feeling}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* ── AREA 2 — FUNNELS ── */}
                  <div>
                    <SL label="funnels — shipped" />
                    <p className="font-sans text-sm leading-relaxed mb-3" style={{ color: "var(--muted-foreground)" }}>
                      Lets a team lay out the exact path they expect customers to take toward a conversion goal, then shows precisely where along that path people are falling away and by how much — turning "the rate dropped" into "step 4 is the problem."
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                      {([
                        { file: "create_funnel.png",                                      caption: "Create funnel — steps in order, beacon filter expanded",              callout: "Steps are a draggable, collapsible list, not a fixed wizard — a funnel can be 3 steps or 8, and the builder needed to flex with that." },
                        { file: "Funnel_list.png",                                        caption: "Funnels list — session start rate, drop-off rate, avg time",          callout: "Start rate and drop-off rate stay separate instead of one blended score — reach and leakage answer different questions." },
                        { file: "Funnel.png",                                             caption: "Drill-in — step-by-step drop-off, highest drop flagged",              callout: "The worst step gets a 'Highest drop-off rate' badge right on its card, not a footnote — same instinct as the Primary tag: don't make someone compare numbers by eye." },
                        { file: "Business-impact_conversion_goal_Funnels.png",            caption: "Business impact dashboard — Conversion Goals + Funnels live",         callout: null },
                      ] as { file: string; caption: string; callout: string | null }[]).map(({ file, caption, callout }) => (
                        <figure key={file} className="overflow-hidden rounded-lg m-0 cursor-zoom-in"
                          style={{ background: "var(--node-header)", border: "1px solid var(--border)" }}
                          onClick={() => setLightbox(BI(file))}>
                          <img src={BI(file)} alt={caption} style={{ width: "100%", height: "auto", display: "block" }} />
                          <figcaption className="px-2 py-1.5 font-mono text-[9px]"
                            style={{ borderTop: "1px solid var(--border)" }}>
                            <span style={{ color: "var(--muted-foreground)", opacity: 0.55, display: "block" }}>{caption}</span>
                            {callout && (
                              <span className="font-sans text-[10px] leading-snug not-italic mt-1" style={{ color: "var(--muted-foreground)", opacity: 0.8, display: "block" }}>{callout}</span>
                            )}
                          </figcaption>
                        </figure>
                      ))}
                    </div>
                    {/* Journey Map 2 — Funnels */}
                    <p className="font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: "#22C55E" }}>journey map — funnels</p>
                    {(() => {
                      const steps = [
                        { n: "01", role: "Business Owner", label: "Define the steps",  doing: "Lays out the intended sequence toward a goal — e.g. cart → checkout → payment.", thinking: "\"Is this genuinely the path we expect people to take, or just the path I assume?\"", feeling: "Deliberate — every step added here becomes something that gets measured and judged." },
                        { n: "02", role: "DevOps",         label: "Instrument steps",  doing: "Scopes each step to a page view or HTTP request/beacon filter, e.g. destination path = /payment.", thinking: "\"Is this filter specific enough to be trustworthy, or will it catch the wrong traffic?\"", feeling: "Careful, slightly tedious — small filter mistakes quietly break the whole funnel later." },
                        { n: "03", role: "SRE",            label: "Spot the drop",     doing: "Opens the funnel view and reads session count and drop-off percentage at every step.", thinking: "\"Where's the cliff — one step, or a slow bleed across several?\"", feeling: "Alert — often the first moment the size of the problem becomes visible." },
                        { n: "04", role: "SRE",            label: "Diagnose the step", doing: "Drills into what dropped sessions had in common — slow loads, JS errors, failed requests, device or geo patterns.", thinking: "\"Is this technical (something broke), or behavioral (people just don't want this step)?\"", feeling: "Investigative, almost like detective work — satisfying when a pattern clicks into place." },
                        { n: "05", role: "Business Owner", label: "Fix + re-measure",  doing: "Ships or requests the fix, then watches the same funnel step to confirm the drop-off recovers.", thinking: "\"Did that actually work, or do we just think it worked?\"", feeling: "Cautiously optimistic until the number itself confirms it." },
                      ];
                      const cols = `repeat(${steps.length}, 1fr)`;
                      const minW = steps.length * 140;
                      return (
                        <div className="overflow-x-auto pb-2 -mx-2 px-2">
                          <div style={{ minWidth: minW }}>
                            <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: cols }}>
                              {steps.map(s => (
                                <div key={s.n} className="px-2 py-1.5 rounded text-center"
                                  style={{ background: "#22C55E18", border: "1px solid #22C55E44" }}>
                                  <p className="font-mono text-[8px] uppercase tracking-widest" style={{ color: "#22C55E", opacity: 0.7 }}>{s.role}</p>
                                  <p className="font-mono text-[8px]" style={{ color: "var(--muted-foreground)", opacity: 0.4 }}>{s.n}</p>
                                  <p className="font-sans text-[11px] font-semibold" style={{ color: "var(--foreground)" }}>{s.label}</p>
                                </div>
                              ))}
                            </div>
                            <p className="font-mono text-[9px] uppercase tracking-widest mb-1 px-1" style={{ color: "var(--muted-foreground)", opacity: 0.45 }}>// doing</p>
                            <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: cols }}>
                              {steps.map(s => (
                                <div key={s.n} className="p-2 rounded" style={{ background: "var(--node-header)", border: "1px solid #22C55E33" }}>
                                  <p className="font-sans text-[9px] leading-snug" style={{ color: "var(--muted-foreground)" }}>{s.doing}</p>
                                </div>
                              ))}
                            </div>
                            <p className="font-mono text-[9px] uppercase tracking-widest mb-1 px-1" style={{ color: "var(--muted-foreground)", opacity: 0.45 }}>// thinking</p>
                            <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: cols }}>
                              {steps.map(s => (
                                <div key={s.n} className="p-2 rounded" style={{ background: "#22C55E10", border: "1px solid #22C55E33" }}>
                                  <p className="font-sans text-[9px] leading-snug italic" style={{ color: "var(--muted-foreground)" }}>{s.thinking}</p>
                                </div>
                              ))}
                            </div>
                            <p className="font-mono text-[9px] uppercase tracking-widest mb-1 px-1" style={{ color: "var(--muted-foreground)", opacity: 0.45 }}>// feeling</p>
                            <div className="grid gap-1" style={{ gridTemplateColumns: cols }}>
                              {steps.map(s => (
                                <div key={s.n} className="p-2 rounded" style={{ background: "#22C55E18", border: "1px solid #22C55E44" }}>
                                  <p className="font-sans text-[9px] leading-snug" style={{ color: "#22C55E" }}>{s.feeling}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* ── AREA 3 — USER JOURNEY ── */}
                  <div>
                    <SL label="user journey — context" />
                    <p className="font-sans text-sm leading-relaxed mb-3" style={{ color: "var(--muted-foreground)" }}>
                      Auto-discovers the paths customers are actually taking toward a key view, instead of relying on a path someone had to design in advance — giving Conversion Goals and Funnels a reality check on whether real behavior matches the intended plan.{" "}
                      <span style={{ fontStyle: "italic", opacity: 0.6 }}>Not my design initiative — included here because it completes the NFI story.</span>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                      {[
                        { file: "Create_User journey.png",                                                    caption: "Create user journey — key view, steps before/after, top/bottom paths" },
                        { file: "User journey_list.png",                                                      caption: "User journeys list — Coupon flow (Pinned), Robotshop, Pre-Confirmation" },
                        { file: "USer journey.png",                                                           caption: "Drill-in — Sankey paths to Confirmation page, drop-off in red" },
                        { file: "Business impact_conversion_goal_funnels _user_journey.png",                  caption: "Business impact dashboard — all three initiatives live" },
                      ].map(({ file, caption }) => (
                        <figure key={file} className="overflow-hidden rounded-lg m-0 cursor-zoom-in"
                          style={{ background: "var(--node-header)", border: "1px solid var(--border)" }}
                          onClick={() => setLightbox(BI(file))}>
                          <img src={BI(file)} alt={caption} style={{ width: "100%", height: "auto", display: "block" }} />
                          <figcaption className="px-2 py-1.5 font-mono text-[9px]"
                            style={{ color: "var(--muted-foreground)", opacity: 0.55, borderTop: "1px solid var(--border)" }}>
                            {caption}
                          </figcaption>
                        </figure>
                      ))}
                    </div>
                    {/* Journey Map 3 — User Journey */}
                    <p className="font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: "#EC4899" }}>journey map — user journey</p>
                    {(() => {
                      const steps = [
                        { n: "01", role: "SRE",            label: "Discover real paths",    doing: "Lets the system auto-discover the paths users actually took toward a conversion goal.", thinking: "\"Are people even following the funnel we built, or ignoring it entirely?\"", feeling: "Curious, sometimes surprised — real behavior rarely matches the tidy diagram in the spec." },
                        { n: "02", role: "Business Owner", label: "Compare to plan",         doing: "Compares the real, discovered paths against the funnel that was designed.", thinking: "\"How far off is reality from what we planned, and does that gap matter?\"", feeling: "A little humbling when the gap is large; validating when it's not." },
                        { n: "03", role: "SRE",            label: "Find the drop-off point", doing: "Reads the Sankey-style view to see exactly which page users bounce from, and how many steps before the goal.", thinking: "\"Is this drop-off happening on the intended path, or one we never even considered?\"", feeling: "Sharpened focus — this is the screen that turns a vague 'something's wrong' into a specific page." },
                        { n: "04", role: "SRE / DevOps",   label: "Diagnose divergence",     doing: "Applies the same drop-off diagnostics used in Funnels to a path nobody explicitly designed for.", thinking: "\"Now that I know where, is this a bug, or is this what customers actually prefer?\"", feeling: "Analytical, occasionally uneasy — sometimes the answer implicates a decision, not a defect." },
                        { n: "05", role: "Business Owner", label: "Redesign the funnel",     doing: "If real behavior consistently diverges from plan, redefines the funnel around the path people are actually taking.", thinking: "\"Should we fight this behavior, or build around it?\"", feeling: "Decisive — the plan bends to match reality instead of the other way around." },
                      ];
                      const cols = `repeat(${steps.length}, 1fr)`;
                      const minW = steps.length * 140;
                      return (
                        <div className="overflow-x-auto pb-2 -mx-2 px-2">
                          <div style={{ minWidth: minW }}>
                            <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: cols }}>
                              {steps.map(s => (
                                <div key={s.n} className="px-2 py-1.5 rounded text-center"
                                  style={{ background: "#EC489918", border: "1px solid #EC489944" }}>
                                  <p className="font-mono text-[8px] uppercase tracking-widest" style={{ color: "#EC4899", opacity: 0.7 }}>{s.role}</p>
                                  <p className="font-mono text-[8px]" style={{ color: "var(--muted-foreground)", opacity: 0.4 }}>{s.n}</p>
                                  <p className="font-sans text-[11px] font-semibold" style={{ color: "var(--foreground)" }}>{s.label}</p>
                                </div>
                              ))}
                            </div>
                            <p className="font-mono text-[9px] uppercase tracking-widest mb-1 px-1" style={{ color: "var(--muted-foreground)", opacity: 0.45 }}>// doing</p>
                            <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: cols }}>
                              {steps.map(s => (
                                <div key={s.n} className="p-2 rounded" style={{ background: "var(--node-header)", border: "1px solid #EC489933" }}>
                                  <p className="font-sans text-[9px] leading-snug" style={{ color: "var(--muted-foreground)" }}>{s.doing}</p>
                                </div>
                              ))}
                            </div>
                            <p className="font-mono text-[9px] uppercase tracking-widest mb-1 px-1" style={{ color: "var(--muted-foreground)", opacity: 0.45 }}>// thinking</p>
                            <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: cols }}>
                              {steps.map(s => (
                                <div key={s.n} className="p-2 rounded" style={{ background: "#EC489910", border: "1px solid #EC489933" }}>
                                  <p className="font-sans text-[9px] leading-snug italic" style={{ color: "var(--muted-foreground)" }}>{s.thinking}</p>
                                </div>
                              ))}
                            </div>
                            <p className="font-mono text-[9px] uppercase tracking-widest mb-1 px-1" style={{ color: "var(--muted-foreground)", opacity: 0.45 }}>// feeling</p>
                            <div className="grid gap-1" style={{ gridTemplateColumns: cols }}>
                              {steps.map(s => (
                                <div key={s.n} className="p-2 rounded" style={{ background: "#EC489918", border: "1px solid #EC489944" }}>
                                  <p className="font-sans text-[9px] leading-snug" style={{ color: "#EC4899" }}>{s.feeling}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* ── JOURNEY MAP 4 — ALL THREE, IN HARMONY ── */}
                  <div>
                    <SL label="all three, in harmony" />
                    <p className="font-sans text-sm leading-relaxed mb-3" style={{ color: "var(--muted-foreground)" }}>
                      This is the loop as it actually runs day to day once all three epics are live together — not three separate investigations, but one, with each epic handing off to the next.
                    </p>
                    {(() => {
                      const steps = [
                        { n: "01", role: "Business Owner",          label: "Signal",                     doing: "Primary conversion rate dips below expected range; deviation alert fires against the seasonal baseline.", thinking: "\"Something's off — how bad, and how fast is it moving?\"", feeling: "The first flicker of concern, not yet alarm." },
                        { n: "02", role: "SRE",                     label: "Locate",                     doing: "Opens the funnel for that goal; the step with the steepest session drop-off is flagged automatically.", thinking: "\"Good — now I know where to look instead of guessing across the whole app.\"", feeling: "Relief at having a starting point instead of an open-ended search." },
                        { n: "03", role: "SRE",                     label: "Confirm intent vs. reality",  doing: "Checks the User Journey view against that same step: are sessions dropping on the intended path, or has real traffic diverged entirely?", thinking: "\"Is this a broken step on the right path, or people rejecting the path altogether?\"", feeling: "The investigation sharpens — the pivot that decides what kind of fix is even possible." },
                        { n: "04", role: "SRE / DevOps",            label: "Correlate",                  doing: "Checks the finding against release markers and business-rule-change markers on the shared timeline.", thinking: "\"What changed right before this — a deploy, a pricing rule, a copy change?\"", feeling: "Focused problem-solving, the satisfaction of closing in on a cause." },
                        { n: "05", role: "Business Owner / DevOps", label: "Close the loop",             doing: "Ships the technical fix, or redefines the funnel to match real behavior; watches Conversion Goal rate to confirm recovery.", thinking: "\"Did this actually move the number back, and do we need to rebuild around this behavior?\"", feeling: "Resolution — the three-tool, three-team fire drill has become a five-minute look at one tab." },
                      ];
                      const cols = `repeat(${steps.length}, 1fr)`;
                      const minW = steps.length * 140;
                      return (
                        <div className="overflow-x-auto pb-2 -mx-2 px-2">
                          <div style={{ minWidth: minW }}>
                            <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: cols }}>
                              {steps.map(s => (
                                <div key={s.n} className="px-2 py-1.5 rounded text-center"
                                  style={{ background: "var(--node-header)", border: "1px solid var(--primary)" }}>
                                  <p className="font-mono text-[8px] uppercase tracking-widest" style={{ color: "var(--primary)", opacity: 0.7 }}>{s.role}</p>
                                  <p className="font-mono text-[8px]" style={{ color: "var(--muted-foreground)", opacity: 0.4 }}>{s.n}</p>
                                  <p className="font-sans text-[11px] font-semibold" style={{ color: "var(--foreground)" }}>{s.label}</p>
                                </div>
                              ))}
                            </div>
                            <p className="font-mono text-[9px] uppercase tracking-widest mb-1 px-1" style={{ color: "var(--muted-foreground)", opacity: 0.45 }}>// doing</p>
                            <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: cols }}>
                              {steps.map(s => (
                                <div key={s.n} className="p-2 rounded" style={{ background: "var(--node-header)", border: "1px solid var(--border)" }}>
                                  <p className="font-sans text-[9px] leading-snug" style={{ color: "var(--muted-foreground)" }}>{s.doing}</p>
                                </div>
                              ))}
                            </div>
                            <p className="font-mono text-[9px] uppercase tracking-widest mb-1 px-1" style={{ color: "var(--muted-foreground)", opacity: 0.45 }}>// thinking</p>
                            <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: cols }}>
                              {steps.map(s => (
                                <div key={s.n} className="p-2 rounded" style={{ background: dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)", border: "1px solid var(--border)" }}>
                                  <p className="font-sans text-[9px] leading-snug italic" style={{ color: "var(--muted-foreground)" }}>{s.thinking}</p>
                                </div>
                              ))}
                            </div>
                            <p className="font-mono text-[9px] uppercase tracking-widest mb-1 px-1" style={{ color: "var(--muted-foreground)", opacity: 0.45 }}>// feeling</p>
                            <div className="grid gap-1" style={{ gridTemplateColumns: cols }}>
                              {steps.map(s => (
                                <div key={s.n} className="p-2 rounded" style={{ background: "var(--node-header)", border: "1px solid var(--primary)" }}>
                                  <p className="font-sans text-[9px] leading-snug" style={{ color: "var(--primary)" }}>{s.feeling}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                    <p className="font-mono text-[9px] mt-2" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>
                      Same three roles, same one tab, no tool-switching — the reason this shipped as a single NFI rather than three separate features.
                    </p>
                  </div>

                  {/* ── VALUE ── */}
                  <div className="p-4 rounded-lg" style={{ background: "var(--node-header)", border: "1px solid var(--primary)" }}>
                    <p className="font-mono text-[12px] uppercase tracking-widest mb-2" style={{ color: "var(--primary)" }}>// value</p>
                    <p className="font-sans text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                      Before this NFI, a business KPI regression and a technical incident lived in different products, investigated by different people, on different timelines. After: one dashboard tab, one timeline, one investigation — from "the number moved" to "here's the step, here's the release, here's the fix." Came from customer requests, user research and analyst direction; validated as viable, usable and feasible before scoping began.
                    </p>
                  </div>

                  {/* ── LOCK ── */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
                        setUnlocked(false);
                      }}
                      className="flex items-center gap-1.5 font-mono text-[12px] px-2.5 py-1 rounded transition-opacity hover:opacity-60"
                      style={{ border: "1px solid var(--border)", color: "var(--muted-foreground)", background: "var(--node-header)" }}>
                      <Lock size={9} /> lock case study
                    </button>
                  </div>

                </motion.div>
              )}

              {/* Footer */}
              <div className="flex items-center gap-2 pt-3 overflow-hidden" style={{ borderTop: "1px solid var(--border)" }}>
                <button
                  onClick={() => onOpen("instana-incident-remediation")}
                  className="flex items-center gap-2 flex-1 min-w-0 px-3 py-2 rounded-lg transition-opacity hover:opacity-80"
                  style={{ background: "var(--node-header)", border: "1px solid var(--border)", textAlign: "left" }}>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-widest mb-0.5" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>next →</p>
                    <p className="font-mono text-[11px] font-medium truncate" style={{ color: "var(--foreground)" }}>Instana Incident Remediation</p>
                    <p className="font-mono text-[10px] truncate" style={{ color: "var(--muted-foreground)", opacity: 0.6 }}>Agentic AI · iF Design Award</p>
                  </div>
                  <ChevronRight size={12} style={{ color: "var(--primary)", flexShrink: 0 }} />
                </button>
                <button
                  onClick={() => onOpen("ibm-connector-workflow")}
                  className="hidden sm:flex items-center gap-2 flex-1 min-w-0 px-3 py-2 rounded-lg transition-opacity hover:opacity-80"
                  style={{ background: "var(--node-header)", border: "1px solid var(--border)", textAlign: "left" }}>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-widest mb-0.5" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>also →</p>
                    <p className="font-mono text-[11px] font-medium truncate" style={{ color: "var(--foreground)" }}>Companion Panel</p>
                    <p className="font-mono text-[10px] truncate" style={{ color: "var(--muted-foreground)", opacity: 0.6 }}>IBM Patterns · Connector Workflow</p>
                  </div>
                  <ChevronRight size={12} style={{ color: "var(--primary)", flexShrink: 0 }} />
                </button>
                <button onClick={onClose}
                  className="flex items-center justify-center rounded-lg transition-opacity hover:opacity-70 w-9 flex-shrink-0"
                  style={{ border: "1px solid var(--border)", color: "var(--muted-foreground)", background: "var(--node-header)", alignSelf: "stretch" }}>
                  <X size={13} />
                </button>
              </div>

            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}


// ─── Gen AI Traces & Failures modal ──────────────────────────────────────────
export function GenAITracesModal({ onClose, onOpen, dark, pageMode }: { onClose: () => void; onOpen: (slug: string) => void; dark: boolean; pageMode?: boolean }) {
  useEffect(() => {
    if (pageMode) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose, pageMode]);

  const SESSION_KEY = "ibm_connector_unlocked";
  const [unlocked, setUnlocked] = useState(() => { try { return sessionStorage.getItem(SESSION_KEY) === "1"; } catch { return false; } });
  const [guess, setGuess] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const [processExpanded, setProcessExpanded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setChecking(true);
    try {
      const res = await fetch("/api/check-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guess }),
      });
      if (!res.ok) throw new Error("api_error");
      const data = await res.json() as { ok?: boolean };
      if (data.ok === true) {
        try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* ignore */ }
        setUnlocked(true);
      } else {
        setError("Incorrect password.");
        setGuess("");
      }
    } catch {
      setError("Could not verify — please try again.");
      // stays locked on any failure
    } finally {
      setChecking(false);
    }
  };

  const shell = dark ? "rgba(22,20,18,0.96)" : "#FAF8F4";

  const SL = ({ label }: { label: string }) => (
    <p className="font-mono text-[12px] uppercase tracking-widest mb-3" style={{ color: "var(--primary)" }}>// {label}</p>
  );

  // Placeholder image component — slots a labelled frame until real screenshots arrive
  const ImgSlot = ({ label, area }: { label: string; area: string }) => (
    <div className="w-full rounded-lg flex flex-col items-center justify-center py-10 px-4"
      style={{ background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
        border: "1px dashed var(--border)", minHeight: 120 }}>
      <p className="font-mono text-[9px] uppercase tracking-widest mb-1" style={{ color: "var(--primary)", opacity: 0.5 }}>
        image · {area}
      </p>
      <p className="font-mono text-[10px] text-center" style={{ color: "var(--muted-foreground)", opacity: 0.4 }}>{label}</p>
    </div>
  );

  // Real image — shown once actual screenshots are placed
  const Img = ({ src, alt, expandable = false }: { src: string; alt: string; expandable?: boolean }) => (
    <figure className="overflow-hidden rounded-lg m-0"
      style={{ border: "1px solid var(--border)", background: "transparent",
        cursor: expandable ? "zoom-in" : "default" }}
      onClick={expandable ? () => setLightbox(src) : undefined}>
      <img src={src} alt={alt} loading="lazy"
        style={{ width: "100%", height: "auto", display: "block" }} />
      {expandable && (
        <figcaption className="px-3 py-1.5 font-mono text-[9px] flex items-center gap-1"
          style={{ color: "var(--muted-foreground)", opacity: 0.5, borderTop: "1px solid var(--border)" }}>
          <span>⊕</span> click to expand
        </figcaption>
      )}
    </figure>
  );

  return (
    <>
      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(8px)" }}
          onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="expanded"
            style={{ maxWidth: "92vw", maxHeight: "90vh", width: "auto", height: "auto",
              borderRadius: 8, border: "1px solid var(--border)" }} />
          <button className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full"
            style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}
            onClick={() => setLightbox(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={pageMode ? "w-full flex items-start justify-center" : "fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto"}
        style={pageMode ? {} : { background: dark ? "rgba(10,9,8,0.9)" : "rgba(40,36,32,0.6)", backdropFilter: "blur(10px)" }}
        onClick={pageMode ? undefined : onClose}>

        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className={pageMode && isMobile ? "relative w-full overflow-hidden flex flex-col" : "relative w-full max-w-3xl mx-4 my-10 rounded-xl overflow-hidden flex flex-col"}
          style={pageMode && isMobile ? {} : { background: shell, border: "1px solid var(--border)", boxShadow: dark ? "0 24px 80px rgba(0,0,0,0.75), inset 0 1px 0 rgba(237,233,227,0.06)" : "0 24px 80px rgba(26,24,22,0.13), inset 0 1px 0 rgba(255,255,255,1)" }}
          onClick={e => e.stopPropagation()}>

          {/* ── Node header bar ── */}
          <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
            style={{ background: "var(--node-header)", borderBottom: "1px solid var(--border)" }}>
            {pageMode ? (
              <div className="flex items-center gap-2 min-w-0">
                <button onClick={onClose}
                  className="flex items-center gap-1.5 font-mono text-[9px] transition-opacity hover:opacity-60 flex-shrink-0"
                  style={{ color: "var(--muted-foreground)", background: "none", border: "none", cursor: "pointer" }}>
                  <ArrowLeft size={11} />
                  <span className="hidden sm:inline">back</span>
                </button>
                <span className="font-mono text-[9px]" style={{ color: "var(--border)", opacity: 0.6, flexShrink: 0 }}>|</span>
                <span style={{ color: "var(--primary)", flexShrink: 0 }}>▤</span>
                <span className="font-mono text-[9px] tracking-[0.2em] uppercase truncate"
                  style={{ color: "var(--primary)", fontWeight: 500 }}>project · case study</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span style={{ color: "var(--primary)" }}>▤</span>
                <span className="font-mono text-[9px] tracking-[0.2em] uppercase"
                  style={{ color: "var(--primary)", fontWeight: 500 }}>project · case study</span>
                <span className="font-mono text-[9px]"
                  style={{ color: "var(--muted-foreground)", opacity: 0.38 }}>prj_genai_traces</span>
              </div>
            )}
            <div className="flex items-center gap-2 flex-shrink-0">
              {pageMode ? (
                <span className="font-mono text-[9px] flex-shrink-0"
                  style={{ color: "var(--muted-foreground)", opacity: 0.38 }}>prj_genai_traces</span>
              ) : (
                <button onClick={onClose}
                  className="flex items-center justify-center w-6 h-6 rounded transition-opacity hover:opacity-60"
                  style={{ color: "var(--muted-foreground)" }}>
                  <X size={13} />
                </button>
              )}
              <ReadTime minutes={8} className="hidden sm:inline" />
            </div>
          </div>

          {/* ── Scrollable body ── */}
          <div className={pageMode ? undefined : "overflow-y-auto flex-1"}>

            {/* HERO */}
            <div className="w-full overflow-hidden" style={{ background: "#050D1A" }}>
              <img src="/images/genai-traces/Hero.png" alt="Gen AI Traces & Failures"
                style={{ width: "100%", height: "auto", display: "block" }} />
            </div>

            <div className="p-6" style={{ display: "flex", flexDirection: "column", gap: 32 }}>

              {/* ─── TIER 1 — always visible ───────────────────────────────── */}

              {/* TITLE */}
              <div>
                <p className="font-mono text-[9px] tracking-[0.2em] uppercase mb-2"
                  style={{ color: "var(--primary)" }}>Instana GenAI Observability · UX Designer</p>
                <h2 className="font-serif leading-tight mb-1"
                  style={{ fontSize: "clamp(1.4rem,3.5vw,2.2rem)", color: "var(--foreground)", lineHeight: 1.15 }}>
                  Gen AI Traces &amp; Failures
                </h2>
                <p className="font-mono text-[11px] mb-4" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>
                  2026 · UX Designer — IBM Instana, Kochi
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {["GenAI", "LLM", "Enterprise Design"].map(t => (
                    <span key={t} className="font-mono text-[10px] px-2 py-0.5 rounded"
                      style={{ background: "var(--muted)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}>{t}</span>
                  ))}
                </div>
                <div className="mt-2 sm:hidden">
                  <ReadTime minutes={8} />
                </div>
              </div>

              {/* OPENING SCENE */}
              <div>
                <SL label="the scene" />
                <div className="space-y-4">
                  {[
                    "3:47 AM. An agent finishes a task. The response looks fine. No error, no timeout, nothing red on the dashboard. And yet — the run took four times as long as it should have, and burned through a small fortune in tokens getting there.",
                    "Nobody notices. Nothing broke. That's the problem.",
                  ].map((para, i) => (
                    <p key={i} className={`font-sans text-sm leading-relaxed${i === 1 ? " font-semibold" : ""}`}
                      style={{ color: i === 1 ? "var(--foreground)" : "var(--muted-foreground)" }}>
                      {para}
                    </p>
                  ))}
                </div>
              </div>

              {/* WHY AI WORKLOADS NEEDED A ROOM OF THEIR OWN */}
              <div>
                <SL label="why ai workloads needed a room of their own" />
                <p className="font-sans text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                  AI workloads don&rsquo;t fit cleanly into classic APM. Tokens, prompts, model versions, reasoning steps, tool calls — none of it maps to the tables and timelines built for services calling services. The market had already decided this deserved its own space: Datadog carved out a distinct LLM Observability experience, Dynatrace calls it full-stack AI observability, New Relic pitches it as &lsquo;APM for AI.&rsquo; The only real question left was what to put in that space, and in what order.
                </p>
              </div>

              {/* THE FAILURE THAT DOESN'T LOOK LIKE ONE */}
              <div>
                <SL label="the failure that doesn't look like one" />
                <div className="space-y-3">
                  <p className="font-sans text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                    Most observability is built to catch something breaking. Agentic systems introduce a stranger problem: something can succeed, and still be wrong. An agent can loop through the same reasoning step five times before landing on an answer it could have reached on the first try — and every conventional signal, error rate, uptime, response status, stays green the entire time. The cost shows up eventually. The cause never announces itself.
                  </p>
                  <p className="font-sans text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                    That gap is what this work is about — not tracing what happened after something broke, but surfacing what&rsquo;s quietly going wrong while everything still looks fine.
                  </p>
                </div>
              </div>

              {/* THE TWO CAPABILITIES */}
              <div>
                <SL label="the two capabilities" />
                <div className="space-y-2">
                  {[
                    { name: "Task Hierarchy View", desc: "What the system saw and produced, step by step — including automatic detection of unproductive cycles hiding inside otherwise-healthy-looking steps" },
                    { name: "Trajectory",           desc: "The full reasoning path, start to finish, for the moments when knowing what looped isn't enough — you need to know why" },
                  ].map(({ name, desc }) => (
                    <div key={name} className="flex items-start gap-3 p-3 rounded-lg"
                      style={{ background: "var(--node-header)", border: "1px solid var(--border)" }}>
                      <span className="font-mono text-[9px] flex-shrink-0 mt-0.5" style={{ color: "var(--primary)" }}>—</span>
                      <div>
                        <p className="font-sans text-sm font-semibold" style={{ color: "var(--foreground)" }}>{name}</p>
                        <p className="font-sans text-xs leading-snug mt-0.5" style={{ color: "var(--muted-foreground)" }}>{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* WHO THIS IS FOR */}
              <div>
                <SL label="who this is for" />
                <div className="space-y-3">
                  {[
                    { role: "SRE", color: "#22C55E",
                      goal: "Catch a cost or reliability problem while it's still small enough to be a footnote, not an incident. Every classic health signal can look completely fine while an agent is quietly burning tokens in a loop — the job is noticing the shape of that before it shows up on a bill or a postmortem.",
                      frustration: "Nothing paged me. Nothing's technically broken. I only noticed because two charts moved together in a way that felt off — and if I hadn't been looking at that exact window, I wouldn't have caught it at all." },
                    { role: "AI Engineer", color: "#3B82F6",
                      goal: "Turn 'this step repeated five times' into 'here's why it repeated' — find the actual reasoning failure underneath a flagged cycle, not just confirm that one exists.",
                      frustration: "A cycle flag tells me something's wrong. It doesn't tell me what the model was thinking when it went wrong — and that's the only thing that actually tells me how to fix it." },
                  ].map(({ role, color, goal, frustration }) => (
                    <div key={role} className="p-3 rounded-lg"
                      style={{ background: "var(--node-header)", border: `1px solid ${color}44` }}>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded inline-block mb-2"
                        style={{ background: `${color}18`, color, border: `1px solid ${color}44` }}>{role}</span>
                      <p className="font-sans text-xs leading-snug mb-2" style={{ color: "var(--muted-foreground)" }}><span style={{ color: "var(--foreground)", fontWeight: 600 }}>Goal: </span>{goal}</p>
                      <p className="font-sans text-xs leading-snug italic" style={{ color: "var(--muted-foreground)" }}>&ldquo;{frustration}&rdquo;</p>
                    </div>
                  ))}
                </div>
                <p className="font-sans text-xs mt-2" style={{ color: "var(--muted-foreground)", opacity: 0.55 }}>
                  Full personas and how each of them actually moves through an investigation are in the gated section.
                </p>
              </div>

              {/* SUMMARY */}
              <div className="p-4 rounded-lg" style={{ background: "var(--node-header)", border: "1px solid var(--border)" }}>
                <p className="font-sans text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                  A &lsquo;successful&rsquo; AI response can still hide a system that reasoned badly, looped expensively, or picked the wrong tool on the way to the right answer. This one&rsquo;s also still in motion — phase 1 of an ongoing project, grounded in IBM Research&rsquo;s work on multi-agent failure detection, not a closed case study. What&rsquo;s behind the gate includes how it got here, not just what shipped: the research it came from, the scoping tradeoffs, and a real walkthrough of the investigation this was built to shorten.
                </p>
              </div>

              {/* ─── PASSWORD GATE ───────────────────────────────────────────── */}
              {!unlocked ? (
                <div className="rounded-lg overflow-hidden"
                  style={{ border: "1px solid var(--border)" }}>
                  <div className="px-4 py-3"
                    style={{ background: "var(--node-header)", borderBottom: "1px solid var(--border)" }}>
                    <p className="font-mono text-[10px] uppercase tracking-widest"
                      style={{ color: "var(--primary)" }}>// full case study</p>
                  </div>
                  <div className="p-5">
                    <p className="font-sans text-sm leading-relaxed font-semibold mb-2"
                      style={{ color: "var(--foreground)" }}>
                      Enter password to view the full case study.
                    </p>
                    <p className="font-sans text-xs leading-relaxed mb-4"
                      style={{ color: "var(--muted-foreground)", opacity: 0.6 }}>
                      This is real work from an internal IBM project — worth sharing, but too detailed to publish openly. If you&rsquo;re a hiring manager or collaborator who wants the full process, reach out via{" "}
                      <a href="mailto:ux.sayan@gmail.com" className="underline underline-offset-2 transition-opacity hover:opacity-80" style={{ color: "var(--primary)" }}>email</a>
                      {" "}or{" "}
                      <a href="https://linkedin.com/in/sayanoriginals" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 transition-opacity hover:opacity-80" style={{ color: "var(--primary)" }}>LinkedIn</a>
                      {" "}and I&rsquo;ll send the password.
                    </p>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                      <input
                        type="password"
                        value={guess}
                        onChange={e => setGuess(e.target.value)}
                        placeholder="Password"
                        autoComplete="off"
                        className="w-full px-3 py-2 rounded font-mono text-sm"
                        style={{
                          background: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                          border: `1px solid ${error ? "#EF4444" : "var(--border)"}`,
                          color: "var(--foreground)",
                          outline: "none",
                        }}
                      />
                      {error && (
                        <p className="font-mono text-[10px]" style={{ color: "#EF4444" }}>{error}</p>
                      )}
                      <button
                        type="submit"
                        disabled={checking || !guess}
                        className="w-full flex items-center justify-center gap-1.5 font-mono text-sm py-2 rounded transition-opacity hover:opacity-80 disabled:opacity-40"
                        style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                        {checking ? "Checking…" : <><Unlock size={13} /> unlock</>}
                      </button>
                    </form>
                  </div>
                </div>
              ) : (

                /* ─── TIER 2 — unlocked ──────────────────────────────────── */
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                  style={{ display: "flex", flexDirection: "column", gap: 32, width: "100%", minWidth: 0 }}>

                  {/* HOW THIS GOT HERE — amber-bordered container with accordion */}
                  <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #F59E0B66" }}>
                    {/* container header */}
                    <div className="px-4 py-3 flex items-center justify-between"
                      style={{ background: "#F59E0B12", borderBottom: `1px solid #F59E0B44` }}>
                      <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "#F59E0B" }}>// how this got here</p>
                    </div>
                    <div className="p-4">
                      {/* always-visible summary */}
                      <p className="font-sans text-sm leading-relaxed mb-3" style={{ color: "var(--muted-foreground)" }}>
                        This started with Task Hierarchy View, then grew from IBM Research&rsquo;s work on multi-agent failure patterns — including cycles that never throw an error but quietly waste time and money. Their detection algorithm was scoped down to what could realistically ship first, shaped by recurring roadmap sessions with the PM and ongoing feedback from real users. This is phase 1 of an ongoing project — the full picture, including the research and the scoping tradeoffs, is below.
                      </p>
                      {/* accordion trigger */}
                      <button
                        onClick={() => setProcessExpanded(v => !v)}
                        className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest mb-3 transition-opacity hover:opacity-70"
                        style={{ color: "#F59E0B", background: "none", border: "none", padding: 0, cursor: "pointer" }}>
                        <svg
                          width="12" height="12" viewBox="0 0 12 12" fill="none"
                          style={{ transition: "transform 0.25s", transform: processExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>
                          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {processExpanded ? "Show less" : "Read the full story"}
                      </button>
                      {/* expandable body */}
                      <div
                        style={{
                          overflow: "hidden",
                          maxHeight: processExpanded ? 1200 : 0,
                          transition: "max-height 0.4s cubic-bezier(0.25,0.1,0.25,1)",
                        }}>
                        <div className="space-y-4 pb-1">
                          {[
                            "This started with Task Hierarchy View — designed first for what it's good at: showing a trace as something legible, a tree instead of a wall of spans.",
                            "What came next wasn't a feature request. It was a stack of research. IBM Research had been studying multi-agent systems, their traces, and their failures — including a category they called silent failures, where a result comes back looking fine, but not the way it was actually meant to. Going through that research, alongside the PM and the developers who'd eventually build it, surfaced a specific one worth chasing first: unproductive cycles — an agent re-planning, re-invoking a tool, or re-generating similar output without making real progress, invisible to every conventional health signal because nothing actually threw an error.",
                            "IBM Research had already built a detection algorithm for this — robust, thorough, built for the general case. Handed to Instana's development team, it was clearly more than could ship in one release. So the first real design decision wasn't about the UI at all — it was about scope: what version of this algorithm could realistically ship soonest, and what would the next version build on top of.",
                            "That scoping didn't happen in isolation. It happened in recurring 'X-in-a-box' sessions with the PM, reasoning quarter by quarter about what actually needed to ship next, weighed against a roadmap that was already fairly directive about where this needed to go. Strategic direction from the PM didn't mean skipping users, though — cadences with real users ran alongside it, and what came back fed into the same MVPs being shaped by business need and development feasibility. Design's job was making sure all three of those pulled in the same direction instead of past each other.",
                            "This is phase 1. The algorithm's fuller capability is still ahead of what's shipped, the roadmap is still being reasoned quarter to quarter, and the shape of this could still shift. What follows is what phase 1 actually looks like in use.",
                          ].map((para, i) => (
                            <p key={i} className="font-sans text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{para}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PERSONAS */}
                  <div>
                    <SL label="who's in this story" />
                    <div className="space-y-4">
                      {/* PERSONA 1 — SRE */}
                      {(() => {
                        const color = "#22C55E";
                        return (
                          <div className="p-4 rounded-lg" style={{ background: "var(--node-header)", border: `1px solid ${color}55` }}>
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-serif text-base"
                                style={{ background: color, color: "#fff" }}>S</div>
                              <div>
                                <p className="font-sans text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>SRE</p>
                                <p className="font-mono text-[11px]" style={{ color }}>Observability Team</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                              <div>
                                <p className="font-mono text-[9px] uppercase tracking-widest mb-1" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>watches</p>
                                <p className="font-sans text-xs leading-snug" style={{ color: "var(--muted-foreground)" }}>Cost trends, latency trends, error rate, and now — unproductive cycle flags — across every Gen AI service in production.</p>
                              </div>
                              <div>
                                <p className="font-mono text-[9px] uppercase tracking-widest mb-1" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>goal</p>
                                <p className="font-sans text-xs leading-snug" style={{ color: "var(--muted-foreground)" }}>Catch a cost or reliability problem while it&rsquo;s still small enough to be a footnote, not an incident. Every classic health signal can look completely fine while an agent is quietly burning tokens in a loop — the job is noticing the shape of that before it shows up on a bill or a postmortem.</p>
                              </div>
                            </div>
                            <div className="mb-3">
                              <p className="font-mono text-[9px] uppercase tracking-widest mb-1" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>uses across this area</p>
                              {[
                                "Scans the Summary view for cost/token trends that move together without a matching error spike",
                                "Selects a spike directly on the chart to jump into the traces that ran in that window",
                                "Filters the trace list by 'Unproductive cycles' instead of reading a hundred traces by hand",
                                "Reads the Task Hierarchy tree's yellow/red icons and the Failures panel to get iteration count, token cost, and duration without reconstructing it manually",
                              ].map((u, i) => (
                                <div key={i} className="flex gap-1.5 mb-0.5">
                                  <span className="font-mono text-[9px] flex-shrink-0 mt-0.5" style={{ color }}>·</span>
                                  <p className="font-sans text-[11px] leading-snug" style={{ color: "var(--muted-foreground)" }}>{u}</p>
                                </div>
                              ))}
                            </div>
                            <div className="p-2 rounded mb-2" style={{ background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", border: `1px solid ${color}33` }}>
                              <p className="font-mono text-[9px] mb-1" style={{ color, opacity: 0.7 }}>frustration</p>
                              <p className="font-sans text-xs italic" style={{ color: "var(--muted-foreground)" }}>&ldquo;Nothing paged me. Nothing&rsquo;s technically broken. I only noticed because two charts moved together in a way that felt off — and if I hadn&rsquo;t been looking at that exact window, I wouldn&rsquo;t have caught it at all.&rdquo;</p>
                            </div>
                            <div className="p-2.5 rounded" style={{ background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: `1px solid ${color}44` }}>
                              <p className="font-serif italic text-xs leading-snug" style={{ color: "var(--foreground)" }}>&ldquo;I don&rsquo;t need a trace after the fact — I need to catch it while it&rsquo;s still cheap to fix.&rdquo;</p>
                            </div>
                          </div>
                        );
                      })()}
                      {/* PERSONA 2 — AI Engineer */}
                      {(() => {
                        const color = "#3B82F6";
                        return (
                          <div className="p-4 rounded-lg" style={{ background: "var(--node-header)", border: `1px solid ${color}55` }}>
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-serif text-base"
                                style={{ background: color, color: "#fff" }}>A</div>
                              <div>
                                <p className="font-sans text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>AI Engineer</p>
                                <p className="font-mono text-[11px]" style={{ color }}>Often handed off from the SRE</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                              <div>
                                <p className="font-mono text-[9px] uppercase tracking-widest mb-1" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>watches</p>
                                <p className="font-sans text-xs leading-snug" style={{ color: "var(--muted-foreground)" }}>What a model actually decided at each step — tool choice, reasoning, what it believed a previous response meant.</p>
                              </div>
                              <div>
                                <p className="font-mono text-[9px] uppercase tracking-widest mb-1" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>goal</p>
                                <p className="font-sans text-xs leading-snug" style={{ color: "var(--muted-foreground)" }}>Turn &ldquo;this step repeated five times&rdquo; into &ldquo;here&rsquo;s why it repeated&rdquo; — find the actual reasoning failure underneath a flagged cycle, not just confirm that one exists.</p>
                              </div>
                            </div>
                            <div className="mb-3">
                              <p className="font-mono text-[9px] uppercase tracking-widest mb-1" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>uses across this area</p>
                              {[
                                "Picks up a trace already flagged by an SRE, or investigates one directly",
                                "Opens Trajectory to see the full reasoning path as an actual conversation, not a timeline",
                                "Reads the specific tool call/response pair that triggered the repetition",
                                "Hands a specific, fixable cause back — a tool response format, a prompt gap — instead of a vague 'it looped'",
                              ].map((u, i) => (
                                <div key={i} className="flex gap-1.5 mb-0.5">
                                  <span className="font-mono text-[9px] flex-shrink-0 mt-0.5" style={{ color }}>·</span>
                                  <p className="font-sans text-[11px] leading-snug" style={{ color: "var(--muted-foreground)" }}>{u}</p>
                                </div>
                              ))}
                            </div>
                            <div className="p-2 rounded mb-2" style={{ background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", border: `1px solid ${color}33` }}>
                              <p className="font-mono text-[9px] mb-1" style={{ color, opacity: 0.7 }}>frustration</p>
                              <p className="font-sans text-xs italic" style={{ color: "var(--muted-foreground)" }}>&ldquo;A cycle flag tells me something&rsquo;s wrong. It doesn&rsquo;t tell me what the model was thinking when it went wrong — and that&rsquo;s the only thing that actually tells me how to fix it.&rdquo;</p>
                            </div>
                            <div className="p-2.5 rounded" style={{ background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: `1px solid ${color}44` }}>
                              <p className="font-serif italic text-xs leading-snug" style={{ color: "var(--foreground)" }}>&ldquo;Show me the exchange that made it loop, not just the fact that it did.&rdquo;</p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* SCENE 1 — The spike nobody alerted on */}
                  <div>
                    <SL label="scene 1 — the spike nobody alerted on" />
                    <div className="space-y-4">
                      {[
                        "An SRE on the observability team is scanning the Gen AI observability summary — token usage, cost, both trending up in the same window. Nothing paged them. No error rate spike, no red badge anywhere. Just two charts moving together in a way that's a little too coordinated to be nothing.",
                        "They select the spike directly on the chart — the same motion as narrowing in on any other metric — and Instana takes them straight to the traces that ran in that window.",
                      ].map((para, i) => (
                        <p key={i} className="font-sans text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{para}</p>
                      ))}
                    </div>
                    <div className="mt-4">
                      <Img src="/images/genai-traces/Scene 1.png" alt="Scene 1 — Summary tab showing token usage spike and cost trending up in the same window" expandable />
                    </div>
                  </div>

                  {/* SCENE 2 — Filtering down to what actually failed */}
                  <div>
                    <SL label="scene 2 — filtering down to what actually failed" />
                    <div className="space-y-4">
                      {[
                        "A hundred traces ran in that window. Opening the filter panel and checking 'Unproductive cycles' narrows it immediately — most traces are clean, a handful are flagged. That's the short list worth opening.",
                        "This isn't the only path in, either. The same investigation could start from a completely ordinary trace view — the kind used for any traditional transaction — and from there widen out into the Gen AI application, its services, and even the infrastructure underneath, checking whether the same symptoms show up as resource pressure or a service-level metric worth correlating. Cycle detection is one entry point into root cause, not a replacement for the rest of the investigation — it just means nobody has to notice the pattern by eye first.",
                      ].map((para, i) => (
                        <p key={i} className="font-sans text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{para}</p>
                      ))}
                    </div>
                    <div className="mt-4">
                      <Img src="/images/genai-traces/Scene 2.png" alt="Scene 2 — Traces list with filter panel open, Unproductive cycles checked under Failure type" expandable />
                    </div>
                  </div>

                  {/* SCENE 3 — Opening the trace */}
                  <div>
                    <SL label="scene 3 — opening the trace" />
                    <div className="space-y-4">
                      {[
                        "One trace, opened. The task hierarchy unfolds three levels deep by default — enough to see the shape of the run without a hundred manual clicks first.",
                        "Two things mark trouble before a single number is read. A yellow warning icon sits on the exact task rows that belong to a cycle — two Synthesizer calls here, three presenter calls there — so the repeating group is visible in the tree itself, not buried in a report. A red icon sits one level up, on the parent node, showing which layer of the hierarchy that cycling actually lives under. Between the two, the tree alone answers 'is something wrong' and 'roughly where' before anyone opens a panel.",
                        "The right panel confirms the rest. A Failures tab, populated automatically, names exactly which agent cycled, how many iterations it ran, how many tokens that cost — in both count and percentage of the whole trace — and how long it took. No manual counting, no reconstructing it from raw spans.",
                      ].map((para, i) => (
                        <p key={i} className="font-sans text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{para}</p>
                      ))}
                    </div>
                    <div className="mt-4">
                      <Img src="/images/genai-traces/Scene 3.png" alt="Scene 3 — Trace detail with task hierarchy tree, yellow and red icons marking cycles, Failures panel showing iteration count, token cost, and duration" expandable />
                    </div>
                  </div>

                  {/* SCENE 4 — Following it down to the reasoning */}
                  <div>
                    <SL label="scene 4 — following it down to the reasoning" />
                    <div className="space-y-4">
                      {[
                        "The tree says what looped and roughly where. The Failures panel says what it cost. Neither says why — an agent doesn't loop for no reason. Somewhere underneath it, an LLM call is making a decision, over and over, that keeps landing back in the same place.",
                        "So the investigation moves to Trajectory — the conversational view of the same trace, sitting one tab over from the tree. This is where the actual exchange is visible: what the model was told, what it seemed to conclude from that, what it asked for next. If the agent that cycled has LLM calls nested inside it, this is where those calls, and their reasoning, actually live.",
                      ].map((para, i) => (
                        <p key={i} className="font-sans text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{para}</p>
                      ))}
                    </div>
                    <div className="mt-4">
                      <Img src="/images/genai-traces/Scene.png" alt="Scene 4 — Trajectory view showing the full conversational reasoning path for the cycling trace" expandable />
                    </div>
                  </div>

                  {/* SCENE 5 — Back to where it started, now with an answer */}
                  <div>
                    <SL label="scene 5 — back to where it started, now with an answer" />
                    <div className="space-y-4">
                      {[
                        "With the actual cause identified at the reasoning level, the investigation comes back to Task Hierarchy View's Failures panel — the same screen that first flagged the cost, now read with the full picture. What looked like an unexplained spike is now a specific, fixable thing: a tool response format that needs clarifying, a prompt that needs to handle ambiguity better, whichever it turns out to be.",
                        "The fix itself is usually the boring part. What mattered was not having to choose between 'read every trace by hand' and 'wait for the bill to explain itself' — the spike pointed to the traces, the traces pointed to the step, and the step pointed to the reasoning. Cost and time, saved by not guessing.",
                      ].map((para, i) => (
                        <p key={i} className="font-sans text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{para}</p>
                      ))}
                    </div>
                  </div>

                  {/* JOURNEY MAPS */}
                  <div>
                    <SL label="how each of them moved through it" />
                    {/* SRE Journey Map */}
                    <p className="font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: "#22C55E" }}>journey map — sre</p>
                    {(() => {
                      const color = "#22C55E";
                      const steps = [
                        { n: "01", label: "Notice the coincidence",    doing: "Scans the Summary view; sees token usage and cost trending up together in the same window.",                                                                                                                    thinking: "\"Nothing alerted on this — is that because it's nothing, or because nothing's built to alert on this yet?\"",          feeling: "Mildly suspicious, not yet worried." },
                        { n: "02", label: "Narrow the window",         doing: "Selects the spike directly on the chart, jumps into the traces that ran during it.",                                                                                                                             thinking: "\"A hundred traces ran here — I am not reading all of them by hand.\"",                                                  feeling: "Focused, looking for the shortcut." },
                        { n: "03", label: "Filter to what matters",    doing: "Opens the trace filter, checks 'Unproductive cycles.'",                                                                                                                                                          thinking: "\"Good — now I have four traces instead of a hundred.\"",                                                               feeling: "Relief at having a short list." },
                        { n: "04", label: "Read the damage",           doing: "Opens a flagged trace, reads the tree's yellow/red icons and the Failures panel's iteration count, token cost, and duration.",                                                                                   thinking: "\"This is expensive enough to matter — worth handing to someone who can dig into why.\"",                               feeling: "Confident in the size of the problem, less confident in the cause." },
                        { n: "05", label: "Hand off or dig in",        doing: "Either flags the trace for an AI Engineer or continues into Trajectory themself.",                                                                                                                               thinking: "\"Do I have the context to read the reasoning here, or does this need a different kind of eye?\"",                      feeling: "Practical — knowing when to hand off is part of the job." },
                      ];
                      const cols = `repeat(${steps.length}, 1fr)`;
                      const minW = steps.length * 160;
                      return (
                        <div className="overflow-x-auto pb-2 -mx-2 px-2 mb-6">
                          <div style={{ minWidth: minW }}>
                            <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: cols }}>
                              {steps.map(s => (
                                <div key={s.n} className="px-2 py-1.5 rounded text-center"
                                  style={{ background: `${color}18`, border: `1px solid ${color}44` }}>
                                  <p className="font-mono text-[8px] uppercase tracking-widest" style={{ color, opacity: 0.7 }}>SRE</p>
                                  <p className="font-mono text-[8px]" style={{ color: "var(--muted-foreground)", opacity: 0.4 }}>{s.n}</p>
                                  <p className="font-sans text-[11px] font-semibold" style={{ color: "var(--foreground)" }}>{s.label}</p>
                                </div>
                              ))}
                            </div>
                            <p className="font-mono text-[9px] uppercase tracking-widest mb-1 px-1" style={{ color: "var(--muted-foreground)", opacity: 0.45 }}>// doing</p>
                            <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: cols }}>
                              {steps.map(s => (
                                <div key={s.n} className="p-2 rounded" style={{ background: "var(--node-header)", border: `1px solid ${color}33` }}>
                                  <p className="font-sans text-[9px] leading-snug" style={{ color: "var(--muted-foreground)" }}>{s.doing}</p>
                                </div>
                              ))}
                            </div>
                            <p className="font-mono text-[9px] uppercase tracking-widest mb-1 px-1" style={{ color: "var(--muted-foreground)", opacity: 0.45 }}>// thinking</p>
                            <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: cols }}>
                              {steps.map(s => (
                                <div key={s.n} className="p-2 rounded" style={{ background: `${color}10`, border: `1px solid ${color}33` }}>
                                  <p className="font-sans text-[9px] leading-snug italic" style={{ color: "var(--muted-foreground)" }}>{s.thinking}</p>
                                </div>
                              ))}
                            </div>
                            <p className="font-mono text-[9px] uppercase tracking-widest mb-1 px-1" style={{ color: "var(--muted-foreground)", opacity: 0.45 }}>// feeling</p>
                            <div className="grid gap-1" style={{ gridTemplateColumns: cols }}>
                              {steps.map(s => (
                                <div key={s.n} className="p-2 rounded" style={{ background: `${color}18`, border: `1px solid ${color}44` }}>
                                  <p className="font-sans text-[9px] leading-snug" style={{ color }}>{s.feeling}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                    {/* AI Engineer Journey Map */}
                    <p className="font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: "#3B82F6" }}>journey map — ai engineer</p>
                    {(() => {
                      const color = "#3B82F6";
                      const steps = [
                        { n: "01", label: "Receive the flagged trace",  doing: "Picks up a trace already flagged with an unproductive cycle, either handed off or found directly.",                                                                                                             thinking: "\"Something looped — but a flag alone doesn't tell me what to fix.\"",                                                  feeling: "Curious, oriented toward 'why' rather than 'what.'" },
                        { n: "02", label: "Confirm the shape",          doing: "Glances at the Task Hierarchy tree's yellow/red icons to see which agent cycled and where it sits in the nesting.",                                                                                             thinking: "\"Good — I know which part of the system to actually look at.\"",                                                       feeling: "Oriented, narrowing focus fast." },
                        { n: "03", label: "Move into the reasoning",    doing: "Opens Trajectory for the same trace to see the conversational, step-by-step exchange.",                                                                                                                         thinking: "\"What did the model actually see, and what did it think that meant?\"",                                                feeling: "Investigative — this is the part of the job that feels like detective work." },
                        { n: "04", label: "Find the actual trigger",    doing: "Reads the specific tool call and response that the model kept re-asking about.",                                                                                                                                 thinking: "\"There it is — an ambiguous response it didn't know how to interpret, so it just asked again.\"",                     feeling: "Satisfaction at the moment the pattern clicks." },
                        { n: "05", label: "Hand back a fixable answer", doing: "Returns to the Failures panel with the cause identified — a tool response format to clarify, a prompt gap to close.",                                                                                          thinking: "\"Now this is something someone can actually go fix, not just a number that looks bad.\"",                             feeling: "Resolution — the ambiguity has a name now." },
                      ];
                      const cols = `repeat(${steps.length}, 1fr)`;
                      const minW = steps.length * 160;
                      return (
                        <div className="overflow-x-auto pb-2 -mx-2 px-2">
                          <div style={{ minWidth: minW }}>
                            <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: cols }}>
                              {steps.map(s => (
                                <div key={s.n} className="px-2 py-1.5 rounded text-center"
                                  style={{ background: `${color}18`, border: `1px solid ${color}44` }}>
                                  <p className="font-mono text-[8px] uppercase tracking-widest" style={{ color, opacity: 0.7 }}>AI Engineer</p>
                                  <p className="font-mono text-[8px]" style={{ color: "var(--muted-foreground)", opacity: 0.4 }}>{s.n}</p>
                                  <p className="font-sans text-[11px] font-semibold" style={{ color: "var(--foreground)" }}>{s.label}</p>
                                </div>
                              ))}
                            </div>
                            <p className="font-mono text-[9px] uppercase tracking-widest mb-1 px-1" style={{ color: "var(--muted-foreground)", opacity: 0.45 }}>// doing</p>
                            <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: cols }}>
                              {steps.map(s => (
                                <div key={s.n} className="p-2 rounded" style={{ background: "var(--node-header)", border: `1px solid ${color}33` }}>
                                  <p className="font-sans text-[9px] leading-snug" style={{ color: "var(--muted-foreground)" }}>{s.doing}</p>
                                </div>
                              ))}
                            </div>
                            <p className="font-mono text-[9px] uppercase tracking-widest mb-1 px-1" style={{ color: "var(--muted-foreground)", opacity: 0.45 }}>// thinking</p>
                            <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: cols }}>
                              {steps.map(s => (
                                <div key={s.n} className="p-2 rounded" style={{ background: `${color}10`, border: `1px solid ${color}33` }}>
                                  <p className="font-sans text-[9px] leading-snug italic" style={{ color: "var(--muted-foreground)" }}>{s.thinking}</p>
                                </div>
                              ))}
                            </div>
                            <p className="font-mono text-[9px] uppercase tracking-widest mb-1 px-1" style={{ color: "var(--muted-foreground)", opacity: 0.45 }}>// feeling</p>
                            <div className="grid gap-1" style={{ gridTemplateColumns: cols }}>
                              {steps.map(s => (
                                <div key={s.n} className="p-2 rounded" style={{ background: `${color}18`, border: `1px solid ${color}44` }}>
                                  <p className="font-sans text-[9px] leading-snug" style={{ color }}>{s.feeling}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* QA — Validating Task Hierarchy View */}
                  <div>
                    <SL label="qa — validating task hierarchy view" />
                    <div className="space-y-3 mb-4">
                      <p className="font-sans text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                        Before anything ships, the question is whether the view actually works — whether a real trace renders correctly, the hierarchy collapses and expands as expected, cycle icons appear on the right nodes, and the Failures panel populates from live data rather than mocked values.
                      </p>
                      <p className="font-sans text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                        This is a QA pass on Task Hierarchy View against a real agentic trace — checking that the tree structure, icon placement, and panel detail all reflect what the backend is actually reporting, not a placeholder state. The goal isn't edge-case coverage here; it's confirming the core read path holds under real data before it reaches a user.
                      </p>
                    </div>
                    <Img src="/images/genai-traces/image 16.png" alt="QA validation of Task Hierarchy View — real trace rendered in the tree, checking hierarchy structure, cycle icons, and Failures panel accuracy against live backend data" expandable />
                  </div>

                  {/* SCENE 6 — What's still time-ordered */}
                  <div>
                    <SL label="scene 6 — what's still time-ordered" />
                    <p className="font-sans text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                      Task Hierarchy View and Trajectory both answer sequence questions — what happened, in what order, and where it went wrong along the way. Neither answers a structural question: how many agents are actually running, who&rsquo;s calling whom, and whether the real call pattern still matches what was designed. As multi-agent systems become the default shape of production AI, that&rsquo;s the next question worth a view of its own.
                    </p>
                  </div>

                  {/* THE PATH, IN SHORT */}
                  <div className="p-4 rounded-lg" style={{ background: "var(--node-header)", border: "1px solid var(--border)" }}>
                    <p className="font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: "var(--primary)" }}>// the path, in short</p>
                    <p className="font-sans text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                      Spike on a chart &rarr; filtered down to the traces that actually cycled &rarr; opened one, saw the cost and iteration count without reconstructing it by hand &rarr; followed it into the reasoning to find out why it looped &rarr; came back with an answer instead of a guess.
                    </p>
                  </div>

                  {/* VALUE / SUMMARY */}
                  <div className="p-4 rounded-lg"
                    style={{ background: "var(--node-header)", border: "1px solid var(--primary)" }}>
                    <p className="font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: "var(--primary)" }}>// value</p>
                    <p className="font-sans text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                      Before this, a clean-looking response could still be hiding a system that reasoned badly, looped expensively, or picked the wrong tool on the way there — invisible to every classic signal. Task Hierarchy View and Trajectory turn that blind spot into a traceable story: what the system saw, whether it was actually making progress, and the exact moment it stopped, if it ever did.
                    </p>
                  </div>

                  {/* Lock */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
                        setUnlocked(false);
                      }}
                      className="flex items-center gap-1.5 font-mono text-[12px] px-2.5 py-1 rounded transition-opacity hover:opacity-60"
                      style={{ border: "1px solid var(--border)", color: "var(--muted-foreground)", background: "var(--node-header)" }}>
                      <Lock size={9} /> lock case study
                    </button>
                  </div>

                </motion.div>
              )}

              {/* Footer */}
              <div className="flex items-center gap-2 pt-3 overflow-hidden" style={{ borderTop: "1px solid var(--border)" }}>
                <button
                  onClick={() => onOpen("business-impact")}
                  className="flex items-center gap-2 flex-1 min-w-0 px-3 py-2 rounded-lg transition-opacity hover:opacity-80"
                  style={{ background: "var(--node-header)", border: "1px solid var(--border)", textAlign: "left" }}>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-widest mb-0.5" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>next →</p>
                    <p className="font-mono text-[11px] font-medium truncate" style={{ color: "var(--foreground)" }}>Business Impact</p>
                    <p className="font-mono text-[10px] truncate" style={{ color: "var(--muted-foreground)", opacity: 0.6 }}>IBM Instana RUM · Conversion Goals & Funnels</p>
                  </div>
                  <ChevronRight size={12} style={{ color: "var(--primary)", flexShrink: 0 }} />
                </button>
                <button
                  onClick={() => onOpen("instana-incident-remediation")}
                  className="hidden sm:flex items-center gap-2 flex-1 min-w-0 px-3 py-2 rounded-lg transition-opacity hover:opacity-80"
                  style={{ background: "var(--node-header)", border: "1px solid var(--border)", textAlign: "left" }}>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-widest mb-0.5" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>also →</p>
                    <p className="font-mono text-[11px] font-medium truncate" style={{ color: "var(--foreground)" }}>Instana Incident Remediation</p>
                    <p className="font-mono text-[10px] truncate" style={{ color: "var(--muted-foreground)", opacity: 0.6 }}>Agentic AI · iF Design Award 2025</p>
                  </div>
                  <ChevronRight size={12} style={{ color: "var(--primary)", flexShrink: 0 }} />
                </button>
                <button onClick={onClose}
                  className="flex items-center justify-center rounded-lg transition-opacity hover:opacity-70 w-9 flex-shrink-0"
                  style={{ border: "1px solid var(--border)", color: "var(--muted-foreground)", background: "var(--node-header)", alignSelf: "stretch" }}>
                  <X size={13} />
                </button>
              </div>

            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}

// ─── Project modal ────────────────────────────────────────────────────────────

export function ProjectModal({ project, onClose, onOpen, dark, pageMode }: {
  project: typeof projects[0];
  onClose: () => void;
  onOpen: (slug: string) => void;
  dark: boolean;
  pageMode?: boolean;
}) {
  if (project.slug === "genai-traces") return <GenAITracesModal onClose={onClose} onOpen={onOpen} dark={dark} pageMode={pageMode} />;
  if (project.slug === "tusk") return <TuskModal onClose={onClose} onOpen={onOpen} dark={dark} pageMode={pageMode} />;
  if (project.slug === "ibm-design-challenge") return <IbmModal onClose={onClose} onOpen={onOpen} dark={dark} pageMode={pageMode} />;
  if (project.slug === "ibm-connector-workflow") return <IBMConnectorModal onClose={onClose} onOpen={onOpen} dark={dark} pageMode={pageMode} />;
  if (project.slug === "instana-incident-remediation") return <InstanaModal onClose={onClose} onOpen={onOpen} dark={dark} pageMode={pageMode} />;
  if (project.slug === "business-impact") return <BusinessImpactModal onClose={onClose} onOpen={onOpen} dark={dark} pageMode={pageMode} />;

  useEffect(() => {
    if (pageMode) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, pageMode]);

  const isMobile = useIsMobile();

  // helper: render images that belong to a given section, at natural ratio
  const imgs = (section: string) => {
    const matches = project.processImages.filter(i => i.section === section);
    if (!matches.length) return null;
    return (
      <div className="space-y-3 mt-4">
        {matches.map((img, i) => (
          <figure key={i} className="overflow-hidden rounded-lg m-0"
            style={{ background: img.bg, border: "1px solid var(--border)" }}>
            <img
              src={img.src ?? `https://images.unsplash.com/photo-${img.id}?w=900&auto=format`}
              alt={img.caption}
              style={{ width: "100%", height: "auto", display: "block",
                mixBlendMode: img.src ? "normal" : "luminosity",
                opacity: img.src ? 1 : 0.7 }}
            />
            {img.caption && (
              <figcaption className="px-3 py-2 font-mono text-[9px]"
                style={{ color: "var(--muted-foreground)", opacity: 0.55 }}>
                {img.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    );
  };

  // fallback: images with no section or unknown section
  const untaggedImgs = project.processImages.filter(i => !i.section || i.section === "process");

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={pageMode ? "w-full flex items-start justify-center" : "fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto"}
      style={pageMode ? {} : { background: dark ? "rgba(10,9,8,0.88)" : "rgba(40,36,32,0.65)",
        backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
      onClick={pageMode ? undefined : onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className={pageMode && isMobile ? "relative w-full overflow-hidden flex flex-col" : "relative w-full max-w-3xl mx-4 my-10 overflow-hidden rounded-xl flex flex-col"}
        style={pageMode && isMobile ? {} : { background: dark ? "rgba(32,28,24,0.72)" : "#FAF8F4", backdropFilter: "blur(80px) saturate(1.9)", WebkitBackdropFilter: "blur(80px) saturate(1.9)", border: "1px solid var(--border)", boxShadow: dark ? "0 24px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(237,233,227,0.07)" : "0 24px 80px rgba(26,24,22,0.12), inset 0 1px 0 rgba(255,255,255,1)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Node-style header bar */}
        <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
          style={{ background: "var(--node-header)", borderBottom: "1px solid var(--border)" }}>
          {pageMode ? (
            <div className="flex items-center gap-2 min-w-0">
              <button onClick={onClose}
                className="flex items-center gap-1.5 font-mono text-[9px] transition-opacity hover:opacity-60 flex-shrink-0"
                style={{ color: "var(--muted-foreground)", background: "none", border: "none", cursor: "pointer" }}>
                <ArrowLeft size={11} />
                <span className="hidden sm:inline">back</span>
              </button>
              <span className="font-mono text-[9px]" style={{ color: "var(--border)", opacity: 0.6, flexShrink: 0 }}>|</span>
              <span style={{ color: "var(--primary)", flexShrink: 0 }}>▤</span>
              <span className="font-mono text-[9px] tracking-[0.2em] uppercase truncate"
                style={{ color: "var(--primary)", fontWeight: 500 }}>project · case study</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span style={{ color: "var(--primary)" }}>▤</span>
              <span className="font-mono text-[9px] tracking-[0.2em] uppercase"
                style={{ color: "var(--primary)", fontWeight: 500 }}>project · case study</span>
              <span className="font-mono text-[9px]"
                style={{ color: "var(--muted-foreground)", opacity: 0.38 }}>
                prj_{project.slug.replace(/-/g, "_")}
              </span>
            </div>
          )}
          {pageMode ? (
            <span className="font-mono text-[9px] flex-shrink-0"
              style={{ color: "var(--muted-foreground)", opacity: 0.38 }}>
              prj_{project.slug.replace(/-/g, "_")}
            </span>
          ) : (
            <button onClick={onClose}
              className="flex items-center justify-center w-6 h-6 rounded transition-opacity hover:opacity-60"
              style={{ color: "var(--muted-foreground)" }}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* Scrollable body */}
        <div className={pageMode ? undefined : "overflow-y-auto flex-1"}>

          {/* Hero image — natural ratio, no crop */}
          <div className="w-full overflow-hidden" style={{ background: project.imageBg }}>
            <img
              src={project.imageSrc ?? `https://images.unsplash.com/photo-${project.imageId}?w=1200&auto=format`}
              alt={project.title}
              style={{ width: "100%", height: "auto", display: "block",
                mixBlendMode: project.imageSrc ? "normal" : "luminosity",
                opacity: project.imageSrc ? 1 : (dark ? 0.55 : 0.65) }}
            />
          </div>

          <div className="p-6 space-y-8">

            {/* Title block */}
            <div>
              <p className="font-mono text-[9px] tracking-[0.2em] uppercase mb-2"
                style={{ color: "var(--primary)" }}>
                {project.number} — {project.tags.join(" · ")}
              </p>
              <h2 className="font-serif leading-tight mb-1"
                style={{ fontSize: "clamp(1.6rem,4vw,2.6rem)", color: "var(--foreground)", lineHeight: 1.1 }}>
                {project.title}
              </h2>
              <p className="font-serif italic text-base mb-4"
                style={{ color: "var(--muted-foreground)" }}>{project.subtitle}</p>
              <div className="flex flex-wrap gap-4 mb-4">
                {[{ label: "year", value: project.year }, { label: "role", value: project.role }]
                  .map(({ label, value }) => (
                    <div key={label}>
                      <p className="font-mono text-[9px] uppercase tracking-widest mb-0.5"
                        style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>{label}</p>
                      <p className="font-mono text-[11px]" style={{ color: "var(--foreground)" }}>{value}</p>
                    </div>
                  ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {project.tags.map(t => <Tag key={t} s={t} />)}
              </div>
            </div>

            {/* Overview + design process image */}
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest mb-2"
                style={{ color: "var(--primary)" }}>// overview</p>
              <div className="p-4 rounded-lg mb-0" style={{ background: "var(--node-header)", border: "1px solid var(--border)" }}>
                <p className="font-sans text-sm leading-relaxed"
                  style={{ color: "var(--muted-foreground)" }}>{project.summary}</p>
              </div>
              {imgs("overview")}
            </div>

            {/* Problem */}
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest mb-2"
                style={{ color: "var(--primary)" }}>// problem statement</p>
              <p className="font-sans text-sm leading-relaxed"
                style={{ color: "var(--muted-foreground)" }}>{project.problem}</p>
              {imgs("problem")}
            </div>

            {/* Research */}
            {imgs("research") && (
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest mb-2"
                  style={{ color: "var(--primary)" }}>// research</p>
                {imgs("research")}
              </div>
            )}

            {/* Personas */}
            {imgs("personas") && (
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest mb-2"
                  style={{ color: "var(--primary)" }}>// personas</p>
                {imgs("personas")}
              </div>
            )}

            {/* Journey map */}
            {imgs("journey") && (
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest mb-2"
                  style={{ color: "var(--primary)" }}>// user journey</p>
                {imgs("journey")}
              </div>
            )}

            {/* Contribution */}
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest mb-2"
                style={{ color: "var(--primary)" }}>// my contribution</p>
              <p className="font-sans text-sm leading-relaxed"
                style={{ color: "var(--muted-foreground)" }}>{project.contribution}</p>
            </div>

            {/* Information architecture */}
            {imgs("ia") && (
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest mb-2"
                  style={{ color: "var(--primary)" }}>// information architecture</p>
                {imgs("ia")}
              </div>
            )}

            {/* Ideation */}
            {imgs("ideation") && (
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest mb-2"
                  style={{ color: "var(--primary)" }}>// ideation</p>
                {imgs("ideation")}
              </div>
            )}

            {/* Onboarding */}
            {imgs("onboarding") && (
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest mb-2"
                  style={{ color: "var(--primary)" }}>// onboarding</p>
                {imgs("onboarding")}
              </div>
            )}

            {/* Key decisions */}
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest mb-3"
                style={{ color: "var(--primary)" }}>// key decisions — {project.decisions.length} nodes</p>
              <div className="space-y-2">
                {project.decisions.map((d, i) => (
                  <div key={i} className="p-4 rounded-lg"
                    style={{ background: dark ? "rgba(255,255,255,0.03)" : "rgba(26,24,22,0.03)",
                      border: "1px solid var(--border)" }}>
                    <p className="font-mono text-[9px] uppercase tracking-widest mb-1.5"
                      style={{ color: "var(--primary)", opacity: 0.8 }}>
                      decision_{String(i + 1).padStart(2, "0")}
                    </p>
                    <h4 className="font-sans text-sm font-semibold mb-1.5"
                      style={{ color: "var(--foreground)" }}>{d.heading}</h4>
                    <p className="font-sans text-sm leading-relaxed"
                      style={{ color: "var(--muted-foreground)" }}>{d.body}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Components */}
            {imgs("components") && (
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest mb-2"
                  style={{ color: "var(--primary)" }}>// components</p>
                {imgs("components")}
              </div>
            )}

            {/* Outcome */}
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest mb-2"
                style={{ color: "var(--primary)" }}>// outcome</p>
              <p className="font-sans text-sm leading-relaxed mb-4"
                style={{ color: "var(--muted-foreground)" }}>{project.outcome}</p>
              {project.outcomeImages.map((img, i) => (
                <figure key={i} className="overflow-hidden rounded-lg m-0"
                  style={{ background: img.bg, border: "1px solid var(--border)" }}>
                  <img
                    src={img.src ?? `https://images.unsplash.com/photo-${img.id}?w=900&auto=format`}
                    alt={img.caption}
                    style={{ width: "100%", height: "auto", display: "block",
                      mixBlendMode: img.src ? "normal" : "luminosity",
                      opacity: img.src ? 1 : 0.6 }}
                  />
                  {img.caption && (
                    <figcaption className="px-3 py-2 font-mono text-[9px]"
                      style={{ color: "var(--muted-foreground)", opacity: 0.55 }}>
                      {img.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>

            {/* Any untagged/fallback process images */}
            {untaggedImgs.length > 0 && (
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest mb-3"
                  style={{ color: "var(--primary)" }}>// process artefacts</p>
                <div className="space-y-3">
                  {untaggedImgs.map((img, i) => (
                    <figure key={i} className="overflow-hidden rounded-lg m-0"
                      style={{ background: img.bg, border: "1px solid var(--border)" }}>
                      <img
                        src={img.src ?? `https://images.unsplash.com/photo-${img.id}?w=900&auto=format`}
                        alt={img.caption}
                        style={{ width: "100%", height: "auto", display: "block",
                          mixBlendMode: img.src ? "normal" : "luminosity",
                          opacity: img.src ? 1 : 0.7 }}
                      />
                      {img.caption && (
                        <figcaption className="px-3 py-2 font-mono text-[9px]"
                          style={{ color: "var(--muted-foreground)", opacity: 0.55 }}>
                          {img.caption}
                        </figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              </div>
            )}

            {/* Footer — two project suggestions + close */}
            {(() => {
              const idx = projects.findIndex(p => p.slug === project.slug);
              const next = projects[(idx + 1) % projects.length];
              const also = projects[(idx + 2) % projects.length];
              return (
                <div className="flex items-center gap-2 pt-3 overflow-hidden" style={{ borderTop: "1px solid var(--border)" }}>
                  <button
                    onClick={() => onOpen(next.slug)}
                    className="flex items-center gap-2 flex-1 min-w-0 px-3 py-2 rounded-lg transition-opacity hover:opacity-80"
                    style={{ background: "var(--node-header)", border: "1px solid var(--border)", textAlign: "left" }}>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-[8px] uppercase tracking-widest mb-0.5" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>next →</p>
                      <p className="font-mono text-[11px] font-medium truncate" style={{ color: "var(--foreground)" }}>{next.title}</p>
                      <p className="font-mono text-[8px] truncate" style={{ color: "var(--muted-foreground)", opacity: 0.6 }}>{next.subtitle}</p>
                    </div>
                    <ChevronRight size={12} style={{ color: "var(--primary)", flexShrink: 0 }} />
                  </button>
                  <button
                    onClick={() => onOpen(also.slug)}
                    className="hidden sm:flex items-center gap-2 flex-1 min-w-0 px-3 py-2 rounded-lg transition-opacity hover:opacity-80"
                    style={{ background: "var(--node-header)", border: "1px solid var(--border)", textAlign: "left" }}>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-[8px] uppercase tracking-widest mb-0.5" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>also →</p>
                      <p className="font-mono text-[11px] font-medium truncate" style={{ color: "var(--foreground)" }}>{also.title}</p>
                      <p className="font-mono text-[8px] truncate" style={{ color: "var(--muted-foreground)", opacity: 0.6 }}>{also.subtitle}</p>
                    </div>
                    <ChevronRight size={12} style={{ color: "var(--primary)", flexShrink: 0 }} />
                  </button>
                  <button onClick={onClose}
                    className="flex items-center justify-center rounded-lg transition-opacity hover:opacity-70 w-9 flex-shrink-0"
                    style={{ border: "1px solid var(--border)", color: "var(--muted-foreground)", background: "var(--node-header)", alignSelf: "stretch" }}>
                    <X size={13} />
                  </button>
                </div>
              );
            })()}

          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── SVG canvas overlay ───────────────────────────────────────────────────────

function CanvasSVG({ dark }: { dark: boolean }) {
  return (
    <svg className="absolute inset-0 pointer-events-none" width={CW} height={CH}
      style={{ overflow: "visible" }}>
      <defs>
        <filter id="pglow" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="portglow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <style>{`
        @keyframes flow { from { stroke-dashoffset: 24; } to { stroke-dashoffset: 0; } }
        @keyframes drawPath { to { stroke-dashoffset: 0; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      {PATHS.map((p, i) => {
        const [startDelay, duration] = SEQ.conn[i];
        const [flowDur] = TIMING[i];
        return (
          <g key={i}>
            <path id={`cp${i}`} d={p.d} fill="none" stroke="var(--connector)"
              strokeWidth={1.5}
              style={{
                strokeDasharray: 2000,
                strokeDashoffset: 2000,
                animation: `drawPath ${duration}s cubic-bezier(0.4, 0, 0.2, 1) ${startDelay}s forwards`,
              }} />
            <path d={p.d} fill="none" stroke="var(--primary)" strokeWidth={1.5}
              strokeDasharray="5 20" opacity={0}
              style={{
                animation: `fadeIn 0.3s ${startDelay + duration}s forwards, flow ${(flowDur * 0.75).toFixed(2)}s linear ${startDelay + duration}s infinite`,
              }} />
          </g>
        );
      })}

      {PATHS.map((_, i) => {
        const [startDelay, duration] = SEQ.conn[i];
        const [flowDur] = TIMING[i];
        const dotBegin = startDelay + duration;
        return (
          <circle key={i} r={3.5} fill="var(--primary)" filter="url(#pglow)" opacity={0}
            style={{ animation: `fadeIn 0.01s ${dotBegin}s forwards` }}>
            <animateMotion dur={`${flowDur}s`} repeatCount="indefinite"
              begin={`${dotBegin}s`} calcMode="linear">
              <mpath href={`#cp${i}`} />
            </animateMotion>
          </circle>
        );
      })}

      {PORTS.map(([x, y, type], i) => {
        const connIdx = Math.floor(i / 2);
        const isOut = i % 2 === 0;
        const [connStart, connDur] = SEQ.conn[connIdx];
        const portDelay = isOut ? connStart : connStart + connDur;
        return (
          <g key={i} style={{ opacity: 0, animation: `fadeIn 0.3s ${portDelay}s forwards` }}>
            <circle cx={x} cy={y} r={3.5}
              fill={type === "out" ? "var(--primary)" : "var(--background)"}
              stroke="var(--connector)" strokeWidth={1.5}
              filter={type === "out" ? "url(#portglow)" : undefined} />
            {type === "out" && (
              <circle cx={x} cy={y} r={3.5} fill="none" stroke="var(--primary)"
                strokeWidth={1} opacity={0}>
                <animate attributeName="r" values="3.5;9;3.5" dur="2.4s"
                  repeatCount="indefinite" begin={`${portDelay}s`} />
                <animate attributeName="opacity" values="0.6;0;0.6" dur="2.4s"
                  repeatCount="indefinite" begin={`${portDelay}s`} />
              </circle>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Desktop canvas ───────────────────────────────────────────────────────────

const SCALE = 1.1;
const ARROW_STEP = 80;

function DesktopCanvas({ dark, onOpen, onOpenResume }: { dark: boolean; onOpen: (p: typeof projects[0]) => void; onOpenResume: () => void }) {
  const visible = projects.slice(0, SHOW);

  // ── Pan state ──────────────────────────────────────────────────────────────
  const [offset, setOffset] = useState(() => {
    if (typeof window === "undefined") return { x: 0, y: 0 };
    const x = Math.max(0, (window.innerWidth - CW * SCALE) / 2);
    const y = 40;
    return { x, y };
  });
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  const pan = useCallback((dx: number, dy: number) => {
    const STEPS = 12;
    const interval = 16; // ~60fps
    let step = 0;
    const id = setInterval(() => {
      step++;
      const ease = 1 - Math.pow(1 - step / STEPS, 3); // cubic ease-out
      const prevEase = 1 - Math.pow(1 - (step - 1) / STEPS, 3);
      const delta = ease - prevEase;
      setOffset(o => ({ x: o.x + dx * delta, y: o.y + dy * delta }));
      if (step >= STEPS) clearInterval(id);
    }, interval);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("a, button, input, textarea")) return;
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    setOffset(o => ({ x: o.x + dx, y: o.y + dy }));
  }, []);

  const onPointerUp = useCallback(() => { dragging.current = false; }, []);

  // Keyboard arrow panning
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea, [contenteditable]")) return;
      const dirs: Record<string, [number, number]> = {
        ArrowUp:    [0,  ARROW_STEP],
        ArrowDown:  [0, -ARROW_STEP],
        ArrowLeft:  [ ARROW_STEP, 0],
        ArrowRight: [-ARROW_STEP, 0],
      };
      if (dirs[e.key]) {
        e.preventDefault();
        const [dx, dy] = dirs[e.key];
        pan(dx, dy);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pan]);

  return (
    <div
      className="relative overflow-hidden select-none"
      style={{ width: "100vw", height: "calc(100vh - 44px)", cursor: dragging.current ? "grabbing" : "grab" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {/* The panning layer — scaled 10% */}
      <div className="absolute" style={{
        left: offset.x, top: offset.y,
        width: CW, height: CH,
        transform: `scale(${SCALE})`,
        transformOrigin: "top left",
      }}>

        <CanvasSVG dark={dark} />

        {/* Path label badges — appear mid-way through their connector draw */}
        {PATH_LABELS.map(({ text, x, y }) => {
          // Map label to connector index
          const connMap: Record<string, number> = { career_path: 0, selected_work: 2, profile: 4 };
          const ci = connMap[text] ?? 0;
          const [cStart, cDur] = SEQ.conn[ci];
          const labelDelay = cStart + cDur * 0.5; // appear midway through draw
          return (
            <motion.div key={text}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: labelDelay }}
              className="absolute pointer-events-none" style={{
              left: x, top: y, transform: "translate(-50%, -50%)", zIndex: 40,
              padding: "2px 7px", borderRadius: 3,
              border: "1px solid var(--connector)",
              background: dark ? "rgba(14,13,12,0.72)" : "rgba(245,242,236,0.82)",
              backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
              fontFamily: "DM Mono, monospace", fontSize: 9, letterSpacing: "0.06em",
              color: "var(--muted-foreground)", whiteSpace: "nowrap",
            }}>{text}</motion.div>
          );
        })}

        {/* ── COL 1: HERO ── */}
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: SEQ.hero, ease: [0.4, 0, 0.2, 1] }} className="absolute"
          style={{ left: 24, top: 100, width: 330 }}>
          <NodeShell icon="◆" type="trigger" id="trg_intro" dark={dark}>
            <HeroContent compact />
          </NodeShell>
        </motion.div>

        {/* ── COL 2: IBM ACTIVE ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: SEQ.ibm, ease: [0.4, 0, 0.2, 1] }} className="absolute"
          style={{ left: COL2_X, top: IBM_TOP, width: COL2_W }}>
          <IbmShell dark={dark}>
            <div className="p-3">
              <p className="font-mono text-[9px] mb-1"
                style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>2024 — present</p>
              <h3 className="font-sans text-sm font-semibold mb-0.5"
                style={{ color: "var(--foreground)" }}>IBM Instana</h3>
              <p className="font-mono text-[9px] mb-3"
                style={{ color: "var(--primary)" }}>UX Designer • Observability</p>
              <div className="space-y-1.5 mb-3">
                {["Designed enterprise experiences across GenAI Observability, Business Monitoring, and Real User Monitoring (RUM).",
                  "Transformed complex observability workflows into intuitive, data-driven user experiences.",
                  "Built reusable patterns with the IBM Carbon Design System to drive consistency and scalability."].map((b, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className="flex-shrink-0 mt-[4px]"
                      style={{ color: "var(--primary)", fontSize: 8, lineHeight: 1 }}>→</span>
                    <p className="font-sans text-[10px] leading-snug"
                      style={{ color: "var(--muted-foreground)" }}>{b}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {["Figma", "Observability", "GenAI", "Carbon"].map(t => <Tag key={t} s={t} />)}
              </div>
              <p className="font-mono text-[9px] italic"
                style={{ color: "var(--muted-foreground)", opacity: 0.42 }}>
                // NDA — case studies on request
              </p>
            </div>
          </IbmShell>
        </motion.div>

        {/* ── COL 2: INDEP PRACTICE ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: SEQ.indep, ease: [0.4, 0, 0.2, 1] }} className="absolute"
          style={{ left: COL2_X, top: INDEP_TOP, width: COL2_W }}>
          <NodeShell icon="◼" type="experience" id="exp_prev" dark={dark}>
            <div className="p-3">
              <p className="font-mono text-[9px] mb-1"
                style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>Since 2021</p>
              <h3 className="font-sans text-sm font-semibold mb-0.5"
                style={{ color: "var(--foreground)" }}>Independent Practice</h3>
              <p className="font-mono text-[9px] mb-2"
                style={{ color: "var(--primary)" }}>UX / Visual / Product Design</p>
              <p className="font-sans text-[10px] leading-relaxed mb-2"
                style={{ color: "var(--muted-foreground)" }}>
                Fintech, enterprise, EdTech, Web3 — GrowthGear, Finbits, Aconomy Foundation, Debound, Touch Computing, TÜSK.
              </p>
              <div className="flex flex-wrap gap-1 mb-3">
                {["Figma", "UX", "Design Systems"].map(t => <Tag key={t} s={t} />)}
              </div>
              <div className="pt-2.5" style={{ borderTop: "1px solid var(--border)" }}>
                <p className="font-mono text-[9px] mb-0.5"
                  style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>concurrent</p>
                <p className="font-sans text-[12px] font-semibold"
                  style={{ color: "var(--foreground)" }}>Visiting Faculty &amp; Course Lead</p>
                <p className="font-mono text-[9px] mb-1.5" style={{ color: "var(--primary)" }}>
                  Avantika University · MIT Institute of Design
                </p>
                <p className="font-sans text-[10px] leading-relaxed mb-2"
                  style={{ color: "var(--muted-foreground)" }}>
                  Designed and delivered a Visual &amp; UI Design course, combining theory with hands-on Figma exercises. Mentored students through a final exhibition, with critique focused on clarity, usability, accessibility, and real-world design decisions.
                </p>
                <div className="flex flex-wrap gap-1">
                  {["Teaching", "Visual Design", "UI", "Mentorship"].map(t => <Tag key={t} s={t} />)}
                </div>
              </div>
            </div>
          </NodeShell>
        </motion.div>

        {/* ── COL 3: PROJECTS ── */}
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: SEQ.proj, ease: [0.4, 0, 0.2, 1] }} className="absolute"
          style={{ left: COL3_X, top: PROJ_TOP, width: COL3_W, zIndex: 1 }}>
          <NodeShell icon="⟲" type="loop · projects" id="loop_proj" dark={dark}>
            <div className="p-3">
              <p className="font-mono text-[9px] mb-3"
                style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>// {SHOW} items</p>
              <div className="flex flex-col divide-y" style={{ gap: 0, borderColor: "var(--border)" }}>
                {visible.map((p, i) => (
                  <motion.div key={p.slug} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: SEQ.proj + 0.15 + i * 0.06 }}>
                    <ProjCard p={p} dark={dark} onOpen={onOpen} />
                  </motion.div>
                ))}
              </div>
            </div>
          </NodeShell>
        </motion.div>

        {/* ── COL 3: TESTIMONIALS ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: SEQ.quotes, ease: [0.4, 0, 0.2, 1] }} className="absolute"
          style={{ left: COL3_X, top: QUOTES_TOP, width: COL3_W }}>
          <NodeShell icon="⑂" type="router · quotes" id="rtr_social" dark={dark}>
            <div className="p-3">
              <p className="font-mono text-[9px] mb-3"
                style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>
                // {testimonials.length} branches
              </p>
              <div>
                {testimonials.map((t, i) => (
                  <div key={i} className="py-2.5"
                    style={{ borderBottom: i < testimonials.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <p className="font-serif italic text-[13px] leading-snug mb-1"
                      style={{ color: "var(--foreground)" }}>&ldquo;{t.quote}&rdquo;</p>
                    <p className="font-mono text-[9px]" style={{ color: "var(--muted-foreground)" }}>
                      {t.name}{t.company ? ` · ${t.company.split(",")[0]}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </NodeShell>
        </motion.div>

        {/* ── COL 4: ABOUT ── */}
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: SEQ.about, ease: [0.4, 0, 0.2, 1] }} className="absolute"
          style={{ left: COL4_X, top: ABOUT_TOP, width: COL4_W, zIndex: 1 }}>
          <NodeShell icon="◉" type="about" id="abt_sayan" dark={dark}>
            <div className="p-3">
               <p className="font-sans text-[11px] leading-relaxed mb-3"
                 style={{ color: "var(--muted-foreground)" }}>
                 I enjoy building products as much as I enjoy understanding people. When I&apos;m away from the screen, you&apos;ll probably find me exploring a new caf&eacute;, watching a great film, taking photos, or wandering through an art gallery.
               </p>
               <div className="p-2.5 rounded mb-3"
                 style={{ background: "var(--node-header)", border: "1px solid var(--border)" }}>
                 <p className="font-mono text-[9px] uppercase tracking-widest mb-1"
                   style={{ color: "var(--primary)" }}>education</p>
                 <p className="font-sans text-[11px] font-semibold"
                   style={{ color: "var(--foreground)" }}>B.Des · User Experience Design</p>
                 <p className="font-mono text-[9px] mt-0.5 mb-2"
                   style={{ color: "var(--muted-foreground)" }}>Avantika University MIT IoD</p>
                 <Pill label="🥈 Silver Medalist" color="#2563eb" />
               </div>
               <p className="font-mono text-[9px] mb-2"
                 style={{ color: "var(--muted-foreground)", opacity: 0.55 }}>
                 // Simply put, I will win for you.
               </p>
               <div className="flex flex-wrap gap-1">
                 {["Designer.", "Mentor.", "Occasional photographer.", "Film enthusiast.", "Always curious."].map(s => <Tag key={s} s={s} />)}
               </div>
             </div>
           </NodeShell>
         </motion.div>

         {/* ── COL 4: OUTPUT ── */}
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: SEQ.output, ease: [0.4, 0, 0.2, 1] }} className="absolute"
          style={{ left: COL4_X, top: OUTPUT_TOP, width: COL4_W, zIndex: 1 }}>
          <NodeShell icon="→" type="output" id="out_contact" dark={dark}>
            <div className="p-3 space-y-1">
               {[
                 { label: "ux.sayan@gmail.com", href: "mailto:ux.sayan@gmail.com", Icon: Mail },
                 { label: "LinkedIn", href: "https://linkedin.com/in/sayanoriginals", Icon: ExternalLink },
               ].map(({ label, href, Icon }) => (
                <a key={label} href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="flex items-center justify-between py-1.5 transition-opacity hover:opacity-70"
                  style={{ borderBottom: "1px solid var(--border)" }}>
                  <span className="font-mono text-[10px] flex items-center gap-1.5"
                    style={{ color: "var(--foreground)" }}>
                    <Icon size={9} style={{ color: "var(--primary)" }} />{label}
                  </span>
                  <span style={{ color: "var(--primary)" }}>→</span>
                </a>
              ))}
              <button onClick={onOpenResume}
                className="flex items-center justify-between w-full py-1.5 transition-opacity hover:opacity-70"
                style={{ borderBottom: "1px solid var(--border)" }}>
                <span className="font-mono text-[10px] flex items-center gap-1.5"
                  style={{ color: "var(--foreground)" }}>
                  <Download size={9} style={{ color: "var(--primary)" }} />Resume.pdf
                </span>
                <span style={{ color: "var(--primary)" }}>→</span>
              </button>
              <p className="font-mono text-[9px] pt-1"
                style={{ color: "var(--muted-foreground)", opacity: 0.38 }}>
                // pipeline_complete · {new Date().getFullYear()}
              </p>
            </div>
          </NodeShell>
        </motion.div>

      </div>

      {/* Hint badge */}
      <div className="absolute bottom-4 left-1/2 pointer-events-none"
        style={{ transform: "translateX(-50%)", zIndex: 50 }}>
        {/* soft glow halo behind the drag badge */}
        <div style={{ position: "relative" }}>
          <div style={{
            position: "absolute", inset: "-8px",
            borderRadius: "9999px",
            background: dark ? "rgba(224,149,74,0.12)" : "rgba(199,123,50,0.08)",
            filter: "blur(10px)",
          }} />
          <span className="font-mono text-[9px] px-3 py-1 rounded-full"
            style={{
              position: "relative",
              border: "1px solid var(--connector)",
              background: dark ? "rgba(14,13,12,0.72)" : "rgba(245,242,236,0.82)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              color: "var(--muted-foreground)",
              opacity: 0.65,
              display: "inline-block",
            }}>
            drag to pan
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Mobile layout ────────────────────────────────────────────────────────────
// ORDER: Hero → IBM → Indep → Projects → Quotes → About → Output

function MobileLayout({ dark, onOpen, onOpenResume }: { dark: boolean; onOpen: (p: typeof projects[0]) => void; onOpenResume: () => void }) {
  const [openExp, setOpenExp] = useState<"ibm" | "indep" | null>(null);
  const ibmOpen = openExp === "ibm";
  const indepOpen = openExp === "indep";
  const setIbmOpen = (v: boolean) => setOpenExp(v ? "ibm" : null);
  const setIndepOpen = (v: boolean) => setOpenExp(v ? "indep" : null);
  const [quoteIdx, setQuoteIdx] = useState(0);

  // Auto-advance testimonials every 2 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIdx(i => (i + 1) % testimonials.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  function Conn() {
    return (
      <div className="flex flex-col items-center" style={{ height: 40, flexShrink: 0 }}>
        <div className="w-2 h-2 rounded-full border-2 flex-shrink-0"
          style={{ borderColor: "var(--connector)", background: "var(--background)", marginTop: -4 }} />
        <div className="flex-1 w-px" style={{ background: "var(--connector)", opacity: 0.5 }} />
        <div style={{ width: 0, height: 0, borderLeft: "3px solid transparent",
          borderRight: "3px solid transparent", borderTop: "4px solid var(--connector)",
          opacity: 0.5, marginBottom: -2, flexShrink: 0 }} />
        <div className="w-2 h-2 rounded-full border-2 flex-shrink-0"
          style={{ borderColor: "var(--connector)", background: "var(--background)", marginBottom: -4 }} />
      </div>
    );
  }

  const visible = projects.slice(0, SHOW);

  return (
    <div className="flex flex-col px-4 py-8 gap-0">

      {/* 1. HERO */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}>
        <NodeShell icon="◆" type="trigger" id="trg_intro" dark={dark}>
          <HeroContent />
        </NodeShell>
      </motion.div>
      <Conn />

      {/* 2. IBM ACTIVE — accordion */}
      <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.45 }}>
        <IbmShell dark={dark}>
          <button className="w-full text-left p-4 pb-0" onClick={() => setIbmOpen(!ibmOpen)}>
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="font-mono text-[9px] mb-1"
                  style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>2024 — present</p>
                <h3 className="font-sans text-[14px] font-semibold mb-0.5"
                  style={{ color: "var(--foreground)" }}>IBM Instana</h3>
                <p className="font-mono text-[10px]"
                  style={{ color: "var(--primary)" }}>UX Designer • Observability</p>
              </div>
              <ChevronRight size={16} className="flex-shrink-0"
                style={{ color: "var(--muted-foreground)", transition: "transform 0.2s",
                  transform: ibmOpen ? "rotate(90deg)" : "rotate(0deg)" }} />
            </div>
          </button>
          <AnimatePresence initial={false}>
            {ibmOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden">
                <div className="px-4 pt-3 pb-4">
                  <div className="space-y-2.5 mb-4">
                    {["Designed enterprise experiences across GenAI Observability, Business Monitoring, and Real User Monitoring (RUM).",
                      "Transformed complex observability workflows into intuitive, data-driven user experiences.",
                      "Built reusable patterns with the IBM Carbon Design System to drive consistency and scalability."].map((b, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="font-mono text-[10px] mt-0.5 flex-shrink-0"
                          style={{ color: "var(--primary)" }}>→</span>
                        <p className="font-sans text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{b}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {["Figma", "Observability", "GenAI", "Carbon"].map(t => <Tag key={t} s={t} />)}
                  </div>
                  <p className="font-mono text-[9px] italic"
                    style={{ color: "var(--muted-foreground)", opacity: 0.42 }}>
                    // NDA — detailed case studies on request
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {!ibmOpen && <div className="h-3" />}
        </IbmShell>
      </motion.div>
      <Conn />

      {/* 3. INDEP PRACTICE — accordion */}
      <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.45 }}>
        <NodeShell icon="◼" type="experience" id="exp_prev" dark={dark}>
          <button className="w-full text-left p-4 pb-0" onClick={() => setIndepOpen(!indepOpen)}>
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="font-mono text-[9px] mb-1"
                  style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>Since 2021</p>
                <h3 className="font-sans text-[14px] font-semibold mb-0.5"
                  style={{ color: "var(--foreground)" }}>Independent Practice</h3>
                <p className="font-mono text-[10px]"
                  style={{ color: "var(--primary)" }}>UX / Visual / Product Design</p>
              </div>
              <ChevronRight size={16} className="flex-shrink-0"
                style={{ color: "var(--muted-foreground)", transition: "transform 0.2s",
                  transform: indepOpen ? "rotate(90deg)" : "rotate(0deg)" }} />
            </div>
          </button>
          <AnimatePresence initial={false}>
            {indepOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden">
                <div className="px-4 pt-3 pb-4">
                  <p className="font-sans text-sm leading-relaxed mb-3"
                    style={{ color: "var(--muted-foreground)" }}>
                    Fintech, enterprise, EdTech, Web3 — GrowthGear, Finbits, Aconomy Foundation, Debound, Touch Computing, TÜSK.
                  </p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {["Figma", "UX", "Design Systems"].map(t => <Tag key={t} s={t} />)}
                  </div>
                  <div className="pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                    <p className="font-mono text-[9px] mb-0.5"
                      style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>concurrent</p>
                    <h4 className="font-sans text-sm font-semibold mb-0.5"
                      style={{ color: "var(--foreground)" }}>Visiting Faculty &amp; Course Lead</h4>
                    <p className="font-mono text-[10px] mb-2" style={{ color: "var(--primary)" }}>
                      Avantika University · MIT Institute of Design
                    </p>
                    <p className="font-sans text-sm leading-relaxed mb-3"
                      style={{ color: "var(--muted-foreground)" }}>
                      Designed and delivered a Visual &amp; UI Design course, combining theory with hands-on Figma exercises. Mentored students through a final exhibition, with critique focused on clarity, usability, accessibility, and real-world design decisions.
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {["Teaching", "Visual Design", "UI", "Mentorship"].map(t => <Tag key={t} s={t} />)}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {!indepOpen && <div className="h-3" />}
        </NodeShell>
      </motion.div>
      <Conn />

      {/* 4. PROJECTS (3) */}
      <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.45 }}>
        <NodeShell icon="⟲" type="loop · projects" id="loop_proj" dark={dark}>
          <div className="p-3">
            <p className="font-mono text-[9px] mb-3"
              style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>// {SHOW} items</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {visible.map((p, i) => (
                <motion.div key={p.slug} initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}>
                  <ProjCard p={p} dark={dark} onOpen={onOpen} mobile />
                </motion.div>
              ))}
            </div>
          </div>
        </NodeShell>
      </motion.div>
      <Conn />

      {/* 5. TESTIMONIALS — horizontal carousel */}
      <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.45 }}>
        <NodeShell icon="⑂" type="router · quotes" id="rtr_social" dark={dark}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-mono text-[9px]"
                style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>
                // {quoteIdx + 1} of {testimonials.length}
              </p>
              <div className="flex gap-1.5">
                <button onClick={() => setQuoteIdx((quoteIdx - 1 + testimonials.length) % testimonials.length)}
                  className="w-5 h-5 flex items-center justify-center rounded"
                  style={{ border: "1px solid var(--border)", color: "var(--muted-foreground)" }}>
                  <span className="text-[9px]">←</span>
                </button>
                <button onClick={() => setQuoteIdx((quoteIdx + 1) % testimonials.length)}
                  className="w-5 h-5 flex items-center justify-center rounded"
                  style={{ border: "1px solid var(--border)", color: "var(--muted-foreground)" }}>
                  <span className="text-[9px]">→</span>
                </button>
              </div>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={quoteIdx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="p-3 rounded"
                style={{ background: "var(--node-header)", border: "1px solid var(--border)" }}>
                <p className="font-serif italic text-[15px] leading-snug mb-2"
                  style={{ color: "var(--foreground)" }}>&ldquo;{testimonials[quoteIdx].quote}&rdquo;</p>
                <p className="font-sans text-xs font-semibold"
                  style={{ color: "var(--foreground)" }}>{testimonials[quoteIdx].name}</p>
                <p className="font-mono text-[9px] mt-0.5"
                  style={{ color: "var(--muted-foreground)" }}>
                  {testimonials[quoteIdx].role}{testimonials[quoteIdx].company ? ` · ${testimonials[quoteIdx].company}` : ""}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </NodeShell>
      </motion.div>
      <Conn />

      {/* 6. ABOUT */}
      <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.45 }}>
        <NodeShell icon="◉" type="about" id="abt_sayan" dark={dark}>
          <div className="p-4">
            <p className="font-sans text-sm leading-relaxed mb-3"
              style={{ color: "var(--muted-foreground)" }}>
              I enjoy building products as much as I enjoy understanding people. When I&apos;m away from the screen, you&apos;ll probably find me exploring a new caf&eacute;, watching a great film, taking photos, or wandering through an art gallery.
            </p>
            <div className="p-3 rounded mb-3"
              style={{ background: "var(--node-header)", border: "1px solid var(--border)" }}>
              <p className="font-mono text-[9px] uppercase tracking-widest mb-1"
                style={{ color: "var(--primary)" }}>education</p>
              <p className="font-sans text-sm font-semibold"
                style={{ color: "var(--foreground)" }}>B.Des · User Experience Design</p>
              <p className="font-mono text-[9px] mt-0.5 mb-2"
                style={{ color: "var(--muted-foreground)" }}>Avantika University MIT IoD</p>
              <Pill label="🥈 Silver Medalist" color="#2563eb" />
            </div>
            <p className="font-mono text-xs mb-3"
              style={{ color: "var(--muted-foreground)", opacity: 0.6 }}>
              // Simply put, I will win for you.
            </p>
            <div className="flex flex-wrap gap-1">
              {["Designer.", "Mentor.", "Occasional photographer.", "Film enthusiast.", "Always curious."].map(s => <Tag key={s} s={s} />)}
            </div>
          </div>
        </NodeShell>
      </motion.div>
      <Conn />

      {/* 7. OUTPUT */}
      <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.45 }}>
        <NodeShell icon="→" type="output" id="out_contact" dark={dark}>
          <div className="p-4">
            <h2 className="font-serif text-xl italic mb-1" style={{ color: "var(--foreground)" }}>
              Let&apos;s work together.
            </h2>
            <p className="font-sans text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>
              Open to full-time roles, contract work, and interesting conversations.
            </p>
            <div className="space-y-2">
              {[
                { label: "ux.sayan@gmail.com", href: "mailto:ux.sayan@gmail.com", Icon: Mail },
                { label: "LinkedIn", href: "https://linkedin.com/in/sayanoriginals", Icon: ExternalLink },
              ].map(({ label, href, Icon }) => (
                <a key={label} href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="flex items-center justify-between py-2.5 transition-opacity hover:opacity-70"
                  style={{ borderBottom: "1px solid var(--border)" }}>
                  <span className="font-mono text-[10px] flex items-center gap-2"
                    style={{ color: "var(--foreground)" }}>
                    <Icon size={10} style={{ color: "var(--primary)" }} />{label}
                  </span>
                  <span style={{ color: "var(--primary)" }}>→</span>
                </a>
              ))}
              <button onClick={onOpenResume}
                className="flex items-center justify-between w-full py-2.5 transition-opacity hover:opacity-70"
                style={{ borderBottom: "1px solid var(--border)" }}>
                <span className="font-mono text-[10px] flex items-center gap-2"
                  style={{ color: "var(--foreground)" }}>
                  <Download size={10} style={{ color: "var(--primary)" }} />Download Resume
                </span>
                <span style={{ color: "var(--primary)" }}>→</span>
              </button>
            </div>
            <p className="font-mono text-[9px] pt-3"
              style={{ color: "var(--muted-foreground)", opacity: 0.38 }}>
              // pipeline_complete · {new Date().getFullYear()}
            </p>
          </div>
        </NodeShell>
      </motion.div>

      <div className="flex flex-col items-center pt-1">
        <div className="w-px" style={{ height: 20, background: "var(--connector)", opacity: 0.4 }} />
        <div className="font-mono text-[9px] px-3 py-1 rounded-full"
          style={{ border: "1px solid var(--connector)", color: "var(--muted-foreground)", opacity: 0.4 }}>
          ● END
        </div>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

// Survives in-session navigation (React re-mounts) but resets on page refresh.
let _introSeen = false;

export default function Home() {
  const { dark, toggle } = useTheme();
  const [resumeOpen, setResumeOpen] = useState(false);
  const [loaded, setLoaded] = useState(() => _introSeen);

  return (
    <div className={cn("min-h-screen font-sans", dark ? "dark" : "")}
      style={{ background: "var(--background)", color: "var(--foreground)" }}>

      <AnimatePresence>
        {!loaded && (
          <LoadingScreen dark={dark} onDone={() => {
            _introSeen = true;
            setLoaded(true);
          }} />
        )}
      </AnimatePresence>

      {/* Full-page interactive dot field */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <DotField
          dotRadius={1.8}
          dotSpacing={15.6}
          bulgeStrength={72}
          glowRadius={180}
          sparkle={false}
          waveAmplitude={0}
          gradientFrom={dark ? "rgba(237, 233, 227, 0.07)" : "rgba(26, 24, 22, 0.10)"}
          gradientTo={dark   ? "rgba(237, 233, 227, 0.07)" : "rgba(26, 24, 22, 0.10)"}
          glowColor={dark    ? "#111010"                   : "transparent"}
        />
      </div>

      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 h-11"
        style={{
          background: dark ? "rgba(17,16,16,0.88)" : "rgba(245,242,236,0.88)",
          borderBottom: "1px solid var(--border)",
          backdropFilter: "blur(10px)",
        }}>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 transition-opacity hover:opacity-70"
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
          <span className="font-mono text-[9px] tracking-[0.2em] uppercase"
            style={{ color: "var(--muted-foreground)", opacity: 0.6 }}>sayan_portfolio</span>
          <span style={{ color: "var(--border)" }}>/</span>
          <span className="font-mono text-[9px]"
            style={{ color: "var(--primary)", opacity: 0.7 }}>v3</span>
        </button>
        <button onClick={toggle}
          className="flex items-center gap-1.5 font-mono text-[9px] px-2.5 py-1 rounded"
          style={{ color: "var(--muted-foreground)", border: "1px solid var(--border)",
            background: "var(--node-header)" }}>
          <span>{dark ? "☀" : "☽"}</span>{dark ? "light" : "dark"}
        </button>
      </header>

      {/* Desktop: full canvas */}
      <div className="hidden lg:block pt-11 relative z-10">
        <DesktopCanvas dark={dark} onOpen={() => {}} onOpenResume={() => setResumeOpen(true)} />
      </div>
      {/* Tablet: pannable canvas */}
      <div className="hidden md:block lg:hidden pt-11 relative z-10">
        <DesktopCanvas dark={dark} onOpen={() => {}} onOpenResume={() => setResumeOpen(true)} />
      </div>
      {/* Mobile: stacked layout */}
      <div className="md:hidden pt-11 relative z-10">
        <MobileLayout dark={dark} onOpen={() => {}} onOpenResume={() => setResumeOpen(true)} />
      </div>

      {/* Desktop/tablet: slide-in drawer from right */}
      <AnimatePresence>
        {resumeOpen && (
          <div className="hidden md:block">
            <ResumeDrawer onClose={() => setResumeOpen(false)} dark={dark} />
          </div>
        )}
      </AnimatePresence>
      {/* Mobile: slide-up bottom sheet */}
      <AnimatePresence>
        {resumeOpen && (
          <div className="md:hidden">
            <ResumeSheet onClose={() => setResumeOpen(false)} dark={dark} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
