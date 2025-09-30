import { IMAGE_STORAGE_KEYS } from '@/lib/constants';
import { imageStorage } from '@/lib/imageStorage';
import { hslToRgb, makeValidFileName, rgbToHsl } from '@/lib/utils';
import { Theme, useTheme } from 'theme-o-rama';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type InheritsType = 'light' | 'dark' | 'color' | undefined;
type MostLikeType = 'light' | 'dark' | undefined;

interface WorkingThemeState {
  WorkingTheme: Theme;
  setTheme: (theme: Theme) => void;
  setThemeDisplayName: (displayName: string) => void;
  setInherits: (inherits: InheritsType) => void;
  setMostLike: (mostLike: MostLikeType) => void;
  clearWorkingTheme: () => Promise<void>;
  deriveThemeName: () => string;
  setWorkingThemeFromCurrent: (currentTheme: Theme) => void;
  setWorkingThemeFromJson: (json: string) => void;
  setThemeColor: ({ r, g, b }: { r: number; g: number; b: number }) => void;
  getThemeColor: () => { r: number; g: number; b: number };
  setBackgroundImage: (url: string | File | null) => Promise<void>;
  getBackgroundImage: () => Promise<string | null>;
  setBackdropFilters: (enabled: boolean) => void;
  getBackdropFilters: () => boolean;
  refreshBlobUrls: () => Promise<void>;
  refreshBackgroundImageUrl: () => Promise<void>;
}

export const DESIGN_THEME_NAME = 'theme-a-roo-custom-theme';

// Function to refresh blob URLs after store rehydration
async function refreshBlobUrls(state: WorkingThemeState) {
  try {
    const backgroundImage = state.WorkingTheme.backgroundImage;

    // Check if we have an old blob URL
    if (backgroundImage && backgroundImage.startsWith('blob:')) {
      // Don't revoke the old URL - just get a fresh one and update if different
      const freshBlobUrl = await imageStorage.getImageUrl(
        IMAGE_STORAGE_KEYS.BACKGROUND_IMAGE,
      );

      if (freshBlobUrl && freshBlobUrl !== backgroundImage) {
        // Only update if we got a different URL
        state.setTheme({
          ...state.WorkingTheme,
          backgroundImage: freshBlobUrl,
        });
      }
      // If freshBlobUrl is null, the image was deleted from IndexedDB, so clear it
      else if (!freshBlobUrl) {
        state.setTheme({
          ...state.WorkingTheme,
          backgroundImage: undefined,
        });
      }
      // If URLs are the same, no update needed
    }
  } catch (error) {
    console.error('Failed to refresh blob URLs:', error);
  }
}

const DEFAULT_THEME = {
  name: DESIGN_THEME_NAME,
  displayName: 'Design',
  schemaVersion: 1,
  inherits: 'light' as const,
  mostLike: 'light' as const,
  colors: {
    background: 'lightgray',
    foreground: '#2C323C',
    themeColor: 'hsl(92, 20%, 42%)',
    primary: '#324053',
    primaryForeground: '#dfff75',
    secondary: '#b4bfdf',
    secondaryForeground: '#2C323C',
    muted: '#dbecfb',
    mutedForeground: '#2C323C',
    accent: '#dfff75',
    accentForeground: '#2C323C',
    destructive: '#ef4343',
    destructiveForeground: '#fafafa',
  },
};

