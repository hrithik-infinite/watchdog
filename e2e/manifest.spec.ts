import { readFileSync } from 'node:fs';
import path from 'node:path';
import { DIST, expect, test } from './fixtures';

// Static assertion (no browser) that the SHIPPED build preserves the activeTab
// privacy model: on-demand injection driven by the toolbar-icon click, with NO
// always-on content script and NO host permissions — declared OR optional — so
// the install prompt carries no host warning. The content-script E2E loads a
// host-permission-augmented copy to exercise the engine (headless cannot click a
// real toolbar icon); this guards the artifact users actually install.
test.describe('shipped manifest (activeTab privacy model)', () => {
  const manifest = JSON.parse(readFileSync(path.join(DIST, 'manifest.json'), 'utf8'));

  test('declares no host_permissions', () => {
    expect(manifest.host_permissions ?? []).toEqual([]);
  });

  test('declares no optional host_permissions (no <all_urls> umbrella)', () => {
    expect(manifest.optional_host_permissions ?? []).toEqual([]);
  });

  test('declares no always-on content_scripts', () => {
    expect(manifest.content_scripts ?? []).toEqual([]);
  });

  test('requests exactly the activeTab-based permission set', () => {
    expect(new Set(manifest.permissions)).toEqual(
      new Set(['activeTab', 'storage', 'sidePanel', 'scripting'])
    );
  });

  test('floors Chrome at 116 for chrome.sidePanel.open', () => {
    expect(manifest.minimum_chrome_version).toBe('116');
  });

  test('ships the side panel and module service worker', () => {
    expect(manifest.side_panel?.default_path).toBe('src/sidepanel/index.html');
    expect(manifest.background?.type).toBe('module');
  });
});
