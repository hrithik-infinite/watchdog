import { ChevronLeft, RotateCcw } from 'lucide-react';
import type { Settings as SettingsType, VisionMode } from '@/shared/types';
import { Button } from '@/sidepanel/components/ui/button';
import { Label } from '@/sidepanel/components/ui/label';
import { Segmented } from '@/sidepanel/components/ui/segmented';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/sidepanel/components/ui/select';
import { Switch } from '@/sidepanel/components/ui/switch';
import { usePageOverlays } from '@/sidepanel/hooks/usePageOverlays';

interface SettingsProps {
  settings: SettingsType;
  onUpdate: (settings: Partial<SettingsType>) => void;
  onClose: () => void;
}

export default function Settings({ settings, onUpdate, onClose }: SettingsProps) {
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

  // Vision-simulator and focus-order application live in a shared hook so the
  // results-view "Experience" controls and the contrast deep-link apply them the
  // same way (persist + inject-on-demand + message the page).
  const { setVisionMode: handleVisionModeChange, setFocusOrder: handleFocusOrderToggle } =
    usePageOverlays();

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header — back control and title on a single row */}
      <div className="flex items-center gap-2 px-2 py-2 border-b border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="gap-1 -ml-1 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </Button>
        <h2 className="text-h2 text-foreground">Settings</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Experience (persona) — the spine of the Site-owner repositioning. */}
        <div>
          <p className="text-caption uppercase text-muted-foreground mb-2">Experience</p>
          <Segmented
            options={[
              { value: 'site-owner', label: 'Site owner' },
              { value: 'developer', label: 'Developer' },
            ]}
            value={settings.persona}
            onChange={(p) => onUpdate({ persona: p })}
            ariaLabel="Experience mode"
          />
          <p className="text-sm text-muted-foreground mt-2">
            Plain-language results and step-by-step fixes. Switch to Developer for code previews and
            JSON/CSV/HTML exports.
          </p>
        </div>

        {/* WCAG Level */}
        <div>
          <p className="text-caption uppercase text-muted-foreground mb-2">
            WCAG Conformance Level
          </p>
          <Segmented
            options={[
              { value: 'A', label: 'A' },
              { value: 'AA', label: 'AA' },
              { value: 'AAA', label: 'AAA' },
            ]}
            value={settings.wcagLevel}
            onChange={(l) => onUpdate({ wcagLevel: l })}
            ariaLabel="WCAG conformance level"
          />
          <p className="text-sm text-muted-foreground mt-2">
            AA is the common legal target. Raising this adds stricter checks to every accessibility
            scan.
          </p>
        </div>

        {/* Display — grouped toggle rows divided by hairlines. */}
        <div>
          <p className="text-caption uppercase text-muted-foreground mb-2">Display</p>
          <div className="rounded-xl border border-border">
            {/* Show Incomplete */}
            <div className="flex items-center justify-between gap-4 p-4">
              <div className="space-y-1">
                <Label id="setting-show-incomplete" className="text-foreground font-medium block">
                  Show Incomplete Issues
                </Label>
                <p className="text-sm text-muted-foreground">
                  Include issues that need manual review.
                </p>
              </div>
              {/* aria-labelledby (not htmlFor): a <label for> gives no accessible
                  name to a role="switch" button — only ARIA naming does. */}
              <Switch
                aria-labelledby="setting-show-incomplete"
                checked={settings.showIncomplete}
                onCheckedChange={(checked) => onUpdate({ showIncomplete: checked })}
              />
            </div>

            {/* Auto Highlight */}
            <div className="flex items-center justify-between gap-4 p-4 border-t border-border">
              <div className="space-y-1">
                <Label id="setting-auto-highlight" className="text-foreground font-medium block">
                  Auto-highlight on Hover
                </Label>
                <p className="text-sm text-muted-foreground">
                  Highlight elements when hovering over issues.
                </p>
              </div>
              <Switch
                aria-labelledby="setting-auto-highlight"
                checked={settings.autoHighlight}
                onCheckedChange={(checked) => onUpdate({ autoHighlight: checked })}
              />
            </div>

            {/* Focus Order Visualization */}
            <div className="flex items-center justify-between gap-4 p-4 border-t border-border">
              <div className="space-y-1">
                <Label id="setting-focus-order" className="text-foreground font-medium block">
                  Focus Order Visualization
                </Label>
                <p className="text-sm text-muted-foreground">
                  Show numbered badges on all focusable elements to visualize keyboard tab order.
                </p>
              </div>
              <Switch
                aria-labelledby="setting-focus-order"
                checked={settings.showFocusOrder}
                onCheckedChange={handleFocusOrderToggle}
              />
            </div>
          </div>
        </div>

        {/* Vision Simulators */}
        <div>
          <p className="text-caption uppercase text-muted-foreground mb-2">Vision Simulators</p>
          <p className="text-sm text-muted-foreground mb-3">
            Applied as an overlay on the live page — not this panel.
          </p>
          <div className="space-y-4">
            {/* Color Vision Deficiency Simulator */}
            <div>
              <Label id="setting-colorblind" className="text-foreground font-medium mb-2 block">
                Color Vision Deficiency
              </Label>
              <Select value={colorBlindValue} onValueChange={handleVisionModeChange}>
                <SelectTrigger aria-labelledby="setting-colorblind" className="h-auto min-h-[40px]">
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
              <Label id="setting-blur" className="text-foreground font-medium mb-2 block">
                Low Vision (Blur)
              </Label>
              <Select value={blurValue} onValueChange={handleVisionModeChange}>
                <SelectTrigger aria-labelledby="setting-blur" className="h-auto min-h-[40px]">
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
          </div>
        </div>
      </div>

      {/* Footer — link left, version right */}
      <div className="px-4 py-4 border-t border-border flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onUpdate({ hasSeenOnboarding: false });
            onClose();
          }}
          className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4" />
          Replay welcome tour
        </Button>
        <p className="text-caption text-muted-foreground">WatchDog v1.0.1</p>
      </div>
    </div>
  );
}
