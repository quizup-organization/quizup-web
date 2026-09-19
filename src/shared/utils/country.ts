const FLAGS: Record<string, string> = {
  FR: "🇫🇷",
  BE: "🇧🇪",
  CH: "🇨🇭",
  CA: "🇨🇦",
  SN: "🇸🇳",
  JP: "🇯🇵",
  US: "🇺🇸",
  GB: "🇬🇧",
  DE: "🇩🇪",
  ES: "🇪🇸",
  IT: "🇮🇹",
};

const COUNTRIES: Record<string, string> = {
  FR: "France",
  BE: "Belgique",
  CH: "Suisse",
  CA: "Canada",
  SN: "Sénégal",
  JP: "Japon",
  US: "États-Unis",
  GB: "Royaume-Uni",
  DE: "Allemagne",
  ES: "Espagne",
  IT: "Italie",
};

/** Drapeau emoji depuis un code pays ISO-3166 alpha-2. */
export function countryFlag(code?: string | null): string {
  if (!code) return "";
  return FLAGS[code.toUpperCase()] ?? "";
}

/** Libellé pays FR depuis un code ISO-3166 alpha-2 (repli : le code). */
export function countryLabel(code?: string | null): string {
  if (!code) return "";
  return COUNTRIES[code.toUpperCase()] ?? code;
}
