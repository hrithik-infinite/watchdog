import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Issue, Severity } from '@/shared/types';
import { cn } from '@/lib/utils';

interface IssueCardProps {
  issue: Issue;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onHighlight: () => void;
}

const SEVERITY_VARIANTS: Record<Severity, 'critical' | 'serious' | 'moderate' | 'minor'> = {
  critical: 'critical',
  serious: 'serious',
  moderate: 'moderate',
  minor: 'minor',
};

const SEVERITY_LABELS: Record<Severity, string> = {
  critical: 'Critical',
  serious: 'Serious',
  moderate: 'Moderate',
  minor: 'Minor',
};

export default function IssueCard({ issue, isSelected, onSelect, onHighlight }: IssueCardProps) {
  const truncateHtml = (html: string, maxLength: number = 80) => {
    const stripped = html.replace(/<[^>]*>/g, '').trim();
    if (stripped.length <= maxLength) return html;
    return html.slice(0, maxLength) + '...';
  };

  return (
    <Card
      className={cn(
        'mb-3 cursor-pointer transition-all animate-fade-in hover:bg-accent',
        isSelected && 'ring-2 ring-primary'
      )}
      onClick={() => onSelect(issue.id)}
      onMouseEnter={onHighlight}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(issue.id)}
    >
      <CardContent className="p-4">
        {/* Severity Badge */}
        <Badge variant={SEVERITY_VARIANTS[issue.severity]} className="mb-3">
          {SEVERITY_LABELS[issue.severity]}
        </Badge>

        {/* Issue Title */}
        <h3 className="text-h3 text-foreground mb-2 leading-snug">{issue.message}</h3>

        {/* WCAG Reference */}
        <p className="text-xs text-muted-foreground mb-3">
          WCAG {issue.wcag.id} ({issue.wcag.level})
        </p>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{issue.description}</p>

        {/* Code Preview */}
        <div className="bg-background rounded-lg p-3 mb-3 overflow-hidden border border-primary/10">
          <code className="text-xs text-primary-light font-mono block truncate">
            {truncateHtml(issue.element.html)}
          </code>
        </div>

        {/* Learn More Link */}
        <Button
          variant="link"
          asChild
          className="p-0 h-auto text-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <a href={issue.helpUrl} target="_blank" rel="noopener noreferrer">
            Learn more →
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
