import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import type { Settings as SettingsType, WCAGLevel } from '@/shared/types';

interface SettingsProps {
  settings: SettingsType;
  onUpdate: (settings: Partial<SettingsType>) => void;
  onClose: () => void;
}

export default function Settings({ settings, onUpdate, onClose }: SettingsProps) {
  const wcagLevels: WCAGLevel[] = ['A', 'AA', 'AAA'];

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
        <Button variant="ghost" onClick={onClose} className="gap-2 text-primary">
          <ChevronLeft className="h-5 w-5" />
          <span className="text-sm">Back</span>
        </Button>
      </div>

      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-h1 text-foreground">Settings</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* WCAG Level */}
        <div>
          <Label className="text-h3 text-foreground">WCAG Conformance Level</Label>
          <p className="text-caption text-muted-foreground mb-3">
            Filter issues based on WCAG conformance level requirements.
          </p>
          <div className="flex gap-2">
            {wcagLevels.map((level) => (
              <Button
                key={level}
                variant={settings.wcagLevel === level ? 'default' : 'secondary'}
                onClick={() => onUpdate({ wcagLevel: level })}
                className="flex-1"
              >
                Level {level}
              </Button>
            ))}
          </div>
        </div>

        {/* Show Incomplete */}
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="space-y-1">
              <Label className="text-h3 text-foreground">Show Incomplete Issues</Label>
              <p className="text-caption text-muted-foreground">
                Include issues that need manual review.
              </p>
            </div>
            <Switch
              checked={settings.showIncomplete}
              onCheckedChange={(checked) => onUpdate({ showIncomplete: checked })}
            />
          </CardContent>
        </Card>

        {/* Auto Highlight */}
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="space-y-1">
              <Label className="text-h3 text-foreground">Auto-highlight on Hover</Label>
              <p className="text-caption text-muted-foreground">
                Highlight elements when hovering over issues.
              </p>
            </div>
            <Switch
              checked={settings.autoHighlight}
              onCheckedChange={(checked) => onUpdate({ autoHighlight: checked })}
            />
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border">
        <p className="text-caption text-muted-foreground text-center">WatchDog v1.0.0</p>
      </div>
    </div>
  );
}
