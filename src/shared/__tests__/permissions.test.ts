import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ensureHostAccess, HOST_PERMISSION_DENIED_MESSAGE } from '../permissions';

const contains = vi.fn();
const request = vi.fn();

vi.stubGlobal('chrome', {
  permissions: { contains, request },
});

describe('ensureHostAccess (per-origin optional host permission)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('scopes the check to the page origin and short-circuits when already held', async () => {
    contains.mockResolvedValue(true);

    await ensureHostAccess('https://www.youtube.com/watch?v=abc');

    expect(contains).toHaveBeenCalledWith({ origins: ['https://www.youtube.com/*'] });
    expect(request).not.toHaveBeenCalled();
  });

  it('requests only the page origin when not yet held and resolves on grant', async () => {
    contains.mockResolvedValue(false);
    request.mockResolvedValue(true);

    await expect(ensureHostAccess('https://example.com/page')).resolves.toBeUndefined();

    expect(request).toHaveBeenCalledWith({ origins: ['https://example.com/*'] });
  });

  it.each([
    ['no url', undefined],
    ['a non-http(s) scheme', 'chrome://settings'],
    ['a malformed url', 'not a real url'],
  ])('falls back to <all_urls> for %s', async (_label, url) => {
    contains.mockResolvedValue(false);
    request.mockResolvedValue(true);

    await ensureHostAccess(url);

    expect(request).toHaveBeenCalledWith({ origins: ['<all_urls>'] });
  });

  it('throws the denied message when the user declines the prompt', async () => {
    contains.mockResolvedValue(false);
    request.mockResolvedValue(false);

    await expect(ensureHostAccess('https://example.com/')).rejects.toThrow(
      HOST_PERMISSION_DENIED_MESSAGE
    );
  });
});
