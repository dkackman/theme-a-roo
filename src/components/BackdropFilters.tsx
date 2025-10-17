import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useWorkingThemeAutoApply } from '@/hooks/useWorkingThemeAutoApply';
import { useWorkingThemeState } from '@/hooks/useWorkingThemeState';
import { useEffect, useState } from 'react';

export function BackdropFilters() {
  const {
    WorkingTheme,
    setBackdropFilters: setBackdropFiltersHook,
    getBackgroundImage,
  } = useWorkingThemeState();
  const { isExampleTheme } = useWorkingThemeAutoApply();

  const [backdropFilters, setBackdropFilters] = useState<boolean>(false);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Check backdrop filters synchronously from WorkingTheme
        const hasBackdropFilters = Boolean(
          WorkingTheme.colors?.cardBackdropFilter ||
            WorkingTheme.colors?.popoverBackdropFilter ||
            WorkingTheme.colors?.inputBackdropFilter ||
            WorkingTheme.sidebar?.backdropFilter ||
            WorkingTheme.tables?.header?.backdropFilter ||
            WorkingTheme.tables?.row?.backdropFilter ||
            WorkingTheme.tables?.footer?.backdropFilter,
        );

        const backgroundImageResult = await getBackgroundImage();

        setBackdropFilters(hasBackdropFilters);
        setBackgroundImage(backgroundImageResult);
      } catch (error) {
        console.error('Failed to load backdrop filters data:', error);
        // Set default values on error
        setBackdropFilters(false);
        setBackgroundImage(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [WorkingTheme, getBackgroundImage]);

  const disabled = isExampleTheme || !backgroundImage || isLoading;

  return (
    <div className='space-y-3'>
      <div className='flex items-center space-x-2'>
        <Checkbox
          id='backdropFilters'
          checked={backdropFilters}
          onCheckedChange={
            disabled
              ? () => undefined
              : (checked) => {
                  setBackdropFiltersHook(checked === true);
                  setBackdropFilters(checked === true);
                }
          }
          disabled={disabled}
        />
        <Label
          htmlFor='backdropFilters'
          className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
        >
          Enable backdrop filters
        </Label>
      </div>
      <p className='text-xs text-muted-foreground'>
        {isLoading
          ? 'Loading...'
          : !backgroundImage
            ? 'Requires a background image to enable backdrop filters'
            : 'Adds blur effect to cards, popups, and other UI elements'}
      </p>
    </div>
  );
}
