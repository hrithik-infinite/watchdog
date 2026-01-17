import { ChevronLeft, ChevronRight, Info, Eye } from 'lucide-react';
import { Button } from '@/sidepanel/components/ui/button';
import { Badge } from '@/sidepanel/components/ui/badge';
import { Card, CardContent } from '@/sidepanel/components/ui/card';
import CodeBlock from './CodeBlock';
import type { Issue, Severity } from '@/shared/types';

interface IssueDetailProps {
  issue: Issue;
  currentIndex: number;
  totalCount: number;
  onBack: () => void;
  onPrev: () => void;
  onNext: () => void;
  onHighlight: () => void;
  hasPrev: boolean;
  hasNext: boolean;
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
  currentIndex,
  totalCount,
  onBack,
  onPrev,
  onNext,
  onHighlight,
  hasPrev,
  hasNext,
}: IssueDetailProps) {
  return (
    <div className="flex flex-col h-full animate-slide-in bg-background">
      {/* Header with prominent back button */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card/30">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="gap-1.5 text-primary border-primary/30 hover:bg-primary/10 font-medium"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </Button>
        <div className="flex-1" />
        <span className="text-xs text-muted-foreground">
          Issue {currentIndex + 1} of {totalCount}
        </span>
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

        {/* WCAG Info */}
        <Card className="bg-wcag-bg border-wcag-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary-light">WCAG Info</span>
            </div>
            <p className="text-foreground font-medium mb-1">
              WCAG {issue.wcag.id} (Level {issue.wcag.level})
            </p>
            <p className="text-sm text-muted-foreground">{issue.description}</p>
          </CardContent>
        </Card>

        {/* Current Element */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-h3 text-foreground">Current Element</h3>
            <Button variant="secondary" size="sm" onClick={onHighlight} className="gap-1.5">
              <Eye className="h-4 w-4" />
              Highlight
            </Button>
          </div>
          <CodeBlock code={issue.element.html} />
        </div>

        {/* How to Fix */}
        <div>
          <h3 className="text-h3 text-foreground mb-2">How to Fix</h3>
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
    </div>
  );
}
