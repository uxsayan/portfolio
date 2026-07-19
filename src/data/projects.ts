export interface ProjectImage {
  id: string;
  src?: string;
  caption: string;
  bg: string;
  // which content section this image belongs after:
  // "overview" | "problem" | "research" | "personas" | "journey" | "ia"
  // | "ideation" | "onboarding" | "components" | "outcome" | "process"
  section?: string;
}

export interface Project {
  slug: string;
  number: string;
  title: string;
  subtitle: string;
  summary: string;
  tags: string[];
  imageId: string;
  imageSrc?: string;
  imageBg: string;
  year: string;
  role: string;
  problem: string;
  contribution: string;
  decisions: { heading: string; body: string }[];
  outcome: string;
  processImages: ProjectImage[];
  outcomeImages: ProjectImage[];
}

export const projects: Project[] = [
  {
    slug: "genai-traces",
    number: "01",
    title: "Gen AI Traces & Failures",
    subtitle: "IBM · Agent and LLM Observability",
    summary:
      "Full UX ownership on three Gen AI observability views inside IBM Instana — Task Hierarchy View, Trajectory, and Cycle Detection — closing the gap between 'the response was successful' and 'the system actually worked well'.",
    tags: ["GenAI", "LLM", "Enterprise Design"],
    imageId: "",
    imageSrc: "/images/Gen AI Traces & Failures/Hero.png",
    imageBg: "#050D1A",
    year: "2025",
    role: "UX Designer — IBM Instana, Kochi",
    problem:
      "A successful AI response can still hide a system that reasoned badly, looped expensively, or picked the wrong tool on the way to the right answer — invisible to every classic observability signal.",
    contribution:
      "Led UX design for Task Hierarchy View, Trajectory, and Cycle Detection — the three views that together make agentic AI systems traceable, not just measurable.",
    decisions: [],
    outcome:
      "Three shipped views that turn a clean-looking trace into a readable story: what the system saw and produced, the full reasoning path, and whether it was making progress or quietly spinning its wheels.",
    processImages: [],
    outcomeImages: [],
  },
  {
    slug: "business-impact",
    number: "02",
    title: "Business Impact",
    subtitle: "IBM Instana RUM — Conversion Goals & Funnels",
    summary:
      "Full UX-to-visual ownership on Conversion Goals and Funnels inside Instana's RUM Business Impact tab — redesigning how app owners define success, trace user drop-off, and correlate technical performance with business outcomes.",
    tags: ["Enterprise Design", "UX Design", "Observability"],
    imageId: "",
    imageSrc: undefined,
    imageBg: "#050D1A",
    year: "2025",
    role: "Visual & UX Designer — IBM Instana, Kochi",
    problem:
      "App owners, SREs, and developers had no way inside Instana to define what business success looked like — or to see where users dropped off on the path to that success. Conversion data lived outside the observability stack entirely.",
    contribution:
      "Led UX and visual design for Conversion Goals and Funnels — scoping, concepting, lo-fi exploration, full Carbon Design System execution, and clean handoff. User Journey (third epic) was a parallel workstream by another designer.",
    decisions: [],
    outcome:
      "A new Business Impact tab in Instana RUM that lets app owners define conversion goals, build expected funnels, and correlate drop-off with root-cause technical signals — without leaving the observability platform.",
    processImages: [],
    outcomeImages: [],
  },
  {
    slug: "ibm-instana",
    number: "03",
    title: "Instana Incident Remediation",
    subtitle: "IBM · Agentic AI · Observability",
    summary:
      "Contributed to the design of IBM Instana's agentic AI incident response — an iF Design Award submission. Instana uses autonomous AI agents to observe patterns, surface probable root causes in seconds, and guide engineers through remediation — cutting MTTR by up to 80%.",
    tags: ["Enterprise Design", "iF Design Award"],
    imageId: "",
    imageSrc: "/images/IBM IF Design Award/Hero.png",
    imageBg: "#0A0F1E",
    year: "2024",
    role: "Visual & UX Designer — IBM Instana, Kochi",
    problem:
      "Incident investigation in complex systems is often slow and overwhelming — engineers manually correlate metrics, logs, and traces across fragmented tools. Using agentic AI, Instana surfaces the probable root cause in seconds instead of hours, resolving incidents up to 80% faster.",
    contribution:
      "Contributed to the UX design of Instana's agentic AI incident response flows — including investigation reasoning, remediation script generation, AI summary handover, and the recommended actions catalog — as part of the iF Design Award submission.",
    decisions: [],
    outcome:
      "iF Design Award submission. Instana's agentic AI incident response reduces MTTR by up to 80%, turning reactive firefighting into intelligent, guided resolution.",
    processImages: [],
    outcomeImages: [],
  },
  {
    slug: "ibm-connector-workflow",
    number: "04",
    title: "Companion Panel",
    subtitle: "IBM Patterns — Connector Content Workflow",
    summary:
      "Led design on a workflow redesign for how connector documentation gets created, reviewed, and published across product, content, and engineering teams — replacing a manual, email-and-Slack-driven process with a structured, self-serve system.",
    tags: ["Workflow Design", "Cross-functional", "Systems Thinking"],
    imageId: "",
    imageSrc: "/images/Companion panel/Hero.png",
    imageBg: "#050D1A",
    year: "2025",
    role: "Visual & UX Designer — IBM Instana, Kochi",
    problem:
      "Connector information lived in three disconnected places — platform documentation, a shared spreadsheet, and the backend itself — with no single source of truth. Updating or publishing a connector meant manually chasing four different roles across product, service, connectivity, and content teams, with no visibility into who owned a request or where it stood.",
    contribution:
      "Led design on the full workflow redesign — from as-is analysis and persona research through journey mapping, hill statements, and to-be system design — delivered across a 3-week cross-functional IBM incubator.",
    decisions: [],
    outcome:
      "Cut connector publishing time from weeks to days, removed the dependency bottlenecks between four teams, and gave every stakeholder real-time visibility into a process that used to run entirely on manual follow-up.",
    processImages: [],
    outcomeImages: [],
  },
  {
    slug: "tusk",
    number: "05",
    title: "Tusk App",
    subtitle: "Oral Care App — Smart Toothbrush System",
    summary:
      "A sophisticated electric toothbrush system integrated with a companion app — using AI for bristle wear analysis, sensor-based usage tracking, and a subscription service for automated brush head replacement. Full UX from research through final design.",
    tags: ["UX Design", "App", "Product Design"],
    imageId: "",
    imageSrc: "/images/Tusk/That's a wrap. final ending image.png",
    imageBg: "#0E1A18",
    year: "2022",
    role: "UX Designer — Individual Project",
    problem:
      "Traditional toothbrushes and oral care routines lack personalised monitoring, maintenance, and comprehensive dental care support — leading to suboptimal oral health management. Users struggle to know when to replace brush heads, can't track long-term habits, and have no easy way to access dental guidance. The brief: design a smart toothbrush app that solves all of this in one system.",
    contribution:
      "Led the full Double Diamond process — from competitive benchmarking (Colgate, Oral-B, quip, Oclean) and a 40-person survey through personas, user journey mapping, information architecture, brainstorming, and multi-round UI iteration to a final component system and prototype. The survey shaped the feature set directly: demand for an Oral Toxicity Report (65%), battery/health tracking (55%), bristle tip health monitoring (45%), and family dental tracking (32.5%) informed every priority decision. Three homepage iterations were explored and critiqued internally before the final direction was locked.",
    decisions: [
      {
        heading: "AI bristle wear as the core differentiator",
        body:
          "Camera-based AR scanning of brush head condition — giving users a specific, actionable signal for when to reorder rather than generic \"replace every 3 months\" guidance. This justified the subscription model and made the hardware feel intelligent rather than passive.",
      },
      {
        heading: "Rewards and streaks as habit infrastructure",
        body:
          "Survey feedback pointed strongly toward gamification and reward-based habit building. The rewards system — streak-based unlocks, percentage discounts at milestone streaks, a gift box mechanism — was designed to make the routine feel worth maintaining, not just tracked. This directly addressed Mathew's persona insight: brushing shouldn't feel like a chore.",
      },
      {
        heading: "Family tracking as household product expansion",
        body:
          "Family & Friends dashboards create a household unit of adoption — parents monitoring children's brushing scores, shared accountability. This both increases product stickiness and expands the subscription model's natural footprint without requiring separate acquisition.",
      },
      {
        heading: "Dentist access within the app",
        body:
          "Integrating dentist discovery, direct support chat, and report storage inside TUSK — rather than linking out — collapses the gap between daily habit and professional care. The Care tab was designed so the path from 'my brushing score dropped' to 'book a dentist' is two taps.",
      },
    ],
    outcome:
      "A complete product design — hardware context (Gentle Pro toothbrush) and full companion app — covering onboarding, home dashboard, brush health monitoring, quarterly reports, family tracking, rewards, shop, and dentist access. The iterative rejection of three homepage directions (V1 through V3) led to a calmer, more balanced final palette that avoided the \"too green and overwhelming\" failure mode flagged during critique.",
    processImages: [
      { id: "", src: "/images/Tusk/Design process.png",                 caption: "Design process — Double Diamond overview",              bg: "#0E1A18", section: "overview"    },
      { id: "", src: "/images/Tusk/Inspiration.png",                    caption: "Inspiration board",                                     bg: "#0A1210", section: "overview"    },
      { id: "", src: "/images/Tusk/Inspirations.png",                   caption: "Extended inspirations",                                 bg: "#0A1210", section: "overview"    },
      { id: "", src: "/images/Tusk/Survey results.png",                  caption: "Survey results — 40 respondents, feature demand",       bg: "#0E1A18", section: "research"    },
      { id: "", src: "/images/Tusk/Persona One.png",                     caption: "Persona — Daniela Kuasaki, IT Professional, Amsterdam", bg: "#0A1210", section: "personas"    },
      { id: "", src: "/images/Tusk/Persona One-1.png",                   caption: "Persona — Mathew Thomas, Student, Boston",              bg: "#0A1210", section: "personas"    },
      { id: "", src: "/images/Tusk/Journey Map.png",                     caption: "User journey — Mathew's daily oral care routine",       bg: "#0E1A18", section: "journey"     },
      { id: "", src: "/images/Tusk/Information Architecture.png",        caption: "Information architecture — full app structure",         bg: "#0A1210", section: "ia"          },
      { id: "", src: "/images/Tusk/Home page, scratching the head.png",  caption: "Homepage ideation — V1, V2, V3 iterations",            bg: "#0E1A18", section: "ideation"    },
      { id: "", src: "/images/Tusk/Onboarding.png",                      caption: "Onboarding flow — splash to Bluetooth connection",      bg: "#0A1210", section: "onboarding"  },
      { id: "", src: "/images/Tusk/Components.png",                      caption: "Component system — icons, cards, charts, buttons",      bg: "#0E1A18", section: "components"  },
    ],
    outcomeImages: [
      { id: "", src: "/images/Tusk/That's a wrap. final ending image.png", caption: "TUSK — final design, Gentle Pro toothbrush + app", bg: "#0E1A18", section: "outcome" },
    ],
  },
  {
    slug: "ibm-design-challenge",
    number: "06",
    title: "Evo-connect",
    subtitle: "Design Challenge",
    summary:
      "IBM's hiring design challenge: design an iPhone app for a car manufacturer's upcoming flagship EV, giving users full vehicle control — research to final design in 12 hours.",
    tags: ["UX Design", "Mobile", "Sprint"],
    imageId: "",
    imageSrc: "/images/Design challenge/Tata cover.png",
    imageBg: "#12141C",
    year: "2023",
    role: "UX Designer — Solo Sprint",
    problem:
      "The brief: design an iPhone app for a car manufacturer's upcoming flagship EV, enabling full vehicle control through the phone. All scenarios had to be rationalized against desirability, feasibility, and viability. Full research-through-design process in 12 hours. The constraint wasn't just time — it was demonstrating structured UX thinking under pressure, from a blank slate to a coherent, considered design.",
    contribution:
      "The 12 hours were structured as a compressed version of the full UX process: research (competitive analysis, user persona definition, journey mapping), define (problem framing, key scenarios), ideate (information architecture, user flows), and design (wireframes to high-fidelity screens). The resulting app covers vehicle status at a glance, remote control features (climate, locking, charging), trip planning, and emergency scenarios — all rationalised through the desirability/feasibility/viability lens the brief specified.",
    decisions: [
      {
        heading: "Desirability/feasibility/viability as a design filter",
        body:
          "Rather than treating the IBM brief's evaluation framework as a post-design check, it was used as a generative constraint during ideation. Each feature decision was run through all three lenses: does anyone want this, can it actually be built, and does it make business sense for the manufacturer? Features that failed on any dimension were cut or reshaped.",
      },
      {
        heading: "Vehicle status as the home screen",
        body:
          "The most common EV app use case is status anxiety: is it charged, is it locked, where is it? The home screen was designed as a glanceable status view before anything else. Control features are one tap deeper — present and discoverable, but not competing with the primary use case.",
      },
      {
        heading: "Process documentation as the deliverable",
        body:
          "In a 12-hour sprint for a hiring panel, the process is as much the deliverable as the output. Every decision — including the ones that were rejected — was documented with brief rationale. This demonstrated structured thinking, not just design output.",
      },
    ],
    outcome:
      "The submission led directly to Sayan's role at IBM. The structured process documentation and the clarity of the feature hierarchy under a tight deadline were noted as differentiating factors in the evaluation.",
    processImages: [
      {
        id: "1611532736597-de2d4265fba3",
        caption: "12-hour sprint artefacts: persona, journey map, and information architecture",
        bg: "#12141C",
      },
    ],
    outcomeImages: [
      {
        id: "1542744094-3a31f272c490",
        caption: "EV iPhone app — home screen, remote control, and charging flows",
        bg: "#12141C",
      },
    ],
  },
];

