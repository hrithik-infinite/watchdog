# Implementation Plan: BA Review Fixes
## Resolving All User Experience Issues

**Created:** 2026-01-17
**Source Document:** [BA-USER-PERSPECTIVE-REVIEW.md](./BA-USER-PERSPECTIVE-REVIEW.md)
**Total Issues:** 10 UX Friction Points + 9 User Stories
**Estimated Total Effort:** 12-15 days

---

## Executive Summary

This plan addresses all issues identified in the Business Analyst User Perspective Review. Issues are organized into 4 phases based on priority and dependencies.

| Phase | Timeline | Issues | Effort | Business Value |
|-------|----------|--------|--------|----------------|
| **Phase 1** | Week 1 | 3 Critical (P0) | 3-4 days | Prevents legal risk, enables team adoption |
| **Phase 2** | Week 2 | 3 High (P1) | 3-4 days | Improves retention, reduces support |
| **Phase 3** | Week 3-4 | 4 Medium (P2) | 3-4 days | Polish and quality of life |
| **Phase 4** | Future | Long-term features | 2-3 weeks | Enterprise viability |

---

## Phase 1: Critical Fixes (P0) - Week 1

### 1.1 US-002: Clearer Scan Scope Messaging

**Priority:** 🔴 P0 - CRITICAL
**Effort:** 4-6 hours
**Risk Mitigated:** Legal/compliance - users thinking they've fully audited
**Dependencies:** None

#### Problem Statement
Users click "Start Accessibility Scan" and believe they've audited their entire site. They miss 5 other audit categories (SEO, Performance, Security, Best Practices, PWA), creating a false sense of compliance.

#### Implementation Tasks

```
□ Task 1.1.1: Add "Run All Essential Audits" Quick Action Button
  File: src/sidepanel/components/AuditSelector.tsx
  Location: Above the audit grid

  Implementation:
  - Add new button: "Scan All Essential Audits (3)"
  - When clicked, runs Accessibility + Performance + SEO in sequence
  - Shows combined results with audit type tags

  Code Changes:
  - Add state: selectedAudits: AuditType[] (array instead of single)
  - Add "Quick Actions" section above grid
  - Button text: "⚡ Scan All Essential Audits"
```

```
□ Task 1.1.2: Add Post-Scan Reminder Banner
  File: src/sidepanel/components/Summary.tsx (or new component)
  Location: Below summary, above issue list

  Implementation:
  - Show info banner after scan completes
  - Text: "✓ [Audit Type] complete. For full coverage, also run: Security, Best Practices, PWA"
  - Dismissible with "Don't show again" option
  - Store preference in chrome.storage

  UI Design:
  ┌─────────────────────────────────────────────────────┐
  │ ℹ️ Accessibility scan complete                      │
  │    For full site audit, also run: Security, PWA    │
  │    [Run Remaining] [Dismiss]                       │
  └─────────────────────────────────────────────────────┘
```

```
□ Task 1.1.3: Change "Essential" Badge to "High Priority"
  File: src/sidepanel/components/AuditSelector.tsx
  Line: ~206

  Implementation:
  - Change badge text from "Essential" to "High Priority"
  - Add tooltip: "Recommended to run first, but not the only audits needed"

  Before: <span>Essential</span>
  After:  <span title="Recommended first, but run all audits for complete coverage">
            High Priority
          </span>
```

```
□ Task 1.1.4: Add "What This Checks" Tooltip to Each Audit Card
  File: src/sidepanel/components/AuditSelector.tsx

  Implementation:
  - Add info icon (ℹ️) to each card
  - Tooltip shows: "Checks: [list]. Does NOT check: [other audits]"

  Example for Accessibility:
  "Checks: WCAG compliance, screen readers, color contrast, forms, ARIA
   Does NOT check: SEO, Performance, Security, PWA, Best Practices"
```

#### Acceptance Criteria
- [ ] "Scan All Essential Audits" button visible and functional
- [ ] Post-scan reminder appears with correct audit type
- [ ] Reminder can be dismissed and preference is saved
- [ ] Badge text changed to "High Priority"
- [ ] Tooltips show what each audit checks and doesn't check

#### Test Cases
```typescript
describe('Clearer Scan Scope Messaging', () => {
  it('shows "Scan All Essential Audits" button', () => {});
  it('runs 3 audits when quick action clicked', () => {});
  it('shows post-scan reminder with remaining audits', () => {});
  it('dismisses reminder and saves preference', () => {});
  it('shows tooltip with audit scope on hover', () => {});
});
```

---

### 1.2 US-003: Bulk Issue Export

**Priority:** 🔴 P0 - CRITICAL
**Effort:** 4-6 hours
**Risk Mitigated:** Team adoption blocked without collaboration features
**Dependencies:** None

#### Problem Statement
Users cannot export issues to GitHub/Jira/Notion. They must manually copy 20+ issues one by one, taking 20+ minutes for team collaboration.

#### Implementation Tasks

