import Header from '@/components/Header';
import Layout from '@/components/Layout';
import { ThemeActions } from '@/components/ThemeActions';
import { ThemeCard } from '@/components/ThemeCard';
import { ThemeSelector } from '@/components/ThemeSelector';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useWorkingThemeAutoApply } from '@/hooks/useWorkingThemeAutoApply';
import { useWorkingThemeState } from '@/hooks/useWorkingThemeState';
import { STORAGE_KEYS } from '@/lib/constants';
import {
  Captions,
  ChevronDown,
  ChevronUp,
  Loader2,
  Palette,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Theme, useTheme } from 'theme-o-rama';

export default function Themes() {
  const { currentTheme, setCustomTheme, isLoading } = useTheme();
  const { getInitializedWorkingTheme, WorkingTheme } = useWorkingThemeState();
  const { isWorkingThemeSelected, setManuallyApplying } =
    useWorkingThemeAutoApply();

  const [isActionsPanelMinimized, setIsActionsPanelMinimized] =
    useState<boolean>(false);
  const [workingTheme, setWorkingTheme] = useState<Theme | null>(null);

  // Load actions panel minimized state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem(
      STORAGE_KEYS.ACTIONS_PANEL_MINIMIZED,
    );
    if (savedState !== null) {
      setIsActionsPanelMinimized(JSON.parse(savedState));
    }
  }, []);

  // Save actions panel minimized state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.ACTIONS_PANEL_MINIMIZED,
      JSON.stringify(isActionsPanelMinimized),
    );
  }, [isActionsPanelMinimized]);

  // Load working theme asynchronously and update when WorkingTheme changes
  useEffect(() => {
    const loadWorkingTheme = async () => {
      try {
        const theme = await getInitializedWorkingTheme();
        setWorkingTheme(theme);
      } catch (error) {
        console.error('Failed to load working theme:', error);
      }
    };

    loadWorkingTheme();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [WorkingTheme]); // Update when WorkingTheme changes (reset, inherits, mostLike, etc.)

  const handleApplyWorkingTheme = async () => {
    // Signal that we're manually applying to prevent auto-apply conflicts
    setManuallyApplying(true);

    try {
      const theme = await getInitializedWorkingTheme();
      const workingThemeJson = JSON.stringify(theme);
      if (workingThemeJson && workingThemeJson.trim()) {
        // Apply the working theme using setCustomTheme
        await setCustomTheme(workingThemeJson);
      }
    } catch (error) {
      console.error('Failed to apply working theme:', error);
    } finally {
      // Reset manual applying flag
      setManuallyApplying(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <Header title='Theme' />
        <div className='flex-1 overflow-auto'>
          <div className='container mx-auto p-6'>
            <div className='flex items-center justify-center p-8'>
              <Loader2 className='h-6 w-6 animate-spin' />
              <span className='ml-2'>Loading themes...</span>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!currentTheme) {
    return (
      <Layout>
        <Header title='Theme' />
        <div className='flex-1 overflow-auto'>
          <div className='container mx-auto p-6'>
            <div className='flex items-center justify-center p-8'>
              <span>No theme available</span>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  try {
    return (
      <Layout>
        <Header title='Themes' />

        <div className='flex-1 overflow-auto'>
          <div className={`container mx-auto p-6 space-y-8`}>
            {/* Actions Panel */}
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
                <div>
                  <CardTitle className='flex items-center gap-2'>
                    <Captions className='h-5 w-5' />
                    Actions
                  </CardTitle>
                  <CardDescription>
                    Manage your theme with these actions
                  </CardDescription>
                </div>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() =>
                    setIsActionsPanelMinimized(!isActionsPanelMinimized)
                  }
                  className='h-8 w-8 p-0'
                >
                  {isActionsPanelMinimized ? (
                    <ChevronDown className='h-4 w-4' />
                  ) : (
                    <ChevronUp className='h-4 w-4' />
                  )}
                </Button>
              </CardHeader>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isActionsPanelMinimized
                    ? 'max-h-0 opacity-0'
                    : 'max-h-[1000px] opacity-100'
                }`}
              >
                <CardContent>
                  <ThemeActions />
                </CardContent>
              </div>
            </Card>

            <Card>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <div>
                    <CardTitle className='flex items-center gap-2'>
                      <Palette className='h-5 w-5' />
                      Choose a Theme
                    </CardTitle>
                    <CardDescription>
                      Pick up where you left off or start with one of these
                      example themes
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className='space-y-6'>
                  {/* Working Theme Card */}
                  <div>
                    <h3 className='text-sm font-medium mb-3'>
                      Work in Progress
                    </h3>
                    {workingTheme && (
                      <ThemeCard
                        theme={workingTheme}
                        currentTheme={currentTheme}
                        isSelected={isWorkingThemeSelected}
                        onSelect={() => handleApplyWorkingTheme()}
                      />
                    )}
                  </div>

                  <ThemeSelector />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  } catch (error) {
    console.error('Error rendering theme page:', error);
    return (
      <Layout>
        <Header title='Themes' />
        <div className='flex-1 overflow-auto'>
          <div className='container mx-auto p-6'>
            <div className='flex items-center justify-center p-8'>
              <span>Error rendering theme page</span>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
}
