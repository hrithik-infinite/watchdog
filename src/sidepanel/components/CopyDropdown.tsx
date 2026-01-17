import { useState } from 'react';
import { ClipboardCopy, Check, ChevronDown, FileText, Code, Github } from 'lucide-react';
import { Button } from '@/sidepanel/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/sidepanel/components/ui/dropdown-menu';
import {
  issuesToMarkdown,
  issuesToPlainText,
  issuesToGitHubMarkdown,
  copyToClipboard,
} from '@/sidepanel/lib/export';
import type { Issue, ScanResult } from '@/shared/types';
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={className}
          disabled={issueCount === 0}
        >
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
        <DropdownMenuItem onClick={() => handleCopy('markdown')} className="cursor-pointer">
          <Code className="h-4 w-4 mr-2" />
          <span>Copy as Markdown</span>
          {copied === 'markdown' && <Check className="h-3 w-3 ml-auto text-green-500" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleCopy('plain')} className="cursor-pointer">
          <FileText className="h-4 w-4 mr-2" />
          <span>Copy as Plain Text</span>
          {copied === 'plain' && <Check className="h-3 w-3 ml-auto text-green-500" />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleCopy('github')} className="cursor-pointer">
          <Github className="h-4 w-4 mr-2" />
          <span>Copy for GitHub</span>
          {copied === 'github' && <Check className="h-3 w-3 ml-auto text-green-500" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