```
□ Task 1.2.1: Add "Copy All as Markdown" Button
  File: src/sidepanel/components/Summary.tsx (or new ActionBar component)
  Location: Next to filter controls or in header

  Implementation:
  - Add button with clipboard icon: "📋 Copy All"
  - Dropdown with options: "Copy as Markdown", "Copy as Plain Text"
  - Copies all visible (filtered) issues

  UI Design:
  ┌─────────────────────────────────────────────────────┐
  │ [Critical: 3] [Serious: 5] [Moderate: 2] [Minor: 1] │
  │                                    [📋 Copy All ▼] │
  └─────────────────────────────────────────────────────┘
```

```
□ Task 1.2.2: Create Markdown Formatter Utility
  File: src/sidepanel/lib/formatters.ts (new file)

  Implementation:
  export function issuesToMarkdown(issues: Issue[], metadata: ScanMetadata): string {
    const header = `# ${metadata.auditType} Audit Results
**URL:** ${metadata.url}
**Date:** ${new Date(metadata.timestamp).toISOString()}
**Total Issues:** ${issues.length}

---

`;

    const issueList = issues.map((issue, i) => `
## ${i + 1}. [${issue.severity.toUpperCase()}] ${issue.message}

**WCAG:** ${issue.wcag.id} (Level ${issue.wcag.level})
**Category:** ${issue.category}

### Description
${issue.description}

### Element
\`\`\`html
${issue.element.html}
\`\`\`
**Selector:** \`${issue.element.selector}\`

### Fix
${issue.fix.description}

\`\`\`html
${issue.fix.code}
\`\`\`

**Learn More:** ${issue.helpUrl}

---
`).join('\n');

    return header + issueList;
  }
```

```
□ Task 1.2.3: Implement Copy to Clipboard with Toast Notification
  File: src/sidepanel/components/ActionBar.tsx (new component)

  Implementation:
  const handleCopyAll = async (format: 'markdown' | 'text') => {
    const content = format === 'markdown'
      ? issuesToMarkdown(filteredIssues, scanMetadata)
      : issuesToPlainText(filteredIssues, scanMetadata);

    await navigator.clipboard.writeText(content);
    toast.success(`${filteredIssues.length} issues copied to clipboard`);
  };
```

```
□ Task 1.2.4: Add Checkbox Selection for Individual Issues
  File: src/sidepanel/components/IssueCard.tsx

  Implementation:
  - Add checkbox to each issue card (top-left corner)
  - "Select All" checkbox in action bar
  - "Copy Selected" button appears when issues selected
  - Shift+click for range selection

  State Management:
  - Add to store: selectedIssueIds: Set<string>
  - Actions: toggleIssueSelection, selectAll, clearSelection
```

#### Acceptance Criteria
- [ ] "Copy All" button visible in results view
- [ ] Dropdown offers Markdown and Plain Text options
- [ ] Copied content includes all metadata (URL, date, audit type)
- [ ] Each issue includes severity, WCAG, description, element, fix
- [ ] Toast confirms number of issues copied
- [ ] Checkbox selection allows copying subset of issues
- [ ] "Select All" selects all visible (filtered) issues

#### Test Cases
```typescript
describe('Bulk Issue Export', () => {
  it('copies all issues as markdown with correct format', () => {});
  it('copies all issues as plain text', () => {});
  it('includes scan metadata in export', () => {});
  it('respects current filters when copying', () => {});
  it('shows toast with issue count after copy', () => {});
  it('allows selecting individual issues with checkboxes', () => {});
  it('copies only selected issues when some selected', () => {});
});
```

---

### 1.3 US-001: Multi-Audit Selection

**Priority:** 🔴 P0 - CRITICAL
**Effort:** 2-3 days
**Risk Mitigated:** 83% time reduction, competitive parity with Lighthouse
**Dependencies:** None (but enhances US-002)

#### Problem Statement
Users must run 6 separate scans for a comprehensive audit, taking 6-10 minutes. Competitors like Lighthouse run all audits at once.

#### Implementation Tasks

```
□ Task 1.3.1: Convert Single-Select to Multi-Select
  File: src/sidepanel/components/AuditSelector.tsx

  State Changes:
  - Before: selectedAudit: AuditType (single value)
  - After: selectedAudits: Set<AuditType> (multiple values)

  Implementation:
  const [selectedAudits, setSelectedAudits] = useState<Set<AuditType>>(
    new Set(['accessibility']) // Default to accessibility selected
  );

  const toggleAudit = (auditType: AuditType) => {
    setSelectedAudits(prev => {
      const next = new Set(prev);
      if (next.has(auditType)) {
        next.delete(auditType);
      } else {
        next.add(auditType);
      }
      return next;
    });
  };
