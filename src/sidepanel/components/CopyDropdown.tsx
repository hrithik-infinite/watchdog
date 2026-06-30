import { Check, ChevronDown, ClipboardCopy, Code, FileText } from 'lucide-react';
import { type ComponentType, useState } from 'react';
import type { Issue, ScanResult } from '@/shared/types';
import { GithubIcon } from '@/sidepanel/components/icons';
import { Button } from '@/sidepanel/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/sidepanel/components/ui/dropdown-menu';
import {
  copyToClipboard,
  issuesToGitHubMarkdown,
  issuesToMarkdown,
  issuesToPlainText,
} from '@/sidepanel/lib/export';
import { useIsSiteOwner } from '@/sidepanel/lib/persona';
import type { AuditType } from '@/sidepanel/store';

interface CopyDropdownProps {
  issues: Issue[];
  scanResult: ScanResult;
  auditType: AuditType;
  className?: string;
}

type CopyFormat = 'markdown' | 'plain' | 'github';

export default function CopyDropdown({
  issues,
  scanResult,
  auditType,
  className,
}: CopyDropdownProps) {
  const [copied, setCopied] = useState<CopyFormat | null>(null);
  const isSiteOwner = useIsSiteOwner();

  const handleCopy = async (format: CopyFormat) => {
    let text: string;

    switch (format) {
      case 'markdown':
        text = issuesToMarkdown(issues, scanResult, auditType);
        break;
      case 'plain':
        text = issuesToPlainText(issues, scanResult, auditType);
        break;
      case 'github':
        text = issuesToGitHubMarkdown(issues, scanResult, auditType);
        break;
    }

    const success = await copyToClipboard(text);
    if (success) {
      setCopied(format);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const issueCount = issues.length;
  const buttonLabel = copied ? 'Copied!' : `Copy All (${issueCount})`;

  const renderCopy = (
    format: CopyFormat,
    Icon: ComponentType<{ className?: string }>,
    label: string
  ) => (
    <DropdownMenuItem onClick={() => handleCopy(format)} className="cursor-pointer">
      <Icon className="h-4 w-4 mr-2" />
      <span>{label}</span>
      {copied === format && <Check className="h-3 w-3 ml-auto text-green-500" />}
    </DropdownMenuItem>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className} disabled={issueCount === 0}>
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <ClipboardCopy className="h-4 w-4" />
          )}
          <span className="ml-1.5">{buttonLabel}</span>
          <ChevronDown className="h-3 w-3 ml-1 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {isSiteOwner ? (
          <>
            {/* Site-owner: lead with the plain-text summary and tuck the
                developer formats under an "Advanced" section. */}
            {renderCopy('plain', FileText, 'Copy summary')}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Advanced</DropdownMenuLabel>
            {renderCopy('markdown', Code, 'Copy as Markdown')}
            {renderCopy('github', GithubIcon, 'Copy for GitHub')}
          </>
        ) : (
          <>
            {renderCopy('markdown', Code, 'Copy as Markdown')}
            {renderCopy('plain', FileText, 'Copy as Plain Text')}
            <DropdownMenuSeparator />
            {renderCopy('github', GithubIcon, 'Copy for GitHub')}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
