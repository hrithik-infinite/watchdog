import type {
  Issue,
  ScanResult,
  ScanSummary,
  Severity,
  Category,
  WCAGCriteria,
} from '@/shared/types';
import type { AuditType } from '@/shared/messaging';
import { MVP_RULES, RULE_CATEGORIES, SEVERITY_MAP, WCAG_CRITERIA } from '@/shared/constants';
import { generateFix } from '@/shared/fixes';
import { scanPerformance } from './performance-scanner';
import { scanSEO } from './seo-scanner';
import { scanSecurity } from './security-scanner';
import { scanBestPractices } from './best-practices-scanner';
import { scanPWA } from './pwa-scanner';
import logger from '@/shared/logger';

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

async function scanAccessibility(): Promise<ScanResult> {
  logger.info('Starting accessibility scan');
  const startTime = performance.now();

  // Lazy load axe-core
  logger.debug('Loading axe-core');
  const axe = await getAxe();

  // Configure axe to only run our 15 rules
  logger.debug('Running axe scan', { ruleCount: MVP_RULES.length });
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

  logger.info('Accessibility scan complete', {
    duration: `${duration.toFixed(0)}ms`,
    violations: issues.length,
    incomplete: incomplete.length,
  });

  return {
    url: window.location.href,
    timestamp: Date.now(),
    duration,
    issues,
    incomplete,
    summary: generateSummary(issues),
  };
}

export async function scanPage(auditType: AuditType): Promise<ScanResult> {
  logger.group(`Content Script: ${auditType} scan`);
  logger.info('Scan requested', { auditType, url: window.location.href });

  try {
    let result: ScanResult;

    switch (auditType) {
      case 'accessibility':
        result = await scanAccessibility();
        break;
      case 'performance':
        result = await scanPerformance();
        break;
      case 'seo':
        result = await scanSEO();
        break;
      case 'security':
        result = await scanSecurity();
        break;
      case 'best-practices':
        result = await scanBestPractices();
        break;
      case 'pwa':
        result = await scanPWA();
        break;
      case 'mobile':
      case 'links':
      case 'i18n':
      case 'privacy':
        throw new Error(`${auditType} audit is not yet implemented`);
      default:
        throw new Error(`Unknown audit type: ${auditType}`);
    }

    logger.info('Scan finished', {
      auditType,
      issues: result.issues.length,
      duration: `${result.duration.toFixed(0)}ms`,
    });

    return result;
  } catch (error) {
    logger.error('Scan failed', { auditType, error });
    throw error;
  } finally {
    logger.groupEnd();
  }
}
