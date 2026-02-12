/**
 * Preset themes for the ZFENIX Quotation Preview
 * These colors apply to headers, accents, and section titles
 */
export const QUOTATION_THEMES = {
  blue: {
    id: 'blue',
    name: 'Professional Blue',
    primary: '#1E40AF', // Blue 800
    accent: '#3B82F6',  // Blue 500
    secondary: '#DBEAFE', // Blue 100
  },
  green: {
    id: 'green',
    name: 'Sustainable Green',
    primary: '#064E3B', // Green 900
    accent: '#10B981',  // Green 500
    secondary: '#D1FAE5', // Green 100
  },
  red: {
    id: 'red',
    name: 'Premium Red',
    primary: '#7F1D1D', // Red 900
    accent: '#EF4444',  // Red 500
    secondary: '#FEE2E2', // Red 100
  },
  orange: {
    id: 'orange',
    name: 'Creative Orange',
    primary: '#7C2D12', // Orange 900
    accent: '#F97316',  // Orange 500
    secondary: '#FFEDD5', // Orange 100
  },
} as const;

export type QuotationThemeId = keyof typeof QUOTATION_THEMES;

export function getThemeColors(themeId: string) {
  // If themeId is a hex code (custom), generate accent/secondary
  if (themeId.startsWith('#')) {
    return {
      primary: themeId,
      accent: themeId,
      secondary: '#f8fafc', // Default slate 50
    };
  }

  // Use preset if exists, otherwise fallback to blue
  const theme = QUOTATION_THEMES[themeId as QuotationThemeId] || QUOTATION_THEMES.blue;
  return {
    primary: theme.primary,
    accent: theme.accent,
    secondary: theme.secondary,
  };
}
