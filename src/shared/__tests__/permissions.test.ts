import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ensureHostAccess, HOST_PERMISSION_DENIED_MESSAGE } from '../permissions';

const contains = vi.fn();
const request = vi.fn();

vi.stubGlobal('chrome', {
  permissions: { contains, request },
});

describe('ensureHostAccess (optional <all_urls> host permission)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('short-circuits without prompting when access is already held', async () => {
    contains.mockResolvedValue(true);

    await ensureHostAccess();

    expect(contains).toHaveBeenCalledWith({ origins: ['<all_urls>'] });
    expect(request).not.toHaveBeenCalled();
  });

  it('requests <all_urls> when not yet held and resolves on grant', async () => {
    contains.mockResolvedValue(false);
    request.mockResolvedValue(true);

    await expect(ensureHostAccess()).resolves.toBeUndefined();

    expect(request).toHaveBeenCalledWith({ origins: ['<all_urls>'] });
  });

  it('throws the denied message when the user declines the prompt', async () => {
    contains.mockResolvedValue(false);
    request.mockResolvedValue(false);

    await expect(ensureHostAccess()).rejects.toThrow(HOST_PERMISSION_DENIED_MESSAGE);
  });
});
