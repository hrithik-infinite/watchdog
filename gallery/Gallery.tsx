import { Highlighter, RotateCw } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Severity } from '@/shared/types';
import AuditSelector from '@/sidepanel/components/AuditSelector';
import CopyDropdown from '@/sidepanel/components/CopyDropdown';
import EmptyState from '@/sidepanel/components/EmptyState';
import FilterBar from '@/sidepanel/components/FilterBar';
import Header from '@/sidepanel/components/Header';
import ImportReportButton from '@/sidepanel/components/ImportReportButton';
import IncompleteSection from '@/sidepanel/components/IncompleteSection';
import IssueDetail from '@/sidepanel/components/IssueDetail';
import IssueList from '@/sidepanel/components/IssueList';
import Onboarding from '@/sidepanel/components/Onboarding';
import ScanProgress from '@/sidepanel/components/ScanProgress';
import Settings from '@/sidepanel/components/Settings';
import Summary from '@/sidepanel/components/Summary';
import TopFixesCard from '@/sidepanel/components/TopFixesCard';
import { Badge } from '@/sidepanel/components/ui/badge';
import { Button } from '@/sidepanel/components/ui/button';
import { Card } from '@/sidepanel/components/ui/card';
import { Switch } from '@/sidepanel/components/ui/switch';
import { useScanStore } from '@/sidepanel/store';
import { MOCK_ISSUES, MOCK_SCAN_RESULT } from './mock';

const noop = () => {};

/** A 384px-wide side-panel-sized frame, matching the real Chrome side panel. */
function Frame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="w-[384px] h-[680px] bg-background rounded-2xl border border-border overflow-hidden flex flex-col shadow-2xl">
        {children}
      </div>
    </div>
  );
}

/** The composed results screen, mirroring App.tsx's list view layout. */
function ResultsScreen() {
  return (
    <div className="flex flex-col h-full bg-background">
      <Header
        showBackButton
        onBackClick={noop}
        onSettingsClick={noop}
        scanResult={MOCK_SCAN_RESULT}
      />
      <div className="flex items-center justify-between gap-2 px-4 py-2">
        <span className="text-xs text-muted-foreground truncate">Audited just now</span>
        <Button variant="outline" size="sm" onClick={noop} className="gap-1.5 shrink-0">
          <RotateCw className="h-4 w-4" />
          Rescan
        </Button>
      </div>
      <Card className="mx-4 my-2 p-3 gap-3">
        <div className="flex items-start justify-between gap-2">
          <Summary
            summary={MOCK_SCAN_RESULT.summary}
            onFilterBySeverity={noop}
            activeSeverity="all"
            auditType="accessibility"
          />
          <CopyDropdown
            issues={MOCK_ISSUES}
            scanResult={MOCK_SCAN_RESULT}
            auditType="accessibility"
          />
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
          <span className="flex items-center gap-2 text-sm text-foreground">
            <Highlighter className="h-4 w-4 text-muted-foreground" />
            Show all issues on the page
          </span>
          <Switch checked={false} onCheckedChange={noop} aria-label="Show all issues on the page" />
        </div>
      </Card>
      <TopFixesCard issues={MOCK_ISSUES} onSelectIssue={noop} />
      <FilterBar
        severityFilter="all"
        categoryFilter="all"
        searchQuery=""
        hideIgnored
        ignoredCount={0}
        onSeverityChange={noop}
        onCategoryChange={noop}
        onSearchChange={noop}
        onHideIgnoredChange={noop}
      />
      <IssueList
        issues={MOCK_ISSUES}
        selectedIssueId={null}
        onSelectIssue={noop}
        onHighlightIssue={noop}
        canHighlight
        autoHighlight={false}
      />
    </div>
  );
}

const SEVERITIES: Severity[] = ['critical', 'serious', 'moderate', 'minor'];
const PALETTE: { name: string; varName: string }[] = [
  { name: 'background', varName: '--color-background' },
  { name: 'card', varName: '--color-card' },
  { name: 'muted', varName: '--color-muted' },
  { name: 'border', varName: '--color-border' },
  { name: 'foreground', varName: '--color-foreground' },
  { name: 'muted-foreground', varName: '--color-muted-foreground' },
  { name: 'primary', varName: '--color-primary' },
  { name: 'critical', varName: '--color-critical' },
  { name: 'serious', varName: '--color-serious' },
  { name: 'moderate', varName: '--color-moderate' },
  { name: 'minor', varName: '--color-minor' },
];

