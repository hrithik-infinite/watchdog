import { useCallback, useState, useEffect } from 'react';
import Header from './components/Header';
import ScanButton from './components/ScanButton';
import Summary from './components/Summary';
import FilterBar from './components/FilterBar';
import IssueList from './components/IssueList';
import IssueDetail from './components/IssueDetail';
import EmptyState from './components/EmptyState';
import Settings from './components/Settings';
import AuditSelector from './components/AuditSelector';
import ScanProgress from './components/ScanProgress';
import CopyDropdown from './components/CopyDropdown';
import IncompleteSection from './components/IncompleteSection';
import Onboarding from './components/Onboarding';
import TopFixesCard from './components/TopFixesCard';
import { useScanner } from './hooks/useScanner';
import { useIssues } from './hooks/useIssues';
import { useHighlight } from './hooks/useHighlight';
import { useSettings } from './hooks/useSettings';
import { useIgnoredIssues } from './hooks/useIgnoredIssues';
import { Highlighter } from 'lucide-react';
import { useScanStore } from './store';
import type { AuditType } from './store';
import type { Persona } from '@/shared/types';
import logger from '@/shared/logger';

// Human-friendly audit names for the audit-aware success message.
const AUDIT_LABELS: Partial<Record<AuditType, string>> = {
  accessibility: 'Accessibility',
  performance: 'Performance',
  seo: 'SEO',
  security: 'Security',
  'best-practices': 'Best Practices',
  pwa: 'PWA',
};

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
        highlightElement(issue.element.selector, issue.severity);
      }
    },
    [selectIssue, filteredIssues, highlightElement]
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
    return <div className="h-screen flex flex-col bg-bg-dark" aria-busy="true" />;
  }

  // First-run tour — takes priority over every other view. Settings are loaded
  // by this point, so `hasSeenOnboarding` reflects the user's real state.
  if (!settings.hasSeenOnboarding) {
    return (
      <div className="h-screen flex flex-col bg-bg-dark">
        {liveRegion}
        <Onboarding onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  // Settings view
  if (showSettings) {
    return (
      <div className="h-screen flex flex-col bg-bg-dark">
        {liveRegion}
        <Settings
          settings={settings}
          onUpdate={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      </div>
    );
  }

  // Detail view
  if (view === 'detail' && selectedIssue) {
    return (
      <div className="h-screen flex flex-col bg-bg-dark">
        {liveRegion}
        <Header scanResult={scanResult} />
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
      <div className="h-screen flex flex-col bg-bg-dark">
        {liveRegion}
        <Header scanResult={scanResult} />
        <ScanProgress
          currentAuditType={currentAuditType}
          currentAuditIndex={currentAuditIndex}
          totalAudits={totalAudits}
          onCancel={cancelScan}
        />
      </div>
    );
  }

  // Initial state - show audit type selector
  if (!error && !scanResult) {
    return (
      <div className="h-screen flex flex-col bg-bg-dark">
        {liveRegion}
        <Header onSettingsClick={() => setShowSettings(true)} scanResult={scanResult} />
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
    <div className="h-screen flex flex-col bg-bg-dark">
      {liveRegion}
      <Header
        showBackButton
        onBackClick={handleBackToHome}
        onSettingsClick={() => setShowSettings(true)}
        scanResult={scanResult}
      />

      {/* Scan button at top for results view */}
      <div className="px-4 py-2">
        <ScanButton isScanning={isScanning} onScan={handleRescan} hasResults={!!scanResult} />
      </div>

      {/* Full-screen error only when there are no results to show */}
      {error && !scanResult && <EmptyState type="error" error={error} onScan={handleRescan} />}

      {/* Partial-failure banner: some audits failed but others returned results */}
      {error && scanResult && (
        <div
          role="alert"
          className="mx-4 my-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-300"
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
              <div className="flex items-center justify-between px-4 py-2 border-b border-border/40">
                <Summary
                  summary={scanResult.summary}
                  onFilterBySeverity={(severity) => setFilter('severity', severity)}
                  activeSeverity={filters.severity}
                />
                <CopyDropdown
                  issues={filteredIssues}
                  scanResult={scanResult}
                  auditType={selectedAuditType}
                />
              </div>

              {/* WAVE-style whole-page overlay toggle. Only for accessibility
                  scans, where issue selectors map to real on-page elements. */}
              {selectedAuditTypes.includes('accessibility') && filteredIssues.length > 0 && (
                <div className="px-4 py-2 border-b border-border/40">
                  <button
                    type="button"
                    onClick={toggleShowAllOnPage}
                    aria-pressed={showAllOnPage}
                    className={
                      'flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ' +
                      (showAllOnPage
                        ? 'text-primary bg-primary/10 hover:bg-primary/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50')
                    }
                  >
                    <Highlighter className="h-3.5 w-3.5" />
                    {showAllOnPage ? 'Hide markers on the page' : 'Show all issues on the page'}
                  </button>
                </div>
              )}

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
  );
}
