export type CadastreNavContext = {
  ids: string[];
  index: number;
  backUrl: string;
};

export const CADASTRE_NAV_KEY = "cadastreNav";

export function saveNav(ids: string[], index: number, backUrl: string): void {
  try {
    sessionStorage.setItem(CADASTRE_NAV_KEY, JSON.stringify({ ids, index, backUrl } satisfies CadastreNavContext));
  } catch {
    // sessionStorage unavailable
  }
}

export function loadNav(): CadastreNavContext | null {
  try {
    const raw = sessionStorage.getItem(CADASTRE_NAV_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CadastreNavContext;
  } catch {
    return null;
  }
}