```

```
□ Task 1.3.2: Update Audit Card UI for Multi-Select
  File: src/sidepanel/components/AuditSelector.tsx

  Implementation:
  - Add checkbox indicator to each card (top-right corner)
  - Multiple cards can be selected (highlighted border)
  - Keyboard: Space toggles selection, Enter starts scan

  Visual Design:
  ┌─────────────────────────┐
  │ [✓]        Accessibility │
  │ 👁️ WCAG compliance...    │
  │ 15 checks               │
  └─────────────────────────┘

  CSS:
  - Selected: border-primary, bg-primary/5, checkbox filled
  - Unselected: border-border/40, checkbox empty
```

```
□ Task 1.3.3: Update Scan Button for Multiple Audits
  File: src/sidepanel/components/AuditSelector.tsx

  Implementation:
  - Button text changes based on selection count
  - 0 selected: "Select audits to scan" (disabled)
  - 1 selected: "Start Accessibility Scan"
  - 3 selected: "Start 3 Audits"
  - 6 selected: "Start Full Audit (6)"

  <Button disabled={selectedAudits.size === 0}>
    {selectedAudits.size === 0 && "Select audits to scan"}
    {selectedAudits.size === 1 && `Start ${getAuditLabel(selectedAudits)} Scan`}
    {selectedAudits.size > 1 && `Start ${selectedAudits.size} Audits`}
  </Button>
```

```
□ Task 1.3.4: Implement Sequential Multi-Scan Execution
  File: src/sidepanel/hooks/useScanner.ts

  Implementation:
  const scanMultiple = useCallback(async (auditTypes: AuditType[]) => {
    setScanning(true);
    setError(null);

    const allIssues: Issue[] = [];
    const errors: string[] = [];

    for (const auditType of auditTypes) {
      try {
        setCurrentAudit(auditType); // For progress indicator
        const result = await scanSingle(auditType);

        // Tag issues with audit type
        const taggedIssues = result.issues.map(issue => ({
          ...issue,
          auditType, // Add audit type to each issue
        }));

        allIssues.push(...taggedIssues);
      } catch (err) {
        errors.push(`${auditType}: ${err.message}`);
      }
    }

    // Combine results
    const combinedResult: ScanResult = {
      url: window.location.href,
      timestamp: Date.now(),
      duration: totalDuration,
      issues: allIssues,
      incomplete: [],
      summary: generateCombinedSummary(allIssues),
      auditTypes: auditTypes, // Track which audits were run
    };

    setScanResult(combinedResult);
    if (errors.length > 0) {
      setError(`Some audits failed: ${errors.join(', ')}`);
    }
    setScanning(false);
  }, []);
```

```
□ Task 1.3.5: Add Progress Indicator for Multi-Scan
  File: src/sidepanel/components/ScanProgress.tsx (new component)

  Implementation:
  - Shows progress during multi-audit scan
  - "Scanning: Accessibility (1/3)..."
  - Progress bar or step indicator

  UI Design:
  ┌─────────────────────────────────────────────────────┐
  │ 🔄 Scanning...                                      │
  │ ████████░░░░░░░░░░░░ 2/6                           │
  │ Current: Performance                                │
  │ ✓ Accessibility (12 issues)                        │
  │ ✓ SEO (8 issues)                                   │
  │ ⏳ Performance...                                   │
  │ ○ Security                                          │
  │ ○ Best Practices                                    │
  │ ○ PWA                                               │
  └─────────────────────────────────────────────────────┘
```

```
□ Task 1.3.6: Update Results View for Combined Results
  File: src/sidepanel/components/IssueCard.tsx
  File: src/sidepanel/components/FilterBar.tsx

  Implementation:
  - Add audit type badge to each issue card
  - Add audit type filter dropdown to filter bar
  - Color-code issues by audit type

  Issue Card Change:
  ┌─────────────────────────────────────────────────────┐
  │ [Critical] [SEO]                                    │
  │ Missing meta description                            │
  │ ...                                                 │
  └─────────────────────────────────────────────────────┘

  Filter Bar Change:
  [All Severities ▼] [All Categories ▼] [All Audits ▼] [🔍 Search]
```

```
□ Task 1.3.7: Update Types and Store
  File: src/shared/types.ts
  File: src/sidepanel/store/index.ts

  Type Changes:
  export interface Issue {
    // ... existing fields
    auditType?: AuditType; // Add audit type tracking
  }

  export interface ScanResult {
    // ... existing fields
    auditTypes?: AuditType[]; // Track which audits were run
  }

  Store Changes:
  interface ScanState {
    selectedAudits: Set<AuditType>; // Changed from selectedAuditType
    currentAudit: AuditType | null; // For progress indicator
    // ... rest
  }
