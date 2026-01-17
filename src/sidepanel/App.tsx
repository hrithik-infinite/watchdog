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
import { useScanner } from './hooks/useScanner';
import { useIssues } from './hooks/useIssues';
import { useHighlight } from './hooks/useHighlight';
import { useSettings } from './hooks/useSettings';
import { useIgnoredIssues } from './hooks/useIgnoredIssues';
import { useScanStore } from './store';
import type { AuditType } from './store';
import logger from '@/shared/logger';

export default function App() {
  const [showSettings, setShowSettings] = useState(false);
  const {
    scanResult,
    error,
    scan,
    scanMultiple,
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
  const { highlightElement, clearHighlights } = useHighlight();
  const { settings, updateSettings } = useSettings();

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
  }, [clearResults, clearHighlights]);

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
          canHighlight={selectedAuditType === 'accessibility'}
        />
      </div>
    );
  }

  // Scanning state - show progress
  if (isScanning) {
    return (
      <div className="h-screen flex flex-col bg-bg-dark">
        <Header scanResult={scanResult} />
        <ScanProgress
          currentAuditType={currentAuditType}
          currentAuditIndex={currentAuditIndex}
          totalAudits={totalAudits}
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

      {/* Error state */}
      {error && <EmptyState type="error" error={error} onScan={handleRescan} />}

      {/* Results */}
      {!error && scanResult && (
        <>
          {scanResult.issues.length === 0 ? (
            <EmptyState type="no-issues" onScan={handleRescan} />
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
                canHighlight={selectedAuditType === 'accessibility'}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
