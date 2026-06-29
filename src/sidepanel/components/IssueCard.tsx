import { useState } from 'react';
import { Card, CardContent } from '@/sidepanel/components/ui/card';
import { Badge } from '@/sidepanel/components/ui/badge';
import { Button } from '@/sidepanel/components/ui/button';
import type { Issue, Severity } from '@/shared/types';
import { cn } from '@/sidepanel/lib/utils';
import { STANDARD_LABELS, isWcagIssue } from '@/sidepanel/lib/standards';
import { useIsSiteOwner } from '@/sidepanel/lib/persona';
import { describeElement } from '@/sidepanel/lib/element-descriptor';

interface IssueCardProps {
  issue: Issue;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onHighlight: () => void;
  canHighlight?: boolean;
  // When false, hovering a card does not auto-highlight its element on the page
  // (the "Auto-highlight on Hover" setting). Highlighting is still possible via
  // explicit actions in the detail view.
  autoHighlight?: boolean;
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
  autoHighlight = true,
}: IssueCardProps) {
  const isSiteOwner = useIsSiteOwner();
  // Site-owner cards lead with a plain descriptor and keep the raw markup
  // collapsed; this toggle reveals it on demand.
  const [showCode, setShowCode] = useState(false);

  const truncateHtml = (html: string, maxLength: number = 80) => {
    const stripped = html.replace(/<[^>]*>/g, '').trim();
    if (stripped.length <= maxLength) return html;
    return html.slice(0, maxLength) + '...';
  };

  // The raw HTML preview. Rendered inside the activatable region for developers
  // (raw-first), or behind the "Show code" toggle for site owners.
  const codePreview = (
    <div className="bg-background/50 rounded-md p-2 mb-2 overflow-hidden border border-primary/20 backdrop-blur-sm relative group">
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-mono text-[9px] text-muted-foreground/50 tracking-wider">HTML</span>
      </div>
      <code className="text-mono text-xs text-primary-light block truncate leading-relaxed">
        {truncateHtml(issue.element.html)}
      </code>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
    </div>
  );

  return (
    <Card
      className={cn(
        'mb-2 transition-all animate-fade-in hover:bg-accent',
        isSelected && 'ring-2 ring-primary'
      )}
      onMouseEnter={canHighlight && autoHighlight ? onHighlight : undefined}
    >
      <CardContent className="p-3">
        {/*
          Activatable region. The "Learn more" link is rendered as a sibling of
          this element (not a descendant) so the role="button" never contains a
          nested interactive control (avoids axe nested-interactive).
        */}
        <div
          className="cursor-pointer"
          role="button"
          tabIndex={0}
          onClick={() => onSelect(issue.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelect(issue.id);
            }
          }}
        >
          {/* Severity Badge */}
          <Badge variant={SEVERITY_VARIANTS[issue.severity]} className="mb-2">
            {SEVERITY_LABELS[issue.severity]}
          </Badge>

          {/* Issue Title */}
          <h3 className="text-h3 text-foreground mb-1.5 leading-snug">{issue.message}</h3>

          {/* Plain-language consequence (ux-public-3), one-line under the title. */}
          {issue.whyItMatters && (
            <p className="text-sm text-foreground/80 mb-1.5 line-clamp-1">{issue.whyItMatters}</p>
          )}

          {/* Standard reference: WCAG criterion for accessibility, a neutral
              label otherwise. */}
          <div className="flex items-center gap-2 mb-2">
            {issue.standard && !isWcagIssue(issue.standard) ? (
              <span className="text-mono text-[10px] text-muted-foreground tracking-wider px-2 py-0.5 bg-muted/30 rounded border border-border/50">
                {STANDARD_LABELS[issue.standard]}
              </span>
            ) : (
              <>
                <span className="text-mono text-[10px] text-muted-foreground tracking-wider px-2 py-0.5 bg-muted/30 rounded border border-border/50">
                  WCAG {issue.wcag.id}
                </span>
                <span className="text-caption text-muted-foreground/70">
                  Level {issue.wcag.level}
                </span>
              </>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{issue.description}</p>

          {/* Lead-in: a plain descriptor for site owners, raw markup for devs. */}
          {isSiteOwner ? (
            <p className="text-sm text-foreground mb-2">{describeElement(issue.element.html)}</p>
          ) : (
            codePreview
          )}
        </div>

        {/*
          Site-owner "Show code" toggle and the revealed markup live OUTSIDE the
          role="button" region (like "Learn more") so the card never nests an
          interactive control inside another (axe nested-interactive).
        */}
        {isSiteOwner && (
          <>
            <Button
              variant="link"
              className="p-0 h-auto text-sm mr-4"
              aria-expanded={showCode}
              onClick={(e) => {
                e.stopPropagation();
                setShowCode((v) => !v);
              }}
            >
              {showCode ? 'Hide code' : 'Show code'}
            </Button>
            {showCode && <div className="mt-2">{codePreview}</div>}
          </>
        )}

        {/* Learn More Link (sibling of the role="button" region above) */}
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