```

#### Acceptance Criteria
- [ ] Multiple audit cards can be selected simultaneously
- [ ] Checkbox indicators show selection state clearly
- [ ] Button text updates based on selection count
- [ ] Scanning runs all selected audits sequentially
- [ ] Progress indicator shows current audit during multi-scan
- [ ] Results combine issues from all audits
- [ ] Issues are tagged with their audit type
- [ ] Filter bar includes audit type filter
- [ ] Keyboard navigation works (Space to toggle, Enter to scan)

#### Test Cases
```typescript
describe('Multi-Audit Selection', () => {
  it('allows selecting multiple audit types', () => {});
  it('updates button text based on selection count', () => {});
  it('disables button when nothing selected', () => {});
  it('runs all selected audits sequentially', () => {});
  it('shows progress indicator during multi-scan', () => {});
  it('tags issues with audit type', () => {});
  it('combines results from all audits', () => {});
  it('allows filtering by audit type in results', () => {});
  it('handles partial failures gracefully', () => {});
});
```

---

## Phase 2: High Priority Fixes (P1) - Week 2

### 2.1 US-004: Progress Tracking

**Priority:** ⚠️ P1 - HIGH
**Effort:** 2-3 days
**Risk Mitigated:** Users can't demonstrate ROI or improvement
**Dependencies:** None

#### Problem Statement
Users fix issues but can't prove progress to stakeholders. No way to compare current scan to previous scans.

#### Implementation Tasks

```
□ Task 2.1.1: Create Scan History Storage
  File: src/shared/storage.ts (new or extend existing)

  Implementation:
  interface ScanHistoryEntry {
    id: string;
    url: string;
    auditTypes: AuditType[];
    timestamp: number;
    summary: ScanSummary;
    issueCount: number;
    issues: Issue[]; // Store full issues for diff
  }

  const STORAGE_KEY = 'watchdog_scan_history';
  const MAX_HISTORY_ENTRIES = 10; // Per domain

  export async function saveScanToHistory(result: ScanResult): Promise<void> {
    const history = await getScanHistory(result.url);
    const entry: ScanHistoryEntry = {
      id: generateId(),
      url: result.url,
      auditTypes: result.auditTypes || ['accessibility'],
      timestamp: result.timestamp,
      summary: result.summary,
      issueCount: result.issues.length,
      issues: result.issues,
    };

    // Keep only last 10 entries per domain
    const domain = new URL(result.url).hostname;
    const domainHistory = history.filter(e => new URL(e.url).hostname === domain);
    if (domainHistory.length >= MAX_HISTORY_ENTRIES) {
      domainHistory.shift(); // Remove oldest
    }
    domainHistory.push(entry);

    await chrome.storage.local.set({ [STORAGE_KEY]: [...history, entry] });
  }

  export async function getScanHistory(url: string): Promise<ScanHistoryEntry[]> {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const allHistory = result[STORAGE_KEY] || [];
    const domain = new URL(url).hostname;
    return allHistory.filter(e => new URL(e.url).hostname === domain);
  }
```

```
□ Task 2.1.2: Create Comparison Component
  File: src/sidepanel/components/ScanComparison.tsx (new)

  Implementation:
  interface ComparisonProps {
    current: ScanResult;
    previous: ScanHistoryEntry;
  }

  export function ScanComparison({ current, previous }: ComparisonProps) {
    const diff = calculateDiff(current, previous);

    return (
      <div className="comparison-banner">
        <h3>Compared to last scan ({formatDate(previous.timestamp)})</h3>

        <div className="diff-stats">
          <DiffStat
            label="Total Issues"
            current={current.issues.length}
            previous={previous.issueCount}
          />
          <DiffStat
            label="Critical"
            current={current.summary.bySeverity.critical}
            previous={previous.summary.bySeverity.critical}
          />
          {/* ... other severities */}
        </div>

        <div className="diff-details">
          <h4>🟢 Fixed ({diff.fixed.length})</h4>
          {diff.fixed.map(issue => <IssuePreview issue={issue} />)}

          <h4>🔴 New ({diff.new.length})</h4>
          {diff.new.map(issue => <IssuePreview issue={issue} />)}

          <h4>⚪ Unchanged ({diff.unchanged.length})</h4>
        </div>
      </div>
    );
  }

  function DiffStat({ label, current, previous }) {
    const diff = current - previous;
    const color = diff < 0 ? 'text-green-500' : diff > 0 ? 'text-red-500' : 'text-gray-500';
    const arrow = diff < 0 ? '↓' : diff > 0 ? '↑' : '→';

    return (
      <div className="diff-stat">
        <span className="label">{label}</span>
        <span className="current">{current}</span>
        <span className={color}>{arrow} {Math.abs(diff)}</span>
      </div>
    );
  }
```

```
□ Task 2.1.3: Add "Compare to Previous" Button
  File: src/sidepanel/components/Summary.tsx

  Implementation:
  - Check if history exists for current URL
  - Show "Compare to Previous Scan" button
  - Opens comparison modal or inline comparison

  const { history } = useScanHistory(scanResult?.url);
  const previousScan = history[history.length - 2]; // Second to last

  {previousScan && (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setShowComparison(true)}
    >
      📊 Compare to Previous
    </Button>
  )}
