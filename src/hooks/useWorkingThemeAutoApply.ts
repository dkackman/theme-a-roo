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

  // Apply the working theme at startup - always set working theme as the active theme
  useEffect(() => {
    if (!isLoading && WorkingTheme && !hasAppliedWorkingTheme.current) {
      // Always auto-apply the working theme on startup to ensure it's the active theme
      const workingThemeJson = JSON.stringify(getInitializedWorkingTheme());
      setCustomTheme(workingThemeJson);
      lastAppliedThemeHash.current = workingThemeJson;
      hasAppliedWorkingTheme.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]); // Only depend on isLoading to run once at startup

  // Auto-apply working theme changes when working theme is currently selected
  useEffect(() => {
    if (
      !isLoading &&
      currentTheme?.name === DESIGN_THEME_NAME &&
      hasAppliedWorkingTheme.current
    ) {
      const workingThemeJson = JSON.stringify(getInitializedWorkingTheme());

      // Only apply if the theme has actually changed to prevent recursion
      if (workingThemeJson !== lastAppliedThemeHash.current) {
        setCustomTheme(workingThemeJson);
        lastAppliedThemeHash.current = workingThemeJson;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [WorkingTheme]); // Only depend on WorkingTheme changes

  return {
    isWorkingThemeSelected: currentTheme?.name === DESIGN_THEME_NAME,
  };
};
