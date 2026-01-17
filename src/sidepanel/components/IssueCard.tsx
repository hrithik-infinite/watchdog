import { Card, CardContent } from '@/sidepanel/components/ui/card';
import { Badge } from '@/sidepanel/components/ui/badge';
import { Button } from '@/sidepanel/components/ui/button';
import type { Issue, Severity } from '@/shared/types';
import { cn } from '@/sidepanel/lib/utils';

interface IssueCardProps {
  issue: Issue;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onHighlight: () => void;
  canHighlight?: boolean;
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

export default function IssueCard({
  issue,
  isSelected,
  onSelect,
  onHighlight,
  canHighlight = false,
}: IssueCardProps) {
  const truncateHtml = (html: string, maxLength: number = 80) => {
    const stripped = html.replace(/<[^>]*>/g, '').trim();
    if (stripped.length <= maxLength) return html;
    return html.slice(0, maxLength) + '...';
  };

  return (
    <Card
      className={cn(
        'mb-2 cursor-pointer transition-all animate-fade-in hover:bg-accent',
        isSelected && 'ring-2 ring-primary'
      )}
      onClick={() => onSelect(issue.id)}
      onMouseEnter={canHighlight ? onHighlight : undefined}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(issue.id)}
    >
      <CardContent className="p-3">
        {/* Severity Badge */}
        <Badge variant={SEVERITY_VARIANTS[issue.severity]} className="mb-2">
          {SEVERITY_LABELS[issue.severity]}
        </Badge>

        {/* Issue Title */}
        <h3 className="text-h3 text-foreground mb-1.5 leading-snug">{issue.message}</h3>

        {/* WCAG Reference */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-mono text-[10px] text-muted-foreground tracking-wider px-2 py-0.5 bg-muted/30 rounded border border-border/50">
            WCAG {issue.wcag.id}
          </span>
          <span className="text-caption text-muted-foreground/70">Level {issue.wcag.level}</span>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{issue.description}</p>

        {/* Code Preview */}
        <div className="bg-background/50 rounded-md p-2 mb-2 overflow-hidden border border-primary/20 backdrop-blur-sm relative group">
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-mono text-[9px] text-muted-foreground/50 tracking-wider">
              HTML
            </span>
          </div>
          <code className="text-mono text-xs text-primary-light block truncate leading-relaxed">
            {truncateHtml(issue.element.html)}
          </code>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
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
