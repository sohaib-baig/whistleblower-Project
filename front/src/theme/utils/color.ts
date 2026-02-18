// Lightweight, defensive replacements for color helpers used in theme setup.
// These guard against undefined inputs in production and ensure required
// "Channel" properties exist even if a 3rd-party utility fails to load.

type AnyPalette = Record<string, any>;

function hexToRgbChannel(hex: string): string | null {
  if (!hex || typeof hex !== 'string') return null;
  let c = hex.trim().replace('#', '');
  if (c.length === 3) {
    c = c
      .split('')
      .map((ch) => ch + ch)
      .join('');
  }
  if (c.length !== 6) return null;
  const r = Number.parseInt(c.substring(0, 2), 16);
  const g = Number.parseInt(c.substring(2, 4), 16);
  const b = Number.parseInt(c.substring(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  return `${r} ${g} ${b}`;
}

export function varAlphaSafe(colorOrChannel: string | undefined, alpha: number): string {
  if (!colorOrChannel) return `rgba(0 0 0 / ${alpha})`;
  // If we received a hex color, convert to channel
  if (colorOrChannel.startsWith('#')) {
    const ch = hexToRgbChannel(colorOrChannel);
    return ch ? `rgba(${ch} / ${alpha})` : `rgba(0 0 0 / ${alpha})`;
  }
  // Assume channel format "r g b"
  return `rgba(${colorOrChannel} / ${alpha})`;
}

export function createPaletteChannelSafe<T extends AnyPalette>(palette: T): T & AnyPalette {
  if (!palette || typeof palette !== 'object') return {} as T & AnyPalette;

  const result: AnyPalette = { ...palette };

  // Handle grey scale: keys like '50', '100', ..., '900'
  const greyKeys = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'];
  const hasGrey = greyKeys.some((k) => typeof (palette as AnyPalette)[k] === 'string');
  if (hasGrey) {
    greyKeys.forEach((k) => {
      const hex = (palette as AnyPalette)[k];
      const ch = hexToRgbChannel(hex);
      if (ch) result[`${k}Channel`] = ch;
    });
    return result as T & AnyPalette;
  }

  // Handle common colors
  if ((palette as AnyPalette).black || (palette as AnyPalette).white) {
    const blackCh = hexToRgbChannel((palette as AnyPalette).black);
    const whiteCh = hexToRgbChannel((palette as AnyPalette).white);
    if (blackCh) result.blackChannel = blackCh;
    if (whiteCh) result.whiteChannel = whiteCh;
  }

  // Handle palette colors with lighter/light/main/dark/darker
  const shadeKeys = ['lighter', 'light', 'main', 'dark', 'darker'];
  const hasShades = shadeKeys.some((k) => typeof (palette as AnyPalette)[k] === 'string');
  if (hasShades) {
    const lighterCh = hexToRgbChannel((palette as AnyPalette).lighter);
    const darkerCh = hexToRgbChannel((palette as AnyPalette).darker);
    if (lighterCh) result.lighterChannel = lighterCh;
    if (darkerCh) result.darkerChannel = darkerCh;

    // Add numeric shade aliases expected by MUI augmentColor in prod
    // Map common tones to available shades as a safe fallback
    if (!('200' in result) && typeof (palette as AnyPalette).light === 'string') {
      result['200'] = (palette as AnyPalette).light;
    }
    if (!('500' in result) && typeof (palette as AnyPalette).main === 'string') {
      result['500'] = (palette as AnyPalette).main;
    }
    if (!('700' in result) && typeof (palette as AnyPalette).dark === 'string') {
      result['700'] = (palette as AnyPalette).dark;
    }
  }

  return result as T & AnyPalette;
}
