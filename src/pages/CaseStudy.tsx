import { useParams, Link } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, ArrowUpRight, Mail } from "lucide-react";
import { projects } from "../data/projects";
import { useTheme } from "../hooks/useTheme";
import { cn } from "../lib/utils";

function Tag({ label }: { label: string }) {
  return (
    <span
      className="inline-flex font-mono text-[10px] px-2 py-0.5 rounded"
      style={{
        background: "var(--muted)",
        color: "var(--muted-foreground)",
        border: "1px solid var(--border)",
        lineHeight: 1.8,
      }}
    >
      {label}
    </span>
  );
}

function SectionNode({
  icon,
  type,
  id,
  children,
  delay = 0,
}: {
  icon: string;
  type: string;
  id: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay }}
      className="w-full overflow-hidden rounded-lg"
      style={{
        background: "var(--card)",
        backdropFilter: "blur(80px) saturate(1.9)",
        WebkitBackdropFilter: "blur(80px) saturate(1.9)",
        border: "1px solid var(--border)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.18), inset 0 1px 0 rgba(237,233,227,0.06)",
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{
          background: "var(--node-header)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "var(--primary)" }}>{icon}</span>
          <span
            className="font-mono text-[10px] tracking-[0.18em] uppercase"
            style={{ color: "var(--muted-foreground)", fontWeight: 500 }}
          >
            {type}
          </span>
        </div>
        <span
          className="font-mono text-[10px]"
          style={{ color: "var(--muted-foreground)", opacity: 0.4 }}
        >
          {id}
        </span>
      </div>
      <div>{children}</div>
    </motion.div>
  );
}

function Connector() {
  return (
    <div className="flex flex-col items-center" style={{ height: 48, flexShrink: 0 }}>
      <div
        className="w-2 h-2 rounded-full border-2 z-10"
        style={{ borderColor: "var(--connector)", background: "var(--background)", marginTop: -4 }}
      />
      <div className="flex-1 w-px" style={{ background: "var(--connector)", margin: "3px 0" }} />
      <div
        style={{
          width: 0, height: 0,
          borderLeft: "3px solid transparent",
          borderRight: "3px solid transparent",
          borderTop: `4px solid var(--connector)`,
          marginBottom: -2,
        }}
      />
      <div
        className="w-2 h-2 rounded-full border-2 z-10"
        style={{ borderColor: "var(--connector)", background: "var(--background)", marginBottom: -4 }}
      />
    </div>
  );
}

function FullImg({ id, caption, bg, alt }: { id: string; caption: string; bg: string; alt: string }) {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div
        className="w-full overflow-hidden rounded-lg"
        style={{ background: bg, aspectRatio: "16/9", border: "1px solid var(--border)" }}
      >
        <img
          src={`https://images.unsplash.com/photo-${id}?w=1200&h=675&fit=crop&auto=format`}
          alt={alt}
          className="w-full h-full object-cover"
          style={{ mixBlendMode: "luminosity", opacity: 0.65 }}
        />
      </div>
      {caption && (
        <figcaption
          className="font-mono text-[10px] mt-2 text-center"
          style={{ color: "var(--muted-foreground)", opacity: 0.55 }}
        >
          // {caption}
        </figcaption>
      )}
    </motion.figure>
  );
}

