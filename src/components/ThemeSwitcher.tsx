import { useState, useEffect, useRef } from "react";
import { useTheme, type Theme } from "../hooks/useTheme";

interface ThemeOption {
  value: Theme;
  label: string;
  swatches: string[];
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    value: "default-dark",
    label: "Default - Dark",
    swatches: ["#111010", "#252320", "#E0954A"],
  },
  {
    value: "default-light",
    label: "Default - Light",
    swatches: ["#F5F2EC", "#EDEBE4", "#C77B32"],
  },
  {
    value: "ocean-abyss",
    label: "Ocean Abyss - Dark",
    swatches: ["#0B1120", "#131C31", "#3B82F6"],
  },
  {
    value: "deep-forest",
    label: "Deep Forest - Dark",
    swatches: ["#040805", "#0B1710", "#3F7A54"],
  },
  {
    value: "lemon-fizz",
    label: "Lemon Fizz - Light",
    swatches: ["#F7F5EF", "#E4DEC8", "#D9A801"],
  },
];

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  function selectTheme(value: Theme) {
    setTheme(value);
    setOpen(false);
  }

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {/* Trigger button — swatches icon */}
      <button
        aria-label="Switch theme"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "4px 8px",
          borderRadius: 4,
          border: "1px solid var(--border)",
          background: "var(--node-header)",
          color: "var(--muted-foreground)",
          cursor: "pointer",
        }}
      >
        {/* Three small filled dots representing swatches */}
        <span style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {THEME_OPTIONS.find((o) => o.value === theme)?.swatches.map((color, i) => (
            <span
              key={i}
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: color,
                border: "1px solid rgba(128,128,128,0.25)",
                flexShrink: 0,
              }}
            />
          ))}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: 9,
            color: "var(--muted-foreground)",
            letterSpacing: "0.06em",
          }}
        >
          Theme
        </span>
      </button>

      {/* Popover menu */}
      {open && (
        <div
          role="listbox"
          aria-label="Theme options"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            zIndex: 200,
            minWidth: 192,
            borderRadius: 6,
            border: "1px solid var(--border)",
            background: "var(--popover)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "4px 0" }}>
            {THEME_OPTIONS.map((option) => {
              const isActive = option.value === theme;
              return (
                <button
                  key={option.value}
                  role="option"
                  aria-selected={isActive}
                  onClick={() => selectTheme(option.value)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    padding: "7px 10px",
                    textAlign: "left",
                    background: isActive ? "var(--node-header)" : "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {/* Color preview chips */}
                  <span style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                    {option.swatches.map((color, i) => (
                      <span
                        key={i}
                        style={{
                          display: "inline-block",
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: color,
                          border: "1px solid rgba(128,128,128,0.2)",
                          flexShrink: 0,
                        }}
                      />
                    ))}
                  </span>
                  {/* Theme name */}
                  <span
                    style={{
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: 10,
                      color: isActive ? "var(--foreground)" : "var(--muted-foreground)",
                      flex: 1,
                    }}
                  >
                    {option.label}
                  </span>
                  {/* Active checkmark */}
                  {isActive && (
                    <span
                      style={{
                        color: "var(--primary)",
                        fontSize: 10,
                        lineHeight: 1,
                        flexShrink: 0,
                      }}
                    >
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
