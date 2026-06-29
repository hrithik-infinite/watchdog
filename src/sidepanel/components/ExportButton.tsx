import { useState } from 'react';
import { Download, FileJson, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/sidepanel/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/sidepanel/components/ui/dropdown-menu';
import { exportJSON, exportCSV, exportHTML, exportPDF } from '@/sidepanel/lib/export';
import { useScanStore } from '@/sidepanel/store';
import { useIsSiteOwner } from '@/sidepanel/lib/persona';
import type { ScanResult } from '@/shared/types';

type ExportFormat = 'json' | 'csv' | 'html' | 'pdf';

interface ExportButtonProps {
  scanResult: ScanResult | null;
}

export default function ExportButton({ scanResult }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const auditType = useScanStore((state) => state.selectedAuditType);
  const isSiteOwner = useIsSiteOwner();

  if (!scanResult) {
    return null;
  }

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);

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
    } catch (error) {
      console.error(`Failed to export as ${format}:`, error);
    } finally {
      setIsExporting(false);
    }
  };

  const renderFormat = (
    format: ExportFormat,
    Icon: LucideIcon,
    title: string,
    description: string
  ) => (
    <DropdownMenuItem
      onClick={() => handleExport(format)}
      disabled={isExporting}
      className="cursor-pointer"
    >
      <Icon className="h-4 w-4 mr-2" />
      <div className="flex flex-col">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
    </DropdownMenuItem>
  );

  return (
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
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isSiteOwner ? (
          <>
            {/* Site-owner: lead with the shareable, non-technical formats and
                tuck the developer formats under an "Advanced" section. */}
            {renderFormat('html', FileText, 'Share report', 'Open in any web browser')}
            {renderFormat('pdf', FileText, 'Printable report', 'Save or print a copy')}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Advanced</DropdownMenuLabel>
            {renderFormat('json', FileJson, 'JSON', 'For CI/CD pipelines')}
            {renderFormat('csv', FileSpreadsheet, 'CSV', 'For spreadsheets')}
          </>
        ) : (
          <>
            {renderFormat('json', FileJson, 'JSON', 'For CI/CD pipelines')}
            {renderFormat('csv', FileSpreadsheet, 'CSV', 'For spreadsheets')}
            {renderFormat('html', FileText, 'HTML', 'Shareable report')}
            <DropdownMenuSeparator />
            {renderFormat('pdf', FileText, 'PDF', 'Printable report')}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
