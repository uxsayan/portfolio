import { Link, useLocation } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Mail } from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { cn } from "../lib/utils";

export default function NotFound() {
  const { dark, toggle } = useTheme();
  const { pathname } = useLocation();

  const errorJson = `{
  "status":    404,
  "requested": "${pathname}",
  "error":     "node_not_found",
  "pipeline":  "sayan_portfolio_v3",
  "hint":      "this route does not exist in the pipeline"
}`;

  return (
    <div
      className={cn("min-h-screen font-sans flex flex-col items-center justify-center relative", dark ? "dark" : "")}
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      {/* Dot grid */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: "radial-gradient(circle, var(--dot-color) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }} />

      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 h-11"
        style={{
          background: dark ? "rgba(17,16,16,0.88)" : "rgba(245,242,236,0.88)",
          borderBottom: "1px solid var(--border)",
          backdropFilter: "blur(10px)",
        }}>
        <Link to="/"
          className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.2em] uppercase transition-opacity hover:opacity-70"
          style={{ color: "var(--muted-foreground)" }}>
          <ArrowLeft size={10} /> pipeline
        </Link>
        <button onClick={toggle}
          className="flex items-center gap-1.5 font-mono text-[9px] px-2.5 py-1 rounded"
          style={{ color: "var(--muted-foreground)", border: "1px solid var(--border)", background: "var(--node-header)" }}>
          <span>{dark ? "☀" : "☽"}</span>{dark ? "light" : "dark"}
        </button>
      </header>

      <div className="relative z-10 w-full max-w-lg px-4">

        {/* Broken pipeline connector */}
        <div className="flex flex-col items-center mb-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }} className="flex flex-col items-center">

            <div className="w-2.5 h-2.5 rounded-full border-2"
              style={{ borderColor: "var(--connector)", background: "var(--background)" }} />
            <div style={{ width: 1, height: 24, background: "var(--connector)", opacity: 0.5 }} />

            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="font-mono text-[9px] px-3 py-1 rounded"
              style={{ background: "rgba(212,24,61,0.12)", border: "1px solid rgba(212,24,61,0.4)", color: "#d4183d" }}>
              ✕ &nbsp;error · node_not_found
            </motion.div>

            <div className="flex flex-col items-center gap-1 my-2">
              {[0, 1, 2].map(i => (
                <motion.div key={i} initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.4, 0] }}
                  transition={{ duration: 1.6, delay: i * 0.25, repeat: Infinity }}
                  style={{ width: 1, height: 6, background: "#d4183d" }} />
              ))}
            </div>

            <div className="w-2.5 h-2.5 rounded-full border-2"
              style={{ borderColor: "rgba(212,24,61,0.4)", background: "var(--background)" }} />
          </motion.div>
        </div>

        {/* Error node card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="overflow-hidden rounded-lg"
          style={{
            background: "var(--card)",
            backdropFilter: "blur(80px) saturate(1.9)",
            WebkitBackdropFilter: "blur(80px) saturate(1.9)",
            border: "1px solid rgba(212,24,61,0.35)",
            boxShadow: dark
              ? "0 0 32px rgba(212,24,61,0.12), 0 4px 28px rgba(0,0,0,0.45)"
              : "0 0 24px rgba(212,24,61,0.08), 0 4px 24px rgba(26,24,22,0.09)",
          }}>

          {/* Node header */}
          <div className="flex items-center justify-between px-4 py-2.5"
            style={{ background: "rgba(212,24,61,0.06)", borderBottom: "1px solid rgba(212,24,61,0.2)" }}>
            <div className="flex items-center gap-2">
              <span className="text-[11px]" style={{ color: "#d4183d" }}>✕</span>
              <span className="font-mono text-[9px] tracking-[0.2em] uppercase"
                style={{ color: "#d4183d", fontWeight: 500 }}>error</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px]"
                style={{ color: "var(--muted-foreground)", opacity: 0.38 }}>err_404</span>
              <span className="flex items-center gap-1 font-mono text-[8px]" style={{ color: "#d4183d" }}>
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#d4183d" }} />
                failed
              </span>
            </div>
          </div>

          <div className="p-6">
            <h1 className="font-serif leading-none italic mb-1"
              style={{ fontSize: "clamp(4rem, 18vw, 7rem)", color: "var(--foreground)", lineHeight: 1 }}>
              404
            </h1>
            <p className="font-mono text-[10px] mb-6" style={{ color: "#d4183d" }}>
              route · not_found
            </p>

            <div className="rounded p-4 mb-6 overflow-x-auto"
              style={{ background: "var(--node-header)", border: "1px solid var(--border)" }}>
              <pre className="font-mono text-[10px] leading-relaxed whitespace-pre"
                style={{ color: "var(--muted-foreground)" }}>{errorJson}</pre>
            </div>

            <p className="font-sans text-sm leading-relaxed mb-6"
              style={{ color: "var(--muted-foreground)" }}>
              This node doesn't exist in the pipeline. Head back to the canvas.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/"
                className="flex items-center gap-2 px-4 py-2.5 rounded font-mono text-[10px] transition-opacity hover:opacity-80"
                style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                <ArrowLeft size={11} /> back to pipeline
              </Link>
              <a href="mailto:ux.sayan@gmail.com"
                className="flex items-center gap-2 px-4 py-2.5 rounded font-mono text-[10px] transition-opacity hover:opacity-70"
                style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}>
                <Mail size={11} /> ux.sayan@gmail.com
              </a>
            </div>
          </div>
        </motion.div>

        <p className="font-mono text-[9px] text-center mt-6"
          style={{ color: "var(--muted-foreground)", opacity: 0.35 }}>
          // sayan_portfolio_v3 · pipeline_error
        </p>
      </div>
    </div>
  );
}
