import type { LucideIcon } from 'lucide-react';
import {
  AlertCircle,
  Braces,
  Code,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Printer,
  Share2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import type { ScanResult } from '@/shared/types';
import { Button } from '@/sidepanel/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/sidepanel/components/ui/dropdown-menu';
import { exportCSV, exportHTML, exportJSON, exportPDF } from '@/sidepanel/lib/export';
import { useIsSiteOwner } from '@/sidepanel/lib/persona';
import { useScanStore } from '@/sidepanel/store';

type ExportFormat = 'json' | 'csv' | 'html' | 'pdf';

interface ExportButtonProps {
  scanResult: ScanResult | null;
}

export default function ExportButton({ scanResult }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  // Surface export failures (err-10). Previously a throw — e.g. pdf-lib's WinAnsi
  // font rejecting a non-Latin character — was only console.error'd, so the user
  // clicked Export and saw nothing happen. Hold the last failure to show inline.
  const [error, setError] = useState<string | null>(null);
  const auditType = useScanStore((state) => state.selectedAuditType);
  const isSiteOwner = useIsSiteOwner();

  if (!scanResult) {
    return null;
  }

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    setError(null);

    try {
      switch (format) {
        case 'json':
          exportJSON(scanResult);
          break;
        case 'csv':
          exportCSV(scanResult);
          break;
        case 'html':
          exportHTML(scanResult, auditType);
          break;
        case 'pdf':
          await exportPDF(scanResult, auditType);
          break;
      }
    } catch (err) {
      console.error(`Failed to export as ${format}:`, err);
      const detail = err instanceof Error ? err.message : '';
      setError(
        `Couldn't export as ${format.toUpperCase()}.${detail ? ` ${detail}` : ' Please try again.'}`
      );
    } finally {
      setIsExporting(false);
    }
  };

  const renderFormat = (
    format: ExportFormat,
    Icon: LucideIcon,
    title: string,
    description: string,
    ext?: string
  ) => (
    <DropdownMenuItem
      onClick={() => handleExport(format)}
      disabled={isExporting}
      className="cursor-pointer gap-2 py-2"
    >
      <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-muted shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </span>
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
      {ext && <span className="text-mono text-xs text-muted-foreground shrink-0">{ext}</span>}
    </DropdownMenuItem>
  );

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={isExporting} className="gap-1.5 text-primary">
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Exporting...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span className="text-sm">Export</span>
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel>Export report</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {isSiteOwner ? (
            <>
              {/* Site-owner: lead with the shareable, non-technical formats and
                  tuck the developer data formats under an "Advanced" section. */}
              {renderFormat(
                'html',
                Share2,
                'Share report',
                'A clean summary you can send to your team.'
              )}
              {renderFormat(
                'pdf',
                Printer,
                'Printable report',
                'A formatted PDF to print or save.'
              )}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Advanced</DropdownMenuLabel>
              {renderFormat('json', Braces, 'JSON', 'Full axe output + run metadata.', '.json')}
              {renderFormat('csv', FileSpreadsheet, 'CSV', 'One row per issue × node.', '.csv')}
            </>
          ) : (
            <>
              {renderFormat('json', Braces, 'JSON', 'Full axe output + run metadata.', '.json')}
              {renderFormat('csv', FileSpreadsheet, 'CSV', 'One row per issue × node.', '.csv')}
              {renderFormat('html', Code, 'HTML', 'Self-contained, shareable report.', '.html')}
              {renderFormat('pdf', FileText, 'PDF', 'Formatted for print / archive.', '.pdf')}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Absolutely positioned so a failure message never shifts the header
          toolbar layout. role="alert" so it's announced to screen readers. */}
      {error && (
        <div
          role="alert"
          className="absolute right-0 top-full z-50 mt-1 flex w-64 items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/15 p-2 text-xs text-destructive shadow-[var(--shadow-elev-2)]"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1 break-words">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Dismiss export error"
            className="flex-shrink-0 rounded-md p-0.5 text-destructive hover:bg-destructive/20"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
