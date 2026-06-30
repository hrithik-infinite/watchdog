import { useState } from 'react';
import type { Issue, Severity } from '@/shared/types';
import { Badge } from '@/sidepanel/components/ui/badge';
import { Button } from '@/sidepanel/components/ui/button';
import { Card, CardContent } from '@/sidepanel/components/ui/card';
import { describeElement } from '@/sidepanel/lib/element-descriptor';
import { useIsSiteOwner } from '@/sidepanel/lib/persona';
import { isWcagIssue, STANDARD_LABELS } from '@/sidepanel/lib/standards';
import { cn } from '@/sidepanel/lib/utils';

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

// A colored left rail makes a list of 20–30 issues triageable by severity at a
// glance, instead of identical boxes whose only signal is a small corner chip.
const SEVERITY_RAIL: Record<Severity, string> = {
  critical: 'border-l-critical',
  serious: 'border-l-serious',
  moderate: 'border-l-moderate',
  minor: 'border-l-minor',
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
    return `${html.slice(0, maxLength)}...`;
  };

  // The raw HTML preview. Rendered inside the activatable region for developers
  // (raw-first), or behind the "Show code" toggle for site owners.
  const codePreview = (
    <div className="bg-input rounded-lg p-2 mb-2 overflow-hidden border border-border">
      <code className="text-mono text-xs text-foreground block truncate leading-relaxed">
        {truncateHtml(issue.element.html)}
      </code>
    </div>
  );

  return (
    <Card
      className={cn(
        'mb-2 animate-fade-in hover:bg-accent border-l-[3px]',
        SEVERITY_RAIL[issue.severity],
        // Native off-screen virtualization (perf-rel-6): the browser skips
        // layout/paint for cards scrolled out of view. contain-intrinsic-size
        // reserves an approximate card height so the scrollbar stays stable.
        // Zero-dependency alternative to a virtualization library.
        '[content-visibility:auto] [contain-intrinsic-size:0_140px]',
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
        {/* biome-ignore lint/a11y/useSemanticElements: intentional role=button div (see note above) — a real <button> would nest the sibling "Learn more" link as an interactive descendant */}
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
            <p className="text-sm text-foreground mb-1.5 line-clamp-1">{issue.whyItMatters}</p>
          )}

          {/* Standard reference: WCAG criterion for accessibility, a neutral
              label otherwise. */}
          <div className="flex items-center gap-2 mb-2">
            {issue.standard && !isWcagIssue(issue.standard) ? (
              <span className="text-mono text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded-md border border-border">
                {STANDARD_LABELS[issue.standard]}
              </span>
            ) : (
              <>
                <span className="text-mono text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded-md border border-border">
                  WCAG {issue.wcag.id}
                </span>
                <span className="text-caption text-muted-foreground">Level {issue.wcag.level}</span>
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
