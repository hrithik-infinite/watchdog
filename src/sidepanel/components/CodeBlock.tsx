import { useState } from 'react';
import { CheckIcon, CopyIcon } from './icons';

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
    <div className="relative bg-[#2C2C2E] rounded-lg overflow-hidden">
      <pre className="p-4 text-xs overflow-x-auto">
        <code className="text-[#66B2FF] font-mono whitespace-pre-wrap break-words">{code}</code>
      </pre>
      {showCopy && (
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 flex items-center gap-1.5 px-3 py-1.5 bg-[#3A3A3C] hover:bg-[#4A4A4C] rounded-lg text-[#007AFF] text-xs transition-colors"
        >
          {copied ? (
            <>
              <CheckIcon className="w-3.5 h-3.5" />
              Copied!
            </>
          ) : (
            <>
              <CopyIcon className="w-3.5 h-3.5" />
              Copy Fix
            </>
          )}
        </button>
      )}
    </div>
  );
}
