import { PasteInput } from '@/components/PasteInput';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useWorkingThemeAutoApply } from '@/hooks/useWorkingThemeAutoApply';
import { useWorkingThemeState } from '@/hooks/useWorkingThemeState';
import { STORAGE_KEYS } from '@/lib/constants';
import { generateImage, isOpenAIInitialized } from '@/lib/opeanai';
import { saveDataUriAsFile, saveImageAsFile } from '@/lib/utils';
import { readClipboardText } from '@/lib/web-fallbacks';
import { Download, Link, Sparkles, Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

export function BackgroundImageEditor() {
  const {
    getThemeColor,
    getBackgroundImage,
    setBackgroundImage,
    refreshBackgroundImageUrl,
    WorkingTheme,
  } = useWorkingThemeState();
  const { isExampleTheme } = useWorkingThemeAutoApply();

  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(
    null,
  );
  const selectedColor = getThemeColor();
  const disabled = isExampleTheme;
  const isOpenAIReady = isOpenAIInitialized();
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [selectedImageModel, setSelectedImageModel] =
    useState<string>('dall-e-3');
  const [prompt, setPrompt] = useState<string>('');

  // Load values from localStorage on mount
  useEffect(() => {
    const savedImageModel = localStorage.getItem(STORAGE_KEYS.IMAGE_MODEL);
    const savedPrompt = localStorage.getItem(STORAGE_KEYS.DESIGN_PROMPT);

    if (savedImageModel) {
      setSelectedImageModel(savedImageModel);
    }
    if (savedPrompt) {
      setPrompt(savedPrompt);
    }
  }, []);

  // Save selectedImageModel to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.IMAGE_MODEL, selectedImageModel);
  }, [selectedImageModel]);

  // Save prompt to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DESIGN_PROMPT, prompt);
  }, [prompt]);

  // Load and update background image asynchronously
  useEffect(() => {
    const loadBackgroundImage = async () => {
      try {
        // First, try to refresh the blob URL if it exists
        await refreshBackgroundImageUrl();

        // Then get the current background image
        const imageUrl = await getBackgroundImage();
        setBackgroundImageUrl(imageUrl);
      } catch (error) {
        console.error('Failed to load background image:', error);
      }
    };

    loadBackgroundImage();
  }, [
    WorkingTheme.backgroundImage,
    getBackgroundImage,
    refreshBackgroundImageUrl,
  ]); // Only depend on WorkingTheme background image changes

  // Note: We don't cleanup blob URLs on component unmount because they're
  // persisted in the Zustand store and should survive navigation.
  // URLs are only revoked when actually replaced in useWorkingThemeState.

  const handleGenerateImage = async () => {
    if (!isOpenAIInitialized()) {
      toast.error('OpenAI is not initialized');
      return;
    }

    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsGeneratingImage(true);
    try {
      // Use the selected color if available, otherwise use a default
      const colorString = selectedColor
        ? `RGB(${selectedColor.r}, ${selectedColor.g}, ${selectedColor.b})`
        : 'RGB(27, 30, 51)'; // Default dark blue color
      const imageUrl = await generateImage(
        prompt,
        colorString,
        selectedImageModel,
      );

      if (imageUrl) {
        await setBackgroundImage(imageUrl);
      } else {
        toast.error('Failed to generate image');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Error generating image');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleClearBackgroundImage = async () => {
    await setBackgroundImage(null);
    const fileInput = document.getElementById(
      'background-image-upload',
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Pass the File object directly - no need to convert to data URI
      setBackgroundImage(file);
    }
    event.target.value = '';
  };

  const handlePasteUrl = async () => {
    if (!imageUrl.trim()) {
      toast.error('Please enter an image URL');
      return;
    }

    try {
      // Validate URL format
      new URL(imageUrl);
      await setBackgroundImage(imageUrl);
      setImageUrl(''); // Clear the input
    } catch (error) {
      console.error('Invalid URL:', error);
      toast.error('Please enter a valid image URL');
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await readClipboardText();

      if (text && text.trim()) {
        setImageUrl(text.trim());
      } else {
        toast.info('No text found in clipboard');
      }
    } catch (error) {
      console.error('Failed to read clipboard:', error);
      toast.error('Failed to read from clipboard');
    }
  };

  const handleSaveImage = () => {
    if (!backgroundImageUrl) {
      toast.error('No image to save');
      return;
    }

    try {
      // Generate a filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `background-image-${timestamp}.png`;

      if (backgroundImageUrl.startsWith('data:')) {
        saveDataUriAsFile(backgroundImageUrl, filename);
      } else {
        saveImageAsFile(backgroundImageUrl, filename);
      }
      toast.success('Image saved to your downloads folder.');
    } catch (error) {
      console.error('Error saving image:', error);
      toast.error('Failed to save image');
    }
  };

  return (
    <div className='space-y-6'>
      {/* Current Image Preview */}
      {backgroundImageUrl && (
        <div className='space-y-3'>
          <Label className='text-sm font-medium'>
            Current Background Image
          </Label>
          <div className='flex justify-center'>
            <div className='relative'>
              <img
                src={backgroundImageUrl}
                alt='Background image'
                className='max-w-full h-auto max-h-32 rounded-lg border border-border shadow-sm'
              />
              <Button
                variant='destructive'
                size='sm'
                onClick={handleClearBackgroundImage}
                className='absolute -top-2 -right-2 h-6 w-6 rounded-full p-0'
                disabled={disabled}
              >
                <X className='h-3 w-3' />
              </Button>
            </div>
          </div>
          <div className='flex justify-center'>
            <Button
              variant='outline'
              size='sm'
              onClick={handleSaveImage}
              disabled={disabled}
              className='flex items-center gap-2'
            >
              <Download className='h-4 w-4' />
              Download Image
            </Button>
          </div>
          <Separator />
        </div>
      )}

      {/* Three Ways to Add Image */}
      <div className='space-y-6'>
        <div className='text-center'>
          <p className='text-sm text-muted-foreground'>
            Choose one of these three methods
          </p>
        </div>

        {/* Method 1: Paste URL */}
        <div className='space-y-3 p-4 border rounded-lg'>
          <div className='flex items-center gap-2 mb-3'>
            <Link className='h-5 w-5 text-blue-500' />
            <Label className='text-base font-medium'>1. Paste Image URL</Label>
          </div>
          <div className='space-y-2'>
            <PasteInput
              placeholder='Paste or enter image URL here...'
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onEndIconClick={handlePasteFromClipboard}
              disabled={disabled}
            />
            <Button
              onClick={handlePasteUrl}
              disabled={disabled || !imageUrl.trim()}
              className='w-full'
            >
              <Link className='h-4 w-4 mr-2' />
              Apply Image URL
            </Button>
          </div>
        </div>

        {/* Method 2: Upload File */}
        <div className='space-y-3 p-4 border rounded-lg'>
          <div className='flex items-center gap-2 mb-3'>
            <Upload className='h-5 w-5 text-green-500' />
            <Label className='text-base font-medium'>
              2. Upload from Device
            </Label>
          </div>
          <div className='space-y-2'>
            <input
              type='file'
              accept='image/*'
              onChange={handleImageUpload}
              className='hidden'
              id='background-image-upload'
            />
            <Button
              variant='outline'
              onClick={() =>
                document.getElementById('background-image-upload')?.click()
              }
              disabled={disabled}
              className='w-full'
            >
              <Upload className='h-4 w-4 mr-2' />
              Choose File to Upload
            </Button>
          </div>
        </div>

        {/* Method 3: AI Generate */}
        <div
          className={`space-y-3 p-4 border rounded-lg ${!isOpenAIReady ? 'opacity-50' : ''}`}
        >
          <div className='flex items-center gap-2 mb-3'>
            <Sparkles className='h-5 w-5 text-purple-500' />
            <Label className='text-base font-medium'>3. Generate with AI</Label>
            {!isOpenAIReady && (
              <span className='text-sm text-gray-500 ml-2'>
                (Not available)
              </span>
            )}
          </div>
          <div className='space-y-3'>
            <div className='space-y-2'>
              <Label htmlFor='prompt' className='text-sm'>
                Describe your background image
              </Label>
              <Textarea
                id='prompt'
                placeholder={
                  isOpenAIReady
                    ? 'e.g., "A modern minimalist design with clean lines and subtle shadows"'
                    : 'OpenAI not initialized - AI generation unavailable'
                }
                value={prompt}
                onChange={
                  disabled || !isOpenAIReady
                    ? () => undefined
                    : (e) => setPrompt(e.target.value)
                }
                className='min-h-[80px]'
                disabled={disabled || !isOpenAIReady}
              />
            </div>
            <div className='flex gap-3'>
              <div className='flex-1'>
                <Select
                  value={selectedImageModel}
                  onValueChange={
                    disabled || !isOpenAIReady
                      ? () => undefined
                      : setSelectedImageModel
                  }
                  disabled={disabled || !isOpenAIReady}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select AI model' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='dall-e-3'>DALL-E 3</SelectItem>
                    <SelectItem value='gpt-image-1'>GPT Image 1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleGenerateImage}
                disabled={
                  disabled ||
                  !isOpenAIReady ||
                  isGeneratingImage ||
                  !prompt.trim()
                }
                className='flex-1'
              >
                {isGeneratingImage ? (
                  <>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2' />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className='h-4 w-4 mr-2' />
                    Generate Image
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
