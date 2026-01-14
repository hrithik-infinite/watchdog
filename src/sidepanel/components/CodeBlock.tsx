import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CodeBlockProps {
  code: string;
  showCopy?: boolean;
}

export default function CodeBlock({ code, showCopy = false }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="relative bg-card rounded-lg overflow-hidden">
      <pre className="p-4 text-xs overflow-x-auto">
        <code className="text-primary-light font-mono whitespace-pre-wrap break-words">{code}</code>
      </pre>
      {showCopy && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="absolute top-2 right-2 h-7 gap-1.5 text-primary"
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
