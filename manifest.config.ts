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

  // chrome.sidePanel.open() — used by the action.onClicked handler to open the
  // panel — requires Chrome 116+. Declaring the floor hides the listing from older
  // Chrome (where opening the panel would throw) instead of shipping a dead
  // install. scripting/activeTab/storage are all older, so 116 is the binding
  // minimum.
  minimum_chrome_version: '116',

  // No host permissions — declared OR optional. The extension never requests
  // access to "all your data on all websites". Instead, clicking the toolbar icon
  // (chrome.action.onClicked, see src/background/index.ts) grants Chrome's
  // temporary `activeTab` access to just that one tab, which is all the background
  // needs to inject the scanner there. Access lasts until the tab navigates and is
  // scoped to the single page the user acted on — so the install prompt shows no
  // host warning and the user is never prompted to grant a broad host permission.
  permissions: ['activeTab', 'storage', 'sidePanel', 'scripting'],

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
  // armed tab via chrome.scripting.executeScript (the self-contained IIFE bundle
  // built by vite.content.config.ts) from the background service worker. This is
  // deliberate: a static `<all_urls>` content script is the only thing that would
  // trigger Chrome's "read and change all your data on all websites" install
  // warning, so dropping it keeps the install prompt clean. Host access for the
  // on-demand injection comes from the `activeTab` grant the toolbar-icon click
  // hands to the background — no host permission is ever requested.

  icons: {
    '16': 'icons/icon-16.png',
    '32': 'icons/icon-32.png',
    '48': 'icons/icon-48.png',
    '128': 'icons/icon-128.png',
  },
});
