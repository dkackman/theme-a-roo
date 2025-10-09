import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTheme } from 'theme-o-rama';
import {
  DESIGN_THEME_NAME,
  useWorkingThemeState,
} from './useWorkingThemeState';

export const useWorkingThemeAutoApply = () => {
  const { currentTheme, setCustomTheme, isLoading } = useTheme();
  const { WorkingTheme, getInitializedWorkingTheme } = useWorkingThemeState();

  const hasAppliedWorkingTheme = useRef(false);
  const lastAppliedThemeHash = useRef<string>('');
  const isManuallyApplying = useRef(false);

  // Apply the working theme at startup - only on first app load when no theme is selected
  useEffect(() => {
    const applyWorkingTheme = async () => {
      if (
        !isLoading &&
        WorkingTheme &&
        !hasAppliedWorkingTheme.current &&
        !isManuallyApplying.current
      ) {
        // Auto-apply the working theme on first app load when no theme is selected
        // This ensures the app always has a theme at startup
        if (!currentTheme) {
          try {
            const initializedTheme = await getInitializedWorkingTheme();
            const workingThemeJson = JSON.stringify(initializedTheme);
            await setCustomTheme(workingThemeJson);
            lastAppliedThemeHash.current = workingThemeJson;
            hasAppliedWorkingTheme.current = true;
          } catch (error) {
            console.error('Failed to apply working theme at startup:', error);
          }
        }
      }
    };

    applyWorkingTheme();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]); // Only depend on isLoading to run once at startup

  // Auto-apply working theme changes when working theme is currently selected
  useEffect(() => {
    const applyWorkingThemeChanges = async () => {
      if (
        !isLoading &&
        currentTheme?.name === DESIGN_THEME_NAME &&
        !isManuallyApplying.current
      ) {
        try {
          const initializedTheme = await getInitializedWorkingTheme();
          const workingThemeJson = JSON.stringify(initializedTheme);

          // Only apply if the theme has actually changed to prevent recursion
          if (workingThemeJson !== lastAppliedThemeHash.current) {
            await setCustomTheme(workingThemeJson);
            lastAppliedThemeHash.current = workingThemeJson;
          }
        } catch (error) {
          console.error('Failed to apply working theme changes:', error);
        }
      }
    };

    applyWorkingThemeChanges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [WorkingTheme, isLoading]); // Depend on WorkingTheme changes when not manually applying

  const isWorkingThemeSelected = currentTheme?.name === DESIGN_THEME_NAME;

  const setManuallyApplying = useCallback((applying: boolean) => {
    isManuallyApplying.current = applying;
  }, []);

  // Memoize the return value to prevent creating new object references on every render
  return useMemo(
    () => ({
      isWorkingThemeSelected,
      setManuallyApplying,
    }),
    [isWorkingThemeSelected, setManuallyApplying],
  );
};
