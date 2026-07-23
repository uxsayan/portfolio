import { useParams, useNavigate } from "react-router";
import { useTheme } from "../hooks/useTheme";
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

export default function WorkPage() {
  const { slug } = useParams<{ slug: string }>();
  const { dark } = useTheme();
  const navigate = useNavigate();

  const project = projects.find((p) => p.slug === slug);

  const onBack = () => navigate("/");
  const onOpen = (s: string) => navigate(`/work/${s}`);

  const content = (() => {
    if (slug === "tusk")                   return <TuskModal           onClose={onBack} onOpen={onOpen} dark={dark} pageMode />;
    if (slug === "ibm-design-challenge")   return <IbmModal            onClose={onBack} onOpen={onOpen} dark={dark} pageMode />;
    if (slug === "ibm-connector-workflow") return <IBMConnectorModal   onClose={onBack} onOpen={onOpen} dark={dark} pageMode />;
    if (slug === "ibm-instana")            return <InstanaModal        onClose={onBack} onOpen={onOpen} dark={dark} pageMode />;
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

  return (
    <div
      className={cn("min-h-screen font-sans relative", dark ? "dark" : "")}
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      {/* Dot field background — same as homepage */}
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

      {/* Page content — centered box, same visual as modal box */}
      <div className="relative z-10 flex justify-center w-full">
        {content}
      </div>
    </div>
  );
}
