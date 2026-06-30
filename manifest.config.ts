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

  permissions: ['activeTab', 'storage', 'sidePanel', 'scripting'],

  // Optional (not granted at install, so NO "read and change all your data"
  // install warning — secpriv-6's clean-prompt goal is preserved). Requested at
  // runtime via chrome.permissions.request() on the first scan (see
  // shared/permissions.ts). Required because a side panel opened from the action
  // icon never receives the `activeTab` grant — Chrome grants activeTab only for
  // action/context-menu/command/omnibox invocations, deliberately excluding
  // side-panel-open — so executeScript has no host access without this.
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
  // built by vite.content.config.ts), covered by the `activeTab` permission. This
  // is deliberate: a static `<all_urls>` content script is the only thing that
  // would trigger Chrome's "read and change all your data on all websites"
  // install warning, so dropping it keeps the install prompt clean and makes the
  // activeTab-only privacy claims true (secpriv-6).

  icons: {
    '16': 'icons/icon-16.png',
    '32': 'icons/icon-32.png',
    '48': 'icons/icon-48.png',
    '128': 'icons/icon-128.png',
  },
});
