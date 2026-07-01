import type { VisionMode } from '@/shared/types';

// SVG namespace for createElementNS-based filter construction
const SVG_NS = 'http://www.w3.org/2000/svg';

// SVG filter IDs
const FILTER_ID_PREFIX = 'watchdog-vision-filter';

// Colorblind simulation feColorMatrix values based on research
// Source: https://github.com/MaPePeR/jsColorblindSimulator
const COLOR_MATRICES = {
  protanopia: `
    0.567, 0.433, 0,     0, 0
    0.558, 0.442, 0,     0, 0
    0,     0.242, 0.758, 0, 0
    0,     0,     0,     1, 0
  `,
  deuteranopia: `
    0.625, 0.375, 0,   0, 0
    0.7,   0.3,   0,   0, 0
    0,     0.3,   0.7, 0, 0
    0,     0,     0,   1, 0
  `,
  tritanopia: `
    0.95, 0.05,  0,     0, 0
    0,    0.433, 0.567, 0, 0
    0,    0.475, 0.525, 0, 0
    0,    0,     0,     1, 0
  `,
  achromatopsia: `
    0.299, 0.587, 0.114, 0, 0
    0.299, 0.587, 0.114, 0, 0
    0.299, 0.587, 0.114, 0, 0
    0,     0,     0,     1, 0
  `,
};

// Blur levels
const BLUR_LEVELS = {
  'blur-low': 2,
  'blur-medium': 4,
  'blur-high': 8,
};

let currentSvgElement: SVGSVGElement | null = null;

/**
 * Creates and injects SVG filter definitions into the page
 */
function createSvgFilters(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('id', 'watchdog-vision-filters');
  svg.style.position = 'absolute';
  svg.style.width = '0';
  svg.style.height = '0';
  svg.style.overflow = 'hidden';

  const defs = document.createElementNS(SVG_NS, 'defs');

  // Create filter for each colorblind type
  Object.entries(COLOR_MATRICES).forEach(([mode, values]) => {
    const filter = document.createElementNS(SVG_NS, 'filter');
    filter.setAttribute('id', `${FILTER_ID_PREFIX}-${mode}`);
    // Run the simulation in sRGB; the default linearRGB skews the result
    filter.setAttribute('color-interpolation-filters', 'sRGB');

    const feColorMatrix = document.createElementNS(SVG_NS, 'feColorMatrix');
    feColorMatrix.setAttribute('type', 'matrix');
    feColorMatrix.setAttribute('values', values.trim());
    filter.appendChild(feColorMatrix);

    defs.appendChild(filter);
  });

  svg.appendChild(defs);
  return svg;
}

/**
 * Applies a vision simulation filter to the page
 */
export function applyVisionFilter(mode: VisionMode): void {
  // Remove any existing filter
  removeVisionFilter();

  if (mode === 'none') {
    return;
  }

  // Apply blur filter
  if (mode.startsWith('blur-')) {
    const blurAmount = BLUR_LEVELS[mode as keyof typeof BLUR_LEVELS];
    document.documentElement.style.filter = `blur(${blurAmount}px)`;
    return;
  }

  // Apply colorblind filter
  if (!currentSvgElement) {
    currentSvgElement = createSvgFilters();
    document.body.appendChild(currentSvgElement);
  }

  const filterId = `${FILTER_ID_PREFIX}-${mode}`;
  document.documentElement.style.filter = `url(#${filterId})`;
}

/**
 * Removes all vision filters from the page
 */
export function removeVisionFilter(): void {
  document.documentElement.style.filter = '';

  if (currentSvgElement) {
    currentSvgElement.remove();
    currentSvgElement = null;
  }
}

/**
 * Gets the current vision filter mode from the DOM
 */
export function getCurrentVisionFilter(): VisionMode {
  const filter = document.documentElement.style.filter;

  if (!filter) {
    return 'none';
  }

  if (filter.startsWith('blur(')) {
    const blurValue = parseInt(filter.match(/blur\((\d+)px\)/)?.[1] || '0', 10);
    if (blurValue === BLUR_LEVELS['blur-low']) return 'blur-low';
    if (blurValue === BLUR_LEVELS['blur-medium']) return 'blur-medium';
    if (blurValue === BLUR_LEVELS['blur-high']) return 'blur-high';
  }

  for (const mode of Object.keys(COLOR_MATRICES)) {
    if (filter.includes(mode)) {
      return mode as VisionMode;
    }
  }

  return 'none';
}
