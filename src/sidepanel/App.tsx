import { Highlighter, RotateCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import logger from '@/shared/logger';
import type { Persona, ScanResult } from '@/shared/types';
import AuditSelector from './components/AuditSelector';
import CopyDropdown from './components/CopyDropdown';
import EmptyState from './components/EmptyState';
import FilterBar from './components/FilterBar';
import Header from './components/Header';
import ImportReportButton from './components/ImportReportButton';
import IncompleteSection from './components/IncompleteSection';
import IssueDetail from './components/IssueDetail';
import IssueList from './components/IssueList';
import Onboarding from './components/Onboarding';
import ScanProgress from './components/ScanProgress';
import Settings from './components/Settings';
import Summary from './components/Summary';
import TopFixesCard from './components/TopFixesCard';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import { Switch } from './components/ui/switch';
import { useArmedTab } from './hooks/useArmedTab';
import { useHighlight } from './hooks/useHighlight';
import { useIgnoredIssues } from './hooks/useIgnoredIssues';
import { useIssues } from './hooks/useIssues';
import { useScanner } from './hooks/useScanner';
import { useSettings } from './hooks/useSettings';
import type { AuditType } from './store';
import { useScanStore } from './store';

// Human-friendly audit names for the audit-aware success message.
const AUDIT_LABELS: Partial<Record<AuditType, string>> = {
  accessibility: 'Accessibility',
  performance: 'Performance',
  seo: 'SEO',
  security: 'Security',
  'best-practices': 'Best Practices',
  pwa: 'PWA',
};

// "Last audited" relative time for the results Rescan row. Coarse on purpose —
// it only conveys recency, not a precise clock, and isn't reactive.
function relativeTime(ts: number): string {
  if (!ts) return 'just now';
  const min = Math.floor((Date.now() - ts) / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  return `${Math.floor(hr / 24)} d ago`;
}

export default function App() {
  const [showSettings, setShowSettings] = useState(false);
  const {
    scanResult,
    error,
    scan,
    scanMultiple,
    cancelScan,
    clearResults,
    currentAuditIndex,
    totalAudits,
    currentAuditType,
  } = useScanner();

  // Subscribe directly to isScanning from store for reliable updates
  const isScanning = useScanStore((state) => state.isScanning);
  const selectedAuditType = useScanStore((state) => state.selectedAuditType);
  const selectedAuditTypes = useScanStore((state) => state.selectedAuditTypes);
  const setSelectedAuditType = useScanStore((state) => state.setSelectedAuditType);
  const setSelectedAuditTypes = useScanStore((state) => state.setSelectedAuditTypes);
  const setIgnoredHashes = useScanStore((state) => state.setIgnoredHashes);
  const hideIgnored = useScanStore((state) => state.hideIgnored);
  const setHideIgnored = useScanStore((state) => state.setHideIgnored);
  const setScanResult = useScanStore((state) => state.setScanResult);
  const setError = useScanStore((state) => state.setError);

  // Ignored issues
  const {
    ignoredHashes,
    ignoredCount,
    refresh: refreshIgnored,
  } = useIgnoredIssues(scanResult?.url);

  // Sync ignored hashes with store
  useEffect(() => {
    setIgnoredHashes(ignoredHashes);
  }, [ignoredHashes, setIgnoredHashes]);

  const {
    filters,
    filteredIssues,
    selectedIssue,
    view,
    adjacentIds,
    setFilter,
    selectIssue,
    goToPrevIssue,
    goToNextIssue,
    getCurrentIndex,
    totalFiltered,
  } = useIssues();
  const { highlightElement, highlightAll, clearHighlights } = useHighlight();
  // The page a scan will target — the tab whose toolbar icon opened the panel.
  const { hostname: armedHostname } = useArmedTab();
  // WAVE-style "show all on page" overlay toggle (feat-compet-10).
  const [showAllOnPage, setShowAllOnPage] = useState(false);
  const { settings, updateSettings, loaded: settingsLoaded } = useSettings();

  // Persist the persona chosen in the first-run tour and dismiss it.
  const handleOnboardingComplete = useCallback(
    (persona: Persona) => {
      updateSettings({ persona, hasSeenOnboarding: true });
    },
    [updateSettings]
  );

  // Open a previously-exported report (feat-compet-8). The report may be for a
  // different page than the armed tab, so clear the audit selection — that gates
  // off page-targeted highlighting/overlays (canHighlight) for the imported view.
  const handleImportReport = useCallback(
    (result: ScanResult) => {
      setSelectedAuditTypes([]);
      setError(null);
      setScanResult(result);
    },
    [setSelectedAuditTypes, setError, setScanResult]
  );

  const handleStartScan = useCallback(
    (auditType: AuditType) => {
      logger.info('Starting scan', { auditType });
      setSelectedAuditType(auditType);
      setSelectedAuditTypes([auditType]);
      scan(auditType);
    },
    [setSelectedAuditType, setSelectedAuditTypes, scan]
  );

  const handleStartMultipleScan = useCallback(
    (auditTypes: AuditType[]) => {
      if (auditTypes.length > 0) {
        logger.info('Starting multiple scans', { auditTypes });
        setSelectedAuditType(auditTypes[0]);
        setSelectedAuditTypes(auditTypes);
        scanMultiple(auditTypes);
      }
    },
    [setSelectedAuditType, setSelectedAuditTypes, scanMultiple]
  );

  // Rescan using the previously selected audit types
  const handleRescan = useCallback(() => {
    if (selectedAuditTypes.length === 1) {
      scan(selectedAuditTypes[0]);
    } else if (selectedAuditTypes.length > 1) {
      scanMultiple(selectedAuditTypes);
    } else {
      // Fallback to single audit type
      scan(selectedAuditType);
    }
  }, [selectedAuditTypes, selectedAuditType, scan, scanMultiple]);

  const handleSelectIssue = useCallback(
    (id: string) => {
      selectIssue(id);
      const issue = filteredIssues.find((i) => i.id === id);
      if (issue) {
        logger.debug('Issue selected', {
          id,
          selector: issue.element.selector,
          severity: issue.severity,
        });
        // Only highlight (and scroll) for accessibility scans — non-a11y issues
        // (Performance/SEO/…) carry synthetic selectors that don't map to a real
        // element, so highlighting would scroll the page to the wrong place or
        // nowhere (correctness-34).
        if (selectedAuditTypes.includes('accessibility')) {
          highlightElement(issue.element.selector, issue.severity);
        }
      }
    },
    [selectIssue, filteredIssues, highlightElement, selectedAuditTypes]
  );

  const handleHighlightIssue = useCallback(
    (selector: string, severity: Parameters<typeof highlightElement>[1]) => {
      highlightElement(selector, severity);
    },
    [highlightElement]
  );

  const handleBack = useCallback(() => {
    selectIssue(null);
    clearHighlights();
  }, [selectIssue, clearHighlights]);

  // Go back to the audit selector (home)
  const handleBackToHome = useCallback(() => {
    clearResults();
    clearHighlights();
    setShowAllOnPage(false);
  }, [clearResults, clearHighlights]);

  // Toggle the whole-page overlay marking every (filtered) issue's element.
  const toggleShowAllOnPage = useCallback(() => {
    setShowAllOnPage((prev) => {
      const next = !prev;
      if (next) {
        highlightAll(
          filteredIssues.map((issue) => ({
            selector: issue.element.selector,
            severity: issue.severity,
          }))
        );
      } else {
        clearHighlights();
      }
      return next;
    });
  }, [filteredIssues, highlightAll, clearHighlights]);

  // Log scan completion
  useEffect(() => {
    if (scanResult && !isScanning) {
      logger.info('Scan completed', {
        url: scanResult.url,
        issueCount: scanResult.issues.length,
        duration: scanResult.duration,
        summary: scanResult.summary,
      });
    }
  }, [scanResult, isScanning]);

  // Screen-reader announcement for the scan lifecycle, derived during render
  // (no effect needed — deriving avoids cascading renders). Intentionally
  // excludes the cycling per-message progress text; only the start of a scan
  // and its completion are announced.
  let announcement = '';
  if (isScanning) {
    announcement = currentAuditType ? `Scanning ${currentAuditType}` : 'Scanning';
  } else if (scanResult) {
    const count = scanResult.issues.length;
    announcement = `Scan complete, ${count} ${count === 1 ? 'issue' : 'issues'} found`;
  }

  // Visually-hidden live region. Rendered as the first child of every routed
  // view (all share the same root element) so the same DOM node persists across
  // transitions — including when ScanProgress unmounts on completion — which is
  // what lets assistive tech announce the result.
  const liveRegion = (
    <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {announcement}
    </div>
  );

  // Hold the first paint until settings load from storage. This avoids a flash
  // of the wrong persona's UI (onboarding for returning users, the site-owner
  // default audit selection for developers) before their saved settings arrive.
  if (!settingsLoaded) {
    return <div className="h-screen flex flex-col bg-background" aria-busy="true" />;
  }

  // First-run tour — takes priority over every other view. Settings are loaded
  // by this point, so `hasSeenOnboarding` reflects the user's real state.
  if (!settings.hasSeenOnboarding) {
    return (
      <div className="h-screen flex flex-col bg-background">
        {liveRegion}
        <Onboarding onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  // Settings view
  if (showSettings) {
    return (
      <div className="h-screen flex flex-col bg-background">
        {liveRegion}
        <Settings
          settings={settings}
          onUpdate={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      </div>
    );
  }

  // Detail view. No app Header here — IssueDetail owns a full header bar (back
  // control + "Issue X of N"), so rendering the logo Header above it stacked a
  // dead second bar.
  if (view === 'detail' && selectedIssue) {
    return (
      <div className="h-screen flex flex-col bg-background">
        {liveRegion}
        <IssueDetail
          issue={selectedIssue}
          url={scanResult?.url || ''}
          currentIndex={getCurrentIndex()}
          totalCount={totalFiltered}
          onBack={handleBack}
          onPrev={goToPrevIssue}
          onNext={goToNextIssue}
          onHighlight={() =>
            highlightElement(selectedIssue.element.selector, selectedIssue.severity)
          }
          onIgnored={() => {
            logger.info('Issue marked as ignored');
            refreshIgnored();
            handleBack();
          }}
          hasPrev={adjacentIds.prev !== null}
          hasNext={adjacentIds.next !== null}
          canHighlight={selectedAuditTypes.includes('accessibility')}
        />
      </div>
    );
  }

  // Scanning state - show progress
  if (isScanning) {
    return (
      <div className="h-screen flex flex-col bg-background">
        {liveRegion}
        <Header scanResult={scanResult} />
        <ScanProgress
          currentAuditType={currentAuditType}
          currentAuditIndex={currentAuditIndex}
          totalAudits={totalAudits}
          auditTypes={selectedAuditTypes}
          onCancel={cancelScan}
        />
      </div>
    );
  }

  // Initial state - show audit type selector
  if (!error && !scanResult) {
    return (
      <div className="h-screen flex flex-col bg-background">
        {liveRegion}
        <Header onSettingsClick={() => setShowSettings(true)} scanResult={scanResult} />
        {/* Entry point to the read-only saved-report journey — a full-width row
            at the top of Home, per the wireframe. */}
        <div className="px-4 pt-3">
          <ImportReportButton onImport={handleImportReport} />
        </div>
        {/* Which page a scan will target — the tab whose toolbar icon opened the
            panel. If the user has since switched tabs, this still names the armed
            page, cueing them to re-click the icon on the tab they now want. */}
        <p className="px-4 pt-2 text-xs text-muted-foreground truncate">
          {armedHostname
            ? `Ready to scan ${armedHostname}`
            : 'Click the WatchDog toolbar icon on the page you want to scan.'}
        </p>
        <AuditSelector
          onStartScan={handleStartScan}
          onStartMultipleScan={handleStartMultipleScan}
          isScanning={isScanning}
        />
      </div>
    );
  }

  // List view with results
  return (
    <div className="h-screen flex flex-col bg-background">
      {liveRegion}
      <Header
        showBackButton
        onBackClick={handleBackToHome}
        onSettingsClick={() => setShowSettings(true)}
        scanResult={scanResult}
      />

      {/* Toolbar: a "last audited" meta line plus the page-level actions (copy +
          rescan). Pinned above the scroll area. Shown only when there are results
          to re-run; the no-issues and full-error states carry their own single
          retry, so no duplicate CTA. */}
      {scanResult && scanResult.issues.length > 0 && (
        <div className="flex items-center justify-between gap-2 px-4 py-2">
          <span className="text-xs text-muted-foreground truncate">
            Audited {relativeTime(scanResult.timestamp)}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <CopyDropdown
              issues={filteredIssues}
              scanResult={scanResult}
              auditType={selectedAuditType}
            />
            <Button variant="outline" size="sm" onClick={handleRescan} className="gap-1.5">
              <RotateCw className="h-4 w-4" />
              Rescan
            </Button>
          </div>
        </div>
      )}

      {/* One scroll region for the whole report — summary, top fixes, filters and
          the issue list scroll together as a single page instead of nesting a
          tiny scrollbar inside the list. `flex flex-col` lets the full-height
          empty/error states still center via flex-1. */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
        {/* Full-screen error only when there are no results to show */}
        {error && !scanResult && <EmptyState type="error" error={error} onScan={handleRescan} />}

        {/* Partial-failure banner: some audits failed but others returned results */}
        {error && scanResult && (
          <div
            role="alert"
            className="mx-4 my-2 rounded-xl border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning"
          >
            {error}
          </div>
        )}

        {/* Results */}
        {scanResult && (
          <>
            {scanResult.issues.length === 0 ? (
              <EmptyState
                type="no-issues"
                onScan={handleRescan}
                auditLabel={
                  selectedAuditTypes.length === 1 ? AUDIT_LABELS[selectedAuditTypes[0]] : undefined
                }
              />
            ) : (
              <>
                {/* Score card: full-width gauge + verdict + severity filter chips
                    and the page-overlay switch. The copy/rescan actions live in
                    the pinned toolbar above, so the chips get the full width. */}
                <Card className="mx-4 my-2 p-3 gap-3">
                  <Summary
                    summary={scanResult.summary}
                    onFilterBySeverity={(severity) => setFilter('severity', severity)}
                    activeSeverity={filters.severity}
                    auditType={selectedAuditTypes.length === 1 ? selectedAuditTypes[0] : undefined}
                  />

                  {/* Only for accessibility scans, where issue selectors map to
                      real on-page elements. */}
                  {selectedAuditTypes.includes('accessibility') && filteredIssues.length > 0 && (
                    <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
                      <span className="flex items-center gap-2 text-sm text-foreground">
                        <Highlighter className="h-4 w-4 text-muted-foreground" />
                        Show all issues on the page
                      </span>
                      <Switch
                        checked={showAllOnPage}
                        onCheckedChange={toggleShowAllOnPage}
                        aria-label="Show all issues on the page"
                      />
                    </div>
                  )}
                </Card>

                {/* Plain-language ranked starting point above the raw list. */}
                <TopFixesCard issues={filteredIssues} onSelectIssue={handleSelectIssue} />

                <FilterBar
                  severityFilter={filters.severity}
                  categoryFilter={filters.category}
                  searchQuery={filters.searchQuery}
                  hideIgnored={hideIgnored}
                  ignoredCount={ignoredCount}
                  onSeverityChange={(severity) => setFilter('severity', severity)}
                  onCategoryChange={(category) => setFilter('category', category)}
                  onSearchChange={(query) => setFilter('searchQuery', query)}
                  onHideIgnoredChange={setHideIgnored}
                />

                <IssueList
                  issues={filteredIssues}
                  selectedIssueId={null}
                  onSelectIssue={handleSelectIssue}
                  onHighlightIssue={handleHighlightIssue}
                  canHighlight={selectedAuditTypes.includes('accessibility')}
                  autoHighlight={settings.autoHighlight}
                />
              </>
            )}

            {/* Axe "needs manual review" items, gated on the Show Incomplete setting */}
            {settings.showIncomplete && <IncompleteSection issues={scanResult.incomplete} />}
          </>
        )}
      </div>
    </div>
  );
}
