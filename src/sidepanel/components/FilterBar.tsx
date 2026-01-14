import type { Category, Severity } from '@/shared/types';
import { CATEGORY_CONFIG, SEVERITY_CONFIG } from '@/shared/constants';

interface FilterBarProps {
  severityFilter: Severity | 'all';
  categoryFilter: Category | 'all';
  searchQuery: string;
  onSeverityChange: (severity: Severity | 'all') => void;
  onCategoryChange: (category: Category | 'all') => void;
  onSearchChange: (query: string) => void;
}

export default function FilterBar({
  severityFilter,
  categoryFilter,
  searchQuery,
  onSeverityChange,
  onCategoryChange,
  onSearchChange,
}: FilterBarProps) {
  const severities: (Severity | 'all')[] = ['all', 'critical', 'serious', 'moderate', 'minor'];
  const categories: (Category | 'all')[] = [
    'all',
    'images',
    'interactive',
    'forms',
    'color',
    'document',
    'structure',
    'aria',
    'technical',
  ];

  return (
    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 space-y-3">
      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search issues..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <select
          value={severityFilter}
          onChange={(e) => onSeverityChange(e.target.value as Severity | 'all')}
          className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 dark:text-white"
        >
          <option value="all">All Severities</option>
          {severities.slice(1).map((severity) => (
            <option key={severity} value={severity}>
              {SEVERITY_CONFIG[severity as Severity].icon} {SEVERITY_CONFIG[severity as Severity].label}
            </option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value as Category | 'all')}
          className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 dark:text-white"
        >
          <option value="all">All Categories</option>
          {categories.slice(1).map((category) => (
            <option key={category} value={category}>
              {CATEGORY_CONFIG[category as Category].icon} {CATEGORY_CONFIG[category as Category].label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