const useWorkingThemeStateStore = create<WorkingThemeState>()(
  persist(
    (set, get) => ({
      WorkingTheme: DEFAULT_THEME,
      setTheme: (theme: Theme) => set({ WorkingTheme: theme }),
      setThemeDisplayName: (displayName: string) =>
        set((state) => ({
          WorkingTheme: { ...state.WorkingTheme, displayName },
        })),
      setInherits: (inherits: InheritsType) =>
        set((state) => ({ WorkingTheme: { ...state.WorkingTheme, inherits } })),
      setMostLike: (mostLike: MostLikeType) =>
        set((state) => ({ WorkingTheme: { ...state.WorkingTheme, mostLike } })),
      clearWorkingTheme: async () => {
        // Revoke blob URL before clearing
        const currentBackgroundImage = get().WorkingTheme.backgroundImage;
        if (
          currentBackgroundImage &&
          currentBackgroundImage.startsWith('blob:')
        ) {
          imageStorage.revokeImageUrl(currentBackgroundImage);
        }

        // Clear IndexedDB background image
        try {
          await imageStorage.deleteImage(IMAGE_STORAGE_KEYS.BACKGROUND_IMAGE);
        } catch (error) {
          console.warn(
            'Failed to clear background image from IndexedDB:',
            error,
          );
        }
        set({ WorkingTheme: DEFAULT_THEME });
      },
      deriveThemeName: () => {
        return makeValidFileName(get().WorkingTheme.displayName);
      },
      setWorkingThemeFromCurrent: (currentTheme: Theme) => {
        const workingThemeCopy = {
          ...currentTheme,
          name: DESIGN_THEME_NAME,
          displayName: currentTheme.displayName || 'New Theme',
        };
        set({ WorkingTheme: workingThemeCopy });
      },
      setWorkingThemeFromJson: (json: string) => {
        try {
          const parsedTheme = JSON.parse(json) as Theme;
          const workingThemeCopy = {
            ...parsedTheme,
            name: DESIGN_THEME_NAME,
            displayName: parsedTheme.displayName || 'Imported Theme',
          };
          set({ WorkingTheme: workingThemeCopy });
        } catch (error) {
          console.error('Error parsing theme JSON:', error);
          throw new Error('Invalid theme JSON format');
        }
      },
      setThemeColor: ({ r, g, b }: { r: number; g: number; b: number }) => {
        const hsl = rgbToHsl(r, g, b);
        set((state) => ({
          WorkingTheme: {
            ...state.WorkingTheme,
            colors: {
              ...state.WorkingTheme.colors,
              themeColor: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
            },
          },
        }));
      },
      getThemeColor: () => {
        const rgb = hslToRgb(
          get().WorkingTheme.colors?.themeColor || 'hsl(92, 20%, 42%)',
        );
        return rgb || { r: 220, g: 30, b: 15 };
      },
      setBackgroundImage: async (url: string | File | null) => {
        const currentBackgroundImage = get().WorkingTheme.backgroundImage;

        if (
          url &&
          (url instanceof File ||
            (typeof url === 'string' && url.startsWith('data:')))
        ) {
          try {
            await imageStorage.storeImage(
              IMAGE_STORAGE_KEYS.BACKGROUND_IMAGE,
              url,
            );
            const blobUrl = await imageStorage.getImageUrl(
              IMAGE_STORAGE_KEYS.BACKGROUND_IMAGE,
            );

            // Only revoke the old URL if we're actually replacing it with a new one
            if (
              currentBackgroundImage &&
              currentBackgroundImage.startsWith('blob:') &&
              currentBackgroundImage !== blobUrl
            ) {
              imageStorage.revokeImageUrl(currentBackgroundImage);
            }

            set((state) => ({
              WorkingTheme: {
                ...state.WorkingTheme,
                backgroundImage: blobUrl || undefined,
                colors: {
                  ...state.WorkingTheme.colors,
                  background: blobUrl ? 'transparent' : undefined,
                },
              },
            }));
          } catch (error) {
            console.error(
              'Failed to store background image in IndexedDB:',
              error,
            );
            // Re-throw the error so it surfaces to the user
            throw new Error(
              `Failed to store background image: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
          }
        } else if (url === null) {
          // Only revoke URL when explicitly deleting the image
          if (
            currentBackgroundImage &&
            currentBackgroundImage.startsWith('blob:')
          ) {
            imageStorage.revokeImageUrl(currentBackgroundImage);
          }

          // Delete from IndexedDB
          try {
            await imageStorage.deleteImage(IMAGE_STORAGE_KEYS.BACKGROUND_IMAGE);
          } catch (error) {
            console.error(
              'Failed to delete background image from IndexedDB:',
              error,
            );
          }

          set((state) => ({
            WorkingTheme: {
              ...state.WorkingTheme,
              backgroundImage: undefined,
              colors: {
                ...state.WorkingTheme.colors,
                background: undefined,
              },
            },
          }));
        } else {
          // Setting a non-blob URL (like http/https)
          set((state) => ({
            WorkingTheme: {
              ...state.WorkingTheme,
              backgroundImage: typeof url === 'string' ? url : undefined,
              colors: {
                ...state.WorkingTheme.colors,
                background: typeof url === 'string' ? 'transparent' : undefined,
              },
            },
          }));
        }
      },
      getBackgroundImage: async () => {
        const backgroundImage = get().WorkingTheme.backgroundImage;
        return backgroundImage || null;
      },
      setBackdropFilters: (enabled: boolean) => {
        set((state) => ({
          WorkingTheme: {
            ...state.WorkingTheme,
            colors: {
              ...state.WorkingTheme.colors,
              cardBackdropFilter: enabled
                ? 'blur(16px) saturate(180%) brightness(1.1)'
                : null,
              popoverBackdropFilter: enabled
                ? 'blur(20px) saturate(180%) brightness(1.1)'
                : null,
              inputBackdropFilter: enabled
                ? 'blur(8px) saturate(150%) brightness(1.05)'
                : null,
            },
            sidebar: {
              ...state.WorkingTheme.sidebar,
              backdropFilter: enabled
                ? 'blur(20px) saturate(180%) brightness(1.1)'
                : null,
            },
            tables: {
              ...state.WorkingTheme.tables,
              header: {
                ...state.WorkingTheme.tables?.header,
                backdropFilter: enabled
                  ? 'blur(8px) saturate(150%) brightness(1.05)'
                  : null,
              },
              row: {
                ...state.WorkingTheme.tables?.row,
                backdropFilter: enabled
                  ? 'blur(4px) saturate(120%) brightness(1.02)'
                  : null,
              },
              footer: {
                ...state.WorkingTheme.tables?.footer,
                backdropFilter: enabled
                  ? 'blur(8px) saturate(150%) brightness(1.05)'
                  : null,
              },
            },
          },
        }));
      },
      getBackdropFilters: () => {
        // This will be updated to use initialized theme in the hook
        const theme = get().WorkingTheme;
        return Boolean(
          theme.colors?.cardBackdropFilter ||
            theme.colors?.popoverBackdropFilter ||
            theme.colors?.inputBackdropFilter,
        );
      },
      refreshBlobUrls: async () => {
        await refreshBlobUrls(get());
      },
      refreshBackgroundImageUrl: async () => {
        const backgroundImage = get().WorkingTheme.backgroundImage;

        // Only refresh if we have a blob URL that might be stale
        if (backgroundImage && backgroundImage.startsWith('blob:')) {
          try {
            // Check if the image still exists in IndexedDB
            const storedImage = await imageStorage.getImage(
              IMAGE_STORAGE_KEYS.BACKGROUND_IMAGE,
            );

            if (!storedImage) {
              // Image was deleted from IndexedDB, clear it from store
              set((state) => ({
                WorkingTheme: {
                  ...state.WorkingTheme,
                  backgroundImage: undefined,
                },
              }));
            }
            // If image exists, keep using the existing blob URL - no need to create a new one
          } catch (error) {
            console.error('Failed to refresh background image URL:', error);
          }
        }
      },
    }),
    {
      name: 'working-theme-storage', // unique name for localStorage key
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            // Refresh blob URLs after rehydration
            refreshBlobUrls(state);
          }
        };
      },
    },
  ),
);

// Custom hook that combines the store with theme context
export const useWorkingThemeState = () => {
  const store = useWorkingThemeStateStore();
  const themeContext = useTheme();

  const getInitializedWorkingTheme = async (): Promise<Theme> => {
    if (store.WorkingTheme.name === DESIGN_THEME_NAME) {
      return await themeContext.initializeTheme(store.WorkingTheme);
    }

    return store.WorkingTheme;
  };

  const getBackdropFilters = async (): Promise<boolean> => {
    const initializedTheme = await getInitializedWorkingTheme();

    // Check all backdrop filter properties in the theme
    const hasBackdropFilters = Boolean(
      // Colors backdrop filters
      initializedTheme.colors?.cardBackdropFilter ||
        initializedTheme.colors?.popoverBackdropFilter ||
        initializedTheme.colors?.inputBackdropFilter ||
        // Sidebar backdrop filter
        initializedTheme.sidebar?.backdropFilter ||
        // Table backdrop filters
        initializedTheme.tables?.header?.backdropFilter ||
        initializedTheme.tables?.row?.backdropFilter ||
        initializedTheme.tables?.footer?.backdropFilter,
    );

    return hasBackdropFilters;
  };

  return {
    ...store,
    getInitializedWorkingTheme: getInitializedWorkingTheme,
    getBackdropFilters: getBackdropFilters,
  };
};
