import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ensureContentScript, PERMISSION_NEEDED_MESSAGE } from '../inject';

const sendMessage = vi.fn();
const executeScript = vi.fn();
const insertCSS = vi.fn();

vi.stubGlobal('chrome', {
  tabs: { sendMessage },
  scripting: { executeScript, insertCSS },
});

describe('ensureContentScript (on-demand injection, secpriv-6)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    executeScript.mockResolvedValue([]);
    insertCSS.mockResolvedValue([]);
  });

  it('does not inject when the script already answers PING', async () => {
    sendMessage.mockResolvedValue({ success: true, loaded: true });

    await ensureContentScript(1);

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(executeScript).not.toHaveBeenCalled();
    expect(insertCSS).not.toHaveBeenCalled();
  });

  it('injects the stable content bundle on PING failure, then confirms with a second PING', async () => {
    // First PING fails (not injected), second PING (post-inject) succeeds.
    sendMessage.mockRejectedValueOnce(new Error('no receiver')).mockResolvedValueOnce({ ok: true });

    await ensureContentScript(7);

    expect(executeScript).toHaveBeenCalledWith({
      target: { tabId: 7 },
      files: ['content-script.js'],
    });
    expect(insertCSS).toHaveBeenCalledWith({
      target: { tabId: 7 },
      files: ['content-script.css'],
    });
    expect(sendMessage).toHaveBeenCalledTimes(2);
  });

  it('throws the permission-needed message when injection is not allowed (no activeTab grant)', async () => {
    sendMessage.mockRejectedValueOnce(new Error('no receiver'));
    executeScript.mockRejectedValueOnce(new Error('Cannot access contents of the page'));

    await expect(ensureContentScript(2)).rejects.toThrow(PERMISSION_NEEDED_MESSAGE);
  });

  it('throws the permission-needed message when the post-injection PING never answers', async () => {
    // PING fails, injection "succeeds", but the confirm PING still fails.
    sendMessage.mockRejectedValue(new Error('no receiver'));

    await expect(ensureContentScript(3)).rejects.toThrow(PERMISSION_NEEDED_MESSAGE);
  });
});
