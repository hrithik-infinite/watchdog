import type { Issue, ScanResult, ScanSummary, Severity, Category, WCAGCriteria } from '@/shared/types';
import { MVP_RULES, RULE_CATEGORIES, SEVERITY_MAP, WCAG_CRITERIA } from '@/shared/constants';
import { generateFix } from '@/shared/fixes';

// Lazy load axe-core only when needed
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let axeInstance: any = null;

async function getAxe() {
  if (!axeInstance) {
    const module = await import('axe-core');
    axeInstance = module.default;
  }
  return axeInstance;
}

let idCounter = 0;

function generateId(): string {
  return `issue-${Date.now()}-${++idCounter}`;
}

function mapSeverity(impact: string | null | undefined): Severity {
  return SEVERITY_MAP[impact || 'minor'] || 'minor';
}

function mapCategory(ruleId: string): Category {
  return RULE_CATEGORIES[ruleId as keyof typeof RULE_CATEGORIES] || 'technical';
}

function extractWcag(ruleId: string): WCAGCriteria {
  const wcag = WCAG_CRITERIA[ruleId as keyof typeof WCAG_CRITERIA];
  if (wcag) {
    return {
      id: wcag.id,
      level: wcag.level,
      name: wcag.name,
      description: `WCAG ${wcag.id} - ${wcag.name}`,
    };
  }
  return {
    id: 'N/A',
    level: 'A',
    name: 'Unknown',
    description: 'Unknown criterion',
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformViolations(violations: any[]): Issue[] {
  const issues: Issue[] = [];

  for (const violation of violations) {
    for (const node of violation.nodes) {
      const selector = Array.isArray(node.target[0])
        ? (node.target[0] as string[]).join(' ')
        : (node.target[0] as string);

      const element = {
        selector,
        html: node.html,
        failureSummary: node.failureSummary,
      };

      issues.push({
        id: generateId(),
        ruleId: violation.id,
        severity: mapSeverity(violation.impact),
        category: mapCategory(violation.id),
        message: violation.help,
        description: violation.description,
        helpUrl: violation.helpUrl,
        wcag: extractWcag(violation.id),
        element,
        fix: generateFix(violation.id, element),
      });
    }
  }

  return issues;
}

function generateSummary(issues: Issue[]): ScanSummary {
  const bySeverity: Record<Severity, number> = {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0,
  };

  const byCategory: Record<Category, number> = {
    images: 0,
    interactive: 0,
    forms: 0,
    color: 0,
    document: 0,
    structure: 0,
    aria: 0,
    technical: 0,
  };

  for (const issue of issues) {
    bySeverity[issue.severity]++;
    byCategory[issue.category]++;
  }

  return {
    total: issues.length,
    bySeverity,
    byCategory,
  };
}

export async function scanPage(): Promise<ScanResult> {
  const startTime = performance.now();

  // Lazy load axe-core
  const axe = await getAxe();

  // Configure axe to only run our 15 rules
  const results = await axe.run(document, {
    runOnly: {
      type: 'rule',
      values: [...MVP_RULES],
    },
    resultTypes: ['violations', 'incomplete'],
  });

  const duration = performance.now() - startTime;

  const issues = transformViolations(results.violations);
  const incomplete = transformViolations(results.incomplete);

  return {
    url: window.location.href,
    timestamp: Date.now(),
    duration,
    issues,
    incomplete,
    summary: generateSummary(issues),
  };
}
