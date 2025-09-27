import { ReplaceWorkingThemeWarning } from '@/components/dialogs/ReplaceWorkingThemeWarning';
import Header from '@/components/Header';
import Layout from '@/components/Layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useErrors } from '@/hooks/useErrors';
import { useWorkingThemeAutoApply } from '@/hooks/useWorkingThemeAutoApply';
import { useWorkingThemeState } from '@/hooks/useWorkingThemeState';
import { validateThemeJson } from '@/lib/themes';
import Editor from '@monaco-editor/react';
import { Check, Info, Loader2, Upload } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useBlocker } from 'react-router-dom';
import { useTheme } from 'theme-o-rama';

export default function JsonEditor() {
  const { addError } = useErrors();
  const { currentTheme } = useTheme();
  const { WorkingTheme, setWorkingThemeFromJson } = useWorkingThemeState();
  const { isWorkingThemeSelected } = useWorkingThemeAutoApply();

  // JSON editor state - only loads working theme on page navigation
  const [jsonEditorValue, setJsonEditorValue] = useState('');
  const [isApplyingJson, setIsApplyingJson] = useState(false);
  const [hasLoadedInitialTheme, setHasLoadedInitialTheme] = useState(false);
  const [validationState, setValidationState] = useState<
    'none' | 'valid' | 'invalid'
  >('none');

  // Unsaved changes tracking
  const [originalJsonValue, setOriginalJsonValue] = useState('');

  // Check if there are unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    return jsonEditorValue !== originalJsonValue;
  }, [jsonEditorValue, originalJsonValue]);

  // Navigation blocking
  const [showNavigationWarning, setShowNavigationWarning] = useState(false);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges() && currentLocation.pathname !== nextLocation.pathname,
  );

  // Handle navigation blocking
  useEffect(() => {
    if (blocker.state === 'blocked') {
      setShowNavigationWarning(true);
    }
  }, [blocker.state]);

  const handleConfirmNavigation = useCallback(() => {
    if (blocker.state === 'blocked') {
      blocker.proceed();
    }
    setShowNavigationWarning(false);
  }, [blocker]);

  const handleCancelNavigation = useCallback(() => {
    if (blocker.state === 'blocked') {
      blocker.reset();
    }
    setShowNavigationWarning(false);
  }, [blocker]);

  // Handler for applying JSON editor changes - completely replaces working theme
  const handleApplyJsonTheme = useCallback(() => {
    if (!jsonEditorValue || !jsonEditorValue.trim()) {
      addError({
        kind: 'invalid',
        reason: 'Please enter theme JSON',
      });
      return;
    }

    setIsApplyingJson(true);

    try {
      // First validate the JSON
      validateThemeJson(jsonEditorValue);

      // Replace the working theme completely with the JSON content
      // The useWorkingThemeAutoApply hook will automatically apply the changes
      setWorkingThemeFromJson(jsonEditorValue);

      // Update the original value to mark changes as saved
      setOriginalJsonValue(jsonEditorValue);

      // Reset validation state after successful apply
      setValidationState('none');
    } catch (err) {
      addError({
        kind: 'invalid',
        reason: `Invalid JSON format: ${err instanceof Error ? err.message : err}`,
      });
      console.error('Error applying theme:', err);
    } finally {
      setIsApplyingJson(false);
    }
  }, [jsonEditorValue, setWorkingThemeFromJson, addError]);

  // Handler for validating JSON editor content
  const handleValidateJson = useCallback(() => {
    if (!jsonEditorValue || !jsonEditorValue.trim()) {
      setValidationState('invalid');
      addError({
        kind: 'invalid',
        reason: 'Please enter theme JSON to validate',
      });
      return;
    }

    try {
      validateThemeJson(jsonEditorValue);
      setValidationState('valid');
    } catch (err) {
      setValidationState('invalid');
      addError({
        kind: 'invalid',
        reason: `Invalid JSON format. Please check your syntax. ${err}`,
      });
    }
  }, [jsonEditorValue, addError]);

  // Handler for when user edits JSON
  const handleJsonEditorChange = useCallback((value: string) => {
    setJsonEditorValue(value);
    // Reset validation state when user makes changes
    setValidationState('none');
  }, []);

  // Load theme JSON only once when component mounts
  // Show working theme if editable, otherwise show current theme
  useEffect(() => {
    if (!hasLoadedInitialTheme) {
      const workingThemeJson = JSON.stringify(WorkingTheme, null, 2);
      if (isWorkingThemeSelected && workingThemeJson) {
        setJsonEditorValue(workingThemeJson);
        setOriginalJsonValue(workingThemeJson);
      } else if (currentTheme) {
        const currentThemeJson = JSON.stringify(currentTheme, null, 2);
        setJsonEditorValue(currentThemeJson);
        setOriginalJsonValue(currentThemeJson);
      }
      setHasLoadedInitialTheme(true);
    }
  }, [
    currentTheme,
    hasLoadedInitialTheme,
    isWorkingThemeSelected,
    WorkingTheme,
  ]);

  try {
    return (
      <Layout>
        <Header title='JSON Editor' />

        <div className='flex-1 overflow-auto'>
          <div className='container mx-auto p-6 space-y-6'>
            {/* Readonly Notice */}
            {!isWorkingThemeSelected && (
              <Alert>
                <Info className='h-4 w-4' />
                <AlertDescription>
                  You are viewing an example theme. Switch to the working theme
                  to make edits.
                </AlertDescription>
              </Alert>
            )}

            {/* JSON Editor */}
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>JSON Editor</CardTitle>
                <CardDescription>
                  {isWorkingThemeSelected
                    ? 'Edit your theme directly in JSON format. Changes are applied when you click Apply.'
                    : 'View the current theme in JSON format. Switch to the working theme to edit.'}
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <Label htmlFor='theme-json'>Theme JSON</Label>
                  <div className='flex items-center gap-2'>
                    <Button
                      onClick={handleValidateJson}
                      variant='outline'
                      disabled={
                        !isWorkingThemeSelected || !jsonEditorValue?.trim()
                      }
                      className={`flex items-center gap-2 ${
                        validationState === 'valid'
                          ? 'border-green-500 text-green-600 hover:bg-green-50'
                          : validationState === 'invalid'
                            ? 'border-red-500 text-red-600 hover:bg-red-50'
                            : ''
                      }`}
                    >
                      <Check className='h-4 w-4' />
                      Validate
                    </Button>
                    <Button
                      onClick={handleApplyJsonTheme}
                      disabled={
                        !isWorkingThemeSelected ||
                        isApplyingJson ||
                        !jsonEditorValue?.trim()
                      }
                      className='flex items-center gap-2'
                    >
                      {isApplyingJson ? (
                        <>
                          <Loader2 className='h-4 w-4 animate-spin' />
                          Applying...
                        </>
                      ) : (
                        <>
                          <Upload className='h-4 w-4' />
                          Apply Theme
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <div
                  className={`w-full border border-gray-300 rounded ${!isWorkingThemeSelected ? 'opacity-75' : ''}`}
                >
                  <Editor
                    height='calc(100vh - 300px)'
                    defaultLanguage='json'
                    value={jsonEditorValue}
                    onChange={
                      isWorkingThemeSelected
                        ? (value) => handleJsonEditorChange(value || '')
                        : undefined
                    }
                    options={{
                      readOnly: !isWorkingThemeSelected,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 12,
                      fontFamily:
                        'Monaco, Menlo, Ubuntu Mono, Consolas, source-code-pro, monospace',
                      tabSize: 2,
                      insertSpaces: true,
                      wordWrap: 'on',
                      automaticLayout: true,
                      formatOnPaste: true,
                      formatOnType: true,
                      bracketPairColorization: { enabled: true },
                      folding: true,
                      lineNumbers: 'on',
                      renderWhitespace: 'selection',
                      selectOnLineNumbers: true,
                      roundedSelection: false,
                      cursorStyle: 'line',
                      contextmenu: true,
                      mouseWheelZoom: true,
                      smoothScrolling: true,
                      theme: 'vs',
                    }}
                    theme='vs'
                    loading={
                      <div className='flex items-center justify-center h-32'>
                        Loading editor...
                      </div>
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Navigation Warning Dialog */}
        <ReplaceWorkingThemeWarning
          open={showNavigationWarning}
          onOpenChange={setShowNavigationWarning}
          title='Unsaved Changes'
          description='You have unsaved changes in the JSON editor. If you navigate away now, your changes will be lost. Are you sure you want to continue?'
          confirmText='Discard Changes'
          onConfirm={handleConfirmNavigation}
          onCancel={handleCancelNavigation}
        />
      </Layout>
    );
  } catch (error) {
    console.error('Error rendering JSON editor:', error);
    return (
      <Layout>
        <Header title='JSON Editor' />
        <div className='flex-1 overflow-auto'>
          <div className='container mx-auto p-6'>
            <Alert variant='destructive'>
              <Info className='h-4 w-4' />
              <AlertDescription>
                Error rendering JSON editor:{' '}
                {error instanceof Error ? error.message : 'Unknown error'}
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </Layout>
    );
  }
}
