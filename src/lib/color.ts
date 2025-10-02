import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';

// Extend colord with the names plugin to support named colors
extend([namesPlugin]);

// Type definitions for color objects (keeping same interface for compatibility)
export interface RgbaColor {
  red: number; // 0-1 range
  green: number; // 0-1 range
  blue: number; // 0-1 range
  alpha: number; // 0-1 range
}

export interface RgbColor {
  r: number; // 0-255 range
  g: number; // 0-255 range
  b: number; // 0-255 range
}

export interface HslColor {
  h: number; // 0-360 range
  s: number; // 0-100 range
  l: number; // 0-100 range
}

export function parseColor(colorString: string): RgbaColor | null {
  const trimmedColor = colorString.trim();

  // Use colord to parse and validate the color
  const color = colord(trimmedColor);

  // Return null if color is invalid or transparent
  if (!color.isValid() || color.alpha() === 0) {
    return null;
  }

  // Convert to our RgbaColor format (0-1 range)
  const rgb = color.toRgb();
  const alpha = color.alpha();
  return {
    red: rgb.r / 255,
    green: rgb.g / 255,
    blue: rgb.b / 255,
    alpha: alpha,
  };
}

export function hexToRgba(hex: string): RgbaColor | null {
  const color = colord(hex);
  if (!color.isValid()) {
    return null;
  }

  const rgb = color.toRgb();
  const alpha = color.alpha();
  return {
    red: rgb.r / 255,
    green: rgb.g / 255,
    blue: rgb.b / 255,
    alpha: alpha,
  };
}

export function rgbaToHex(color: RgbaColor): string {
  const colordColor = colord({
    r: Math.round(color.red * 255),
    g: Math.round(color.green * 255),
    b: Math.round(color.blue * 255),
    a: color.alpha,
  });

  return colordColor.toHex();
}

export function hslToRgba(
  h: number,
  s: number,
  l: number,
  a: number,
): RgbaColor {
  const color = colord({ h, s: s * 100, l: l * 100, a });
  const rgb = color.toRgb();

  return {
    red: rgb.r / 255,
    green: rgb.g / 255,
    blue: rgb.b / 255,
    alpha: a,
  };
}

export function hslToRgb(themeColor: string): RgbColor | null {
  const color = colord(themeColor);
  if (!color.isValid()) {
    return null;
  }

  const rgb = color.toRgb();
  return {
    r: Math.round(rgb.r),
    g: Math.round(rgb.g),
    b: Math.round(rgb.b),
  };
}

export function rgbToHsl(
  rOrColor: number | RgbColor,
  g?: number,
  b?: number,
): HslColor {
  let color: RgbColor;

  if (typeof rOrColor === 'number') {
    // Legacy function signature: rgbToHsl(r, g, b)
    if (g === undefined || b === undefined) {
      throw new Error(
        'Missing required parameters: g and b must be provided when r is a number',
      );
    }
    color = { r: rOrColor, g, b };
  } else {
    // Object signature: rgbToHsl({r, g, b})
    color = rOrColor;
  }

  const colordColor = colord({ r: color.r, g: color.g, b: color.b });
  const hsl = colordColor.toHsl();

  return {
    h: Math.round(hsl.h),
    s: Math.round(hsl.s),
    l: Math.round(hsl.l),
  };
}
