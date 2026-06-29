/**
 * "Open report" control (feat-compet-8) — the cheapest credible sharing story
 * without a backend: reopen a JSON report someone exported. A hidden file input
 * driven by a visible button; parse errors are shown inline rather than taking
 * over the screen.
 */

import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/sidepanel/components/ui/button';
import { parseReport } from '@/sidepanel/lib/import-report';
import type { ScanResult } from '@/shared/types';

interface ImportReportButtonProps {
  onImport: (result: ScanResult) => void;
  className?: string;
}

export default function ImportReportButton({ onImport, className }: ImportReportButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    try {
      onImport(parseReport(await file.text()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't open that report.");
    }
  };

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = ''; // let the same file be re-opened
        }}
      />
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-4 w-4" />
        Open report
      </Button>
      {error && (
        <p role="alert" className="text-xs text-destructive mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
