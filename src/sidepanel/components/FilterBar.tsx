import type { Category, Severity } from '@/shared/types';

interface FilterBarProps {
  severityFilter: Severity | 'all';
  categoryFilter: Category | 'all';
  searchQuery: string;
  onSeverityChange: (severity: Severity | 'all') => void;
  onCategoryChange: (category: Category | 'all') => void;
  onSearchChange: (query: string) => void;
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
  onSeverityChange,
  onCategoryChange,
  onSearchChange,
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

  return (
    <div className="px-5 py-3 bg-[#1C1C1E] border-b border-[#3A3A3C] space-y-3">
      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93]"
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
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#2C2C2E] border border-[#3A3A3C] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007AFF] focus:border-[#007AFF] text-white placeholder-[#8E8E93]"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs text-[#8E8E93] mb-1">Severity</label>
          <div className="relative">
            <select
              value={severityFilter}
              onChange={(e) => onSeverityChange(e.target.value as Severity | 'all')}
              className="w-full px-3 py-2 text-sm bg-[#2C2C2E] border border-[#3A3A3C] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007AFF] focus:border-[#007AFF] text-white appearance-none cursor-pointer"
            >
              <option value="all">All Severities</option>
              {severities.map((severity) => (
                <option key={severity} value={severity}>
                  {SEVERITY_LABELS[severity]}
                </option>
              ))}
            </select>
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93] pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        <div className="flex-1">
          <label className="block text-xs text-[#8E8E93] mb-1">Category</label>
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryChange(e.target.value as Category | 'all')}
              className="w-full px-3 py-2 text-sm bg-[#2C2C2E] border border-[#3A3A3C] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007AFF] focus:border-[#007AFF] text-white appearance-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93] pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
