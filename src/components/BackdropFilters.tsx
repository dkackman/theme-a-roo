import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useWorkingThemeAutoApply } from '@/hooks/useWorkingThemeAutoApply';
import { useWorkingThemeState } from '@/hooks/useWorkingThemeState';
import { useEffect, useState } from 'react';

export function BackdropFilters() {
  const {
    getBackdropFilters,
    setBackdropFilters: setBackdropFiltersHook,
    getBackgroundImage,
  } = useWorkingThemeState();
  const { isWorkingThemeSelected } = useWorkingThemeAutoApply();

  const [backdropFilters, setBackdropFilters] = useState<boolean>(false);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [backdropFiltersResult, backgroundImageResult] =
          await Promise.all([getBackdropFilters(), getBackgroundImage()]);
        setBackdropFilters(backdropFiltersResult);
        setBackgroundImage(backgroundImageResult);
      } catch (error) {
        console.error('Failed to load backdrop filters data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [getBackdropFilters, getBackgroundImage]);

  const disabled = !isWorkingThemeSelected || !backgroundImage || isLoading;

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
