import { useEffect, useRef, useState, useCallback } from "react";
import { useTheme } from "../hooks/useTheme";
import { useIsMobile } from "../app/components/ui/use-mobile";
import { X, ArrowLeft, GraduationCap, MapPin, Briefcase, Eye, Home, Globe, ChevronLeft, ChevronRight } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ─── Location data ─────────────────────────────────────────────────────────────

type MarkerType = "lived" | "studied" | "working" | "visited";

interface Waypoint {
  id: string;
  name: string;
  tag: string;
  lat: number;
  lng: number;
  type: MarkerType;
  subOf?: string;
}

const WAYPOINTS: Waypoint[] = [
  // Lived
  { id: "kolkata",      name: "Kolkata",              tag: "kol_0",  lat: 22.5726,  lng: 88.3639,  type: "lived" },
  { id: "khopoli",      name: "Khopoli",              tag: "khp_1",  lat: 18.7788,  lng: 73.3458,  type: "lived" },
  { id: "boisar",       name: "Boisar",               tag: "bsr_2",  lat: 19.8077,  lng: 72.7538,  type: "lived" },
  { id: "chittorgarh",  name: "Chittorgarh",          tag: "chg_3",  lat: 24.8887,  lng: 74.6269,  type: "lived" },
  { id: "panvel",       name: "Panvel",               tag: "pnv_4",  lat: 18.9894,  lng: 73.1175,  type: "lived" },
  { id: "sg-central",   name: "Singapore (Central)",  tag: "sg_c_5", lat: 1.3521,   lng: 103.8198, type: "lived", subOf: "Singapore" },
  { id: "sg-east",      name: "Singapore (East)",     tag: "sg_e_5", lat: 1.3644,   lng: 103.9915, type: "lived", subOf: "Singapore" },
  { id: "navi-mumbai",  name: "Navi Mumbai",          tag: "vsh_6",  lat: 19.0330,  lng: 73.0297,  type: "lived" },
  { id: "gandhinagar",  name: "Gandhinagar, Gujarat", tag: "gnd_7",  lat: 23.2156,  lng: 72.6369,  type: "studied" },
  { id: "ujjain",       name: "Ujjain",               tag: "ujj_8",  lat: 23.1765,  lng: 75.7885,  type: "studied" },
  { id: "kochi-main",   name: "Kochi (Ernakulam)",    tag: "kch_9",  lat: 9.9312,   lng: 76.2673,  type: "working" },
  // Studied
  // Visited
  { id: "goa",          name: "Goa",                   tag: "goa_v",  lat: 15.2993,  lng: 74.1240,  type: "visited" },
  { id: "mussoorie",    name: "Mussoorie",              tag: "mus_v",  lat: 30.4598,  lng: 78.0644,  type: "visited" },
  { id: "rishikesh",    name: "Rishikesh",              tag: "rsh_v",  lat: 30.0869,  lng: 78.2676,  type: "visited" },
  { id: "pondicherry",  name: "Pondicherry",            tag: "pdy_v",  lat: 11.9416,  lng: 79.8083,  type: "visited" },
  { id: "jaipur",       name: "Jaipur",                tag: "jpr_v",  lat: 26.9124,  lng: 75.7873,  type: "visited" },
  { id: "kutchh",       name: "Kutchh",                tag: "ktc_v",  lat: 23.7337,  lng: 69.8597,  type: "visited" },
  { id: "puri",         name: "Puri (Odisha)",          tag: "puri_v", lat: 19.8135,  lng: 85.8312,  type: "visited" },
  { id: "colombo",      name: "Colombo",               tag: "clm_v",  lat: 6.9271,   lng: 79.8612,  type: "visited" },
  { id: "kandy",        name: "Kandy",                 tag: "knd_v",  lat: 7.2906,   lng: 80.6337,  type: "visited" },
  { id: "weligama",     name: "Weligama",              tag: "wlg_v",  lat: 5.9741,   lng: 80.4294,  type: "visited" },
  { id: "galle",        name: "Galle",                 tag: "gll_v",  lat: 6.0535,   lng: 80.2210,  type: "visited" },
  { id: "phuket",       name: "Phuket",                tag: "phk_v",  lat: 7.8804,   lng: 98.3923,  type: "visited" },
  { id: "bangkok",      name: "Bangkok",               tag: "bkk_v",  lat: 13.7563,  lng: 100.5018, type: "visited" },
  { id: "varkala",      name: "Varkala",               tag: "vrk_v",  lat: 8.7379,   lng: 76.7163,  type: "visited" },
  { id: "wayanad",      name: "Wayanad",               tag: "wyn_v",  lat: 11.6854,  lng: 76.1320,  type: "visited" },
  { id: "athirapilly",  name: "Athirapilly",           tag: "ath_v",  lat: 10.2867,  lng: 76.5694,  type: "visited" },
  { id: "alleppey",     name: "Alleppey (Backwaters)",  tag: "alp_v",  lat: 9.4981,   lng: 76.3388,  type: "visited" },
];

// ─── Tile layers per theme (all free, no API key) ─────────────────────────────
// Using OpenStreetMap and CartoDB tiles — both free & no key required.

const TILE_LAYERS: Record<string, { url: string; attribution: string; filter?: string }> = {
  "default-dark": {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CartoDB</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    filter: "brightness(0.85) hue-rotate(10deg)",
  },
  "default-light": {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CartoDB</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
  },
  "ocean-abyss": {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CartoDB</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    filter: "brightness(0.8) hue-rotate(180deg) saturate(1.4)",
  },
  "deep-forest": {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CartoDB</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    filter: "brightness(0.75) hue-rotate(80deg) saturate(1.2)",
  },
  "lemon-fizz": {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CartoDB</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    filter: "sepia(0.25) saturate(0.9) brightness(1.05)",
  },
  "sakura": {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CartoDB</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    filter: "hue-rotate(290deg) saturate(0.5) brightness(1.1)",
  },
};

// ─── Accent colors per theme ───────────────────────────────────────────────────

const THEME_ACCENTS: Record<string, { accent: string; lived: string; studied: string; working: string; visited: string }> = {
  "default-dark":  { accent: "#E0954A", lived: "#E0954A", studied: "#4a8fe8", working: "#5cd89a", visited: "#6b6560" },
  "default-light": { accent: "#C77B32", lived: "#C77B32", studied: "#2563eb", working: "#16a34a", visited: "#9ca3af" },
  "ocean-abyss":   { accent: "#3B9FD4", lived: "#3B9FD4", studied: "#a78bfa", working: "#34d399", visited: "#3a5a7a" },
  "deep-forest":   { accent: "#5DB87A", lived: "#5DB87A", studied: "#60a5fa", working: "#fbbf24", visited: "#4a6a4c" },
  "lemon-fizz":    { accent: "#E6A800", lived: "#E6A800", studied: "#16a34a", working: "#0ea5e9", visited: "#9ca3af" },
  "sakura":        { accent: "#B5596A", lived: "#B5596A", studied: "#3D4A6B", working: "#16a34a", visited: "#a0a0b0" },
};

// ─── SVG marker factories ──────────────────────────────────────────────────────
// Each returns a self-contained SVG string rendered via L.divIcon.
// All icons are 26×26 (visited: 22×22) with a rounded-rect badge + pixel icon inside.

// ── Lucide icon SVG inner content (extracted at 24×24 viewBox, stroke-based) ──
// These are the exact same paths Lucide renders in the rest of the site.

const LUCIDE_HOME = `<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>`;
const LUCIDE_BRIEFCASE = `<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>`;
const LUCIDE_MAPPIN = `<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>`;
const LUCIDE_GRAD = `<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>`;
const LUCIDE_EYE = `<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>`;
const LUCIDE_GLOBE = `<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>`;

// ── Marker: solid circle with white Lucide icon inside ────────────────────────

