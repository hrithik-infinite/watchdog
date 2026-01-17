import { Search, X, Ban, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/sidepanel/components/ui/input';
import { Button } from '@/sidepanel/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/sidepanel/components/ui/select';
import { cn } from '@/sidepanel/lib/utils';
import type { Category, Severity } from '@/shared/types';

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

const SEVERITY_LABELS: Record<Severity, string> = {
  critical: 'Critical',
  serious: 'Serious',
  moderate: 'Moderate',
  minor: 'Minor',
};

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
  const severities: Severity[] = ['critical', 'serious', 'moderate', 'minor'];
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
          placeholder="Search issues..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-caption text-muted-foreground mb-1">Severity</label>
          <Select value={severityFilter} onValueChange={onSeverityChange}>
            <SelectTrigger>
              <SelectValue placeholder="All Severities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              {severities.map((severity) => (
                <SelectItem key={severity} value={severity}>
                  {SEVERITY_LABELS[severity]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <label className="block text-caption text-muted-foreground mb-1">Category</label>
          <Select value={categoryFilter} onValueChange={onCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {CATEGORY_LABELS[category]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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

      {/* Known Issues Toggle */}
      {ignoredCount > 0 && (
        <div className="flex items-center justify-between py-1">
          <button
            onClick={() => onHideIgnoredChange(!hideIgnored)}
            className={cn(
              'flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors',
              hideIgnored
                ? 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                : 'text-amber-500 bg-amber-500/10 hover:bg-amber-500/20'
            )}
          >
            <Ban className="h-3.5 w-3.5" />
            <span>
              {ignoredCount} known issue{ignoredCount !== 1 ? 's' : ''}
            </span>
            {hideIgnored ? (
              <EyeOff className="h-3 w-3 ml-1" />
            ) : (
              <Eye className="h-3 w-3 ml-1" />
            )}
          </button>
          <span className="text-xs text-muted-foreground">
            {hideIgnored ? 'Hidden' : 'Showing'}
          </span>
        </div>
      )}
    </div>
  );
}
