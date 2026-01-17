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
import PostScanReminder from './components/PostScanReminder';
import CopyDropdown from './components/CopyDropdown';
import ScanComparisonView from './components/ScanComparison';
import ScanHistory from './components/ScanHistory';
import { useScanner } from './hooks/useScanner';
import { useIssues } from './hooks/useIssues';
import { useHighlight } from './hooks/useHighlight';
import { useSettings } from './hooks/useSettings';
import { useScanHistory } from './hooks/useScanHistory';
import { useIgnoredIssues } from './hooks/useIgnoredIssues';
import { useScanStore } from './store';
import type { AuditType } from './store';
import { compareScanResults } from '@/shared/storage';
import logger from '@/shared/logger';

export default function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const { isScanning, scanResult, error, scan, scanMultiple } = useScanner();
  const selectedAuditType = useScanStore((state) => state.selectedAuditType);
  const setSelectedAuditType = useScanStore((state) => state.setSelectedAuditType);
  const setIgnoredHashes = useScanStore((state) => state.setIgnoredHashes);
  const hideIgnored = useScanStore((state) => state.hideIgnored);
  const setHideIgnored = useScanStore((state) => state.setHideIgnored);

  // Scan history
  const {
    history,
    previousScan,
    saveToHistory,
    refresh: refreshHistory,
  } = useScanHistory(scanResult?.url);

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
  const { highlightElement, clearHighlights } = useHighlight();
  const { settings, updateSettings } = useSettings();

  const handleStartScan = useCallback(
    (auditType: AuditType) => {
      logger.info('Starting scan', { auditType });
      setSelectedAuditType(auditType);
      scan(auditType);
    },
    [setSelectedAuditType, scan]
  );

  const handleStartMultipleScan = useCallback(
    (auditTypes: AuditType[]) => {
      if (auditTypes.length > 0) {
        logger.info('Starting multiple scans', { auditTypes });
        setSelectedAuditType(auditTypes[0]);
        scanMultiple(auditTypes);
      }
    },
    [setSelectedAuditType, scanMultiple]
  );

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

  // Save scan to history when completed
  useEffect(() => {
    if (scanResult && !isScanning) {
      logger.info('Scan completed', {
        url: scanResult.url,
        issueCount: scanResult.issues.length,
        duration: scanResult.duration,
        summary: scanResult.summary,
      });
      saveToHistory(scanResult, [selectedAuditType]);
    }
  }, [scanResult, isScanning, selectedAuditType, saveToHistory]);

  // Get comparison data if previous scan exists
  const comparison =
    scanResult && previousScan ? compareScanResults(scanResult, previousScan) : null;

  // Settings view
  if (showSettings) {
    return (
      <div className="h-screen flex flex-col bg-bg-dark">
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
        />
      </div>
    );
  }

  // Initial state - show audit type selector
  if (!error && !scanResult) {
    return (
      <div className="h-screen flex flex-col bg-bg-dark">
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
      <Header onSettingsClick={() => setShowSettings(true)} scanResult={scanResult} />

      {/* Scan button at top for results view */}
      <div className="px-4 py-2">
        <ScanButton isScanning={isScanning} onScan={scan} hasResults={!!scanResult} />
      </div>

      {/* Post-scan reminder for other audit types */}
      {!isScanning && scanResult && selectedAuditType && (
        <PostScanReminder
          completedAuditType={selectedAuditType}
          onRunRemaining={() => {
            // TODO: Implement multi-scan in US-001
          }}
        />
      )}

      {/* Error state */}
      {error && <EmptyState type="error" error={error} onScan={scan} />}

      {/* Results */}
      {!error && scanResult && (
        <>
          {scanResult.issues.length === 0 ? (
            <EmptyState type="no-issues" onScan={scan} />
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

              {/* Scan Comparison */}
              {showComparison && comparison && (
                <div className="px-4 py-2">
                  <ScanComparisonView
                    comparison={comparison}
                    onClose={() => setShowComparison(false)}
                  />
                </div>
              )}

              {/* Compare to Previous Button */}
              {!showComparison && previousScan && (
                <div className="px-4 py-2">
                  <button
                    onClick={() => setShowComparison(true)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-lg transition-colors"
                  >
                    <span>Compare to Previous Scan</span>
                    <span className="text-muted-foreground">
                      ({previousScan.issueCount} issues)
                    </span>
                  </button>
                </div>
              )}

              {/* Scan History */}
              {history.length > 1 && (
                <div className="px-4 py-2">
                  <ScanHistory history={history} onRefresh={refreshHistory} />
                </div>
              )}

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
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
