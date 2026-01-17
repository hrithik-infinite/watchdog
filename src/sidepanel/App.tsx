import { useCallback, useState } from 'react';
import Header from './components/Header';
import ScanButton from './components/ScanButton';
import Summary from './components/Summary';
import FilterBar from './components/FilterBar';
import IssueList from './components/IssueList';
import IssueDetail from './components/IssueDetail';
import EmptyState from './components/EmptyState';
import Settings from './components/Settings';
import { useScanner } from './hooks/useScanner';
import { useIssues } from './hooks/useIssues';
import { useHighlight } from './hooks/useHighlight';
import { useSettings } from './hooks/useSettings';

export default function App() {
  const [showSettings, setShowSettings] = useState(false);
  const { isScanning, scanResult, error, scan } = useScanner();
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

  // Initial state - scan button below ready to scan content
  if (!error && !scanResult) {
    return (
      <div className="h-screen flex flex-col bg-bg-dark">
        <Header onSettingsClick={() => setShowSettings(true)} scanResult={scanResult} />
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-4">
          <EmptyState type="initial" />
          <div className="w-full max-w-xs mt-6">
            <ScanButton isScanning={isScanning} onScan={scan} />
          </div>
        </div>
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

      {/* Error state */}
      {error && <EmptyState type="error" error={error} onScan={scan} />}

      {/* Results */}
      {!error && scanResult && (
        <>
          {scanResult.issues.length === 0 ? (
            <EmptyState type="no-issues" onScan={scan} />
          ) : (
            <>
              <Summary
                summary={scanResult.summary}
                onFilterBySeverity={(severity) => setFilter('severity', severity)}
                activeSeverity={filters.severity}
              />

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
