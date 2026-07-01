import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/sidepanel/components/ui/button';
import { cn } from '@/sidepanel/lib/utils';

interface CodeBlockProps {
  code: string;
  showCopy?: boolean;
}

// A block is rendered as a diff when every non-empty line is a +/-/context line
// and at least one is an actual change. Lets a contrast fix show "- old / + new"
// without a separate prop.
function isDiffBlock(lines: string[]): boolean {
  return (
    lines.some((l) => l.startsWith('+') || l.startsWith('-')) &&
    lines.every((l) => l === '' || /^[+\- ]/.test(l))
  );
}

export default function CodeBlock({ code, showCopy = false }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const lines = code.split('\n');
  const diff = isDiffBlock(lines);
  // For a diff, copying yields just the proposed (+) lines, stripped of the
  // marker — the snippet you actually paste in.
  const copyText = diff
    ? lines
        .filter((l) => l.startsWith('+'))
        .map((l) => l.replace(/^\+\s?/, ''))
        .join('\n') || code
    : code;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="relative bg-input rounded-xl overflow-hidden border border-border">
      <pre className={`p-4 text-xs overflow-x-auto ${showCopy ? 'pr-24' : ''}`}>
        {diff ? (
          <code className="text-mono whitespace-pre-wrap break-words block">
            {lines.map((line, i) => {
              const added = line.startsWith('+');
              const removed = line.startsWith('-');
              return (
                <span
                  // biome-ignore lint/suspicious/noArrayIndexKey: diff lines are static, position is the identity
                  key={i}
                  className={cn(
                    '-mx-1 block rounded px-1',
                    added && 'bg-success/15 text-success',
                    removed && 'bg-destructive/15 text-destructive',
                    !added && !removed && 'text-foreground'
                  )}
                >
                  {line || ' '}
                </span>
              );
            })}
          </code>
        ) : (
          <code className="text-mono text-foreground whitespace-pre-wrap break-words">{code}</code>
        )}
      </pre>
      {showCopy && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="absolute top-2 right-2 h-7 gap-1.5 text-primary bg-card/80 backdrop-blur-sm hover:bg-card"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy Fix
            </>
          )}
        </Button>
      )}
    </div>
  );
}