export const testimonials = [
  {
    quote: "Understands conceptual dynamics of design.",
    full: "Sayan has a range of talents in designing that go beyond photography and filmmaking. A strong technical skill set paired with a genuine grasp of the conceptual side of design — watched over from Sayan's early days learning UX fundamentals.",
    name: "Prabodh Mishra",
    role: "Fashion Designer & Lecturer",
    company: "Academy of Fine Arts, Vienna",
  },
  {
    quote: "No nonsense approach on design choices.",
    full: "On a tight-deadline brochure project, Sayan delivered early. His straightforward attitude and decisiveness in design choices — no hedging, no unnecessary back-and-forth — made him exactly the kind of design partner you want under pressure.",
    name: "Sharat Sreekantan",
    role: "Senior Consultant & Shareholder",
    company: "Webbit21",
  },
  {
    quote: "Helping the client stand out.",
    full: "Sayan delivered tangible value in a short window and communicated clearly throughout. His work has a consistent point of view — he genuinely helps the client stand out rather than producing interchangeable output.",
    name: "Husain Ghadiali",
    role: "Co-founder",
    company: "Finbits",
  },
  {
    quote: "Quick understanding and adaptability.",
    full: "What stood out was adaptability on complex tasks, openness to feedback, and a consistently positive, above-and-beyond attitude. Sayan never needed scope explained twice, and he asked exactly the right questions upfront.",
    name: "Tarun Gupta",
    role: "Design Manager",
    company: "Pandora Finance",
  },
  {
    quote: "An ideal designer.",
    full: "Strong academic performance paired with the ability to grasp complex concepts quickly. Well-equipped to excel in any design environment — the kind of person you describe as an ideal designer because you can't think of a more precise way to put it.",
    name: "Varun Nair",
    role: "UX Designer & Educator",
    company: "",
  },
];
