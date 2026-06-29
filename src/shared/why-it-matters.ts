// Plain-language "why this matters" lines, keyed by issue `ruleId`. Each value is
// ONE sentence describing the human or business CONSEQUENCE of the issue — not a
// restatement of the rule — so Site-owner mode can explain stakes without jargon.
// React-free on purpose: this is imported content-side by the scanner.
//
// Coverage: the 39 axe accessibility rules (MVP_RULES) plus the ruleIds emitted by
// the five custom scanners (performance / seo / security / best-practices / pwa).
// A missing entry is fine — the consumer treats `undefined` as "show nothing".
export const WHY_IT_MATTERS: Record<string, string> = {
  // --- Accessibility (axe-core / WCAG) ---
  'image-alt': "People using a screen reader can't tell what these images show.",
  'button-name':
    "People using a screen reader hear an unlabeled button and can't tell what it does.",
  'link-name':
    "People using a screen reader hear a link with no text and can't tell where it goes.",
  'color-contrast': 'Text is hard to read for people with low vision or in bright sunlight.',
  label: "People can't tell what to type in these form fields, especially with a screen reader.",
  'html-has-lang': 'Screen readers may read the page in the wrong accent or language.',
  'document-title': 'Search results and browser tabs show a confusing or missing page name.',
  'heading-order': 'People who navigate by headings get a jumbled outline of the page.',
  region:
    "Screen reader users can't jump straight to the main content and have to wade through everything.",
  'aria-valid-attr':
    'Broken accessibility code can make controls behave unpredictably for assistive technology.',
  'aria-required-attr':
    'Assistive technology is missing details it needs to describe these controls correctly.',
  'aria-roles': 'An invalid role makes assistive technology announce the wrong kind of control.',
  'meta-viewport':
    "People who zoom in to read can't enlarge the text, locking out anyone with low vision.",
  tabindex: 'Keyboard users get sent through the page in a confusing order.',
  'duplicate-id': 'Duplicate IDs can break labels and controls for assistive technology.',
  bypass:
    'Keyboard and screen reader users must tab through the same menus on every page with no way to skip.',
  'scrollable-region-focusable':
    "People using only a keyboard can't scroll this area to see all of its content.",
  'frame-focusable-content': "Keyboard users can't reach the content inside this frame.",
  'focus-order-semantics':
    "Assistive technology can't tell these elements are interactive, so they're easy to miss.",
  'video-caption': "People who are deaf or hard of hearing can't follow this video.",
  'audio-caption': "People who are deaf or hard of hearing miss what's said in this audio.",
  'no-autoplay-audio':
    'Sound that plays automatically drowns out screen readers and startles people.',
  'object-alt': "People using a screen reader can't tell what this embedded content is.",
  'svg-img-alt': "People using a screen reader can't tell what this graphic shows.",
  'td-headers-attr': 'Screen reader users lose track of which header each table cell belongs to.',
  'th-has-data-cells':
    "This table's headers don't line up with its data, confusing screen reader users.",
  'scope-attr-valid': "Screen readers can't reliably connect table headers to their cells.",
  'table-fake-caption':
    "Screen reader users miss the table's caption because it isn't marked up as one.",
  'definition-list': "Screen readers can't read this list of terms and definitions correctly.",
  list: "Screen readers can't announce how many items are in this list or read them properly.",
  listitem: 'List items placed outside a proper list confuse screen readers.',
  'nested-interactive':
    'Controls placed inside other controls trap keyboard and screen reader users.',
  'input-image-alt': "People using a screen reader can't tell what this image button does.",
  'select-name': "People can't tell what this dropdown is for, especially with a screen reader.",
  'autocomplete-valid':
    "Browsers can't autofill these fields, making forms slower and more error-prone for everyone.",
  'frame-title': "Screen reader users can't tell what this embedded frame contains.",
  'valid-lang': 'Screen readers mispronounce text marked with an invalid language.',
  marquee: "Moving text can't be paused, which is hard to read and can trigger discomfort.",
  blink: 'Blinking content is distracting and can trigger seizures for some people.',

  // --- Performance (Core Web Vitals + resource budgets) ---
  'performance-cls':
    'The page jumps around as it loads, making people tap or click the wrong thing.',
  'performance-cls-element':
    'This element shifts as the page loads, causing people to tap or click the wrong thing.',
  'performance-inp': 'The page feels sluggish and slow to respond when people tap or click.',
  'performance-tbt': 'The page is frozen and unresponsive for a noticeable stretch while it loads.',
  'performance-long-task':
    "A long-running script freezes the page, so taps and clicks don't register.",
  'performance-ttfb--time-to-first-byte-':
    'The server is slow to respond, so the page takes longer to start loading.',
  'performance-fcp--first-contentful-paint-':
    'People stare at a blank screen for too long before anything appears.',
  'performance-lcp--largest-contentful-paint-':
    'The main content takes too long to appear, so the page feels slow.',
  'performance-dom-content-loaded':
    'The page structure takes too long to be ready, delaying when people can interact.',
  'performance-page-load-time':
    "The page takes a long time to fully load, testing people's patience.",
  'performance-total-resources':
    'The page loads a lot of files, which slows it down especially on slower connections.',
  'performance-total-resource-size':
    'The page is heavy to download, costing people time and mobile data.',
  'performance-image-size': "Large images slow the page down and eat into people's mobile data.",
  'performance-javascript-size':
    'Heavy JavaScript slows the page down, especially on phones and older devices.',

  // --- SEO ---
  'title-missing': 'Search results and browser tabs show no page name, so people skip past it.',
  'title-length': 'A too-short or too-long title gets cut off or looks weak in search results.',
  'meta-description-missing':
    'Search results show a random snippet instead of a clear summary, costing you clicks.',
  'meta-description-length':
    'The search-result summary gets cut off or padded, reading awkwardly to searchers.',
  'h1-missing': "Search engines and readers can't tell what this page is mainly about.",
  'h1-multiple': 'Multiple main headings muddy what the page is about for search engines.',
  'og-title-missing': 'Links to this page shared on social media show no clear title.',
  'og-image-missing':
    'Links to this page shared on social media show no preview image, getting fewer clicks.',
  'canonical-missing':
    'Search engines may treat duplicate versions of this page as competing, splitting its ranking.',
  'viewport-missing':
    'The page does not adapt to phones, so mobile visitors get a broken, zoomed-out layout.',
  'https-missing':
    "Browsers warn visitors the page is 'not secure,' and search engines rank it lower.",
  'images-missing-alt':
    "Search engines can't index these images and screen reader users can't tell what they show.",
  'structured-data-missing':
    'The page misses out on rich search results like ratings, prices, and FAQs.',

  // --- Security ---
  'headers-check-failed':
    "Security headers couldn't be checked, so the page's protections are unverified.",
  'https-not-enabled':
    "Data sent to and from this page isn't encrypted and can be read or tampered with.",
  'mixed-content':
    'Insecure files loaded on a secure page can be hijacked and trigger browser warnings.',
  'cookies-accessible':
    'Cookies readable by scripts can be stolen, letting attackers hijack user sessions.',
  'forms-insecure': 'Data entered in this form is sent unencrypted and can be intercepted.',
  'forms-no-csrf':
    'Without protection, attackers can trick logged-in users into submitting this form unknowingly.',
  'password-over-http': 'Passwords entered here are sent unencrypted and can be stolen.',
  'password-autocomplete-off':
    'Blocking password managers pushes people toward weaker, reused passwords.',
  'inline-scripts-excessive':
    'Lots of inline scripts make it easier for attackers to inject malicious code.',
  'external-links-unsafe':
    'Links opening in new tabs without protection let the linked site tamper with your page.',
  'header-content-security-policy':
    'Without this protection, the page is more vulnerable to code-injection attacks like XSS.',
  'header-strict-transport-security':
    'Without this, attackers can downgrade visitors to an insecure connection.',
  'header-x-frame-options':
    'Without this, attackers can embed your page to trick users into clicking hidden controls.',
  'header-x-content-type-options':
    'Without this, browsers can misread files in ways attackers exploit.',
  'header-referrer-policy':
    'Without this, the page can leak where your visitors came from to other sites.',
  'header-permissions-policy':
    'Without this, embedded content can quietly access powerful features like camera or location.',

  // --- Best Practices ---
  'library-scan-scope':
    'Only some libraries could be checked, so hidden vulnerable dependencies may remain.',
  'password-paste-prevention':
    'Blocking paste in password fields frustrates people and discourages strong passwords.',
  'notification-on-load':
    'Asking to send notifications the moment someone arrives feels pushy and gets denied.',
  'unsized-images': 'Images without set dimensions make the page jump around as they load.',
  'image-aspect-ratio':
    "Stretched or squashed images look unprofessional and distort what's shown.",
  'doctype-missing':
    'Without a doctype, browsers may render the page in an old, unpredictable mode.',
  'doctype-invalid':
    'An incorrect doctype can make browsers render the page in an unpredictable mode.',
  'charset-missing':
    'Without a declared character set, text and symbols may show as garbled characters.',
  'lang-missing':
    'Without a language set, screen readers and translation tools may handle the text wrong.',
  'deprecated-elements': 'Outdated HTML elements may stop working as browsers drop support.',
  'broken-images': 'These images fail to load, leaving blank spots or broken-image icons.',
  'duplicate-ids': 'Repeated IDs can break scripts, styles, and links within the page.',
  'empty-links': 'Links with no text give people and search engines nothing to act on.',
  'javascript-links':
    "These links don't work without JavaScript and break for search engines and some users.",
  'meta-refresh':
    'Auto-refreshing or redirecting the page can disorient people and lose their place.',
  'passive-listeners':
    'Non-passive scroll handlers make scrolling feel janky, especially on touchscreens.',
  'geolocation-on-load':
    'Asking for location the moment someone arrives feels invasive and gets denied.',

  // --- PWA ---
  'manifest-missing':
    "Without an app manifest, people can't install this site as an app on their device.",
  'manifest-name-missing':
    'The installed app would show no name, confusing people on their home screen.',
  'manifest-short-name-missing':
    'The app icon would show no short label under it on the home screen.',
  'manifest-start-url-missing':
    'Launching the installed app may open the wrong page or fail to open.',
  'manifest-display-missing':
    'The installed app opens in a browser tab instead of feeling like a real app.',
  'manifest-theme-color-missing':
    "The app's toolbar shows a default color instead of matching your brand.",
  'manifest-background-color-missing':
    'The app shows a plain splash screen instead of your brand color while loading.',
  'manifest-icons-missing':
    'The installed app has no icon, showing a generic placeholder on the home screen.',
  'manifest-icons-sizes': 'Missing icon sizes make the app icon look blurry on some devices.',
  'manifest-unreachable':
    "The app manifest can't be loaded, so the site can't be installed as an app.",
  'service-worker-not-supported':
    "This browser can't support the offline features that make a site app-like.",
  'service-worker-not-registered': "The app won't work offline or load quickly on repeat visits.",
  'service-worker-check-failed': "The offline-support setup couldn't be verified.",
  'pwa-https-required':
    "The app can't be installed or work offline because the page isn't served over HTTPS.",
  'pwa-viewport-missing':
    "Without a viewport tag, the installed app won't scale correctly on phones.",
  'apple-touch-icon-missing':
    'On iPhones and iPads, the saved app shows a blurry screenshot instead of a crisp icon.',
  'theme-color-meta-missing':
    'The browser toolbar shows a default color instead of matching your brand.',
};

export function whyItMatters(ruleId: string): string | undefined {
  return WHY_IT_MATTERS[ruleId];
}