function markerBadge(fill: string, lucideInner: string, size = 26, pulse = false): string {
  const r = size / 2;
  const pulseRing = pulse
    ? `<circle cx="${r}" cy="${r}" r="${r}" fill="${fill}" opacity="0.15">
         <animate attributeName="r" values="${r};${r + 9};${r}" dur="1.8s" repeatCount="indefinite"/>
         <animate attributeName="opacity" values="0.15;0;0.15" dur="1.8s" repeatCount="indefinite"/>
       </circle>`
    : "";
  const pad = 6;
  const iconSize = size - pad * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${pulseRing}
    <circle cx="${r}" cy="${r}" r="${r - 1}" fill="${fill}"/>
    <circle cx="${r}" cy="${r}" r="${r - 1}" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1"/>
    <g transform="translate(${pad},${pad}) scale(${iconSize / 24})"
       fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      ${lucideInner}
    </g>
  </svg>`;
}

function makeMarkerIcon(wp: Waypoint, fill: string): [string, number] {
  // Special individual overrides first
  if (wp.id === "navi-mumbai")
    return [markerBadge(fill, LUCIDE_HOME, 26), 26];
  if (wp.id === "kochi-main")
    return [markerBadge(fill, LUCIDE_BRIEFCASE, 26, true), 26];
  if (wp.id === "sg-central" || wp.id === "sg-east")
    return [markerBadge(fill, LUCIDE_GLOBE, 26), 26];

  // Type-based defaults
  if (wp.type === "visited")  return [markerBadge(fill, LUCIDE_EYE,       20), 20];
  if (wp.type === "studied")  return [markerBadge(fill, LUCIDE_GRAD,      26), 26];
  if (wp.type === "lived")    return [markerBadge(fill, LUCIDE_MAPPIN,    26), 26];
  if (wp.type === "working")  return [markerBadge(fill, LUCIDE_BRIEFCASE, 26, true), 26];
  return [markerBadge(fill, LUCIDE_MAPPIN, 26), 26];
}

function makeDivIcon(svgStr: string, size: [number, number]): L.DivIcon {
  return L.divIcon({
    html: svgStr,
    className: "",
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1] / 2],
  });
}

// ─── Photo card markers (Apple Maps style) ────────────────────────────────────

interface PhotoWaypoint {
  id: string;        // must match a WAYPOINTS id
  photos: string[];  // paths under /images/Journey/ — first is primary
  label: string;     // short label shown on card
}

// ── Photos live in public/images/Journey/<City>/ ─────────────────────────────
// Drop images into the matching folder and populate the photos array.
// Locations with photos:[] get no photo card — just the regular circle marker popup.
export const PHOTO_WAYPOINTS: PhotoWaypoint[] = [
  // ── Lived ──────────────────────────────────────────────────────────────────
  {
    id: "kolkata",
    label: "Kolkata",
    photos: [
      "/images/Journey/Kolkata/Kolkata_1.jpg",
      "/images/Journey/Kolkata/Kolkata_2.jpg",
      "/images/Journey/Kolkata/Kolkata_3.jpg",
      "/images/Journey/Kolkata/Kolkata_4.jpg",
      "/images/Journey/Kolkata/Kolkata_5.jpg",
      "/images/Journey/Kolkata/Kolkata_6.jpg",
      "/images/Journey/Kolkata/Kolkata_7.jpg",
      "/images/Journey/Kolkata/Kolkata_8.jpg",
      "/images/Journey/Kolkata/Kolkata_9.jpg",
      "/images/Journey/Kolkata/Kolkata_10.jpg",
      "/images/Journey/Kolkata/Kolkata_11.jpg",
      "/images/Journey/Kolkata/Kolkata_12.jpg",
      "/images/Journey/Kolkata/Kolkata_13.jpg",
      "/images/Journey/Kolkata/Kolkata_14.jpg",
      "/images/Journey/Kolkata/Kolkata_15.jpg",
      "/images/Journey/Kolkata/Kolkata_16.jpg",
      "/images/Journey/Kolkata/Kolkata_17.jpg",
      "/images/Journey/Kolkata/Kolkata_18.jpg",
      "/images/Journey/Kolkata/Kolkata_19.jpg",
      "/images/Journey/Kolkata/Kolkata_20.jpg",
      "/images/Journey/Kolkata/Kolkata_21.jpg",
      "/images/Journey/Kolkata/Kolkata_22.jpg",
      "/images/Journey/Kolkata/Kolkata_23.jpg",
      "/images/Journey/Kolkata/Kolkata_24.jpg",
      "/images/Journey/Kolkata/Kolkata_25.jpg",
    ],
  },
  { id: "khopoli",     label: "Khopoli",              photos: [] },
  { id: "boisar",      label: "Boisar",               photos: [] },
  { id: "chittorgarh", label: "Chittorgarh",          photos: [] },
  { id: "panvel",      label: "Panvel",               photos: [] },
  {
    id: "navi-mumbai",
    label: "Navi Mumbai",
    photos: [
      "/images/Journey/Navi Mumbai/navi_mumbai_1.jpeg",
      "/images/Journey/Navi Mumbai/navi_mumbai_food_1.jpeg",
      "/images/Journey/Navi Mumbai/navi_mumbai_2.jpeg",
      "/images/Journey/Navi Mumbai/navi_mumbai_12.jpeg",
      "/images/Journey/Navi Mumbai/navi_mumbai_food_2.jpeg",
      "/images/Journey/Navi Mumbai/navi_mumbai_3.jpeg",
      "/images/Journey/Navi Mumbai/navi_mumbai_food_3.jpeg",
      "/images/Journey/Navi Mumbai/navi_mumbai_13.jpeg",
      "/images/Journey/Navi Mumbai/navi_mumbai_4.jpeg",
      "/images/Journey/Navi Mumbai/navi_mumbai_food_4.jpeg",
      "/images/Journey/Navi Mumbai/navi_mumbai_5.jpeg",
      "/images/Journey/Navi Mumbai/navi_mumbai_14.jpeg",
      "/images/Journey/Navi Mumbai/navi_mumbai_food_5.jpeg",
      "/images/Journey/Navi Mumbai/navi_mumbai_6.jpeg",
      "/images/Journey/Navi Mumbai/navi_mumbai_food_6.jpeg",
      "/images/Journey/Navi Mumbai/navi_mumbai_15.jpeg",
      "/images/Journey/Navi Mumbai/navi_mumbai_7.jpeg",
      "/images/Journey/Navi Mumbai/navi_mumbai_food_7.jpeg",
      "/images/Journey/Navi Mumbai/navi_mumbai_16.jpeg",
      "/images/Journey/Navi Mumbai/navi_mumbai_food_8.jpeg",
      "/images/Journey/Navi Mumbai/navi_mumbai_9.jpeg",
      "/images/Journey/Navi Mumbai/navi_mumbai_food_9.jpeg",
      "/images/Journey/Navi Mumbai/navi_mumbai_10.jpeg",
      "/images/Journey/Navi Mumbai/navi_mumbai_food_10.jpeg",
      "/images/Journey/Navi Mumbai/navi_mumbai_11.jpeg",
    ],
  },
  { id: "sg-central",  label: "Singapore (Central)",  photos: [] },
  { id: "sg-east",     label: "Singapore (East)",     photos: [] },
  {
    id: "kochi-main",
    label: "Kochi · Home & Work",
    photos: [
      "/images/Journey/Kochi/Kochi_1.jpg",
      "/images/Journey/Kochi/Kochi_2.jpg",
      "/images/Journey/Kochi/Kochi_3.jpg",
      "/images/Journey/Kochi/Kochi_4.jpg",
      "/images/Journey/Kochi/Kochi_5.jpg",
      "/images/Journey/Kochi/Kochi_6.jpg",
      "/images/Journey/Kochi/Kochi_7.jpg",
      "/images/Journey/Kochi/Kochi_8.jpg",
      "/images/Journey/Kochi/Kochi_9.jpg",
      "/images/Journey/Kochi/Kochi_10.jpg",
      "/images/Journey/Kochi/Kochi_11.jpg",
      "/images/Journey/Kochi/Kochi_12.jpg",
      "/images/Journey/Kochi/Kochi_13.jpg",
      "/images/Journey/Kochi/Kochi_14.jpg",
      "/images/Journey/Kochi/Kochi_15.jpg",
      "/images/Journey/Kochi/Kochi_16.jpg",
      "/images/Journey/Kochi/Kochi_17.jpg",
      "/images/Journey/Kochi/Kochi_18.jpg",
      "/images/Journey/Kochi/Kochi_19.jpg",
      "/images/Journey/Kochi/Kochi_20.jpg",
      "/images/Journey/Kochi/Kochi_21.jpg",
      "/images/Journey/Kochi/Kochi_22.jpg",
      "/images/Journey/Kochi/Kochi_23.jpg",
      "/images/Journey/Kochi/Kochi_24.jpg",
      "/images/Journey/Kochi/Kochi_25.jpg",
      "/images/Journey/Kochi/Kochi_26.jpg",
      "/images/Journey/Kochi/Kochi_27.jpg",
      "/images/Journey/Kochi/Kochi_28.jpg",
      "/images/Journey/Kochi/Kochi_29.jpg",
      "/images/Journey/Kochi/Kochi_30.jpg",
      "/images/Journey/Kochi/Kochi_31.jpg",
      "/images/Journey/Kochi/Kochi_32.jpg",
      "/images/Journey/Kochi/Kochi_33.jpg",
      "/images/Journey/Kochi/Kochi_34.jpg",
      "/images/Journey/Kochi/Kochi_35.jpg",
      "/images/Journey/Kochi/Kochi_36.jpg",
      "/images/Journey/Kochi/Kochi_37.jpg",
      "/images/Journey/Kochi/Kochi_38.jpg",
      "/images/Journey/Kochi/Kochi_39.jpg",
      "/images/Journey/Kochi/Kochi_40.jpg",
      "/images/Journey/Kochi/Kochi_41.jpg",
      "/images/Journey/Kochi/Kochi_42.jpg",
      "/images/Journey/Kochi/Kochi_43.jpg",
      "/images/Journey/Kochi/Kochi_44.jpg",
      "/images/Journey/Kochi/Kochi_45.jpg",
      "/images/Journey/Kochi/Kochi_46.jpg",
      "/images/Journey/Kochi/Kochi_47.jpg",
      "/images/Journey/Kochi/Kochi_48.jpg",
      "/images/Journey/Kochi/Kochi_49.jpg",
      "/images/Journey/Kochi/Kochi_50.jpg",
      "/images/Journey/Kochi/Kochi_51.jpg",
      "/images/Journey/Kochi/Kochi_52.jpg",
      "/images/Journey/Kochi/Kochi_53.jpg",
      "/images/Journey/Kochi/Kochi_54.jpg",
      "/images/Journey/Kochi/Kochi_55.jpg",
      "/images/Journey/Kochi/Kochi_56.jpg",
      "/images/Journey/Kochi/Kochi_57.jpg",
      "/images/Journey/Kochi/Kochi_58.jpg",
      "/images/Journey/Kochi/Kochi_59.jpg",
      "/images/Journey/Kochi/Kochi_60.jpg",
      "/images/Journey/Kochi/Kochi_61.jpg",
      "/images/Journey/Kochi/Kochi_62.jpg",
    ],
  },
  // ── Studied ────────────────────────────────────────────────────────────────
  { id: "gandhinagar", label: "Gandhinagar",          photos: [] },
  {
    id: "ujjain",
    label: "Ujjain",
    photos: [
      "/images/Journey/Ujjain/Ujjain_1.jpeg",
      "/images/Journey/Ujjain/Ujjain_2.jpeg",
      "/images/Journey/Ujjain/Ujjain_3.jpeg",
      "/images/Journey/Ujjain/Ujjain_4.jpeg",
      "/images/Journey/Ujjain/Ujjain_5.jpeg",
      "/images/Journey/Ujjain/Ujjain_6.jpeg",
      "/images/Journey/Ujjain/Ujjain_7.jpeg",
    ],
  },
  // ── Visited ────────────────────────────────────────────────────────────────
  {
    id: "goa",
    label: "Goa",
    photos: [
      "/images/Journey/Goa/Goa_1.jpeg",
      "/images/Journey/Goa/Goa_2.jpeg",
      "/images/Journey/Goa/Goa_3.jpeg",
      "/images/Journey/Goa/Goa_4.jpeg",
      "/images/Journey/Goa/Goa_5.jpeg",
      "/images/Journey/Goa/Goa_6.jpeg",
      "/images/Journey/Goa/Goa_7.jpeg",
      "/images/Journey/Goa/Goa_8.jpeg",
    ],
  },
  {
    id: "mussoorie",
    label: "Mussoorie",
    photos: [
      "/images/Journey/Musoorie/Mussoorie_1.jpg",
      "/images/Journey/Musoorie/Mussoorie_2.jpg",
      "/images/Journey/Musoorie/Mussoorie_3.jpg",
      "/images/Journey/Musoorie/Mussoorie_4.jpg",
      "/images/Journey/Musoorie/Mussoorie_5.jpg",
      "/images/Journey/Musoorie/Mussoorie_6.jpg",
      "/images/Journey/Musoorie/Mussoorie_7.jpg",
      "/images/Journey/Musoorie/Mussoorie_8.jpg",
      "/images/Journey/Musoorie/Mussoorie_9.jpg",
      "/images/Journey/Musoorie/Mussoorie_10.jpg",
      "/images/Journey/Musoorie/Mussoorie_11.jpg",
      "/images/Journey/Musoorie/Mussoorie_12.jpg",
      "/images/Journey/Musoorie/Mussoorie_13.jpg",
      "/images/Journey/Musoorie/Mussoorie_14.jpg",
      "/images/Journey/Musoorie/Mussoorie_15.jpg",
      "/images/Journey/Musoorie/Mussoorie_16.jpg",
      "/images/Journey/Musoorie/Mussoorie_17.jpg",
      "/images/Journey/Musoorie/Mussoorie_18.jpg",
      "/images/Journey/Musoorie/Mussoorie_19.jpg",
      "/images/Journey/Musoorie/Mussoorie_20.jpg",
      "/images/Journey/Musoorie/Mussoorie_21.jpg",
      "/images/Journey/Musoorie/Mussoorie_22.jpg",
      "/images/Journey/Musoorie/Mussoorie_23.jpg",
      "/images/Journey/Musoorie/Mussoorie_24.jpg",
    ],
  },
  {
    id: "rishikesh",
    label: "Rishikesh",
    photos: [
      "/images/Journey/Rhishikesh/Rishikesh_1.jpg",
      "/images/Journey/Rhishikesh/Rishikesh_2.jpg",
      "/images/Journey/Rhishikesh/Rishikesh_3.jpg",
      "/images/Journey/Rhishikesh/Rishikesh_4.jpg",
      "/images/Journey/Rhishikesh/Rishikesh_5.jpg",
      "/images/Journey/Rhishikesh/Rishikesh_6.jpg",
      "/images/Journey/Rhishikesh/Rishikesh_7.jpg",
      "/images/Journey/Rhishikesh/Rishikesh_8.jpg",
      "/images/Journey/Rhishikesh/Rishikesh_9.jpg",
      "/images/Journey/Rhishikesh/Rishikesh_10.jpg",
      "/images/Journey/Rhishikesh/Rishikesh_11.jpg",
      "/images/Journey/Rhishikesh/Rishikesh_12.jpg",
      "/images/Journey/Rhishikesh/Rishikesh_13.jpg",
      "/images/Journey/Rhishikesh/Rishikesh_14.jpg",
      "/images/Journey/Rhishikesh/Rishikesh_15.jpg",
    ],
  },
  {
    id: "pondicherry",
    label: "Pondicherry",
    photos: [
      "/images/Journey/Pondicherry/Pondicherry_1.jpg",
      "/images/Journey/Pondicherry/Pondicherry_2.jpg",
      "/images/Journey/Pondicherry/Pondicherry_3.jpg",
      "/images/Journey/Pondicherry/Pondicherry_4.jpg",
      "/images/Journey/Pondicherry/Pondicherry_5.jpg",
      "/images/Journey/Pondicherry/Pondicherry_6.jpg",
      "/images/Journey/Pondicherry/Pondicherry_7.jpg",
      "/images/Journey/Pondicherry/Pondicherry_8.jpg",
      "/images/Journey/Pondicherry/Pondicherry_9.jpg",
      "/images/Journey/Pondicherry/Pondicherry_10.jpg",
      "/images/Journey/Pondicherry/Pondicherry_11.jpg",
      "/images/Journey/Pondicherry/Pondicherry_12.jpg",
      "/images/Journey/Pondicherry/Pondicherry_13.jpg",
      "/images/Journey/Pondicherry/Pondicherry_14.jpg",
      "/images/Journey/Pondicherry/Pondicherry_15.jpg",
      "/images/Journey/Pondicherry/Pondicherry_16.jpg",
      "/images/Journey/Pondicherry/Pondicherry_17.jpg",
      "/images/Journey/Pondicherry/Pondicherry_18.jpg",
    ],
  },
  { id: "jaipur",      label: "Jaipur",               photos: [] },
  {
    id: "kutchh",
    label: "Kutchh",
    photos: [
      "/images/Journey/Kutchh/Kutchh_1.jpg",
      "/images/Journey/Kutchh/Kutchh_2.jpg",
      "/images/Journey/Kutchh/Kutchh_3.jpg",
      "/images/Journey/Kutchh/Kutchh_4.jpg",
      "/images/Journey/Kutchh/Kutchh_5.jpg",
      "/images/Journey/Kutchh/Kutchh_6.jpg",
      "/images/Journey/Kutchh/Kutchh_7.jpg",
      "/images/Journey/Kutchh/Kutchh_8.jpg",
      "/images/Journey/Kutchh/Kutchh_9.jpg",
      "/images/Journey/Kutchh/Kutchh_10.jpg",
    ],
  },
  { id: "puri",        label: "Puri (Odisha)",         photos: [] },
  {
    id: "colombo",
    label: "Colombo",
    photos: [
      "/images/Journey/Sri Lanka/Colombo/Colombo_1.jpeg",
      "/images/Journey/Sri Lanka/Colombo/Colombo_2.jpeg",
      "/images/Journey/Sri Lanka/Colombo/Colombo_3.jpeg",
      "/images/Journey/Sri Lanka/Colombo/Colombo_4.jpeg",
      "/images/Journey/Sri Lanka/Colombo/Colombo_5.jpeg",
      "/images/Journey/Sri Lanka/Colombo/Colombo_6.jpeg",
      "/images/Journey/Sri Lanka/Colombo/Colombo_7.jpeg",
      "/images/Journey/Sri Lanka/Colombo/Colombo_8.jpeg",
      "/images/Journey/Sri Lanka/Colombo/Colombo_9.jpeg",
      "/images/Journey/Sri Lanka/Colombo/Colombo_10.jpeg",
      "/images/Journey/Sri Lanka/Colombo/Colombo_11.jpeg",
      "/images/Journey/Sri Lanka/Colombo/Colombo_12.jpeg",
      "/images/Journey/Sri Lanka/Colombo/Colombo_13.jpeg",
      "/images/Journey/Sri Lanka/Colombo/Colombo_14.jpeg",
    ],
  },
  {
    id: "kandy",
    label: "Kandy",
    photos: [
      "/images/Journey/Sri Lanka/Kandy/Kandy_1.jpeg",
      "/images/Journey/Sri Lanka/Kandy/Kandy_2.jpeg",
      "/images/Journey/Sri Lanka/Kandy/Kandy_3.jpeg",
      "/images/Journey/Sri Lanka/Kandy/Kandy_4.jpeg",
      "/images/Journey/Sri Lanka/Kandy/Kandy_5.jpeg",
      "/images/Journey/Sri Lanka/Kandy/Kandy_6.jpeg",
      "/images/Journey/Sri Lanka/Kandy/Kandy_7.jpeg",
      "/images/Journey/Sri Lanka/Kandy/Kandy_8.jpeg",
      "/images/Journey/Sri Lanka/Kandy/Kandy_9.jpeg",
      "/images/Journey/Sri Lanka/Kandy/Kandy_10.jpeg",
      "/images/Journey/Sri Lanka/Kandy/Kandy_11.jpeg",
      "/images/Journey/Sri Lanka/Kandy/Kandy_12.jpeg",
      "/images/Journey/Sri Lanka/Kandy/Kandy_13.jpeg",
      "/images/Journey/Sri Lanka/Kandy/Kandy_14.jpeg",
      "/images/Journey/Sri Lanka/Kandy/Kandy_15.jpeg",
    ],
  },
  {
    id: "weligama",
    label: "Weligama",
    photos: [
      "/images/Journey/Sri Lanka/Weligama/Weligama_1.jpeg",
      "/images/Journey/Sri Lanka/Weligama/Weligama_2.jpeg",
      "/images/Journey/Sri Lanka/Weligama/Weligama_3.jpeg",
      "/images/Journey/Sri Lanka/Weligama/Weligama_4.jpeg",
      "/images/Journey/Sri Lanka/Weligama/Weligama_5.jpeg",
      "/images/Journey/Sri Lanka/Weligama/Weligama_6.jpeg",
      "/images/Journey/Sri Lanka/Weligama/Weligama_7.jpeg",
      "/images/Journey/Sri Lanka/Weligama/Weligama_8.jpeg",
      "/images/Journey/Sri Lanka/Weligama/Weligama_9.jpeg",
      "/images/Journey/Sri Lanka/Weligama/Weligama_10.jpeg",
      "/images/Journey/Sri Lanka/Weligama/Weligama_11.jpeg",
      "/images/Journey/Sri Lanka/Weligama/Weligama_12.jpeg",
      "/images/Journey/Sri Lanka/Weligama/Weligama_13.jpeg",
      "/images/Journey/Sri Lanka/Weligama/Weligama_14.jpeg",
      "/images/Journey/Sri Lanka/Weligama/Weligama_15.jpeg",
    ],
  },
  {
    id: "galle",
    label: "Galle",
    photos: [
      "/images/Journey/Sri Lanka/Galle/Galle_1.jpeg",
      "/images/Journey/Sri Lanka/Galle/Galle_2.jpeg",
      "/images/Journey/Sri Lanka/Galle/Galle_3.jpeg",
      "/images/Journey/Sri Lanka/Galle/Galle_4.jpeg",
      "/images/Journey/Sri Lanka/Galle/Galle_5.jpeg",
      "/images/Journey/Sri Lanka/Galle/Galle_6.jpeg",
      "/images/Journey/Sri Lanka/Galle/Galle_7.jpeg",
      "/images/Journey/Sri Lanka/Galle/Galle_8.jpeg",
      "/images/Journey/Sri Lanka/Galle/Galle_9.jpeg",
      "/images/Journey/Sri Lanka/Galle/Galle_10.jpeg",
      "/images/Journey/Sri Lanka/Galle/Galle_11.jpeg",
    ],
  },
  {
    id: "phuket",
    label: "Phuket",
    photos: [
      "/images/Journey/Phuket/Phuket_25.jpg",
      "/images/Journey/Phuket/Phuket_1.jpg",
      "/images/Journey/Phuket/Phuket_2.jpg",
      "/images/Journey/Phuket/Phuket_3.jpg",
      "/images/Journey/Phuket/Phuket_4.jpg",
      "/images/Journey/Phuket/Phuket_5.jpg",
      "/images/Journey/Phuket/Phuket_6.jpg",
      "/images/Journey/Phuket/Phuket_7.jpg",
      "/images/Journey/Phuket/Phuket_8.jpg",
      "/images/Journey/Phuket/Phuket_9.jpg",
      "/images/Journey/Phuket/Phuket_10.jpg",
      "/images/Journey/Phuket/Phuket_11.jpg",
      "/images/Journey/Phuket/Phuket_12.jpg",
      "/images/Journey/Phuket/Phuket_13.jpg",
      "/images/Journey/Phuket/Phuket_14.jpg",
      "/images/Journey/Phuket/Phuket_15.jpg",
      "/images/Journey/Phuket/Phuket_16.jpg",
      "/images/Journey/Phuket/Phuket_17.jpg",
      "/images/Journey/Phuket/Phuket_18.jpg",
      "/images/Journey/Phuket/Phuket_19.jpg",
      "/images/Journey/Phuket/Phuket_20.jpg",
      "/images/Journey/Phuket/Phuket_21.jpg",
      "/images/Journey/Phuket/Phuket_22.jpg",
      "/images/Journey/Phuket/Phuket_23.jpg",
      "/images/Journey/Phuket/Phuket_24.jpg",
    ],
  },
  {
    id: "bangkok",
    label: "Bangkok",
    photos: [
      "/images/Journey/Bangkok/Bangkok_1.jpg",
      "/images/Journey/Bangkok/Bangkok_2.jpg",
      "/images/Journey/Bangkok/Bangkok_3.jpg",
      "/images/Journey/Bangkok/Bangkok_4.jpg",
      "/images/Journey/Bangkok/Bangkok_5.jpg",
      "/images/Journey/Bangkok/Bangkok_6.jpg",
      "/images/Journey/Bangkok/Bangkok_7.jpg",
      "/images/Journey/Bangkok/Bangkok_8.jpg",
      "/images/Journey/Bangkok/Bangkok_9.jpg",
      "/images/Journey/Bangkok/Bangkok_10.jpg",
      "/images/Journey/Bangkok/Bangkok_11.jpg",
      "/images/Journey/Bangkok/Bangkok_12.jpg",
      "/images/Journey/Bangkok/Bangkok_13.jpg",
      "/images/Journey/Bangkok/Bangkok_14.jpg",
      "/images/Journey/Bangkok/Bangkok_15.jpg",
      "/images/Journey/Bangkok/Bangkok_16.jpg",
      "/images/Journey/Bangkok/Bangkok_17.jpg",
      "/images/Journey/Bangkok/Bangkok_18.jpg",
      "/images/Journey/Bangkok/Bangkok_19.jpg",
      "/images/Journey/Bangkok/Bangkok_20.jpg",
      "/images/Journey/Bangkok/Bangkok_21.jpg",
      "/images/Journey/Bangkok/Bangkok_22.jpg",
      "/images/Journey/Bangkok/Bangkok_23.jpg",
      "/images/Journey/Bangkok/Bangkok_24.jpg",
      "/images/Journey/Bangkok/Bangkok_25.jpg",
      "/images/Journey/Bangkok/Bangkok_26.jpg",
      "/images/Journey/Bangkok/Bangkok_27.jpg",
      "/images/Journey/Bangkok/Bangkok_28.jpg",
      "/images/Journey/Bangkok/Bangkok_29.jpg",
      "/images/Journey/Bangkok/Bangkok_30.jpg",
      "/images/Journey/Bangkok/Bangkok_31.jpg",
      "/images/Journey/Bangkok/Bangkok_32.jpg",
      "/images/Journey/Bangkok/Bangkok_33.jpg",
      "/images/Journey/Bangkok/Bangkok_34.jpg",
      "/images/Journey/Bangkok/Bangkok_35.jpg",
    ],
  },
  {
    id: "varkala",
    label: "Varkala",
    photos: [
      "/images/Journey/Varkala/Varkala_1.jpg",
      "/images/Journey/Varkala/Varkala_2.jpg",
      "/images/Journey/Varkala/Varkala_3.jpg",
      "/images/Journey/Varkala/Varkala_4.jpg",
      "/images/Journey/Varkala/Varkala_5.jpg",
      "/images/Journey/Varkala/Varkala_6.jpg",
      "/images/Journey/Varkala/Varkala_7.jpg",
      "/images/Journey/Varkala/Varkala_8.jpg",
      "/images/Journey/Varkala/Varkala_9.jpg",
      "/images/Journey/Varkala/Varkala_10.jpg",
      "/images/Journey/Varkala/Varkala_11.jpg",
      "/images/Journey/Varkala/Varkala_12.jpg",
      "/images/Journey/Varkala/Varkala_13.jpg",
      "/images/Journey/Varkala/Varkala_14.jpg",
      "/images/Journey/Varkala/Varkala_15.jpg",
      "/images/Journey/Varkala/Varkala_16.jpg",
    ],
  },
  { id: "wayanad",     label: "Wayanad",              photos: [] },
  { id: "athirapilly", label: "Athirapilly",          photos: [] },
  {
    id: "alleppey",
    label: "Alleppey",
    photos: [
      "/images/Journey/Alappuzha/Alappuzha_1.jpg",
      "/images/Journey/Alappuzha/Alappuzha_2.jpg",
      "/images/Journey/Alappuzha/Alappuzha_3.jpg",
      "/images/Journey/Alappuzha/Alappuzha_4.jpg",
      "/images/Journey/Alappuzha/Alappuzha_5.jpg",
      "/images/Journey/Alappuzha/Alappuzha_6.jpg",
      "/images/Journey/Alappuzha/Alappuzha_7.jpg",
      "/images/Journey/Alappuzha/Alappuzha_8.jpg",
      "/images/Journey/Alappuzha/Alappuzha_9.jpg",
      "/images/Journey/Alappuzha/Alappuzha_10.jpg",
      "/images/Journey/Alappuzha/Alappuzha_11.jpg",
      "/images/Journey/Alappuzha/Alappuzha_12.jpg",
      "/images/Journey/Alappuzha/Alappuzha_13.jpg",
      "/images/Journey/Alappuzha/Alappuzha_14.jpg",
    ],
  },
];

// Card size scales with zoom: tiny at zoom 3, large at zoom 7+
function photoCardSize(zoom: number): number {
  if (zoom <= 3) return 48;
  if (zoom >= 7) return 96;
  return Math.round(48 + (zoom - 3) * 12); // 48→96 over 4 zoom steps
}

// ── Type icon SVG paths (same as LUCIDE_* above, used inline in card) ────────
const TYPE_ICON_PATH: Record<MarkerType, string> = {
  lived:   LUCIDE_MAPPIN,
  studied: LUCIDE_GRAD,
  working: LUCIDE_BRIEFCASE,
  visited: LUCIDE_EYE,
};

// ── Cluster card: stacked look with peeking cards behind + count badge ────────
function makeClusterIcon(
  items: { photos: string[]; label: string }[],
  zoom: number,
  onClickId: string,
): L.DivIcon {
  const sz = photoCardSize(zoom);
  const cardW = Math.max(sz, 160);
  const totalH = sz + 8; // +8 for stack peek
  const radius = Math.round(sz * 0.16);
  const count = items.length;
  const peek = Math.min(count - 1, 3);

  // Build stacked shadow cards behind the main card
  const stackCards = Array.from({ length: peek }, (_, i) => {
    const offset = (i + 1) * 5;
    const scale = 1 - (i + 1) * 0.04;
    return `<div style="
      position:absolute;
      top:${offset}px; left:50%;
      transform:translateX(-50%) scale(${scale});
      transform-origin:top center;
      width:${cardW}px; height:${sz}px;
      border-radius:${radius}px;
      background:#1a1a1a;
      overflow:hidden;
      z-index:${peek - i};
    ">
      <img src="${items[i + 1]?.photos[0] ?? items[0].photos[0]}" alt=""
        style="width:100%;height:100%;object-fit:cover;display:block;opacity:0.6;-webkit-user-select:none;user-select:none;-webkit-user-drag:none;"
        onerror="this.style.display='none'"
        oncontextmenu="event.preventDefault();return false;"
        ondragstart="event.preventDefault();return false;"
      />
    </div>`;
  }).reverse().join("");

  const html = `
    <div data-photo-card="${onClickId}" style="
      position:relative;
      width:${cardW}px;
      height:${totalH}px;
      filter:drop-shadow(0 4px 14px rgba(0,0,0,0.55));
      cursor:pointer;
    ">
      ${stackCards}
      <!-- Main front card -->
      <div style="
        position:absolute; top:0; left:0;
        width:${cardW}px; height:${sz}px;
        border-radius:${radius}px;
        overflow:hidden;
        background:rgba(20,20,20,0.55);
        backdrop-filter:blur(20px) saturate(1.8);
        -webkit-backdrop-filter:blur(20px) saturate(1.8);
        z-index:10;
      ">
        <img src="${items[0].photos[0]}" alt="${items[0].label}"
          style="width:100%;height:100%;object-fit:cover;display:block;-webkit-user-select:none;user-select:none;-webkit-user-drag:none;"
          onerror="this.style.display='none'"
          oncontextmenu="event.preventDefault();return false;"
          ondragstart="event.preventDefault();return false;"
        />
        <!-- City label -->
        <div style="
          position:absolute; top:7px; left:7px;
          background:rgba(0,0,0,0.52); backdrop-filter:blur(6px);
          -webkit-backdrop-filter:blur(6px);
          border-radius:20px; padding:3px 8px;
          font-family:'DM Mono',monospace; font-size:${Math.max(8, Math.round(sz * 0.115))}px;
          color:#fff; font-weight:500; letter-spacing:0.03em;
          white-space:nowrap; pointer-events:none;
        ">${items[0].label}</div>
        <!-- Count badge -->
        <div style="
          position:absolute; bottom:7px; right:7px;
          background:rgba(0,0,0,0.65); backdrop-filter:blur(6px);
          -webkit-backdrop-filter:blur(6px);
          border-radius:20px; padding:3px 9px;
          font-family:'DM Mono',monospace; font-size:${Math.max(8, Math.round(sz * 0.115))}px;
          color:#fff; font-weight:600; letter-spacing:0.02em;
          pointer-events:none;
        ">${count} places</div>
      </div>
    </div>`;

  return L.divIcon({
    html,
    className: "",
    iconSize: [cardW, totalH],
    iconAnchor: [cardW / 2, totalH + 16],
  });
}

// Unified photo card: image top (city pill + +N badge overlaid), text row below, pointer tail
function makePhotoCardIcon(
  photos: string[],
  label: string,
  tag: string,
  type: MarkerType,
  zoom: number,
  onClickId: string,  // data attribute so the click handler can identify which card
): L.DivIcon {
  const sz = photoCardSize(zoom);
  const cardW = Math.max(sz, 160);  // always wide enough to fit the text row
  const showText = sz >= 56;        // hide text row at tiny zoom
  const textRowH = showText ? 30 : 0;
  const totalH = sz + textRowH;
  const radius = Math.round(sz * 0.16);
  const remaining = photos.length - 1;
  const showBadges = sz >= 56;

  const typeLabel: Record<MarkerType, string> = {
    lived: "Lived here", studied: "Studied here",
    working: "Working here", visited: "Visited",
  };
  const iconPaths = TYPE_ICON_PATH[type];

  const html = `
    <div
      data-photo-card="${onClickId}"
      style="
        width:${cardW}px;
        position:relative;
        filter: drop-shadow(0 3px 10px rgba(0,0,0,0.45));
        cursor:pointer;
        border-radius:${radius}px;
        border:1px solid var(--border,rgba(255,255,255,0.12));
        overflow:hidden;
        backdrop-filter:blur(20px) saturate(1.8);
        -webkit-backdrop-filter:blur(20px) saturate(1.8);
      "
    >
      <!-- Image area -->
      <div style="
        width:${cardW}px; height:${sz}px;
        overflow:hidden;
        background:#1a1a1a;
        position:relative;
      ">
        <img src="${photos[0]}" alt="${label}"
          style="width:100%;height:100%;object-fit:cover;display:block;-webkit-user-select:none;user-select:none;-webkit-user-drag:none;"
          onerror="this.style.display='none'"
          oncontextmenu="event.preventDefault();return false;"
          ondragstart="event.preventDefault();return false;"
        />
        ${showBadges ? `
        <!-- City label pill top-left -->
        <div style="
          position:absolute; top:7px; left:7px;
          background:rgba(0,0,0,0.52);
          backdrop-filter:blur(6px);
          -webkit-backdrop-filter:blur(6px);
          border-radius:20px;
          padding:3px 8px;
          font-family:'DM Mono',monospace;
          font-size:${Math.max(8, Math.round(sz * 0.115))}px;
          color:#fff;
          font-weight:500;
          letter-spacing:0.03em;
          white-space:nowrap;
          pointer-events:none;
        ">${label}</div>
        ` : ""}
        ${showBadges && remaining > 0 ? `
        <!-- +N badge bottom-right -->
        <div style="
          position:absolute; bottom:7px; right:7px;
          background:rgba(0,0,0,0.52);
          backdrop-filter:blur(6px);
          -webkit-backdrop-filter:blur(6px);
          border-radius:20px;
          padding:3px 9px;
          font-family:'DM Mono',monospace;
          font-size:${Math.max(8, Math.round(sz * 0.115))}px;
          color:#fff;
          font-weight:600;
          letter-spacing:0.02em;
          pointer-events:none;
        ">+${remaining}</div>
        ` : ""}
      </div>

      <!-- Text row -->
      <div style="
        width:${cardW}px;
        height:${textRowH}px;
        overflow:hidden;
        background:var(--card,rgba(20,20,20,0.55));
        backdrop-filter:blur(20px) saturate(1.8);
        -webkit-backdrop-filter:blur(20px) saturate(1.8);
        border-top:${showText ? `1px solid var(--border,rgba(255,255,255,0.1))` : "none"};
        display:${showText ? "flex" : "none"};
        align-items:center;
        justify-content:space-between;
        padding:0 10px;
        box-sizing:border-box;
      ">
        <div style="display:flex;align-items:center;gap:5px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24"
            fill="none" stroke="var(--muted-foreground,#888)" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            ${iconPaths}
          </svg>
          <span style="
            font-family:'DM Mono',monospace;
            font-size:9px;
            color:var(--foreground,#e0e0e0);
            font-weight:500;
            white-space:nowrap;
          ">${typeLabel[type]}</span>
        </div>
        <span style="
          font-family:'DM Mono',monospace;
          font-size:8px;
          color:var(--muted-foreground,#888);
          opacity:0.65;
          white-space:nowrap;
        ">${tag}</span>
      </div>

    </div>
  `;

  return L.divIcon({
    html,
    className: "",
    iconSize: [cardW, totalH],
    iconAnchor: [cardW / 2, totalH + 16],
  });
}

// ─── CSS injected once for Leaflet overrides + pulse animation ─────────────────

const LEAFLET_CSS_ID = "spidey-leaflet-overrides";
function injectLeafletOverrides() {
  if (document.getElementById(LEAFLET_CSS_ID)) return;
  const style = document.createElement("style");
  style.id = LEAFLET_CSS_ID;
  style.textContent = `
    .leaflet-container { background: var(--background) !important; font-family: inherit; }
    .leaflet-control-attribution { display: none !important; }
    .leaflet-tile-pane { }
    .spidey-popup .leaflet-popup-content-wrapper {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.45);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      padding: 0;
      overflow: hidden;
      min-width: 160px;
    }
    .spidey-popup .leaflet-popup-content { margin: 0; }
    .spidey-popup .leaflet-popup-tip-container { display: none; }
    .spidey-popup .leaflet-popup-close-button { display: none !important; }
    @keyframes spidey-spin { to { transform: rotate(360deg); } }
    .leaflet-marker-pane img, .spidey-carousel img {
      -webkit-touch-callout: none !important;
      pointer-events: none;
      user-select: none;
      -webkit-user-select: none;
    }
  `;
  document.head.appendChild(style);
}

// ─── Main component ────────────────────────────────────────────────────────────

interface JourneyMapProps {
  onClose: () => void;
  pageMode?: boolean;
}

export function JourneyMap({ onClose, pageMode }: JourneyMapProps) {
  const { theme, dark } = useTheme();
  const isMobile = useIsMobile();
  // In pageMode the header sits on --node-header (opaque card surface),
  // so light themes must use dark text. White text is only needed when the
  // header floats over the dark modal-overlay backdrop (non-pageMode).
  const isLightTheme = theme === "lemon-fizz" || theme === "default-light" || theme === "sakura";
  const needsWhiteText = isLightTheme && !pageMode;
  const headerText = needsWhiteText ? "rgba(255,255,255,0.75)" : "var(--muted-foreground)";
  const headerTextStrong = needsWhiteText ? "#ffffff" : "var(--foreground)";
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const photoMarkersRef = useRef<L.Marker[]>([]);
  const accents = THEME_ACCENTS[theme] ?? THEME_ACCENTS["default-dark"];

  // ── Live map view state (drives compass viewport rect) ────────────────────────
  const [mapView, setMapView] = useState<{ lat: number; lng: number; zoom: number }>({ lat: 18, lng: 82, zoom: 4.5 });

  // ── Carousel state + lazy loading ──────────────────────────────────────────────
  const [carousel, setCarousel] = useState<{ pw: PhotoWaypoint; wp: Waypoint; index: number } | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const carouselRef = useRef(carousel);
  carouselRef.current = carousel;
  const imageCache = useRef<Map<string, boolean>>(new Map());

  // Prefetch just the first 3 photos of a city on marker hover — so the carousel
  // opens instantly without bulk-loading all 280 images upfront.
  const prefetchCity = useCallback((pw: PhotoWaypoint) => {
    pw.photos.slice(0, 3).forEach(photoUrl => {
      if (!imageCache.current.has(photoUrl)) {
        imageCache.current.set(photoUrl, true);
        const img = new Image();
        img.onload = () => setLoadedImages(prev => new Set([...prev, photoUrl]));
        img.src = photoUrl;
      }
    });
  }, []);

  // Preload current, prev, next as the user swipes through the carousel
  useEffect(() => {
    if (!carousel) return;
    const { pw, index } = carousel;
    const indicesToLoad = [
      index,
      (index - 1 + pw.photos.length) % pw.photos.length,
      (index + 1) % pw.photos.length,
    ];
    indicesToLoad.forEach(i => {
      const photoUrl = pw.photos[i];
      if (!imageCache.current.has(photoUrl)) {
        imageCache.current.set(photoUrl, true);
        const img = new Image();
        img.onload = () => setLoadedImages(prev => new Set([...prev, photoUrl]));
        img.src = photoUrl;
      }
    });
  }, [carousel?.index, carousel?.pw.photos]);

  const openCarousel = useCallback((pw: PhotoWaypoint, wp: Waypoint) => {
    setCarousel({ pw, wp, index: 0 });
  }, []);
  const closeCarousel = useCallback(() => setCarousel(null), []);
  const carouselPrev = useCallback(() => setCarousel(c => c ? { ...c, index: (c.index - 1 + c.pw.photos.length) % c.pw.photos.length } : c), []);
  const carouselNext = useCallback(() => setCarousel(c => c ? { ...c, index: (c.index + 1) % c.pw.photos.length } : c), []);

  // ── Swipe drag state ────────────────────────────────────────────────────────
  const swipeTouchX = useRef<number>(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const swipeDragging = useRef(false);
  // When true we are mid-commit animation — suppress transition on the instant reset
  const swipeCommitting = useRef(false);

  const TICKER_TEXT = "● SAYAN CHAKRABORTY  ·  UX DESIGNER  ·  KOLKATA → KHOPOLI → BOISAR → CHITTORGARH → PANVEL → SINGAPORE → NAVI MUMBAI → GANDHINAGAR → UJJAIN → KOCHI  ·  20+ WAYPOINTS  ·  CURRENTLY @ IBM KOCHI  ·  WATCH SAYAN EXPLORE AND UNLOCK NEW CHAPTERS OF LIFE ACROSS THE WORLD  ·  ";

  // ── Build markers ──────────────────────────────────────────────────────────
  function buildMarkers(map: L.Map, acc: typeof accents) {
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    WAYPOINTS.forEach(wp => {
      const isVisited = wp.type === "visited";
      const fill = acc[wp.type];
      const [svgStr, sz] = makeMarkerIcon(wp, fill);
      const icon = makeDivIcon(svgStr, [sz, sz]);

      const zIndex = wp.type === "working" ? 1000 : isVisited ? 0 : 100;
      const marker = L.marker([wp.lat, wp.lng], { icon, zIndexOffset: zIndex });

      // Waypoints with photos use the floating card — no popup needed on the circle
      const hasPhotos = PHOTO_WAYPOINTS.some(p => p.id === wp.id && p.photos.length > 0);
      if (!hasPhotos) {
        const typeLabelMap: Record<MarkerType, string> = {
          lived: "Lived here", studied: "Studied here",
          working: "Working here", visited: "Visited",
        };
        const iconPath = TYPE_ICON_PATH[wp.type];

        // Unified card-style hover popup — colour block in image slot, text row below
        const popupHtml = `
          <div style="width:160px;">
            <!-- Colour header block replacing image -->
            <div style="
              width:160px; height:80px;
              background:${fill}22;
              border-bottom:1px solid ${fill}33;
              display:flex; align-items:center; justify-content:center;
              position:relative;
            ">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
                fill="none" stroke="${fill}" stroke-width="1.5"
                stroke-linecap="round" stroke-linejoin="round" opacity="0.7">
                ${iconPath}
              </svg>
              <!-- Location name pill -->
              <div style="
                position:absolute; top:7px; left:8px;
                background:${fill}33;
                border-radius:20px; padding:2px 8px;
                font-family:'DM Mono',monospace; font-size:9px;
                color:${fill}; font-weight:600; letter-spacing:0.03em;
                white-space:nowrap;
              ">${wp.name}</div>
            </div>
            <!-- Text row -->
            <div style="
              display:flex; align-items:center; justify-content:space-between;
              padding:7px 10px; box-sizing:border-box;
            ">
              <div style="display:flex; align-items:center; gap:5px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24"
                  fill="none" stroke="var(--muted-foreground,#888)" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round">
                  ${iconPath}
                </svg>
                <span style="
                  font-family:'DM Mono',monospace; font-size:9px;
                  color:var(--foreground,#e0e0e0); font-weight:500; white-space:nowrap;
                ">${typeLabelMap[wp.type]}</span>
              </div>
              <span style="
                font-family:'DM Mono',monospace; font-size:8px;
                color:var(--muted-foreground,#888); opacity:0.6; white-space:nowrap;
              ">${wp.tag}</span>
            </div>
          </div>`;

        marker.bindPopup(popupHtml, {
          className: "spidey-popup",
          offset: [0, -sz / 2 - 4],
          closeButton: false,
          autoClose: false,
          closeOnClick: false,
        });

        // Open on hover, close on mouse out
        marker.on("mouseover", () => marker.openPopup());
        marker.on("mouseout", () => marker.closePopup());
      }

      marker.addTo(map);
      markersRef.current.push(marker);
    });
  }

  // ── Build photo card markers with clustering ──────────────────────────────
  // Groups nearby photo waypoints into a stacked cluster card at low zoom,
  // separates them as individual cards when zoomed in.
  function buildPhotoMarkers(map: L.Map) {
    photoMarkersRef.current.forEach(m => m.remove());
    photoMarkersRef.current = [];

    const zoom = map.getZoom();
    // Cluster radius in pixels — shrinks as you zoom in so cards separate naturally
    const clusterRadius = zoom < 5 ? 120 : zoom < 6 ? 80 : zoom < 7 ? 50 : 0;

    // Build list of active photo waypoints with their screen positions
    type PWEntry = { pw: typeof PHOTO_WAYPOINTS[0]; wp: typeof WAYPOINTS[0]; pt: L.Point };
    const entries: PWEntry[] = [];
    PHOTO_WAYPOINTS.forEach(pw => {
      if (pw.photos.length === 0) return;
      const wp = WAYPOINTS.find(w => w.id === pw.id);
      if (!wp) return;
      const pt = map.latLngToContainerPoint([wp.lat, wp.lng]);
      entries.push({ pw, wp, pt });
    });

    // Greedy clustering — group entries within clusterRadius pixels of each other
    const assigned = new Set<string>();
    const clusters: PWEntry[][] = [];

    entries.forEach(entry => {
      if (assigned.has(entry.pw.id)) return;
      if (clusterRadius === 0) {
        clusters.push([entry]);
        assigned.add(entry.pw.id);
        return;
      }
      const group: PWEntry[] = [entry];
      assigned.add(entry.pw.id);
      entries.forEach(other => {
        if (assigned.has(other.pw.id)) return;
        const dx = entry.pt.x - other.pt.x;
        const dy = entry.pt.y - other.pt.y;
        if (Math.sqrt(dx * dx + dy * dy) <= clusterRadius) {
          group.push(other);
          assigned.add(other.pw.id);
        }
      });
      clusters.push(group);
    });

    // Priority order for front-card within a cluster
    const CLUSTER_PRIORITY: Record<string, number> = {
      "kolkata":     100,
      "navi-mumbai": 90,
      "kochi-main":  80,
    };
    const clusterPriority = (id: string) => CLUSTER_PRIORITY[id] ?? 0;

    // Place one marker per cluster
    clusters.forEach(group => {
      // Sort group so highest-priority location is first (front card)
      group.sort((a, b) => clusterPriority(b.pw.id) - clusterPriority(a.pw.id));

      // Cluster centre = average lat/lng
      const avgLat = group.reduce((s, e) => s + e.wp.lat, 0) / group.length;
      const avgLng = group.reduce((s, e) => s + e.wp.lng, 0) / group.length;

      const isHome = group.some(e => e.pw.id === "navi-mumbai" || e.pw.id === "kochi-main");
      const isMussoorie = group.some(e => e.pw.id === "mussoorie");
      const zIndex = isHome ? 1300 : isMussoorie ? 1200 : 1100;

      let icon: L.DivIcon;
      const clusterId = group.map(e => e.pw.id).join("|");

      if (group.length === 1) {
        const { pw, wp } = group[0];
        icon = makePhotoCardIcon(pw.photos, pw.label, wp.tag, wp.type, zoom, pw.id);
      } else {
        const items = group.map(e => ({ photos: e.pw.photos, label: e.pw.label }));
        icon = makeClusterIcon(items, zoom, clusterId);
      }

      const marker = L.marker([avgLat, avgLng], { icon, zIndexOffset: zIndex, interactive: true });

      marker.on("mouseover", () => {
        group.forEach(e => prefetchCity(e.pw));
      });

      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        if (group.length === 1) {
          openCarousel(group[0].pw, group[0].wp);
        } else {
          // Open the first item's carousel — user can close and tap others when zoomed in
          openCarousel(group[0].pw, group[0].wp);
        }
      });

      marker.addTo(map);
      photoMarkersRef.current.push(marker);
    });
  }

  // ── Init map (once) ────────────────────────────────────────────────────────
  useEffect(() => {
    injectLeafletOverrides();
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [18, 82],
      zoom: 4.5,
      zoomControl: false,
      attributionControl: false,
    });
    mapRef.current = map;

    const cfg = TILE_LAYERS[theme] ?? TILE_LAYERS["default-dark"];
    const tile = L.tileLayer(cfg.url, { attribution: cfg.attribution, maxZoom: 18 });
    tile.addTo(map);
    tileLayerRef.current = tile;

    // Apply CSS filter to tile pane
    const pane = map.getPanes().tilePane as HTMLElement;
    if (cfg.filter) pane.style.filter = cfg.filter;

    buildMarkers(map, THEME_ACCENTS[theme] ?? THEME_ACCENTS["default-dark"]);
    buildPhotoMarkers(map);

    // Rebuild photo cards on every zoom change so they scale up/down
    map.on("zoomend", () => buildPhotoMarkers(map));

    // Keep compass in sync with every pan/zoom
    const syncView = () => {
      const c = map.getCenter();
      setMapView({ lat: c.lat, lng: c.lng, zoom: map.getZoom() });
    };
    map.on("move", syncView);
    map.on("zoomend", syncView);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Re-skin on theme change ────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) tileLayerRef.current.remove();
    const cfg = TILE_LAYERS[theme] ?? TILE_LAYERS["default-dark"];
    const newTile = L.tileLayer(cfg.url, { attribution: cfg.attribution, maxZoom: 18 });
    newTile.addTo(map);
    tileLayerRef.current = newTile;

    const pane = map.getPanes().tilePane as HTMLElement;
    pane.style.filter = cfg.filter ?? "";

    buildMarkers(map, THEME_ACCENTS[theme] ?? THEME_ACCENTS["default-dark"]);
    buildPhotoMarkers(map);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  // ── ESC: close carousel first, then map ────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (carouselRef.current) { closeCarousel(); }
        else onClose();
      }
      if (e.key === "ArrowLeft" && carouselRef.current) carouselPrev();
      if (e.key === "ArrowRight" && carouselRef.current) carouselNext();
    };
    window.addEventListener("keydown", onKey);
    if (!pageMode) document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      if (!pageMode) document.body.style.overflow = "";
    };
  }, [onClose, pageMode, closeCarousel, carouselPrev, carouselNext]);

  // ─── Compass widget ─────────────────────────────────────────────────────────
  const CompassWidget = () => {
    const LAT_MIN = -10, LAT_MAX = 35, LNG_MIN = 68, LNG_MAX = 106;
    const CX = 38, CY = 38, R = 27;

    // Project a lat/lng into compass SVG space
    const project = (lat: number, lng: number) => ({
      x: CX - R + ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * R * 2,
      y: CY - R + (1 - (lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * R * 2,
    });

    const waypointDots = WAYPOINTS.map(wp => {
      const { x, y } = project(wp.lat, wp.lng);
      const color = accents[wp.type];
      const isHome = wp.id === "kochi-main";
      return { x, y, color, isHome, id: wp.id };
    });

    // Viewport rect — derive tile count from actual map container dimensions
    const degsPerTile = 360 / Math.pow(2, mapView.zoom);
    const mapW = mapContainerRef.current?.clientWidth  ?? 800;
    const mapH = mapContainerRef.current?.clientHeight ?? 500;
    const tilesX = mapW / 256;
    const tilesY = mapH / 256;
    const viewW = degsPerTile * tilesX;
    const viewH = degsPerTile * tilesY;
    const vTL = project(mapView.lat + viewH / 2, mapView.lng - viewW / 2);
    const vBR = project(mapView.lat - viewH / 2, mapView.lng + viewW / 2);
    const rectX = Math.max(CX - R, Math.min(vTL.x, CX + R));
    const rectY = Math.max(CY - R, Math.min(vTL.y, CY + R));
    const rectW = Math.min(vBR.x - vTL.x, (CX + R) - rectX);
    const rectH = Math.min(vBR.y - vTL.y, (CY + R) - rectY);

    // Centre crosshair dot
    const { x: cx, y: cy } = project(mapView.lat, mapView.lng);

    return (
      <svg width="76" height="76" viewBox="0 0 76 76" style={{ display: "block" }}>
        {[12, 21, 30].map(r => (
          <circle key={r} cx="38" cy="38" r={r} fill="none"
            stroke="var(--border)" strokeWidth="0.8" opacity="0.55" />
        ))}
        {[0, 45, 90, 135].map(a => {
          const rad = (a * Math.PI) / 180;
          return (
            <line key={a}
              x1={38 + 12 * Math.cos(rad)} y1={38 + 12 * Math.sin(rad)}
              x2={38 + 30 * Math.cos(rad)} y2={38 + 30 * Math.sin(rad)}
              stroke="var(--border)" strokeWidth="0.8" opacity="0.45" />
          );
        })}
        {[0, 45, 90, 135].map(a => {
          const rad = (a * Math.PI) / 180;
          return (
            <line key={`a-${a}`} x1={38} y1={38}
              x2={38 + 30 * Math.cos(rad)} y2={38 + 30 * Math.sin(rad)}
              stroke={accents.accent} strokeWidth="0.7" opacity="0.3" />
          );
        })}

        {/* Live viewport rect — shows where on the map the user is looking */}
        {rectW > 0 && rectH > 0 && (
          <rect
            x={rectX} y={rectY} width={rectW} height={rectH}
            fill={accents.accent} fillOpacity="0.08"
            stroke={accents.accent} strokeWidth="0.8" strokeOpacity="0.5"
            rx="1"
            style={{ transition: "all 0.1s ease-out" }}
          />
        )}

        {/* Waypoint dots projected onto compass */}
        {waypointDots.map(({ x, y, color, isHome, id }) => (
          <circle key={id} cx={x} cy={y} r={isHome ? 2.5 : 1.5}
            fill={color} opacity={isHome ? 1 : 0.7} />
        ))}

        {/* Live centre crosshair — moves as the user pans */}
        <line x1={cx - 3} y1={cy} x2={cx + 3} y2={cy}
          stroke={accents.accent} strokeWidth="0.8" opacity="0.9" />
        <line x1={cx} y1={cy - 3} x2={cx} y2={cy + 3}
          stroke={accents.accent} strokeWidth="0.8" opacity="0.9" />

        {/* Pulsing centre dot for current location (Kochi) */}
        <circle cx="38" cy="38" r="3" fill={accents.working} />
        <circle cx="38" cy="38" r="3" fill="none" stroke={accents.working} strokeWidth="1.5">
          <animate attributeName="r" values="3;8;3" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.7;0;0.7" dur="1.8s" repeatCount="indefinite" />
        </circle>
        {[
          { label: "N", x: 38, y: 9 },
          { label: "S", x: 38, y: 71 },
          { label: "E", x: 71, y: 41 },
          { label: "W", x: 5,  y: 41 },
        ].map(({ label, x, y }) => (
          <text key={label} x={x} y={y} textAnchor="middle"
            fontFamily="monospace" fontSize="7" fill="var(--muted-foreground)" opacity="0.65">
            {label}
          </text>
        ))}
      </svg>
    );
  };

  // ─── Legend item ─────────────────────────────────────────────────────────────
  const LegendItem = ({ color, label, dot = false }: { color: string; label: string; dot?: boolean }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
      {dot ? (
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0, border: "1px solid rgba(0,0,0,0.2)" }} />
      ) : (
        <div style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0, border: "1px solid rgba(0,0,0,0.15)" }} />
      )}
      <span style={{ fontFamily: "DM Mono, monospace", fontSize: 9, color: "var(--muted-foreground)" }}>{label}</span>
    </div>
  );

  // ─── Container styles ─────────────────────────────────────────────────────
  const containerStyle: React.CSSProperties = pageMode ? {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    background: "var(--background)",
  } : {
    position: "fixed",
    inset: 0,
    zIndex: 300,
    display: "flex",
    flexDirection: "column",
    background: "var(--modal-overlay)",
    backdropFilter: "blur(4px)",
    WebkitBackdropFilter: "blur(4px)",
  };

  const innerStyle: React.CSSProperties = pageMode ? {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  } : {
    position: "absolute",
    inset: "12px",
    borderRadius: 12,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    border: "1px solid var(--border)",
    boxShadow: "var(--modal-shadow)",
    background: "var(--card)",
    backdropFilter: "blur(80px) saturate(1.9)",
    WebkitBackdropFilter: "blur(80px) saturate(1.9)",
  };

  return (
    <div
      style={containerStyle}
      onClick={!pageMode ? (e => { if (e.target === e.currentTarget) onClose(); }) : undefined}
    >
      <div style={innerStyle}>

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 12px",
          height: 32,
          background: "var(--node-header)",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}>
          {/* Left: back button (hidden on mobile) + separator + icon + label */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {!isMobile && (
              <>
                <button
                  onClick={onClose}
                  aria-label="Back"
                  style={{
                    display: "flex", alignItems: "center", gap: 4,
                    background: "none", border: "none", cursor: "pointer",
                    color: headerText, padding: 0,
                    fontFamily: "DM Mono, monospace", fontSize: 9,
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = headerTextStrong)}
                  onMouseLeave={e => (e.currentTarget.style.color = headerText)}
                >
                  <ArrowLeft size={11} />
                  <span>back</span>
                </button>
                {/* Vertical divider — same as site nav */}
                <div style={{ width: 1, height: 12, background: "var(--border)", flexShrink: 0 }} />
              </>
            )}
            <span style={{ fontSize: 10, color: "var(--primary)" }}>◎</span>
            <span style={{
              fontFamily: "DM Mono, monospace", fontSize: 9,
              color: headerText, letterSpacing: "0.2em",
              textTransform: "uppercase", fontWeight: 500,
            }}>journey</span>
          </div>

          {/* Right: id tag + dot + close — matches NodeHeader right side */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              fontFamily: "DM Mono, monospace", fontSize: 9,
              color: headerText, opacity: 0.55,
            }}>jrn_map</span>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "var(--primary)", opacity: 0.7,
              display: "inline-block", flexShrink: 0,
            }} />
            {!pageMode && (
              <button onClick={onClose} aria-label="Close map" style={{
                width: 20, height: 20, borderRadius: 4,
                border: "none", background: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: headerText,
                transition: "opacity 0.15s",
              }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.6")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* ── Map area ──────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>

          {/* Leaflet map container */}
          <div ref={mapContainerRef} style={{ position: "absolute", inset: 0, zIndex: 1 }} />

          {/* ── Floating back button (mobile only, bottom-left) ───────────── */}
          {isMobile && (
            <button
              onClick={onClose}
              aria-label="Back"
              style={{
                position: "absolute", bottom: 10, left: 10, zIndex: 10,
                display: "flex", alignItems: "center", gap: 5,
                padding: "5px 10px",
                background: "var(--card)",
                backdropFilter: "blur(20px) saturate(1.8)",
                WebkitBackdropFilter: "blur(20px) saturate(1.8)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                boxShadow: "var(--card-shadow)",
                cursor: "pointer",
                fontFamily: "DM Mono, monospace", fontSize: 9,
                color: "var(--foreground)",
              }}
            >
              <ArrowLeft size={11} />
              <span>back</span>
            </button>
          )}

          {/* ── Legend (top-left) ───────────────────────────────────────────── */}
          <div style={{
            position: "absolute", top: 10, left: 10, zIndex: 10,
            background: "var(--card)",
            backdropFilter: "blur(20px) saturate(1.8)",
            WebkitBackdropFilter: "blur(20px) saturate(1.8)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "8px 12px",
            boxShadow: "var(--card-shadow)",
          }}>
            <p style={{
              fontFamily: "DM Mono, monospace", fontSize: 8,
              color: "var(--muted-foreground)", marginBottom: 6,
              opacity: 0.5, letterSpacing: "0.12em", textTransform: "uppercase",
            }}>// legend</p>
            <LegendItem color={accents.lived}   label="lived here" />
            <LegendItem color={accents.studied} label="studied here" />
            <LegendItem color={accents.working} label="working · now" />
            <LegendItem color={accents.visited} label="visited" dot />
          </div>

          {/* ── Zoom + reset controls (top-right) ───────────────────────────── */}
          <div style={{
            position: "absolute", top: 10, right: 10, zIndex: 10,
            display: "flex", flexDirection: "column", gap: 4,
          }}>
            {/* Zoom in/out */}
            <div style={{
              background: "var(--card)",
              backdropFilter: "blur(20px) saturate(1.8)",
              WebkitBackdropFilter: "blur(20px) saturate(1.8)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              overflow: "hidden",
              boxShadow: "var(--card-shadow)",
            }}>
              {["+", "−"].map((label, i) => (
                <button key={label}
                  onClick={() => {
                    const map = mapRef.current;
                    if (!map) return;
                    map.setZoom(map.getZoom() + (i === 0 ? 1 : -1));
                  }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 30, height: 30,
                    background: "none", border: "none",
                    borderBottom: i === 0 ? "1px solid var(--border)" : "none",
                    fontFamily: "DM Mono, monospace", fontSize: 16, fontWeight: 400,
                    color: "var(--foreground)", cursor: "pointer",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--node-header)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "none")}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Reset view */}
            <button
              onClick={() => mapRef.current?.setView([17, 82], 4)}
              title="Reset view"
              style={{
                width: 30, height: 30, borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--card)",
                backdropFilter: "blur(20px) saturate(1.8)",
                WebkitBackdropFilter: "blur(20px) saturate(1.8)",
                boxShadow: "var(--card-shadow)",
                fontFamily: "DM Mono, monospace", fontSize: 13,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "var(--muted-foreground)",
                transition: "background 0.12s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--node-header)")}
              onMouseLeave={e => (e.currentTarget.style.background = "var(--card)")}
            >↺</button>
          </div>

          {/* ── Compass widget (bottom-right) ────────────────────────────────── */}
          <div style={{
            position: "absolute", bottom: 10, right: 10, zIndex: 10,
            background: "var(--card)",
            backdropFilter: "blur(20px) saturate(1.8)",
            WebkitBackdropFilter: "blur(20px) saturate(1.8)",
            border: "1px solid var(--border)", borderRadius: 8,
            padding: 8,
            boxShadow: "var(--card-shadow)",
          }}>
            <CompassWidget />
          </div>

          {/* ── Carousel overlay ─────────────────────────────────────────────── */}
          {carousel && (() => {
            const { pw, wp, index } = carousel;
            const typeLabel: Record<MarkerType, string> = {
              lived: "Lived here", studied: "Studied here",
              working: "Working here", visited: "Visited",
            };
            const TypeIcon = {
              lived: MapPin, studied: GraduationCap,
              working: Briefcase, visited: Eye,
            }[wp.type];

            return (
              <div
                style={{
                  position: "absolute", inset: 0, zIndex: 50,
                  background: "rgba(0,0,0,0.72)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
                onClick={closeCarousel}
              >
                {/* Card */}
                <div
                  style={{
                    width: "min(380px, calc(100vw - 32px))",
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 16,
                    overflow: "hidden",
                    boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
                    position: "relative",
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  {/* Image strip — overflow-clipped viewport with prev/current/next side by side */}
                  <div
                    style={{ width: "100%", height: 350, position: "relative", background: "#111", overflow: "hidden" }}
                    onContextMenu={e => e.preventDefault()}
                    onDragStart={e => e.preventDefault()}
                    onTouchStart={e => {
                      swipeTouchX.current = e.touches[0].clientX;
                      swipeDragging.current = true;
                      setSwipeOffset(0);
                    }}
                    onTouchMove={e => {
                      if (!swipeDragging.current) return;
                      e.preventDefault();
                      const dx = e.touches[0].clientX - swipeTouchX.current;
                      // Rubber-band at edges (first/last photo)
                      const atStart = index === 0 && dx > 0;
                      const atEnd   = index === pw.photos.length - 1 && dx < 0;
                      const clamped = (atStart || atEnd)
                        ? Math.sign(dx) * Math.abs(dx) * 0.25
                        : dx;
                      setSwipeOffset(clamped);
                    }}
                    onTouchEnd={e => {
                      swipeDragging.current = false;
                      const dx = e.changedTouches[0].clientX - swipeTouchX.current;
                      if (Math.abs(dx) > 40) {
                        // Phase 1: animate strip all the way to the target slot
                        const cardW = e.currentTarget.clientWidth;
                        swipeCommitting.current = true;
                        setSwipeOffset(dx < 0 ? -cardW : cardW);
                        // Phase 2: after transition ends, swap index and instant-reset offset
                        setTimeout(() => {
                          dx < 0 ? carouselNext() : carouselPrev();
                          swipeCommitting.current = false;
                          setSwipeOffset(0);
                        }, 500);
                      } else {
                        // Not enough — spring back
                        setSwipeOffset(0);
                      }
                    }}
                  >
                    {/* The sliding strip: prev | current | next */}
                    <div
                      className="spidey-carousel"
                      style={{
                        display: "flex",
                        width: "300%",
                        height: "100%",
                        // Centre slot is index 1 of 3, so base offset = -100%/3 = -33.33%
                        transform: `translateX(calc(-33.3333% + ${swipeOffset}px))`,
                        transition: (swipeDragging.current || swipeCommitting.current)
                          ? (swipeDragging.current ? "none" : "transform 0.52s cubic-bezier(0.16, 1, 0.3, 1)")
                          : "none",
                        willChange: "transform",
                      }}
                    >
                      {[
                        pw.photos[(index - 1 + pw.photos.length) % pw.photos.length],
                        pw.photos[index],
                        pw.photos[(index + 1) % pw.photos.length],
                      ].map((src, slot) => (
                        <div key={`${src}-${slot}`} style={{ width: "33.3333%", height: "100%", flexShrink: 0, position: "relative" }}>
                          {!loadedImages.has(src) && (
                            <div style={{
                              position: "absolute", inset: 0,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              background: "rgba(0,0,0,0.5)",
                            }}>
                              <div style={{
                                width: 20, height: 20, borderRadius: "50%",
                                border: "2px solid rgba(255,255,255,0.3)",
                                borderTop: "2px solid #fff",
                                animation: "spin 0.8s linear infinite",
                              }} />
                            </div>
                          )}
                          <img
                            src={src}
                            alt={`${pw.label} ${slot}`}
                            style={{
                              width: "100%", height: "100%",
                              objectFit: "cover", display: "block",
                              userSelect: "none", WebkitUserSelect: "none",
                              WebkitTouchCallout: "none" as React.CSSProperties["WebkitTouchCallout"],
                              pointerEvents: "none",
                            }}
                            onContextMenu={e => e.preventDefault()}
                            onDragStart={e => e.preventDefault()}
                          />
                        </div>
                      ))}
                    </div>

                    {/* City pill top-left */}
                    <div style={{
                      position: "absolute", top: 10, left: 10,
                      background: "rgba(0,0,0,0.52)",
                      backdropFilter: "blur(6px)",
                      WebkitBackdropFilter: "blur(6px)",
                      borderRadius: 20, padding: "4px 10px",
                      fontFamily: "DM Mono, monospace", fontSize: 11,
                      color: "#fff", fontWeight: 500, letterSpacing: "0.03em",
                      zIndex: 2,
                    }}>{pw.label}</div>

                    {/* Photo counter — bottom-left, beside dots */}
                    <div style={{
                      position: "absolute", bottom: 28, left: 10,
                      background: "rgba(0,0,0,0.52)",
                      backdropFilter: "blur(6px)",
                      WebkitBackdropFilter: "blur(6px)",
                      borderRadius: 20, padding: "3px 9px",
                      fontFamily: "DM Mono, monospace", fontSize: 9,
                      color: "rgba(255,255,255,0.7)", letterSpacing: "0.06em",
                      zIndex: 2,
                    }}>{index + 1} / {pw.photos.length}</div>

                    {/* Prev / Next arrows */}
                    {pw.photos.length > 1 && (
                      <>
                        <button
                          onClick={carouselPrev}
                          aria-label="Previous photo"
                          style={{
                            position: "absolute", left: 8, top: "50%",
                            transform: "translateY(-50%)",
                            width: 32, height: 32, borderRadius: "50%",
                            background: "rgba(0,0,0,0.45)",
                            backdropFilter: "blur(4px)",
                            border: "none", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#fff", zIndex: 2,
                          }}
                        ><ChevronLeft size={16} /></button>
                        <button
                          onClick={carouselNext}
                          aria-label="Next photo"
                          style={{
                            position: "absolute", right: 8, top: "50%",
                            transform: "translateY(-50%)",
                            width: 32, height: 32, borderRadius: "50%",
                            background: "rgba(0,0,0,0.45)",
                            backdropFilter: "blur(4px)",
                            border: "none", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#fff", zIndex: 2,
                          }}
                        ><ChevronRight size={16} /></button>
                      </>
                    )}

                    {/* Dot indicators with fade — selected dot always centered */}
                    {pw.photos.length > 1 && (
                      <div style={{
                        position: "absolute", bottom: 10, left: 0, right: 0,
                        display: "flex", justifyContent: "center", gap: 5,
                        overflow: "hidden", zIndex: 2,
                        mask: "linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%)",
                        WebkitMask: "linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%)",
                      }}>
                        <div style={{
                          display: "flex", gap: 5, alignItems: "center",
                          transform: `translateX(calc(50% - ${index * 11 + 8}px))`,
                          transition: "transform 0.3s ease-out",
                        }}>
                          {pw.photos.map((_, i) => (
                            <div
                              key={i}
                              onClick={e => { e.stopPropagation(); setCarousel(c => c ? { ...c, index: i } : c); }}
                              style={{
                                width: i === index ? 16 : 6, height: 6,
                                borderRadius: 3,
                                background: i === index ? "#fff" : "rgba(255,255,255,0.4)",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                flexShrink: 0,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Text row */}
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 14px",
                    borderTop: "1px solid var(--border)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <TypeIcon size={13} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
                      <span style={{
                        fontFamily: "DM Mono, monospace", fontSize: 11,
                        color: "var(--foreground)", fontWeight: 500,
                      }}>{typeLabel[wp.type]}</span>
                    </div>
                    <span style={{
                      fontFamily: "DM Mono, monospace", fontSize: 9,
                      color: "var(--muted-foreground)", opacity: 0.6,
                    }}>{wp.tag}</span>
                  </div>

                  {/* Close button — top-right corner of card, above image */}
                  <button
                    onClick={closeCarousel}
                    aria-label="Close"
                    style={{
                      position: "absolute", top: 10, right: 10,
                      width: 26, height: 26, borderRadius: "50%",
                      background: "rgba(0,0,0,0.52)",
                      backdropFilter: "blur(6px)",
                      WebkitBackdropFilter: "blur(6px)",
                      border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff",
                      zIndex: 10,
                    }}
                  ><X size={13} /></button>
                </div>
              </div>
            );
          })()}

        </div>

        {/* ── Bottom ticker band ────────────────────────────────────────────── */}
        <div style={{
          flexShrink: 0,
          height: 28,
          borderTop: "1px solid var(--border)",
          background: "var(--node-header)",
          overflow: "hidden",
          position: "relative",
          display: "flex",
          alignItems: "center",
        }}>
          <style>{`
            @keyframes jrn-ticker {
              from { transform: translateX(0); }
              to   { transform: translateX(-50%); }
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
            /* Prevent image saving */
            .spidey-carousel img {
              -webkit-user-select: none;
              user-select: none;
              -webkit-user-drag: none;
            }
          `}</style>
          <div style={{
            display: "flex",
            whiteSpace: "nowrap",
            fontFamily: "DM Mono, monospace",
            fontSize: 9,
            color: headerText,
            opacity: 0.65,
            letterSpacing: "0.1em",
            animation: "jrn-ticker 80s linear infinite",
            willChange: "transform",
          }}>
            {/* Duplicate so the loop is seamless — animate exactly 50% = one full copy */}
            <span>{TICKER_TEXT.repeat(4)}</span>
            <span aria-hidden="true">{TICKER_TEXT.repeat(4)}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