```

```
□ Task 2.1.4: Create History Timeline View
  File: src/sidepanel/components/ScanHistory.tsx (new)

  Implementation:
  - List of past scans with date and issue count
  - Click to view details or compare
  - Visual timeline showing trend

  UI Design:
  ┌─────────────────────────────────────────────────────┐
  │ 📈 Scan History                                     │
  │                                                     │
  │ ● Jan 17, 2026 - 23 issues (current)               │
  │ │                                                   │
  │ ● Jan 15, 2026 - 28 issues ↓5                      │
  │ │                                                   │
  │ ● Jan 10, 2026 - 35 issues ↓7                      │
  │                                                     │
  │ 📉 Total improvement: -12 issues (34%)             │
  └─────────────────────────────────────────────────────┘
```

#### Acceptance Criteria
- [ ] Scans are automatically saved to history (last 10 per domain)
- [ ] "Compare to Previous" button appears when history exists
- [ ] Comparison shows +/- diff for each severity level
- [ ] Comparison shows fixed issues (in previous, not in current)
- [ ] Comparison shows new issues (in current, not in previous)
- [ ] History timeline shows trend over time
- [ ] Can export comparison report

---

### 2.2 US-005: Ignore Known Issues

**Priority:** ⚠️ P1 - HIGH
**Effort:** 2-3 days
**Risk Mitigated:** Third-party issues clutter real issues
**Dependencies:** None

#### Implementation Tasks

```
□ Task 2.2.1: Add "Mark as Known Issue" Button
  File: src/sidepanel/components/IssueDetail.tsx

  Implementation:
  - Add button in issue detail footer
  - Opens modal to select reason
  - Saves to chrome.storage by issue hash (selector + ruleId)

  <Button variant="ghost" onClick={() => setShowIgnoreModal(true)}>
    🚫 Mark as Known Issue
  </Button>
