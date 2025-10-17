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
import { parseColor, rgbaToHex } from '@/lib/color';
import { validateThemeJson } from '@/lib/themes';
import jsonSchema from '@/schema.json';
import Editor from '@monaco-editor/react';
import { Check, Info, Loader2, Upload } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useBlocker } from 'react-router-dom';
import { useTheme } from 'theme-o-rama';

export default function JsonEditor() {
  const { addError } = useErrors();
  const { currentTheme } = useTheme();
  const { WorkingTheme, setWorkingThemeFromJson } = useWorkingThemeState();
  const { isExampleTheme } = useWorkingThemeAutoApply();

  // JSON editor state - only loads working theme on page navigation
  const [jsonEditorValue, setJsonEditorValue] = useState('');
  const [isApplyingJson, setIsApplyingJson] = useState(false);
  const [hasLoadedInitialTheme, setHasLoadedInitialTheme] = useState(false);
  const [validationState, setValidationState] = useState<
    'none' | 'valid' | 'invalid'
  >('none');

  // Unsaved changes tracking
  const [originalJsonValue, setOriginalJsonValue] = useState('');

  // Monaco Editor initialization tracking
  const monacoInitializedRef = useRef(false);

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
      if (!isExampleTheme && workingThemeJson) {
        setJsonEditorValue(workingThemeJson);
        setOriginalJsonValue(workingThemeJson);
      } else if (currentTheme) {
        const currentThemeJson = JSON.stringify(currentTheme, null, 2);
        setJsonEditorValue(currentThemeJson);
        setOriginalJsonValue(currentThemeJson);
      }
      setHasLoadedInitialTheme(true);
    }
  }, [currentTheme, hasLoadedInitialTheme, isExampleTheme, WorkingTheme]);

  try {
    return (
      <Layout>
        <Header title='JSON Editor' />

        <div className='flex-1 overflow-auto'>
          <div className='container mx-auto p-6 space-y-6'>
            {/* Readonly Notice */}
            {isExampleTheme && (
              <Alert>
                <Info className='h-4 w-4' />
                <AlertDescription>
                  You are viewing an example theme. Switch to your own theme to
                  make edits.
                </AlertDescription>
              </Alert>
            )}

            {/* JSON Editor */}
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>JSON Editor</CardTitle>
                <CardDescription>
                  {isExampleTheme
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
                      disabled={isExampleTheme || !jsonEditorValue?.trim()}
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
                        isExampleTheme ||
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
                  className={`w-full border border-gray-300 rounded ${isExampleTheme ? 'opacity-75' : ''}`}
                >
                  <Editor
                    theme={currentTheme?.mostLike === 'dark' ? 'vs-dark' : 'vs'}
                    beforeMount={(monaco) => {
                      // Only initialize Monaco once to prevent duplicate color providers
                      if (monacoInitializedRef.current) {
                        return;
                      }
                      monacoInitializedRef.current = true;

                      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
                        validate: true,
                        schemas: [
                          {
                            uri: 'http://myserver/my-schema.json',
                            fileMatch: ['*'],
                            schema: jsonSchema,
                          },
                        ],
                      });
                      monaco.languages.json.jsonDefaults.setModeConfiguration({
                        documentFormattingEdits: true,
                        documentRangeFormattingEdits: true,
                        completionItems: true,
                        hovers: true,
                        documentSymbols: true,
                        tokens: true,
                        colors: true, // Enable color picker
                        foldingRanges: true,
                        diagnostics: true,
                        selectionRanges: true,
                      });
                      // Only register color provider once to prevent duplicates on navigation
                      if (
                        !(
                          window as unknown as {
                            __jsonColorProviderRegistered?: boolean;
                          }
                        ).__jsonColorProviderRegistered
                      ) {
                        monaco.languages.registerColorProvider('json', {
                          provideDocumentColors(model) {
                            const colors: {
                              color: {
                                red: number;
                                green: number;
                                blue: number;
                                alpha: number;
                              };
                              range: {
                                startLineNumber: number;
                                startColumn: number;
                                endLineNumber: number;
                                endColumn: number;
                              };
                            }[] = [];
                            const text = model.getValue();

                            // Match quoted strings that could be colors (hex, rgb, rgba, hsl, hsla, or named colors)
                            // This regex matches any quoted string, then we'll validate with parseColor
                            const colorRegex = /"([^"]+)"/g;
                            let match;

                            while ((match = colorRegex.exec(text)) !== null) {
                              const colorString = match[1];

                              // Skip obviously non-color strings to improve performance
                              // Only check strings that could plausibly be colors
                              if (
                                colorString.length > 50 ||
                                (colorString.includes(' ') &&
                                  !colorString.match(/^(rgb|hsl)/i)) ||
                                colorString.includes('/') ||
                                colorString.includes('\\')
                              ) {
                                continue;
                              }

                              const startPos = model.getPositionAt(
                                match.index + 1,
                              ); // +1 to skip opening quote
                              const endPos = model.getPositionAt(
                                match.index + match[1].length + 1,
                              );

                              // Use our robust parseColor function to validate and parse
                              const color = parseColor(colorString);
                              if (color) {
                                colors.push({
                                  color: color,
                                  range: {
                                    startLineNumber: startPos.lineNumber,
                                    startColumn: startPos.column,
                                    endLineNumber: endPos.lineNumber,
                                    endColumn: endPos.column,
                                  },
                                });
                              }
                            }

                            return colors;
                          },
                          provideColorPresentations(_, colorInfo) {
                            const color = colorInfo.color;
                            const hex = rgbaToHex(color);
                            const rgb = `rgba(${Math.round(color.red * 255)}, ${Math.round(color.green * 255)}, ${Math.round(color.blue * 255)}, ${color.alpha})`;

                            return [
                              {
                                label: hex,
                                textEdit: {
                                  range: colorInfo.range,
                                  text: hex,
                                },
                              },
                              {
                                label: rgb,
                                textEdit: {
                                  range: colorInfo.range,
                                  text: rgb,
                                },
                              },
                            ];
                          },
                        });
                        (
                          window as unknown as {
                            __jsonColorProviderRegistered?: boolean;
                          }
                        ).__jsonColorProviderRegistered = true;
                      }
                    }}
                    height='calc(100vh - 300px)'
                    defaultLanguage='json'
                    value={jsonEditorValue}
                    onChange={
                      isExampleTheme
                        ? (value) => handleJsonEditorChange(value || '')
                        : undefined
                    }
                    options={{
                      readOnly: isExampleTheme,
                      minimap: { enabled: true },
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
                      roundedSelection: true,
                      cursorStyle: 'line',
                      contextmenu: true,
                      mouseWheelZoom: true,
                      smoothScrolling: true,
                    }}
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
