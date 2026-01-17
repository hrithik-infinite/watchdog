import { useCallback, useState } from 'react';
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
import { useScanner } from './hooks/useScanner';
import { useIssues } from './hooks/useIssues';
import { useHighlight } from './hooks/useHighlight';
import { useSettings } from './hooks/useSettings';
import { useScanStore } from './store';
import type { AuditType } from './store';

export default function App() {
  const [showSettings, setShowSettings] = useState(false);
  const { isScanning, scanResult, error, scan } = useScanner();
  const selectedAuditType = useScanStore((state) => state.selectedAuditType);
  const setSelectedAuditType = useScanStore((state) => state.setSelectedAuditType);
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
      setSelectedAuditType(auditType);
      scan(auditType);
    },
    [setSelectedAuditType, scan]
  );

  const handleSelectIssue = useCallback(
    (id: string) => {
      selectIssue(id);
      const issue = filteredIssues.find((i) => i.id === id);
      if (issue) {
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
          currentIndex={getCurrentIndex()}
          totalCount={totalFiltered}
          onBack={handleBack}
          onPrev={goToPrevIssue}
          onNext={goToNextIssue}
          onHighlight={() =>
            highlightElement(selectedIssue.element.selector, selectedIssue.severity)
          }
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
        <AuditSelector onStartScan={handleStartScan} isScanning={isScanning} />
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

              <FilterBar
                severityFilter={filters.severity}
                categoryFilter={filters.category}
                searchQuery={filters.searchQuery}
                onSeverityChange={(severity) => setFilter('severity', severity)}
                onCategoryChange={(category) => setFilter('category', category)}
                onSearchChange={(query) => setFilter('searchQuery', query)}
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
