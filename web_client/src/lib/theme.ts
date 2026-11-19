export interface TenantBranding {
  storeName: string;
  tagline?: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor: string;
  primaryDarkColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textPrimaryColor: string;
  seoTitle?: string;
  seoDescription?: string;
  aiChatbotActive?: boolean;
}

export interface TenantPlanInfo {
  code: string;
  name: string;
  maxProducts: number;
  maxStorageMb: number;
  customDomainAllowed: boolean;
  aiChatbotEnabled: boolean;
  autoProcurementEnabled: boolean;
}

export interface PublicTenant {
  id: string;
  name: string;
  slug: string;
  isDefault: boolean;
  status: string;
  customDomain: string | null;
  customDomainVerified: boolean;
  plan: TenantPlanInfo | null;
  branding: TenantBranding;
}

export const DEFAULT_TENANT: PublicTenant = {
  id: "tenant_smk_default",
  name: "SMK",
  slug: "smk",
  isDefault: true,
  status: "ACTIVE",
  customDomain: null,
  customDomainVerified: false,
  plan: {
    code: "PRO",
    name: "Pro AI",
    maxProducts: 5000,
    maxStorageMb: 25000,
    customDomainAllowed: true,
    aiChatbotEnabled: true,
    autoProcurementEnabled: true,
  },
  branding: {
    storeName: "SMK",
    tagline: "Curated collections & everyday essentials",
    logoUrl: "/images/logo/smk.jpg",
    faviconUrl: "/favicon.ico",
    primaryColor: "#3C50E0",
    primaryDarkColor: "#1C3FB7",
    accentColor: "#0EA5E9",
    backgroundColor: "#F6FAFF",
    surfaceColor: "#FFFFFF",
    textPrimaryColor: "#1C274C",
    seoTitle: "SMK | Online Shopping Store",
    seoDescription:
      "Shop curated collections, everyday essentials, and new arrivals at SMK with transparent pricing, real-time stock availability, and secure online checkout.",
    aiChatbotActive: true,
  },
};

export interface ThemePreset {
  id: string;
  name: string;
  primaryColor: string;
  primaryDarkColor: string;
  accentColor: string;
  backgroundColor: string;
  textPrimaryColor: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "ocean-blue",
    name: "Ocean Blue",
    primaryColor: "#3C50E0",
    primaryDarkColor: "#1C3FB7",
    accentColor: "#0EA5E9",
    backgroundColor: "#F6FAFF",
    textPrimaryColor: "#1C274C",
  },
  {
    id: "emerald-luxury",
    name: "Emerald Luxury",
    primaryColor: "#059669",
    primaryDarkColor: "#047857",
    accentColor: "#14B8A6",
    backgroundColor: "#F4FBF8",
    textPrimaryColor: "#0F2922",
  },
  {
    id: "crimson-studio",
    name: "Crimson Studio",
    primaryColor: "#E11D48",
    primaryDarkColor: "#BE123C",
    accentColor: "#F97316",
    backgroundColor: "#FFF6F7",
    textPrimaryColor: "#2B111A",
  },
  {
    id: "royal-violet",
    name: "Royal Violet",
    primaryColor: "#7C3AED",
    primaryDarkColor: "#6D28D9",
    accentColor: "#EC4899",
    backgroundColor: "#F9F6FF",
    textPrimaryColor: "#1E1438",
  },
  {
    id: "terracotta-warm",
    name: "Terracotta Warm",
    primaryColor: "#C2410C",
    primaryDarkColor: "#9A3412",
    accentColor: "#D97706",
    backgroundColor: "#FFF9F5",
    textPrimaryColor: "#2E1A12",
  },
  {
    id: "obsidian-minimal",
    name: "Obsidian Minimal",
    primaryColor: "#18181B",
    primaryDarkColor: "#09090B",
    accentColor: "#52525B",
    backgroundColor: "#FAFAFA",
    textPrimaryColor: "#18181B",
  },
];

const HEX_RE = /^#?[0-9A-Fa-f]{6}$/;

export function hexToRgbTriplet(hex: string, fallback = "60 80 224"): string {
  if (!hex || !HEX_RE.test(hex.trim())) return fallback;
  const clean = hex.trim().replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

export function lightenHex(hex: string, amount = 0.2): string {
  if (!hex || !HEX_RE.test(hex.trim())) return "#5475E5";
  const clean = hex.trim().replace("#", "");
  const r = Math.min(255, Math.round(parseInt(clean.slice(0, 2), 16) + (255 - parseInt(clean.slice(0, 2), 16)) * amount));
  const g = Math.min(255, Math.round(parseInt(clean.slice(2, 4), 16) + (255 - parseInt(clean.slice(2, 4), 16)) * amount));
  const b = Math.min(255, Math.round(parseInt(clean.slice(4, 6), 16) + (255 - parseInt(clean.slice(4, 6), 16)) * amount));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

export function darkenHex(hex: string, factor = 0.78): string {
  if (!hex || !HEX_RE.test(hex.trim())) return "#1C3FB7";
  const clean = hex.trim().replace("#", "");
  const r = Math.max(0, Math.round(parseInt(clean.slice(0, 2), 16) * factor));
  const g = Math.max(0, Math.round(parseInt(clean.slice(2, 4), 16) * factor));
  const b = Math.max(0, Math.round(parseInt(clean.slice(4, 6), 16) * factor));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

export function buildThemeCssVariables(branding?: Partial<TenantBranding>): Record<string, string> {
  const b = { ...DEFAULT_TENANT.branding, ...(branding || {}) };
  const primaryLight = lightenHex(b.primaryColor, 0.22);
  const primarySoft = lightenHex(b.primaryColor, 0.88);
  const primaryDark = b.primaryDarkColor || darkenHex(b.primaryColor);

  return {
    "--brand-primary": hexToRgbTriplet(b.primaryColor, "60 80 224"),
    "--brand-primary-dark": hexToRgbTriplet(primaryDark, "28 63 183"),
    "--brand-primary-light": hexToRgbTriplet(primaryLight, "84 117 229"),
    "--brand-primary-soft": hexToRgbTriplet(primarySoft, "225 232 255"),
    "--brand-accent": hexToRgbTriplet(b.accentColor, "14 165 233"),
    "--brand-text-primary": hexToRgbTriplet(b.textPrimaryColor, "28 39 76"),
    "--app-bg": b.backgroundColor || "#F6FAFF",
    "--surface": b.surfaceColor || "#FFFFFF",
    "--text-primary": b.textPrimaryColor || "#1C274C",
  };
}
