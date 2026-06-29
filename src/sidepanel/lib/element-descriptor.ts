/**
 * Plain-language element descriptor (ux-public-13).
 *
 * Turns a raw HTML snippet (the page-controlled `issue.element.html`) into a
 * friendly phrase a non-developer can recognise — e.g. `the "Buy now" button`,
 * `the image "logo.png"`, `a link to /pricing`, `a heading`. The Site-owner
 * views lead with this instead of raw markup.
 *
 * Safety: the html is page-controlled, so it is only ever PARSED — we read
 * textContent and attributes, never re-inject it as markup. DOMParser with
 * 'text/html' neither executes scripts nor loads sub-resources.
 */

// Friendly nouns for tags that have no dedicated branch below. Anything not
// listed falls back to the raw (but still readable) tag name.
const TAG_NOUNS: Record<string, string> = {
  nav: 'navigation',
  ul: 'list',
  ol: 'list',
  li: 'list item',
  dl: 'list',
  p: 'paragraph',
  form: 'form',
  table: 'table',
  svg: 'graphic',
  iframe: 'frame',
  label: 'label',
  video: 'video',
  audio: 'audio',
  section: 'section',
  header: 'header',
  footer: 'footer',
  main: 'main content',
  article: 'article',
  span: 'element',
  div: 'element',
};

/** Trimmed attribute value, or '' when missing/blank. */
function attr(el: Element, name: string): string {
  return el.getAttribute(name)?.trim() ?? '';
}

/** Cap a name so a verbose snippet can't dominate the phrase. */
function clamp(value: string, max = 60): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

/** Collapsed, trimmed, length-capped text content. */
function text(el: Element): string {
  return clamp((el.textContent ?? '').replace(/\s+/g, ' ').trim());
}

/** "a"/"an" prefix for a noun, picked by its leading sound (good enough). */
function indefinite(noun: string): string {
  return /^[aeiou]/i.test(noun) ? `an ${noun}` : `a ${noun}`;
}

/** File name from a src/href, minus path and query — '' for data: URIs. */
function fileName(src: string): string {
  if (!src || src.startsWith('data:')) return '';
  const clean = src.split(/[?#]/)[0];
  const base = clean.slice(clean.lastIndexOf('/') + 1);
  return clamp(base || clean);
}

/** The first element node of a snippet, or null when there is none to describe. */
function firstElement(html: string): Element | null {
  if (typeof html !== 'string' || html.trim() === '') return null;
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.firstElementChild;
  } catch {
    return null;
  }
}

export function describeElement(html: string): string {
  const el = firstElement(html);
  if (!el) return 'this element';

  const tag = el.tagName.toLowerCase();

  switch (tag) {
    case 'a': {
      const name = attr(el, 'aria-label') || text(el) || attr(el, 'title');
      if (name) return `the "${name}" link`;
      const href = attr(el, 'href');
      return href ? `a link to ${clamp(href)}` : 'a link';
    }
    case 'button': {
      const name = attr(el, 'aria-label') || text(el) || attr(el, 'title');
      return name ? `the "${name}" button` : 'a button';
    }
    case 'img': {
      const name = attr(el, 'aria-label') || attr(el, 'alt') || attr(el, 'title');
      // No accessible name is itself the common image finding — fall back to the
      // file name so the owner can still locate the image on the page.
      const label = name || fileName(attr(el, 'src'));
      return label ? `the image "${clamp(label)}"` : 'an image';
    }
    case 'input': {
      const type = (attr(el, 'type') || 'text').toLowerCase();
      if (type === 'submit' || type === 'button' || type === 'reset') {
        const name = attr(el, 'aria-label') || attr(el, 'value') || attr(el, 'title');
        return name ? `the "${name}" button` : 'a button';
      }
      if (type === 'image') {
        const label = attr(el, 'aria-label') || attr(el, 'alt') || fileName(attr(el, 'src'));
        return label ? `the image button "${clamp(label)}"` : 'an image button';
      }
      if (type === 'checkbox') {
        const name = attr(el, 'aria-label') || attr(el, 'title');
        return name ? `the "${name}" checkbox` : 'a checkbox';
      }
      if (type === 'radio') {
        const name = attr(el, 'aria-label') || attr(el, 'title');
        return name ? `the "${name}" radio button` : 'a radio button';
      }
      const name =
        attr(el, 'aria-label') || attr(el, 'placeholder') || attr(el, 'title') || attr(el, 'value');
      return name ? `the "${name}" field` : 'a form field';
    }
    case 'textarea': {
      const name = attr(el, 'aria-label') || attr(el, 'placeholder') || attr(el, 'title');
      return name ? `the "${name}" field` : 'a text field';
    }
    case 'select': {
      const name = attr(el, 'aria-label') || attr(el, 'title');
      return name ? `the "${name}" dropdown` : 'a dropdown';
    }
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6': {
      const name = attr(el, 'aria-label') || text(el);
      return name ? `the "${name}" heading` : 'a heading';
    }
    default: {
      const noun = TAG_NOUNS[tag] ?? tag;
      const name = attr(el, 'aria-label') || text(el) || attr(el, 'title');
      return name ? `the "${name}" ${noun}` : indefinite(noun);
    }
  }
}