```

```
□ Task 2.2.2: Create Ignore Modal
  File: src/sidepanel/components/IgnoreIssueModal.tsx (new)

  Predefined Reasons:
  - Third-party code (can't modify)
  - Design decision (intentional)
  - False positive
  - Will fix later
  - Other (custom text)

  interface IgnoredIssue {
    hash: string; // MD5(selector + ruleId)
    reason: string;
    customNote?: string;
    ignoredAt: number;
    ignoredBy?: string; // Future: team feature
  }
```

```
□ Task 2.2.3: Filter Out Ignored Issues
  File: src/sidepanel/hooks/useIssues.ts

  Implementation:
  - Load ignored issues from storage
  - Filter them out by default
  - Add toggle: "Show Known Issues"

  const { showKnownIssues } = useSettings();
  const { ignoredIssues } = useIgnoredIssues();

  const filteredIssues = useMemo(() => {
    let issues = scanResult?.issues || [];

    if (!showKnownIssues) {
      issues = issues.filter(issue => {
        const hash = generateIssueHash(issue);
        return !ignoredIssues.has(hash);
      });
    }

    // ... other filters
    return issues;
  }, [scanResult, showKnownIssues, ignoredIssues, filters]);
```

```
□ Task 2.2.4: Add Filter Toggle and Counter
  File: src/sidepanel/components/FilterBar.tsx

  Implementation:
  - Add toggle: "Show Known Issues (5 hidden)"
  - Counter updates based on ignored count

  <div className="ignored-toggle">
    <Switch checked={showKnownIssues} onCheckedChange={setShowKnownIssues} />
    <span>Show Known Issues ({ignoredCount} hidden)</span>
  </div>
```

#### Acceptance Criteria
- [ ] "Mark as Known Issue" button in issue detail
- [ ] Modal allows selecting predefined reason or custom note
- [ ] Ignored issues are hidden by default
- [ ] Filter bar shows count of hidden issues
- [ ] Toggle to show/hide known issues
- [ ] Ignored status persists across scans (by selector hash)
- [ ] Can un-ignore issues

---

### 2.3 US-006: Better Error Messages

**Priority:** ⚠️ P1 - HIGH
**Effort:** 2-3 hours
**Risk Mitigated:** User frustration and support burden
**Dependencies:** None

#### Implementation Tasks

```
□ Task 2.3.1: Define Error Codes and Messages
  File: src/shared/errors.ts (new)

  export const ERROR_CODES = {
    E001: {
      code: 'E001',
      title: 'No Active Tab',
      message: 'Could not find an active browser tab to scan.',
      suggestion: 'Make sure you have a webpage open and try again.',
      helpUrl: '/docs/errors#E001',
    },
    E002: {
      code: 'E002',
      title: 'Restricted Page',
      message: 'Cannot scan browser internal pages (chrome://, about:, etc.)',
      suggestion: 'Navigate to a regular webpage (http:// or https://) to scan.',
      helpUrl: '/docs/errors#E002',
    },
    E003: {
      code: 'E003',
      title: 'Content Script Not Loaded',
      message: 'The scanner is not loaded on this page.',
      suggestion: 'Refresh the page and try again. If the problem persists, reload the extension.',
      helpUrl: '/docs/errors#E003',
    },
    E004: {
      code: 'E004',
      title: 'Scan Timeout',
      message: 'The scan took too long to complete.',
      suggestion: 'The page may be too large or slow. Try refreshing and scanning again.',
      helpUrl: '/docs/errors#E004',
    },
    E005: {
      code: 'E005',
      title: 'Scan Failed',
      message: 'An unexpected error occurred during the scan.',
      suggestion: 'Try refreshing the page. If the problem continues, check the browser console for details.',
      helpUrl: '/docs/errors#E005',
    },
    E006: {
      code: 'E006',
      title: 'Audit Not Supported',
      message: 'This audit type is not yet implemented.',
      suggestion: 'This feature is coming soon. Try a different audit type for now.',
      helpUrl: '/docs/errors#E006',
    },
  };

  export function getErrorDetails(error: Error | string): ErrorDetails {
    const message = typeof error === 'string' ? error : error.message;

    if (message.includes('No active tab')) return ERROR_CODES.E001;
    if (message.includes('internal pages')) return ERROR_CODES.E002;
    if (message.includes('refresh the page')) return ERROR_CODES.E003;
    if (message.includes('timeout') || message.includes('too long')) return ERROR_CODES.E004;
    if (message.includes('not yet implemented')) return ERROR_CODES.E006;

    return { ...ERROR_CODES.E005, message };
  }
```

```
□ Task 2.3.2: Update EmptyState for Rich Errors
  File: src/sidepanel/components/EmptyState.tsx

  Implementation:
  - Show error code, title, message, suggestion
  - Add "Get Help" link
  - Show which audit type failed

  if (type === 'error') {
    const errorDetails = getErrorDetails(error);

    return (
      <div className="error-state">
        <ErrorCircleIcon />
        <span className="error-code">{errorDetails.code}</span>
        <h2>{errorDetails.title}</h2>
        <p className="error-message">{errorDetails.message}</p>
        <p className="error-suggestion">💡 {errorDetails.suggestion}</p>

        <div className="error-actions">
          <Button onClick={onRetry}>Try Again</Button>
          <Button variant="link" asChild>
            <a href={errorDetails.helpUrl} target="_blank">
              Get Help →
            </a>
          </Button>
        </div>

        {auditType && (
          <p className="error-context">
            Failed during: {auditType} audit
          </p>
        )}
      </div>
    );
  }
```

#### Acceptance Criteria
- [ ] All errors show code, title, message, and suggestion
- [ ] Errors include "Get Help" link to documentation
- [ ] Error messages are actionable (tell user what to do)
- [ ] Error shows which audit type failed (if applicable)
- [ ] "Try Again" button is always visible

---

## Phase 3: Medium Priority Fixes (P2) - Week 3-4

### 3.1 US-007: First-Time User Onboarding

**Priority:** 🟡 P2 - MEDIUM
**Effort:** 4-6 hours
**Dependencies:** None

#### Implementation Tasks

```
□ Task 3.1.1: Create Onboarding Tour Component
  File: src/sidepanel/components/OnboardingTour.tsx (new)

  Steps:
  1. "Select audit types to check" - Highlight audit grid
  2. "Click to scan the page" - Highlight scan button
  3. "Review and fix issues" - Show example results

  Libraries:
  - Consider: react-joyride, shepherd.js, or custom implementation
```

```
□ Task 3.1.2: Track First Launch
  File: src/sidepanel/hooks/useOnboarding.ts (new)

  export function useOnboarding() {
    const [hasSeenTour, setHasSeenTour] = useState<boolean | null>(null);

    useEffect(() => {
      chrome.storage.local.get('hasSeenOnboarding').then(result => {
        setHasSeenTour(result.hasSeenOnboarding ?? false);
      });
    }, []);

    const completeTour = () => {
      chrome.storage.local.set({ hasSeenOnboarding: true });
      setHasSeenTour(true);
    };

    const skipTour = completeTour;

    return { hasSeenTour, completeTour, skipTour };
  }
```

```
□ Task 3.1.3: Add Skip and Don't Show Again

  - "Skip Tour" button always visible
  - "Don't show again" checkbox
  - Esc key dismisses tour
```

#### Acceptance Criteria
- [ ] Tour appears on first launch only
- [ ] 3 clear, concise steps
- [ ] Can skip tour at any point
- [ ] "Don't show again" prevents future tours
- [ ] Tour preference saved to storage

---

### 3.2 US-008: Auto-Scroll to Highlighted Element

**Priority:** 🟡 P2 - MEDIUM
**Effort:** 2-3 hours
**Dependencies:** None

#### Implementation Tasks

```
□ Task 3.2.1: Update Highlight Function to Auto-Scroll
  File: src/content/overlay.ts

  export function highlightElement(selector: string, severity: Severity) {
    const element = document.querySelector(selector);
    if (!element) return;

    // Check if element is in viewport
    const rect = element.getBoundingClientRect();
    const isInViewport = (
      rect.top >= 0 &&
      rect.bottom <= window.innerHeight
    );

    if (!isInViewport) {
      // Smooth scroll to element
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }

    // Apply highlight with flash effect
    applyHighlight(element, severity);
    flashElement(element);
  }

  function flashElement(element: Element) {
    // Check prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    element.animate([
      { opacity: 1 },
      { opacity: 0.5 },
      { opacity: 1 },
    ], {
      duration: 600,
      iterations: 2,
    });
  }
