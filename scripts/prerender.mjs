/**
 * prerender.mjs
 *
 * Post-build script: generates a static HTML snapshot for each /work/:slug
 * route and writes it to dist/work/<slug>/index.html.
 *
 * Does NOT use a headless browser — it reads projects.ts data directly and
 * injects a rich <noscript> block (same pattern as inject-static.mjs) plus
 * correct per-page <title>, <meta description>, <link canonical>, OG tags,
 * and CreativeWork JSON-LD into a copy of dist/index.html.
 *
 * This makes every case study page crawlable by Google, Bing, and AI bots
 * (GPTBot, ClaudeBot, PerplexityBot) without any runtime behaviour change.
 * The live site still runs as a fully interactive React SPA.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST      = path.join(__dirname, "..", "dist");
const INDEX     = path.join(DIST, "index.html");

// ── Project data (mirrors src/data/projects.ts) ──────────────────────────────
const PROJECTS = [
  {
    slug:    "genai-traces",
    title:   "Gen AI Traces & Failures",
    subtitle:"IBM · Agent and LLM Observability",
    year:    "2026",
    role:    "UX Designer — IBM Instana, Kochi",
    tags:    ["GenAI", "LLM", "Enterprise Design"],
    summary: "Full UX ownership on three Gen AI observability views inside IBM Instana — Task Hierarchy View, Trajectory, and Cycle Detection — closing the gap between 'the response was successful' and 'the system actually worked well'.",
    problem: "A successful AI response can still hide a system that reasoned badly, looped expensively, or picked the wrong tool on the way to the right answer — invisible to every classic observability signal.",
    contribution: "Led UX design for Task Hierarchy View, Trajectory, and Cycle Detection — the three views that together make agentic AI systems traceable, not just measurable.",
    outcome: "Three shipped views that turn a clean-looking trace into a readable story: what the system saw and produced, the full reasoning path, and whether it was making progress or quietly spinning its wheels.",
  },
  {
    slug:    "business-impact",
    title:   "Business Impact",
    subtitle:"IBM Instana RUM — Conversion Goals & Funnels",
    year:    "2025",
    role:    "Visual & UX Designer — IBM Instana, Kochi",
    tags:    ["Enterprise Design", "UX Design", "Observability"],
    summary: "Full UX-to-visual ownership on Conversion Goals and Funnels inside Instana's RUM Business Impact tab — redesigning how app owners define success, trace user drop-off, and correlate technical performance with business outcomes.",
    problem: "App owners, SREs, and developers had no way inside Instana to define what business success looked like — or to see where users dropped off on the path to that success. Conversion data lived outside the observability stack entirely.",
    contribution: "Led UX and visual design for Conversion Goals and Funnels — scoping, concepting, lo-fi exploration, full Carbon Design System execution, and clean handoff.",
    outcome: "A new Business Impact tab in Instana RUM that lets app owners define conversion goals, build expected funnels, and correlate drop-off with root-cause technical signals — without leaving the observability platform.",
  },
  {
    slug:    "instana-incident-remediation",
    title:   "Instana Incident Remediation",
    subtitle:"IBM · Agentic AI · Observability",
    year:    "2025",
    role:    "Visual & UX Designer — IBM Instana, Kochi",
    tags:    ["Enterprise Design", "iF Design Award"],
    summary: "Contributed to the design of IBM Instana's agentic AI incident response — an iF Design Award submission. Instana uses autonomous AI agents to observe patterns, surface probable root causes in seconds, and guide engineers through remediation — cutting MTTR by up to 80%.",
    problem: "Incident investigation in complex systems is often slow and overwhelming — engineers manually correlate metrics, logs, and traces across fragmented tools.",
    contribution: "Contributed to the UX design of Instana's agentic AI incident response flows — including investigation reasoning, remediation script generation, AI summary handover, and the recommended actions catalog.",
    outcome: "iF Design Award submission. Instana's agentic AI incident response reduces MTTR by up to 80%, turning reactive firefighting into intelligent, guided resolution.",
  },
  {
    slug:    "ibm-connector-workflow",
    title:   "Companion Panel",
    subtitle:"IBM Patterns — Connector Content Workflow",
    year:    "2025",
    role:    "Visual & UX Designer — IBM Instana, Kochi",
    tags:    ["Workflow Design", "Cross-functional", "Systems Thinking"],
    summary: "Led design on a workflow redesign for how connector documentation gets created, reviewed, and published across product, content, and engineering teams — replacing a manual, email-and-Slack-driven process with a structured, self-serve system.",
    problem: "Connector information lived in three disconnected places — platform documentation, a shared spreadsheet, and the backend itself — with no single source of truth.",
    contribution: "Led design on the full workflow redesign — from as-is analysis and persona research through journey mapping, hill statements, and to-be system design — delivered across a 3-week cross-functional IBM incubator.",
    outcome: "Cut connector publishing time from weeks to days, removed the dependency bottlenecks between four teams, and gave every stakeholder real-time visibility into a process that used to run entirely on manual follow-up.",
  },
  {
    slug:    "tusk",
    title:   "Tusk App",
    subtitle:"Oral Care App — Smart Toothbrush System",
    year:    "2023",
    role:    "UX Designer — Individual Project",
    tags:    ["UX Design", "App", "Product Design"],
    summary: "A sophisticated electric toothbrush system integrated with a companion app — using AI for bristle wear analysis, sensor-based usage tracking, and a subscription service for automated brush head replacement.",
    problem: "Traditional toothbrushes and oral care routines lack personalised monitoring, maintenance, and comprehensive dental care support — leading to suboptimal oral health management.",
    contribution: "Led the full Double Diamond process — from competitive benchmarking and a 40-person survey through personas, user journey mapping, information architecture, brainstorming, and multi-round UI iteration.",
    outcome: "A complete product design — hardware context (Gentle Pro toothbrush) and full companion app — covering onboarding, home dashboard, brush health monitoring, quarterly reports, family tracking, rewards, shop, and dentist access.",
  },
  {
    slug:    "ibm-design-challenge",
    title:   "Evo-connect",
    subtitle:"Design Challenge",
    year:    "2023",
    role:    "UX Designer — Solo Sprint",
    tags:    ["UX Design", "Mobile", "Sprint"],
    summary: "IBM's hiring design challenge: design an iPhone app for a car manufacturer's upcoming flagship EV, giving users full vehicle control — research to final design in 12 hours.",
    problem: "The brief: design an iPhone app for a car manufacturer's upcoming flagship EV, enabling full vehicle control through the phone. All scenarios had to be rationalized against desirability, feasibility, and viability.",
    contribution: "Structured as a compressed full UX process: research, define, ideate, and design — covering vehicle status, remote control features, trip planning, and emergency scenarios.",
    outcome: "The submission led directly to Sayan's role at IBM. The structured process documentation and clarity of the feature hierarchy under a tight deadline were noted as differentiating factors.",
  },
];

// ── Per-route meta ────────────────────────────────────────────────────────────
const META = {
  "genai-traces":          { title: "Gen AI Traces & Failures — IBM Instana | Sayan Chakraborty",                          description: "Full UX ownership on Gen AI observability inside IBM Instana — Task Hierarchy View, Trajectory, and Cycle Detection. By Sayan Chakraborty, UX Designer at IBM.",               ogImage: "https://www.uxsayan.in/images/Gen AI Traces %26 Failures/Hero.png" },
  "business-impact":       { title: "Business Impact: Conversion Goals & Funnels — IBM Instana | Sayan Chakraborty",        description: "UX and visual design for Conversion Goals and Funnels inside Instana's RUM Business Impact tab — correlating user drop-off with technical performance. By Sayan Chakraborty.",  ogImage: "https://www.uxsayan.in/images/Business Impact EUM/Hero.png" },
  "instana-incident-remediation": { title: "Instana Incident Remediation — iF Design Award | Sayan Chakraborty",            description: "Contributed to IBM Instana's agentic AI incident response — an iF Design Award submission. Autonomous agents surface root causes in seconds, cutting MTTR by up to 80%.",          ogImage: "https://www.uxsayan.in/images/IBM IF Design Award/Hero.png" },
  "ibm-connector-workflow":{ title: "Companion Panel — IBM Connector Content Workflow | Sayan Chakraborty",                  description: "Led design on a cross-functional workflow redesign for connector documentation across product, content, and engineering teams at IBM. By Sayan Chakraborty.",                       ogImage: "https://www.uxsayan.in/images/Companion panel/Hero.png" },
  "tusk":                  { title: "Tusk App — Smart Oral Care System | Sayan Chakraborty",                                description: "Full UX for a smart toothbrush companion app — AI bristle wear analysis, sensor-based usage tracking, family dashboards, and dentist access. By Sayan Chakraborty.",           ogImage: "https://www.uxsayan.in/images/Tusk/Hero.png" },
  "ibm-design-challenge":  { title: "Evo-connect — IBM Design Challenge (12-Hour Sprint) | Sayan Chakraborty",              description: "IBM hiring design challenge: designed an iPhone app for a flagship EV with full vehicle control — research through final design in 12 hours. By Sayan Chakraborty.",             ogImage: "https://www.uxsayan.in/images/Design challenge/Tata cover.png" },
};

// ── Escape HTML ───────────────────────────────────────────────────────────────
function esc(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Build the static noscript content for a project ──────────────────────────
function buildNoscript(p) {
  return `
<noscript>
<style>
  .seo-work{font-family:system-ui,sans-serif;max-width:860px;margin:0 auto;padding:40px 24px;color:#1a1816;background:#f5f2ec;}
  .seo-work h1{font-size:1.8rem;margin:0 0 4px;}
  .seo-work h2{font-size:1rem;font-weight:600;margin:28px 0 8px;border-bottom:1px solid #e0ddd6;padding-bottom:4px;}
  .seo-work p,.seo-work li{font-size:0.9rem;line-height:1.65;margin:4px 0;}
  .seo-work .sub{font-size:0.95rem;color:#6b6560;margin:0 0 8px;}
  .seo-work .tags{display:flex;gap:6px;flex-wrap:wrap;margin:12px 0 24px;}
  .seo-work .tag{font-size:0.78rem;padding:2px 8px;border-radius:10px;background:#e8e4dd;color:#5a5650;}
  .seo-work a{color:#3b6fd4;}
</style>
<div class="seo-work">
  <h1>${esc(p.title)}</h1>
  <p class="sub">${esc(p.subtitle)} &middot; ${esc(p.role)} &middot; ${esc(p.year)}</p>
  <div class="tags">${p.tags.map(t => `<span class="tag">${esc(t)}</span>`).join("")}</div>

  <h2>Overview</h2>
  <p>${esc(p.summary)}</p>

  <h2>Problem</h2>
  <p>${esc(p.problem)}</p>

  <h2>Contribution</h2>
  <p>${esc(p.contribution)}</p>

  <h2>Outcome</h2>
  <p>${esc(p.outcome)}</p>

  <h2>Designer</h2>
  <p>Sayan Chakraborty (UXsayan) &mdash; UX &amp; Product Designer at IBM Instana, Kochi.</p>
  <p><a href="https://www.uxsayan.in">uxsayan.in</a> &middot; <a href="https://www.linkedin.com/in/sayanoriginals">LinkedIn</a></p>
</div>
</noscript>`;
}

// ── Build the CreativeWork JSON-LD for a project ─────────────────────────────
function buildJsonLd(p, slug) {
  const data = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "name": p.title,
    "description": p.summary,
    "author": {
      "@type": "Person",
      "name": "Sayan Chakraborty",
      "url": "https://www.uxsayan.in",
    },
    "dateCreated": p.year,
    "keywords": p.tags.join(", "),
    "url": `https://www.uxsayan.in/work/${slug}`,
    "isPartOf": {
      "@type": "WebSite",
      "name": "Sayan Chakraborty — UX & Product Designer",
      "url": "https://www.uxsayan.in",
    },
  };
  return `<script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n</script>`;
}

// ── Main ─────────────────────────────────────────────────────────────────────
if (!fs.existsSync(INDEX)) {
  console.error("prerender: dist/index.html not found — run vite build first.");
  process.exit(1);
}

const baseHtml = fs.readFileSync(INDEX, "utf-8");

for (const p of PROJECTS) {
  const { slug } = p;
  const meta = META[slug];
  if (!meta) continue;

  let html = baseHtml;

  // 1. Per-page <title>
  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${esc(meta.title)}</title>`
  );

  // 2. Meta description
  html = html.replace(
    /(<meta name="description" content=")[^"]*(")/,
    `$1${esc(meta.description)}$2`
  );

  // 3. Canonical
  html = html.replace(
    /(<link rel="canonical" href=")[^"]*(")/,
    `$1https://www.uxsayan.in/work/${slug}$2`
  );

  // 4. OG tags
  html = html.replace(/(<meta property="og:title" content=")[^"]*(")/,       `$1${esc(meta.title)}$2`);
  html = html.replace(/(<meta property="og:description" content=")[^"]*(")/,  `$1${esc(meta.description)}$2`);
  html = html.replace(/(<meta property="og:url" content=")[^"]*(")/,          `$1https://www.uxsayan.in/work/${slug}$2`);
  html = html.replace(/(<meta property="og:image" content=")[^"]*(")/,        `$1${meta.ogImage}$2`);

  // 5. Twitter tags
  html = html.replace(/(<meta name="twitter:title" content=")[^"]*(")/,       `$1${esc(meta.title)}$2`);
  html = html.replace(/(<meta name="twitter:description" content=")[^"]*(")/,  `$1${esc(meta.description)}$2`);
  html = html.replace(/(<meta name="twitter:image" content=")[^"]*(")/,        `$1${meta.ogImage}$2`);

  // 6. Inject CreativeWork JSON-LD before </head>
  html = html.replace("</head>", `${buildJsonLd(p, slug)}\n</head>`);

  // 7. Inject noscript static content after <body>
  html = html.replace("<body>", `<body>${buildNoscript(p)}`);

  // Write to dist/work/<slug>/index.html
  const outDir = path.join(DIST, "work", slug);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), html, "utf-8");

  console.log(`prerender: ✓ /work/${slug}`);
}

console.log("prerender: all routes done ✓");
