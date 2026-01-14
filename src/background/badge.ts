// Badge management for extension icon

const BADGE_COLORS: Record<string, string> = {
  none: '#10B981', // Green - no issues
  low: '#3B82F6', // Blue - few issues
  medium: '#F59E0B', // Yellow/Orange - some issues
  high: '#DC2626', // Red - many issues
};

function getBadgeColor(count: number): string {
  if (count === 0) return BADGE_COLORS.none;
  if (count <= 5) return BADGE_COLORS.low;
  if (count <= 15) return BADGE_COLORS.medium;
  return BADGE_COLORS.high;
}

function formatBadgeText(count: number): string {
  if (count === 0) return '';
  if (count > 99) return '99+';
  return count.toString();
}

export async function updateBadge(tabId: number, issueCount: number): Promise<void> {
  try {
    await chrome.action.setBadgeText({
      tabId,
      text: formatBadgeText(issueCount),
    });

    await chrome.action.setBadgeBackgroundColor({
      tabId,
      color: getBadgeColor(issueCount),
    });

    await chrome.action.setBadgeTextColor({
      tabId,
      color: '#FFFFFF',
    });
  } catch (error) {
    console.error('Failed to update badge:', error);
  }
}

export async function clearBadge(tabId: number): Promise<void> {
  try {
    await chrome.action.setBadgeText({
      tabId,
      text: '',
    });
  } catch {
    // Tab may already be closed, ignore error
  }
}
