import { defineManifest } from '@crxjs/vite-plugin';
import packageJson from './package.json';

const { version, description } = packageJson;

// Convert semver to Chrome's 4-part version format
const [major, minor, patch] = version.split(/[.-]/);

export default defineManifest({
  manifest_version: 3,
  name: 'WatchDog',
  version: `${major}.${minor}.${patch}`,
  version_name: version,
  description,

  // sidePanel + the side_panel manifest key require Chrome 114+. Declaring the
  // floor hides the listing from older Chrome (where the service worker would
  // throw at init) instead of shipping a dead install. scripting/activeTab/storage
  // are all older, so 114 is the binding minimum.
  minimum_chrome_version: '114',

  permissions: ['activeTab', 'storage', 'sidePanel', 'scripting'],

  // Optional (not granted at install, so NO "read and change all your data"
  // install warning — secpriv-6's clean-prompt goal is preserved). `<all_urls>`
  // is the umbrella under which host access is requested at runtime by
  // ensureHostAccess() on the first scan (see shared/permissions.ts). The request
  // is scoped to the scanned page's origin WHEN that origin is known; but a side
  // panel receives no activeTab grant and this manifest declares no `tabs`
  // permission, so on a cold first scan Chrome redacts tab.url and the request
  // necessarily falls back to <all_urls>. Required because executeScript has no
  // host access otherwise.
  optional_host_permissions: ['<all_urls>'],

  action: {
    default_icon: {
      '16': 'icons/icon-16.png',
      '32': 'icons/icon-32.png',
      '48': 'icons/icon-48.png',
      '128': 'icons/icon-128.png',
    },
  },

  commands: {
    _execute_action: {},
  },

  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self'",
  },

  side_panel: {
    default_path: 'src/sidepanel/index.html',
  },

  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },

  // No declarative content script. The scanner is injected on demand into the
  // active tab via chrome.scripting.executeScript (the self-contained IIFE bundle
  // built by vite.content.config.ts). This is deliberate: a static `<all_urls>`
  // content script is the only thing that would trigger Chrome's "read and change
  // all your data on all websites" install warning, so dropping it keeps the
  // install prompt clean (secpriv-6). Host access for the on-demand injection is
  // requested at runtime via chrome.permissions (see shared/permissions.ts) — a
  // side panel opened from the action icon does not receive an activeTab grant.

  icons: {
    '16': 'icons/icon-16.png',
    '32': 'icons/icon-32.png',
    '48': 'icons/icon-48.png',
    '128': 'icons/icon-128.png',
  },
});
