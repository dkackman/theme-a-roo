import { useEffect, useRef } from 'react';
import { useTheme } from 'theme-o-rama';
import {
  DESIGN_THEME_NAME,
  useWorkingThemeState,
} from './useWorkingThemeState';

/**
 * Custom hook that automatically applies working theme changes when the working theme is selected.
 * This prevents the need to duplicate the auto-apply logic across multiple pages.
 */
export const useWorkingThemeAutoApply = () => {
  const { currentTheme, setCustomTheme, isLoading } = useTheme();
  const { WorkingTheme, getInitializedWorkingTheme } = useWorkingThemeState();

  const hasAppliedWorkingTheme = useRef(false);
  const lastAppliedThemeHash = useRef<string>('');

  // Apply the working theme at startup - only on first app load when no theme is selected
  useEffect(() => {
    if (!isLoading && WorkingTheme && !hasAppliedWorkingTheme.current) {
      // Auto-apply the working theme on first app load when no theme is selected
      // This ensures the app always has a theme at startup
      if (!currentTheme) {
        const workingThemeJson = JSON.stringify(getInitializedWorkingTheme());
        setCustomTheme(workingThemeJson);
        lastAppliedThemeHash.current = workingThemeJson;
        hasAppliedWorkingTheme.current = true;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]); // Only depend on isLoading to run once at startup

  // Auto-apply working theme changes when working theme is currently selected
  useEffect(() => {
    if (!isLoading && currentTheme?.name === DESIGN_THEME_NAME) {
      const workingThemeJson = JSON.stringify(getInitializedWorkingTheme());

      // Only apply if the theme has actually changed to prevent recursion
      if (workingThemeJson !== lastAppliedThemeHash.current) {
        setCustomTheme(workingThemeJson);
        lastAppliedThemeHash.current = workingThemeJson;
        hasAppliedWorkingTheme.current = true;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [WorkingTheme, currentTheme?.name]); // Depend on WorkingTheme changes and current theme name

  return {
    isWorkingThemeSelected: currentTheme?.name === DESIGN_THEME_NAME,
  };
};
