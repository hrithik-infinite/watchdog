import { Ban, ChevronLeft, ChevronRight, Code, Eye, Glasses } from 'lucide-react';
import { useState } from 'react';
import type { Issue, Severity } from '@/shared/types';
import { Badge } from '@/sidepanel/components/ui/badge';
import { Button } from '@/sidepanel/components/ui/button';
import { usePageOverlays } from '@/sidepanel/hooks/usePageOverlays';
import { describeElement } from '@/sidepanel/lib/element-descriptor';
import { useIsSiteOwner } from '@/sidepanel/lib/persona';
import { isWcagIssue, STANDARD_LABELS } from '@/sidepanel/lib/standards';
import CodeBlock from './CodeBlock';
import IgnoreIssueModal from './IgnoreIssueModal';

interface IssueDetailProps {
  issue: Issue;
  url: string;
  currentIndex: number;
  totalCount: number;
  onBack: () => void;
  onPrev: () => void;
  onNext: () => void;
  onHighlight: () => void;
  onIgnored: () => void;
  hasPrev: boolean;
  hasNext: boolean;
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

export default function IssueDetail({
  issue,
  url,
  currentIndex,
  totalCount,
  onBack,
  onPrev,
  onNext,
  onHighlight,
  onIgnored,
  hasPrev,
  hasNext,
  canHighlight = false,
}: IssueDetailProps) {
  const isSiteOwner = useIsSiteOwner();
  const { visionMode, setVisionMode } = usePageOverlays();
  const [showIgnoreModal, setShowIgnoreModal] = useState(false);

  // Deep-link the colorblind simulator from color-contrast issues (ux-public-10):
  // the most direct way to *see* why low contrast matters. Toggles a colorblind
  // mode on the live page.
  const isColorIssue = issue.ruleId === 'color-contrast' || issue.category === 'color';
  const isPreviewingCVD = visionMode !== 'none' && !visionMode.startsWith('blur');
  const togglePreview = () => setVisionMode(isPreviewingCVD ? 'none' : 'deuteranopia');
  // Site owners see the element described in plain language with the raw markup
  // collapsed behind this toggle; developers keep the code visible by default.
  const [showCode, setShowCode] = useState(false);

  return (
    <div className="flex flex-col h-full animate-slide-in bg-background">
      {/* Header with back button */}
      <div className="grid grid-cols-[auto_1fr_auto] items-center px-4 py-3 border-b border-border bg-card">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-1.5 font-medium">
          <ChevronLeft className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </Button>
        <span className="text-sm text-muted-foreground tabular-nums text-center">
          Issue {currentIndex + 1} of {totalCount}
        </span>
        <span className="w-9" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Title and Severity */}
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-h2 text-foreground flex-1">{issue.message}</h2>
          <Badge variant={SEVERITY_VARIANTS[issue.severity]} className="flex-shrink-0">
            {SEVERITY_LABELS[issue.severity]}
          </Badge>
        </div>

        {/* Why this matters (ux-public-3): the plain-language consequence, led
            above the technical description so non-developers get the stakes
            first. Omitted when the scanner supplied no copy for this rule. */}
        {issue.whyItMatters && (
          <div className="rounded-xl border border-border bg-muted p-3">
            <p className="text-caption uppercase text-muted-foreground mb-1">WHY THIS MATTERS</p>
            <p className="text-sm text-foreground">{issue.whyItMatters}</p>
          </div>
        )}

        {/* Standard info: WCAG criterion for accessibility, a neutral label
            (e.g. "Performance metric") for the other audits. */}
        <div className="bg-muted border border-border rounded-xl p-3">
          <p className="text-caption uppercase text-muted-foreground mb-1">STANDARD</p>
          {isWcagIssue(issue.standard) ? (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-foreground font-medium">WCAG {issue.wcag.id}</span>
              <Badge variant="outline">Level {issue.wcag.level}</Badge>
            </div>
          ) : (
            <p className="text-foreground font-medium mb-1">{STANDARD_LABELS[issue.standard!]}</p>
          )}
          <p className="text-sm text-muted-foreground">{issue.description}</p>
        </div>

        {/* Current Element */}
        <div>
          <p className="text-caption uppercase text-muted-foreground mb-2">CURRENT ELEMENT</p>
          {/* Actions wrap onto their own line(s) — at 360px a single row of
              "Preview color blindness" + "Highlight" + "Hide" overflowed. */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {isColorIssue && canHighlight && (
              <Button
                variant="secondary"
                size="sm"
                onClick={togglePreview}
                aria-pressed={isPreviewingCVD}
                className="gap-1.5"
              >
                <Glasses className="h-4 w-4" />
                {isPreviewingCVD ? 'Stop preview' : 'Preview color blindness'}
              </Button>
            )}
            {canHighlight && (
              <Button variant="secondary" size="sm" onClick={onHighlight} className="gap-1.5">
                <Eye className="h-4 w-4" />
                Highlight
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowIgnoreModal(true)}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <Ban className="h-4 w-4" />
              {isSiteOwner ? 'Mark as known' : 'Hide'}
            </Button>
          </div>
          {isSiteOwner ? (
            <>
              <p className="text-body text-foreground mb-2">
                {describeElement(issue.element.html)}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCode((v) => !v)}
                aria-expanded={showCode}
                className="gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Code className="h-4 w-4" />
                {showCode ? 'Hide code' : 'Show code'}
              </Button>
              {showCode && (
                <div className="mt-2">
                  <CodeBlock code={issue.element.html} />
                </div>
              )}
            </>
          ) : (
            <CodeBlock code={issue.element.html} />
          )}
        </div>

        {/* How to Fix */}
        <div>
          <h3 className="text-h3 text-foreground mb-2">How to fix</h3>
          <p className="text-body text-muted-foreground mb-2">{issue.fix.description}</p>
        </div>

        {/* Suggested Fix */}
        {issue.fix.code && (
          <div>
            <h3 className="text-h3 text-foreground mb-2">Suggested Fix</h3>
            <CodeBlock code={issue.fix.code} showCopy />
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card">
        <Button variant="ghost" size="sm" onClick={onPrev} disabled={!hasPrev} className="gap-1.5">
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} of {totalCount}
        </span>

        <Button variant="ghost" size="sm" onClick={onNext} disabled={!hasNext} className="gap-1.5">
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Ignore Issue Modal */}
      {showIgnoreModal && (
        <IgnoreIssueModal
          issue={issue}
          url={url}
          onClose={() => setShowIgnoreModal(false)}
          onIgnored={onIgnored}
        />
      )}
    </div>
  );
}