export default function CaseStudy() {
  const { slug } = useParams<{ slug: string }>();
  const { dark, toggle } = useTheme();
  const project = projects.find((p) => p.slug === slug);

  if (!project) {
    return (
      <div
        className={cn("min-h-screen flex flex-col items-center justify-center font-sans", dark ? "dark" : "")}
        style={{ background: "var(--background)", color: "var(--foreground)" }}
      >
        <p className="font-mono text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>
          // 404: project not found
        </p>
        <Link
          to="/"
          className="flex items-center gap-1.5 font-mono text-xs"
          style={{ color: "var(--primary)" }}
        >
          <ArrowLeft size={12} />
          back to pipeline
        </Link>
      </div>
    );
  }

  const currentIndex = projects.findIndex((p) => p.slug === slug);
  const nextProject = projects[(currentIndex + 1) % projects.length];

  return (
    <div
      className={cn("min-h-screen font-sans relative", dark ? "dark" : "")}
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      {/* Dot grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, var(--dot-color) 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
      />

      {/* Top bar */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 h-12"
        style={{
          background: dark ? "rgba(17,16,16,0.88)" : "rgba(245,242,236,0.88)",
          borderBottom: "1px solid var(--border)",
          backdropFilter: "blur(10px)",
        }}
      >
        <Link
          to="/"
          className="flex items-center gap-1.5 font-mono text-[10px] transition-opacity hover:opacity-70"
          style={{ color: "var(--muted-foreground)" }}
        >
          <ArrowLeft size={11} />
          pipeline
        </Link>
        <div className="flex items-center gap-3">
          <span
            className="font-mono text-[10px] hidden sm:inline"
            style={{ color: "var(--muted-foreground)", opacity: 0.45 }}
          >
            prj_{project.slug.replace(/-/g, "_")}
          </span>
          <button
            onClick={toggle}
            className="flex items-center gap-1.5 font-mono text-[10px] px-2.5 py-1 rounded"
            style={{
              color: "var(--muted-foreground)",
              border: "1px solid var(--border)",
              background: "var(--node-header)",
            }}
          >
            <span>{dark ? "☀" : "☽"}</span>
            {dark ? "light" : "dark"}
          </button>
        </div>
      </header>

      {/* Canvas content */}
      <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-24">

        {/* HEADER node */}
        <SectionNode icon="◆" type="trigger · case study" id={`prj_${project.slug.replace(/-/g, "_")}`}>
          <div className="p-6 sm:p-8">
            <p
              className="font-mono text-[10px] tracking-widest uppercase mb-4"
              style={{ color: "var(--primary)" }}
            >
              {project.number} — {project.tags.join(" · ")}
            </p>
            <h1
              className="font-serif leading-tight mb-3"
              style={{ fontSize: "clamp(2rem, 7vw, 4.5rem)", color: "var(--foreground)", lineHeight: 1.05 }}
            >
              {project.title}
            </h1>
            <p
              className="font-serif italic text-lg mb-6"
              style={{ color: "var(--muted-foreground)" }}
            >
              {project.subtitle}
            </p>
            <div className="flex flex-wrap gap-4 mb-5">
              {[
                { label: "year", value: project.year },
                { label: "role", value: project.role },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p
                    className="font-mono text-[9px] uppercase tracking-widest mb-0.5"
                    style={{ color: "var(--muted-foreground)", opacity: 0.5 }}
                  >
                    {label}
                  </p>
                  <p className="font-mono text-[11px]" style={{ color: "var(--foreground)" }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {project.tags.map((t) => <Tag key={t} label={t} />)}
            </div>
          </div>
        </SectionNode>

        {/* Hero image */}
        <motion.div
          className="my-4 overflow-hidden rounded-lg"
          style={{
            background: project.imageBg,
            aspectRatio: "16/7",
            border: "1px solid var(--border)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <img
            src={`https://images.unsplash.com/photo-${project.imageId}?w=1400&h=612&fit=crop&auto=format`}
            alt={`${project.title} hero`}
            className="w-full h-full object-cover"
            style={{ mixBlendMode: "luminosity", opacity: dark ? 0.55 : 0.6 }}
          />
        </motion.div>

        <Connector />

        {/* PROBLEM node */}
        <SectionNode icon="◎" type="problem" id="sec_problem" delay={0.05}>
          <div className="p-6 sm:p-8">
            <p
              className="font-mono text-[10px] uppercase tracking-widest mb-3"
              style={{ color: "var(--primary)" }}
            >
              // problem statement
            </p>
            <p
              className="font-sans text-base leading-relaxed"
              style={{ color: "var(--muted-foreground)" }}
            >
              {project.problem}
            </p>
          </div>
        </SectionNode>

        {project.processImages.length > 0 && (
          <>
            <Connector />
            <SectionNode icon="▥" type="process" id="sec_process">
              <div className="p-5 sm:p-6 space-y-4">
                <p
                  className="font-mono text-[10px] uppercase tracking-widest mb-1"
                  style={{ color: "var(--primary)" }}
                >
                  // process artefacts
                </p>
                {project.processImages.map((img, i) => (
                  <FullImg key={i} id={img.id} caption={img.caption} bg={img.bg} alt={img.caption} />
                ))}
              </div>
            </SectionNode>
          </>
        )}

        <Connector />

        {/* CONTRIBUTION node */}
        <SectionNode icon="◈" type="contribution" id="sec_contribution" delay={0.05}>
          <div className="p-6 sm:p-8">
            <p
              className="font-mono text-[10px] uppercase tracking-widest mb-3"
              style={{ color: "var(--primary)" }}
            >
              // my contribution
            </p>
            <p
              className="font-sans text-base leading-relaxed"
              style={{ color: "var(--muted-foreground)" }}
            >
              {project.contribution}
            </p>
          </div>
        </SectionNode>

        <Connector />

        {/* KEY DECISIONS node */}
        <SectionNode icon="◇" type="decisions" id="sec_decisions">
          <div className="p-5 sm:p-6">
            <p
              className="font-mono text-[10px] uppercase tracking-widest mb-4"
              style={{ color: "var(--primary)" }}
            >
              // key decisions — {project.decisions.length} nodes
            </p>
            <div className="space-y-3">
              {project.decisions.map((d, i) => (
                <motion.div
                  key={i}
                  className="p-5 rounded-md"
                  style={{
                    background: dark ? "rgba(255,255,255,0.03)" : "rgba(26,24,22,0.03)",
                    border: "1px solid var(--border)",
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-20px" }}
                  transition={{ duration: 0.4, ease: "easeOut", delay: i * 0.08 }}
                >
                  <p
                    className="font-mono text-[9px] uppercase tracking-widest mb-2"
                    style={{ color: "var(--primary)", opacity: 0.8 }}
                  >
                    decision_{String(i + 1).padStart(2, "0")}
                  </p>
                  <h3
                    className="font-sans text-sm font-semibold mb-2"
                    style={{ color: "var(--foreground)" }}
                  >
                    {d.heading}
                  </h3>
                  <p
                    className="font-sans text-sm leading-relaxed"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {d.body}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </SectionNode>

        <Connector />

        {/* OUTCOME node */}
        <SectionNode icon="◉" type="outcome" id="sec_outcome" delay={0.05}>
          <div className="p-6 sm:p-8">
            <p
              className="font-mono text-[10px] uppercase tracking-widest mb-3"
              style={{ color: "var(--primary)" }}
            >
              // outcome
            </p>
            <p
              className="font-sans text-base leading-relaxed mb-6"
              style={{ color: "var(--muted-foreground)" }}
            >
              {project.outcome}
            </p>
            {project.outcomeImages.map((img, i) => (
              <FullImg key={i} id={img.id} caption={img.caption} bg={img.bg} alt={img.caption} />
            ))}
          </div>
        </SectionNode>

        <Connector />

        {/* NEXT PROJECT node */}
        <SectionNode icon="→" type="route · next" id="rte_next">
          <a
            href={`/work/${nextProject.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between p-6 sm:p-8"
          >
            <div>
              <p
                className="font-mono text-[10px] uppercase tracking-widest mb-2"
                style={{ color: "var(--muted-foreground)", opacity: 0.5 }}
              >
                next project
              </p>
              <h2
                className="font-serif text-2xl sm:text-3xl leading-tight"
                style={{ color: "var(--foreground)" }}
              >
                {nextProject.title}
              </h2>
              <p className="font-mono text-[11px] mt-1" style={{ color: "var(--muted-foreground)" }}>
                {nextProject.subtitle}
              </p>
            </div>
            <ArrowUpRight
              size={22}
              className="flex-shrink-0 ml-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              style={{ color: "var(--primary)" }}
            />
          </a>
        </SectionNode>

        {/* End port */}
        <div className="flex flex-col items-center pt-1">
          <div className="w-px" style={{ height: 20, background: "var(--connector)", opacity: 0.4 }} />
          <div
            className="font-mono text-[10px] px-3 py-1 rounded-full mt-1"
            style={{
              border: "1px solid var(--connector)",
              color: "var(--muted-foreground)",
              opacity: 0.4,
            }}
          >
            ● END
          </div>
        </div>
      </main>
    </div>
  );
}
