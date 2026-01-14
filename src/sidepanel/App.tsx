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
      <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
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
      <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
        <Header />
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

  // List view
  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
      <Header onSettingsClick={() => setShowSettings(true)} />

      {/* Scan button */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <ScanButton isScanning={isScanning} onScan={scan} />
      </div>

      {/* Error state */}
      {error && <EmptyState type="error" error={error} onScan={scan} />}

      {/* Initial state */}
      {!error && !scanResult && <EmptyState type="initial" />}

      {/* Results */}
      {!error && scanResult && (
        <>
          {scanResult.issues.length === 0 ? (
            <EmptyState type="no-issues" />
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
