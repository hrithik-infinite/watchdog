import { useScanStore } from '../store';

export function useIssues() {
  const {
    filters,
    selectedIssueId,
    view,
    setFilter,
    resetFilters,
    selectIssue,
    setView,
    getFilteredIssues,
    getIssueById,
    getAdjacentIssueIds,
  } = useScanStore();

  const filteredIssues = getFilteredIssues();
  const selectedIssue = selectedIssueId ? getIssueById(selectedIssueId) : null;
  const adjacentIds = selectedIssueId ? getAdjacentIssueIds(selectedIssueId) : { prev: null, next: null };

  const goToIssue = (id: string | null) => {
    selectIssue(id);
  };

  const goToPrevIssue = () => {
    if (adjacentIds.prev) {
      selectIssue(adjacentIds.prev);
    }
  };

  const goToNextIssue = () => {
    if (adjacentIds.next) {
      selectIssue(adjacentIds.next);
    }
  };

  const getCurrentIndex = () => {
    if (!selectedIssueId) return -1;
    return filteredIssues.findIndex((issue) => issue.id === selectedIssueId);
  };

  return {
    filters,
    filteredIssues,
    selectedIssue,
    selectedIssueId,
    view,
    adjacentIds,
    setFilter,
    resetFilters,
    selectIssue,
    setView,
    goToIssue,
    goToPrevIssue,
    goToNextIssue,
    getCurrentIndex,
    totalFiltered: filteredIssues.length,
  };
}
