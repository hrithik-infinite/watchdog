import { Ban, Eye, EyeOff, Search, X } from 'lucide-react';
import type { Category, Severity } from '@/shared/types';
import { Button } from '@/sidepanel/components/ui/button';
import { Input } from '@/sidepanel/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/sidepanel/components/ui/select';
import { cn } from '@/sidepanel/lib/utils';
import { useScanStore } from '@/sidepanel/store';

interface FilterBarProps {
  severityFilter: Severity | 'all';
  categoryFilter: Category | 'all';
  searchQuery: string;
  hideIgnored: boolean;
  ignoredCount: number;
  onSeverityChange: (severity: Severity | 'all') => void;
  onCategoryChange: (category: Category | 'all') => void;
  onSearchChange: (query: string) => void;
  onHideIgnoredChange: (hide: boolean) => void;
}

const CATEGORY_LABELS: Record<Category, string> = {
  images: 'Images',
  interactive: 'Interactive',
  forms: 'Forms',
  color: 'Color',
  document: 'Document',
  structure: 'Structure',
  aria: 'ARIA',
  technical: 'Technical',
};

export default function FilterBar({
  severityFilter,
  categoryFilter,
  searchQuery,
  hideIgnored,
  ignoredCount,
  onSeverityChange,
  onCategoryChange,
  onSearchChange,
  onHideIgnoredChange,
}: FilterBarProps) {
  // Read the current scan so the Category filter only offers categories that
  // actually occur in the results (ux-public-14).
  const scanResult = useScanStore((s) => s.scanResult);

  const categories: Category[] = [
    'images',
    'interactive',
    'forms',
    'color',
    'document',
    'structure',
    'aria',
    'technical',
  ];

  // Categories present in the current results. With no scan we fall back to the
  // full list so the control still renders sensibly (e.g. before a scan runs).
  const presentCategories = scanResult
    ? categories.filter((category) => (scanResult.summary.byCategory[category] ?? 0) > 0)
    : categories;
  // Nothing to filter when 0 or 1 category is present — hide the whole control.
  const showCategoryFilter = presentCategories.length > 1;

  const hasActiveFilters =
    severityFilter !== 'all' || categoryFilter !== 'all' || searchQuery.trim() !== '';

  const clearAllFilters = () => {
    onSeverityChange('all');
    onCategoryChange('all');
    onSearchChange('');
  };

  return (
    <div className="px-4 py-2 bg-background border-b border-border space-y-2">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          aria-label="Search issues"
          placeholder="Search issues..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters. Severity is filtered from the Summary chips above the list, so
          it is intentionally NOT duplicated here — this row is category + a
          clear-all affordance. */}
      {(showCategoryFilter || hasActiveFilters) && (
        <div className="flex gap-3 items-end">
          {/* Category filter is hidden when there is nothing meaningful to filter
              by (0 or 1 category present in the results). */}
          {showCategoryFilter && (
            <div className="flex-1">
              <label
                htmlFor="category-filter"
                className="block text-caption text-muted-foreground mb-1"
              >
                Category
              </label>
              <Select value={categoryFilter} onValueChange={onCategoryChange}>
                <SelectTrigger id="category-filter">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {presentCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {CATEGORY_LABELS[category]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="gap-2 text-muted-foreground hover:text-foreground"
              aria-label="Clear all filters"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      )}

      {/* Known Issues Toggle */}
      {ignoredCount > 0 && (
        <div className="flex items-center justify-between py-1">
          <button
            type="button"
            onClick={() => onHideIgnoredChange(!hideIgnored)}
            aria-pressed={hideIgnored}
            className={cn(
              'flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors',
              hideIgnored
                ? 'text-muted-foreground hover:text-foreground hover:bg-accent'
                : 'text-warning bg-warning/10 hover:bg-warning/20'
            )}
          >
            <Ban className="h-3.5 w-3.5" />
            <span>
              {ignoredCount} known issue{ignoredCount !== 1 ? 's' : ''}
            </span>
            {hideIgnored ? <EyeOff className="h-3 w-3 ml-1" /> : <Eye className="h-3 w-3 ml-1" />}
          </button>
          <span className="text-xs text-muted-foreground">
            {hideIgnored ? 'Hidden' : 'Showing'}
          </span>
        </div>
      )}
    </div>
  );
}
