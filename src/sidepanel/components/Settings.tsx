import { ChevronLeft } from 'lucide-react';
import { Button } from '@/sidepanel/components/ui/button';
import { Switch } from '@/sidepanel/components/ui/switch';
import { Card, CardContent } from '@/sidepanel/components/ui/card';
import { Label } from '@/sidepanel/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/sidepanel/components/ui/select';
import type { Settings as SettingsType, WCAGLevel, VisionMode } from '@/shared/types';
import { getCurrentTab } from '@/shared/messaging';

interface SettingsProps {
  settings: SettingsType;
  onUpdate: (settings: Partial<SettingsType>) => void;
  onClose: () => void;
}

export default function Settings({ settings, onUpdate, onClose }: SettingsProps) {
  const wcagLevels: WCAGLevel[] = ['A', 'AA', 'AAA'];

  const colorBlindModes: { value: VisionMode; label: string; description: string }[] = [
    { value: 'none', label: 'None', description: 'Normal color vision' },
    { value: 'protanopia', label: 'Protanopia', description: 'Red-blind (1% of males)' },
    { value: 'deuteranopia', label: 'Deuteranopia', description: 'Green-blind (1% of males)' },
    { value: 'tritanopia', label: 'Tritanopia', description: 'Blue-blind (rare)' },
    { value: 'achromatopsia', label: 'Achromatopsia', description: 'Total color blindness' },
  ];

  const blurModes: { value: VisionMode; label: string; description: string }[] = [
    { value: 'none', label: 'None', description: 'Normal vision' },
    { value: 'blur-low', label: 'Mild Blur', description: '20/40 vision (mild impairment)' },
    {
      value: 'blur-medium',
      label: 'Moderate Blur',
      description: '20/70 vision (moderate impairment)',
    },
    { value: 'blur-high', label: 'Severe Blur', description: '20/200 vision (legal blindness)' },
  ];

  // Determine current mode type
  const isColorBlindMode =
    settings.visionMode !== 'none' && !settings.visionMode.startsWith('blur');
  const isBlurMode = settings.visionMode !== 'none' && settings.visionMode.startsWith('blur');
  const colorBlindValue = isColorBlindMode ? settings.visionMode : 'none';
  const blurValue = isBlurMode ? settings.visionMode : 'none';

  const handleVisionModeChange = async (mode: VisionMode) => {
    onUpdate({ visionMode: mode });

    // Apply filter to the current tab
    try {
      const tab = await getCurrentTab();
      if (tab?.id) {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'APPLY_VISION_FILTER',
          payload: { mode },
        });
      }
    } catch (error) {
      console.error('Failed to apply vision filter:', error);
    }
  };

  const handleFocusOrderToggle = async (checked: boolean) => {
    onUpdate({ showFocusOrder: checked });

    // Toggle focus order visualization on the current tab
    try {
      const tab = await getCurrentTab();
      if (tab?.id) {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'TOGGLE_FOCUS_ORDER',
          payload: { show: checked },
        });
      }
    } catch (error) {
      console.error('Failed to toggle focus order:', error);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-2 p-2 border-b border-border">
        <Button variant="ghost" size="sm" onClick={onClose} className="gap-1 text-primary -ml-2">
          <ChevronLeft className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </Button>
      </div>

      <div className="p-2 border-b border-border">
        <h2 className="text-h2 text-foreground">Settings</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* WCAG Level */}
        <div>
          <Label className="text-h3 text-foreground mb-2 block">WCAG Conformance Level</Label>
          <p className="text-sm text-muted-foreground mb-3">
            Filter issues based on WCAG conformance level requirements.
          </p>
          <div className="flex gap-2 mt-3">
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
            <div className="space-y-1 pr-4">
              <Label className="text-h3 text-foreground block">Show Incomplete Issues</Label>
              <p className="text-sm text-muted-foreground">
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
            <div className="space-y-1 pr-4">
              <Label className="text-h3 text-foreground block">Auto-highlight on Hover</Label>
              <p className="text-sm text-muted-foreground">
                Highlight elements when hovering over issues.
              </p>
            </div>
            <Switch
              checked={settings.autoHighlight}
              onCheckedChange={(checked) => onUpdate({ autoHighlight: checked })}
            />
          </CardContent>
        </Card>

        {/* Color Vision Deficiency Simulator */}
        <div>
          <Label className="text-h3 text-foreground mb-2 block">Color Vision Deficiency</Label>
          <p className="text-sm text-muted-foreground mb-3">
            Simulate colorblindness to test if your colors are distinguishable.
          </p>
          <Select value={colorBlindValue} onValueChange={handleVisionModeChange}>
            <SelectTrigger className="h-auto min-h-[40px]">
              <SelectValue placeholder="Select colorblind mode">
                {colorBlindModes.find((m) => m.value === colorBlindValue)?.label || 'None'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-w-[320px]">
              {colorBlindModes.map((mode) => (
                <SelectItem key={mode.value} value={mode.value} className="py-2 cursor-pointer">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">{mode.label}</span>
                    <span className="text-xs text-muted-foreground leading-tight">
                      {mode.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Low Vision (Blur) Simulator */}
        <div>
          <Label className="text-h3 text-foreground mb-2 block">Low Vision (Blur)</Label>
          <p className="text-sm text-muted-foreground mb-3">
            Simulate visual impairment to test readability and layout clarity.
          </p>
          <Select value={blurValue} onValueChange={handleVisionModeChange}>
            <SelectTrigger className="h-auto min-h-[40px]">
              <SelectValue placeholder="Select blur level">
                {blurModes.find((m) => m.value === blurValue)?.label || 'None'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-w-[320px]">
              {blurModes.map((mode) => (
                <SelectItem key={mode.value} value={mode.value} className="py-2 cursor-pointer">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">{mode.label}</span>
                    <span className="text-xs text-muted-foreground leading-tight">
                      {mode.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Focus Order Visualization */}
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="space-y-1 pr-4">
              <Label className="text-h3 text-foreground block">Focus Order Visualization</Label>
              <p className="text-sm text-muted-foreground">
                Show numbered badges on all focusable elements to visualize keyboard tab order.
              </p>
            </div>
            <Switch checked={settings.showFocusOrder} onCheckedChange={handleFocusOrderToggle} />
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-border">
        <p className="text-caption text-muted-foreground text-center">WatchDog v1.0.0</p>
      </div>
    </div>
  );
}
