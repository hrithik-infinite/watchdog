import { useState } from 'react';
import { Download, FileJson, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
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
import type { ScanResult } from '@/shared/types';

interface ExportButtonProps {
  scanResult: ScanResult | null;
}

export default function ExportButton({ scanResult }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  if (!scanResult) {
    return null;
  }

  const handleExport = async (format: 'json' | 'csv' | 'html' | 'pdf') => {
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
          exportHTML(scanResult);
          break;
        case 'pdf':
          await exportPDF(scanResult);
          break;
      }
    } catch (error) {
      console.error(`Failed to export as ${format}:`, error);
    } finally {
      setIsExporting(false);
    }
  };

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
        <DropdownMenuItem
          onClick={() => handleExport('json')}
          disabled={isExporting}
          className="cursor-pointer"
        >
          <FileJson className="h-4 w-4 mr-2" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">JSON</span>
            <span className="text-xs text-muted-foreground">For CI/CD pipelines</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport('csv')}
          disabled={isExporting}
          className="cursor-pointer"
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">CSV</span>
            <span className="text-xs text-muted-foreground">For spreadsheets</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport('html')}
          disabled={isExporting}
          className="cursor-pointer"
        >
          <FileText className="h-4 w-4 mr-2" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">HTML</span>
            <span className="text-xs text-muted-foreground">Shareable report</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleExport('pdf')}
          disabled={isExporting}
          className="cursor-pointer"
        >
          <FileText className="h-4 w-4 mr-2" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">PDF</span>
            <span className="text-xs text-muted-foreground">With screenshot</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
