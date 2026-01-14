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
    <div className="px-4 py-5 bg-[#1C1C1E] border-b border-[#2C2C2E] space-y-4 shadow-sm">
      {/* Search */}
      <div className="relative group">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93] group-focus-within:text-[#007AFF] transition-colors"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search issues..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-11 pr-4 py-3 text-sm bg-[#2C2C2E] border border-[#3A3A3C] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007AFF40] focus:border-[#007AFF] text-white placeholder-[#8E8E93] transition-all"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8E8E93] mb-1.5 ml-1">Severity</label>
          <div className="relative">
            <select
              value={severityFilter}
              onChange={(e) => onSeverityChange(e.target.value as Severity | 'all')}
              className="w-full px-3 py-2.5 text-sm bg-[#2C2C2E] border border-[#3A3A3C] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007AFF40] focus:border-[#007AFF] text-white appearance-none cursor-pointer transition-all"
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <div className="flex-1">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8E8E93] mb-1.5 ml-1">Category</label>
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryChange(e.target.value as Category | 'all')}
              className="w-full px-3 py-2.5 text-sm bg-[#2C2C2E] border border-[#3A3A3C] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007AFF40] focus:border-[#007AFF] text-white appearance-none cursor-pointer transition-all"
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