export default function Gallery() {
  const persona = useScanStore((s) => s.settings.persona);
  const settings = useScanStore((s) => s.settings);
  const updateSettings = useScanStore((s) => s.updateSettings);

  return (
    <div className="min-h-screen bg-[#070709] text-foreground">
      {/* Toolbar */}
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 border-b border-border bg-background/95 px-6 py-3 backdrop-blur">
        <div>
          <h1 className="text-h2 text-foreground">WatchDog — UX Gallery</h1>
          <p className="text-sm text-muted-foreground">
            Graphite design system · every side-panel screen, rendered with mock data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Persona:</span>
          <Button
            variant={persona === 'site-owner' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => updateSettings({ persona: 'site-owner' })}
          >
            Site owner
          </Button>
          <Button
            variant={persona === 'developer' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => updateSettings({ persona: 'developer' })}
          >
            Developer
          </Button>
        </div>
      </header>

      <main className="flex flex-wrap items-start gap-8 p-6">
        {/* Home — keyed on persona so AuditSelector re-seeds its default selection */}
        <Frame label="Home — Audit selector">
          <div key={persona} className="flex flex-col h-full bg-background">
            <Header onSettingsClick={noop} scanResult={null} />
            <div className="flex justify-end px-4 pt-2">
              <ImportReportButton onImport={noop} />
            </div>
            <AuditSelector onStartScan={noop} onStartMultipleScan={noop} isScanning={false} />
          </div>
        </Frame>

        {/* First run */}
        <Frame label="First run — Onboarding">
          <div key={persona} className="flex flex-col h-full bg-background">
            <Onboarding onComplete={noop} />
          </div>
        </Frame>

        {/* Scanning — single audit (spinner) */}
        <Frame label="Scanning — single audit">
          <div className="flex flex-col h-full bg-background">
            <Header scanResult={MOCK_SCAN_RESULT} />
            <ScanProgress
              currentAuditType="accessibility"
              currentAuditIndex={0}
              totalAudits={1}
              onCancel={noop}
            />
          </div>
        </Frame>

        {/* Scanning — multi audit (determinate bar) */}
        <Frame label="Scanning — full audit (determinate)">
          <div className="flex flex-col h-full bg-background">
            <Header scanResult={MOCK_SCAN_RESULT} />
            <ScanProgress
              currentAuditType="seo"
              currentAuditIndex={2}
              totalAudits={6}
              auditTypes={[
                'accessibility',
                'performance',
                'seo',
                'security',
                'best-practices',
                'pwa',
              ]}
              onCancel={noop}
            />
          </div>
        </Frame>

        {/* Results */}
        <Frame label="Results — issue list">
          <ResultsScreen />
        </Frame>

        {/* Issue detail */}
        <Frame label="Issue detail — critical">
          <IssueDetail
            issue={MOCK_ISSUES[0]}
            url={MOCK_SCAN_RESULT.url}
            currentIndex={0}
            totalCount={MOCK_ISSUES.length}
            onBack={noop}
            onPrev={noop}
            onNext={noop}
            onHighlight={noop}
            onIgnored={noop}
            hasPrev={false}
            hasNext
            canHighlight
          />
        </Frame>

        {/* Issue detail — contrast (shows the colorblind-preview deep link) */}
        <Frame label="Issue detail — contrast">
          <IssueDetail
            issue={MOCK_ISSUES[1]}
            url={MOCK_SCAN_RESULT.url}
            currentIndex={1}
            totalCount={MOCK_ISSUES.length}
            onBack={noop}
            onPrev={noop}
            onNext={noop}
            onHighlight={noop}
            onIgnored={noop}
            hasPrev
            hasNext
            canHighlight
          />
        </Frame>

        {/* Settings — live (toggles update the shared store) */}
        <Frame label="Settings">
          <Settings settings={settings} onUpdate={updateSettings} onClose={noop} />
        </Frame>

        {/* Incomplete section */}
        <Frame label="Needs manual review">
          <div className="flex flex-col h-full bg-background overflow-y-auto">
            <IncompleteSection issues={MOCK_SCAN_RESULT.incomplete} />
          </div>
        </Frame>

        {/* Empty states */}
        <Frame label="Result — no issues">
          <div className="flex flex-col h-full bg-background">
            <Header showBackButton onBackClick={noop} onSettingsClick={noop} scanResult={null} />
            <EmptyState type="no-issues" auditLabel="Accessibility" onScan={noop} />
          </div>
        </Frame>

        <Frame label="Result — error">
          <div className="flex flex-col h-full bg-background">
            <Header showBackButton onBackClick={noop} onSettingsClick={noop} scanResult={null} />
            <EmptyState
              type="error"
              error="E003: The page needs a refresh before it can be scanned."
              onScan={noop}
            />
          </div>
        </Frame>

        {/* Design tokens / primitives */}
        <div className="flex flex-col gap-3 w-[384px]">
          <span className="text-sm font-medium text-foreground">Tokens &amp; primitives</span>
          <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
            <div>
              <p className="text-caption uppercase text-muted-foreground mb-2">Severity badges</p>
              <div className="flex flex-wrap gap-2">
                {SEVERITIES.map((s) => (
                  <Badge key={s} variant={s}>
                    {s[0].toUpperCase() + s.slice(1)}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <p className="text-caption uppercase text-muted-foreground mb-2">Buttons</p>
              <div className="flex flex-wrap gap-2">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link</Button>
              </div>
            </div>

            <div>
              <p className="text-caption uppercase text-muted-foreground mb-2">Palette</p>
              <div className="grid grid-cols-2 gap-2">
                {PALETTE.map((c) => (
                  <div key={c.name} className="flex items-center gap-2">
                    <span
                      className="h-6 w-6 rounded-md border border-border shrink-0"
                      style={{ backgroundColor: `var(${c.varName})` }}
                    />
                    <span className="text-xs text-muted-foreground truncate">{c.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