```

#### Acceptance Criteria
- [ ] Page scrolls to element if not in viewport
- [ ] Scroll is smooth (not instant jump)
- [ ] Element flashes after scrolling
- [ ] Respects prefers-reduced-motion setting
- [ ] No scroll if element already visible

---

### 3.3 US-009: Keyboard Navigation in Issue List

**Priority:** 🟡 P2 - MEDIUM
**Effort:** 3-4 hours
**Dependencies:** None

#### Implementation Tasks

```
□ Task 3.3.1: Add Keyboard Event Handlers
  File: src/sidepanel/components/IssueList.tsx

  const handleKeyDown = (e: KeyboardEvent) => {
    const currentIndex = filteredIssues.findIndex(i => i.id === focusedIssueId);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        const nextIndex = Math.min(currentIndex + 1, filteredIssues.length - 1);
        setFocusedIssueId(filteredIssues[nextIndex].id);
        break;

      case 'ArrowUp':
        e.preventDefault();
        const prevIndex = Math.max(currentIndex - 1, 0);
        setFocusedIssueId(filteredIssues[prevIndex].id);
        break;

      case 'Enter':
        e.preventDefault();
        if (focusedIssueId) {
          onSelectIssue(focusedIssueId);
        }
        break;

      case 'Escape':
        e.preventDefault();
        onBack?.();
        break;
    }
  };
```

```
□ Task 3.3.2: Add Visual Focus Indicator
  File: src/sidepanel/components/IssueCard.tsx

  - Add focused state styling
  - Auto-scroll focused item into view

  className={cn(
    'issue-card',
    isSelected && 'selected',
    isFocused && 'ring-2 ring-primary ring-offset-2',
  )}
```

#### Acceptance Criteria
- [ ] Arrow keys navigate between issues
- [ ] Enter opens issue detail
- [ ] Escape closes detail/clears selection
- [ ] Visual focus ring on keyboard-selected issue
- [ ] Focused issue scrolls into view if needed

---

### 3.4 Additional P2 Fixes

```
□ Task 3.4.1: Add "What This Doesn't Check" Warning
  - After scan, show what was NOT checked
  - Prevent false sense of security

□ Task 3.4.2: Add Issue Count to Summary
  - "23 issues found (vs. industry avg of 15)"
  - Provide context/benchmark

□ Task 3.4.3: Settings Label Visibility
  - Add "Settings" text label next to gear icon
  - Improve discoverability

□ Task 3.4.4: Switch Audit Type from Results
  - Add dropdown/tabs to switch between audit types
  - Keep current results while switching
```

---

## Phase 4: Future Enhancements - Long Term

### 4.1 Multi-Page Scanning (v2.0)

**Effort:** 1-2 weeks
**Dependencies:** Multi-audit feature complete

```
□ Scan all pages in sitemap
□ Crawl internal links
□ Aggregate results across pages
□ Site-wide dashboard
```

### 4.2 Team Collaboration (v2.0)

**Effort:** 2-3 weeks
**Dependencies:** Progress tracking complete

```
□ Shared scan history
□ Comments on issues
□ Team dashboards
□ Slack/Teams notifications
□ JIRA/Linear integration
```

### 4.3 CI/CD Integration (v1.5)

**Effort:** 1 week
**Dependencies:** Bulk export complete

```
□ CLI tool for automated scanning
□ GitHub Action
□ Fail build on critical issues
□ PR comments with scan results
```

---

## Implementation Schedule

### Week 1 (Days 1-5)

| Day | Task | Effort | Owner |
|-----|------|--------|-------|
| Day 1 | US-002: Clearer messaging (Tasks 1.1.1-1.1.2) | 4h | - |
| Day 1 | US-003: Bulk export - Markdown formatter (Task 1.2.2) | 2h | - |
| Day 2 | US-002: Tooltips and badge changes (Tasks 1.1.3-1.1.4) | 2h | - |
| Day 2 | US-003: Copy button and toast (Tasks 1.2.1, 1.2.3) | 3h | - |
| Day 3 | US-003: Checkbox selection (Task 1.2.4) | 3h | - |
| Day 3-5 | US-001: Multi-select audit (Tasks 1.3.1-1.3.4) | 12h | - |

### Week 2 (Days 6-10)

| Day | Task | Effort | Owner |
|-----|------|--------|-------|
| Day 6 | US-001: Progress indicator and results (Tasks 1.3.5-1.3.7) | 6h | - |
| Day 7-8 | US-004: Progress tracking (Tasks 2.1.1-2.1.4) | 12h | - |
| Day 9 | US-005: Ignore issues (Tasks 2.2.1-2.2.4) | 8h | - |
| Day 10 | US-006: Better errors (Tasks 2.3.1-2.3.2) | 3h | - |

### Week 3-4 (Days 11-20)

| Day | Task | Effort | Owner |
|-----|------|--------|-------|
| Day 11-12 | US-007: Onboarding tour | 5h | - |
| Day 12 | US-008: Auto-scroll to element | 3h | - |
| Day 13 | US-009: Keyboard navigation | 4h | - |
| Day 14-15 | Additional P2 fixes | 6h | - |
| Day 16-20 | Testing, bug fixes, polish | 10h | - |

---

## Testing Requirements

### Unit Tests Required

```typescript
// Phase 1 Tests
describe('US-002: Clearer Messaging', () => {
  // 5 test cases
});

