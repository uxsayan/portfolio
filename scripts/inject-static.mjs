/**
 * inject-static.mjs
 *
 * Post-build script: injects a <noscript> block of real page content into
 * dist/index.html so that crawlers/bots that don't execute JavaScript still
 * see the actual portfolio content (name, role, projects, about, experience).
 *
 * This does NOT alter any visible on-page content or layout.
 * It runs after `vite build` as part of the build pipeline.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distIndex = path.join(__dirname, "..", "dist", "index.html");

const staticContent = `
<noscript>
<style>
  .seo-static{font-family:system-ui,sans-serif;max-width:860px;margin:0 auto;padding:40px 24px;color:#1a1816;background:#f5f2ec;}
  .seo-static h1{font-size:2rem;margin:0 0 4px;}
  .seo-static h2{font-size:1.1rem;font-weight:600;margin:32px 0 8px;border-bottom:1px solid #e0ddd6;padding-bottom:4px;}
  .seo-static h3{font-size:0.95rem;font-weight:600;margin:16px 0 4px;}
  .seo-static p,.seo-static li{font-size:0.9rem;line-height:1.65;margin:4px 0;}
  .seo-static ul{padding-left:20px;margin:4px 0;}
  .seo-static .role{font-size:1rem;color:#6b6560;margin:0 0 24px;}
  .seo-static .proj{margin:12px 0;padding:12px;background:#fff;border-radius:6px;border:1px solid #e0ddd6;}
  .seo-static .proj-title{font-weight:600;font-size:0.95rem;}
  .seo-static .proj-sub{font-size:0.82rem;color:#6b6560;margin:2px 0 0;}
</style>
<div class="seo-static" aria-hidden="false">

  <h1>Sayan Chakraborty</h1>
  <p class="role">UX &amp; Product Designer &mdash; IBM &middot; Visiting Faculty, Avantika University</p>
  <p>
    I design enterprise SaaS and GenAI-driven products. Currently at IBM Instana working on
    observability experiences for GenAI systems. I also partner with startups through an
    independent design practice, and teach UX &amp; Visual Design as Visiting Faculty at
    Avantika University MIT Institute of Design.
  </p>

  <h2>Selected Work</h2>

  <div class="proj">
    <p class="proj-title">Gen AI Traces &amp; Failures</p>
    <p class="proj-sub">IBM Instana GenAI Observability &middot; UX Designer &middot; 2026</p>
    <p>
      Full UX ownership on three Gen AI observability views inside IBM Instana &mdash;
      Task Hierarchy View, Trajectory, and Cycle Detection &mdash; closing the gap between
      &ldquo;the response was successful&rdquo; and &ldquo;the system actually worked well.&rdquo;
    </p>
  </div>

  <div class="proj">
    <p class="proj-title">Business Impact &mdash; Conversion Goals &amp; Funnels</p>
    <p class="proj-sub">IBM Instana RUM &middot; UX Designer &middot; 2025</p>
    <p>
      Full UX-to-visual ownership on Conversion Goals and Funnels inside Instana&rsquo;s
      Real User Monitoring Business Impact tab &mdash; redesigning how app owners define
      success, trace user drop-off, and correlate technical performance with business outcomes.
    </p>
  </div>

  <div class="proj">
    <p class="proj-title">Instana Incident Remediation</p>
    <p class="proj-sub">IBM &middot; Agentic AI &middot; iF Design Award 2025 &middot; UX Designer</p>
    <p>
      Contributed to the design of IBM Instana&rsquo;s agentic AI incident response &mdash;
      an iF Design Award submission. Instana uses autonomous AI agents to observe patterns,
      surface probable root causes in seconds, and guide engineers through remediation,
      cutting MTTR by up to 80%.
    </p>
  </div>

  <div class="proj">
    <p class="proj-title">Companion Panel &mdash; IBM Innovation Incubator</p>
    <p class="proj-sub">IBM Patterns &middot; Connector Content Workflow &middot; 2025</p>
    <p>
      Led design on a workflow redesign for how connector documentation gets created,
      reviewed, and published across product, content, and engineering teams &mdash;
      replacing a manual, email-and-Slack-driven process with a structured, self-serve system.
    </p>
  </div>

  <div class="proj">
    <p class="proj-title">Tusk App</p>
    <p class="proj-sub">Oral Care App &middot; Smart Toothbrush System &middot; 2022</p>
    <p>
      A sophisticated electric toothbrush system integrated with a companion app &mdash;
      using AI for bristle wear analysis, sensor-based usage tracking, and a subscription
      service for automated brush head replacement. Full UX from research through final design.
    </p>
  </div>

  <div class="proj">
    <p class="proj-title">Evo-connect</p>
    <p class="proj-sub">IBM Design Challenge &middot; 12-Hour Sprint &middot; 2023</p>
    <p>
      IBM&rsquo;s hiring design challenge: design an iPhone app for a car manufacturer&rsquo;s
      upcoming flagship EV, giving users full vehicle control &mdash; research to final design
      in 12 hours.
    </p>
  </div>

  <h2>Experience</h2>

  <h3>IBM Instana &mdash; UX Designer (2024 &ndash; present)</h3>
  <ul>
    <li>Designed enterprise experiences across GenAI Observability, Business Monitoring, and Real User Monitoring (RUM).</li>
    <li>Transformed complex observability workflows into intuitive, data-driven user experiences.</li>
    <li>Built reusable patterns with the IBM Carbon Design System to drive consistency and scalability.</li>
  </ul>

  <h3>Independent Design Practice (Since 2021)</h3>
  <p>
    UX, Visual &amp; Product Design across Fintech, Enterprise, EdTech, and Web3 &mdash;
    GrowthGear, Finbits, Aconomy Foundation, Debound, Touch Computing, T&Uuml;SK.
  </p>

  <h3>Visiting Faculty &amp; Course Lead &mdash; Avantika University &middot; MIT Institute of Design</h3>
  <p>
    Designed and delivered a Visual &amp; UI Design course combining theory with hands-on
    Figma exercises. Mentored students through a final exhibition with critique focused on
    clarity, usability, accessibility, and real-world design decisions.
  </p>

  <h2>About</h2>
  <p>
    I enjoy building products as much as I enjoy understanding people.
    B.Des in User Experience Design &mdash; Avantika University MIT Institute of Design,
    Silver Medalist.
  </p>

  <h2>Contact</h2>
  <ul>
    <li>Email: <a href="mailto:ux.sayan@gmail.com">ux.sayan@gmail.com</a></li>
    <li>LinkedIn: <a href="https://linkedin.com/in/sayanoriginals">linkedin.com/in/sayanoriginals</a></li>
  </ul>

</div>
</noscript>`;

if (!fs.existsSync(distIndex)) {
  console.error("inject-static: dist/index.html not found — run vite build first.");
  process.exit(1);
}

let html = fs.readFileSync(distIndex, "utf-8");

// Avoid double-injection on incremental builds
if (html.includes("seo-static")) {
  console.log("inject-static: static content already present, skipping.");
  process.exit(0);
}

// Inject immediately after <body>
html = html.replace("<body>", `<body>${staticContent}`);

fs.writeFileSync(distIndex, html, "utf-8");
console.log("inject-static: static noscript content injected into dist/index.html ✓");
