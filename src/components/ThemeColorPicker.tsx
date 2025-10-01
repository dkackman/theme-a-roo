import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useWorkingThemeAutoApply } from '@/hooks/useWorkingThemeAutoApply';
import { useWorkingThemeState } from '@/hooks/useWorkingThemeState';
import { rgbToHsl } from '@/lib/utils';
import { useState } from 'react';
import { RgbColorPicker } from 'react-colorful';

interface ThemeColorPickerProps {
  className?: string;
}

export function ThemeColorPicker({ className = '' }: ThemeColorPickerProps) {
  const { getThemeColor, setThemeColor, setBackgroundColor } =
    useWorkingThemeState();
  const { isWorkingThemeSelected } = useWorkingThemeAutoApply();
  const [applyToBackground, setApplyToBackground] = useState(false);

  const color = getThemeColor();
  const disabled = !isWorkingThemeSelected;

  const handleApplyToBackgroundChange = (checked: boolean) => {
    setApplyToBackground(checked);
    if (checked) {
      setBackgroundColor('var(--theme-color)');
    } else {
      setBackgroundColor(undefined);
    }
  };
  return (
    <div
      className={`space-y-4 ${className} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <div className='flex justify-center'>
        <RgbColorPicker
          color={color}
          onChange={disabled ? undefined : setThemeColor}
          style={{ width: '200px', height: '200px' }}
        />
      </div>
      <div className='flex items-center justify-center space-x-2'>
        <Checkbox
          id='apply-to-background'
          checked={applyToBackground}
          onCheckedChange={handleApplyToBackgroundChange}
          disabled={disabled}
        />
        <Label htmlFor='apply-to-background' className='text-sm cursor-pointer'>
          Apply to background color
        </Label>
      </div>
      <div className='text-center'>
        <div
          className='w-16 h-16 mx-auto rounded-lg border-2 border-border shadow-sm'
          style={{
            backgroundColor: `rgba(${color.r}, ${color.g}, ${color.b})`,
          }}
        />
        <div className='mt-2 space-y-1'>
          <p className='text-sm text-muted-foreground'>
            RGBA({color.r}, {color.g}, {color.b})
          </p>
          <p className='text-sm text-muted-foreground'>
            {(() => {
              const hsl = rgbToHsl(color.r, color.g, color.b);
              return `HSL(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
            })()}
          </p>
        </div>
      </div>
    </div>
  );
}
