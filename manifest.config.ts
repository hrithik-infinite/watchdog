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

  permissions: ['activeTab', 'storage', 'sidePanel'],

  action: {
    default_icon: {
      '16': 'icons/icon-16.png',
      '32': 'icons/icon-32.png',
      '48': 'icons/icon-48.png',
      '128': 'icons/icon-128.png',
    },
  },

  side_panel: {
    default_path: 'src/sidepanel/index.html',
  },

  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },

  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/index.ts'],
      css: ['src/content/styles.css'],
      run_at: 'document_idle',
    },
  ],

  icons: {
    '16': 'icons/icon-16.png',
    '32': 'icons/icon-32.png',
    '48': 'icons/icon-48.png',
    '128': 'icons/icon-128.png',
  },

  web_accessible_resources: [
    {
      resources: ['src/content/styles.css'],
      matches: ['<all_urls>'],
    },
  ],
});
