import { useEffect } from "react";
import { useRouteError } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Mail, RotateCw } from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { cn } from "../lib/utils";

const RELOAD_KEY = "sc-chunk-reload";

function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(message);
}

export default function RouteError() {
  const error = useRouteError();
  const { dark } = useTheme();
  const chunkError = isChunkLoadError(error);
  const message = error instanceof Error ? error.message : "Unknown error";

  // A stale tab pointing at deleted build assets is fixed by one fresh reload.
  useEffect(() => {
    if (chunkError && !sessionStorage.getItem(RELOAD_KEY)) {
      sessionStorage.setItem(RELOAD_KEY, "1");
      window.location.reload();
    } else if (!chunkError) {
      sessionStorage.removeItem(RELOAD_KEY);
    }
  }, [chunkError]);

  const errorJson = `{
  "status":   ${chunkError ? 503 : 500},
  "error":    "${chunkError ? "stale_build" : "node_crashed"}",
  "pipeline": "sayan_portfolio_v3",
  "hint":     "${chunkError ? "a newer version was deployed - reload to sync" : "something broke while rendering this node"}"
}`;

  return (
    <div
      className={cn("min-h-screen font-sans flex flex-col items-center justify-center relative", dark ? "dark" : "")}
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: "radial-gradient(circle, var(--dot-color) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }} />

      <div className="relative z-10 w-full max-w-lg px-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="overflow-hidden rounded-lg"
          style={{
            background: "var(--card)",
            border: "1px solid rgba(212,24,61,0.35)",
            boxShadow: dark
              ? "0 0 32px rgba(212,24,61,0.12), 0 4px 28px rgba(0,0,0,0.45)"
              : "0 0 24px rgba(212,24,61,0.08), 0 4px 24px rgba(26,24,22,0.09)",
          }}>
          <div className="flex items-center justify-between px-4 py-2.5"
            style={{ background: "rgba(212,24,61,0.06)", borderBottom: "1px solid rgba(212,24,61,0.2)" }}>
            <div className="flex items-center gap-2">
              <span className="text-[11px]" style={{ color: "#d4183d" }}>✕</span>
              <span className="font-mono text-[9px] tracking-[0.2em] uppercase"
                style={{ color: "#d4183d", fontWeight: 500 }}>error</span>
            </div>
            <span className="flex items-center gap-1 font-mono text-[8px]" style={{ color: "#d4183d" }}>
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#d4183d" }} />
              failed
            </span>
          </div>

          <div className="p-6">
            <h1 className="font-serif italic mb-1" style={{ fontSize: "clamp(2.5rem, 12vw, 4rem)", lineHeight: 1.1 }}>
              {chunkError ? "Out of sync" : "Something broke"}
            </h1>
            <p className="font-mono text-[10px] mb-6" style={{ color: "#d4183d" }}>
              {chunkError ? "node · stale_build" : "node · crashed"}
            </p>

            <div className="rounded p-4 mb-6 overflow-x-auto"
              style={{ background: "var(--node-header)", border: "1px solid var(--border)" }}>
              <pre className="font-mono text-[10px] leading-relaxed whitespace-pre"
                style={{ color: "var(--muted-foreground)" }}>{errorJson}</pre>
            </div>

            <p className="font-sans text-sm leading-relaxed mb-6" style={{ color: "var(--muted-foreground)" }}>
              {chunkError
                ? "This page was updated while you had it open. Reload to load the latest version."
                : `The page hit an unexpected error (${message}). Try reloading, or head back to the canvas.`}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-4 py-2.5 rounded font-mono text-[10px] transition-opacity hover:opacity-80"
                style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                <RotateCw size={11} /> reload page
              </button>
              <a href="/"
                className="flex items-center gap-2 px-4 py-2.5 rounded font-mono text-[10px] transition-opacity hover:opacity-70"
                style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}>
                <ArrowLeft size={11} /> back to pipeline
              </a>
              <a href="mailto:ux.sayan@gmail.com"
                className="flex items-center gap-2 px-4 py-2.5 rounded font-mono text-[10px] transition-opacity hover:opacity-70"
                style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}>
                <Mail size={11} /> contact
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