describe('US-003: Bulk Export', () => {
  // 7 test cases
});

describe('US-001: Multi-Audit Selection', () => {
  // 9 test cases
});

// Phase 2 Tests
describe('US-004: Progress Tracking', () => {
  // 6 test cases
});

describe('US-005: Ignore Issues', () => {
  // 5 test cases
});

describe('US-006: Better Errors', () => {
  // 4 test cases
});

// Phase 3 Tests
describe('US-007: Onboarding', () => {
  // 4 test cases
});

describe('US-008: Auto-Scroll', () => {
  // 3 test cases
});

describe('US-009: Keyboard Navigation', () => {
  // 4 test cases
});
```

### Integration Tests Required

```typescript
describe('Multi-Audit E2E Flow', () => {
  it('selects multiple audits and runs sequential scan', () => {});
  it('shows combined results with audit tags', () => {});
  it('filters by audit type', () => {});
  it('exports combined results', () => {});
});

describe('Progress Tracking E2E', () => {
  it('saves scan to history', () => {});
  it('compares to previous scan', () => {});
  it('shows improvement metrics', () => {});
});
```

---

## Risk Mitigation

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Multi-scan causes memory issues | Medium | High | Limit to 6 audits max, clear between scans |
| Storage quota exceeded | Low | Medium | Limit history to 10 entries per domain |
| Chrome API changes | Low | High | Abstract Chrome APIs, add version checks |

### UX Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Multi-select confuses users | Medium | Medium | Clear visual indicators, onboarding |
| Too many features overwhelm | Medium | Medium | Progressive disclosure, good defaults |
| Export format incompatible | Low | Low | Multiple format options |

---

## Success Criteria

### Phase 1 Complete When:
- [ ] Users can run multiple audits in one scan
- [ ] Users see clear warnings about partial audits
- [ ] Users can copy all issues to clipboard
- [ ] All P0 tests passing

### Phase 2 Complete When:
- [ ] Users can compare scans over time
- [ ] Users can ignore known issues
- [ ] Error messages are actionable
- [ ] All P1 tests passing

### Phase 3 Complete When:
- [ ] New users complete onboarding tour
- [ ] Keyboard navigation works throughout
- [ ] Auto-scroll improves element discovery
- [ ] All P2 tests passing

### Overall Success Metrics:
- [ ] User satisfaction: 8.5/10 (up from 6.5/10)
- [ ] Multi-audit usage: 60%+ of scans
- [ ] Export feature usage: 20%+ of users
- [ ] Support tickets: <10 per 1000 users

---

## Appendix: File Changes Summary

### New Files to Create

```
src/sidepanel/components/ActionBar.tsx
src/sidepanel/components/ScanProgress.tsx
src/sidepanel/components/ScanComparison.tsx
src/sidepanel/components/ScanHistory.tsx
src/sidepanel/components/IgnoreIssueModal.tsx
src/sidepanel/components/OnboardingTour.tsx
src/sidepanel/lib/formatters.ts
src/sidepanel/hooks/useOnboarding.ts
src/sidepanel/hooks/useScanHistory.ts
src/sidepanel/hooks/useIgnoredIssues.ts
src/shared/errors.ts
src/shared/storage.ts
```

### Files to Modify

```
src/sidepanel/components/AuditSelector.tsx - Multi-select
src/sidepanel/components/Summary.tsx - Copy button, compare button
src/sidepanel/components/FilterBar.tsx - Audit type filter, ignore toggle
src/sidepanel/components/IssueCard.tsx - Checkbox, audit tag
src/sidepanel/components/IssueDetail.tsx - Ignore button
src/sidepanel/components/IssueList.tsx - Keyboard navigation
src/sidepanel/components/EmptyState.tsx - Rich error display
src/sidepanel/hooks/useScanner.ts - Multi-scan support
src/sidepanel/hooks/useIssues.ts - Ignore filter
src/sidepanel/store/index.ts - New state fields
src/content/overlay.ts - Auto-scroll
src/shared/types.ts - Extended types
```

---

**Document Version:** 1.0
**Created:** 2026-01-17
**Last Updated:** 2026-01-17
**Status:** Ready for Implementation
