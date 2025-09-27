import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useWorkingThemeState } from '@/hooks/useWorkingThemeState';
import { isTauriEnvironment } from '@/lib/utils';
import html2canvas from 'html2canvas-pro';
import { ArrowLeft, ArrowRight, Download, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { applyThemeIsolated, useTheme } from 'theme-o-rama';

interface NftImagesFormProps {
  onBack: () => void;
  onNext: () => void;
}

export default function NftImagesForm({ onBack, onNext }: NftImagesFormProps) {
  const { currentTheme } = useTheme();
  const { getBackgroundImage } = useWorkingThemeState();
  const previewRef = useRef<HTMLDivElement>(null);
  const [nftIcon, setNftIcon] = useState<string | null>(null);
  const [collectionBanner, setCollectionBanner] = useState<string | null>(null);
  const backgroundImage = (() => {
    const bgImg = getBackgroundImage();
    // Only show if it's a data URL (not a regular URL)
    return bgImg && (bgImg.startsWith('data:') || bgImg.startsWith('blob:'))
      ? bgImg
      : null;
  })();

  // Load saved images from localStorage
  useEffect(() => {
    const savedNftIcon = localStorage.getItem('nft-icon');
    const savedBanner = localStorage.getItem('nft-banner');

    if (savedNftIcon) {
      setNftIcon(savedNftIcon);
    }
    if (savedBanner) {
      setCollectionBanner(savedBanner);
    }
  }, []);

  // Save images to localStorage whenever they change
  useEffect(() => {
    if (nftIcon) {
      localStorage.setItem('nft-icon', nftIcon);
    } else {
      localStorage.removeItem('nft-icon');
    }
  }, [nftIcon]);

  useEffect(() => {
    if (collectionBanner) {
      localStorage.setItem('nft-banner', collectionBanner);
    } else {
      localStorage.removeItem('nft-banner');
    }
  }, [collectionBanner]);

  useEffect(() => {
    if (previewRef.current && currentTheme) {
      // Apply the theme with complete isolation from ambient theme
      applyThemeIsolated(currentTheme, previewRef.current);
    }
  }, [currentTheme]);

  const handleImageUpload = (file: File, setter: (url: string) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setter(result);
        toast.success('Image uploaded successfully');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      handleImageUpload(file, setter);
    }
  };

  const isFormValid = () => {
    return nftIcon !== null;
  };

  const downloadForWeb = (canvas: HTMLCanvasElement, filename: string) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Image saved successfully.`);
  };

  const downloadForTauri = async (
    canvas: HTMLCanvasElement,
    filename: string,
  ) => {
    if (!isTauriEnvironment()) {
      throw new Error('Tauri environment not detected');
    }

    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const { writeFile } = await import('@tauri-apps/plugin-fs');

      const filePath = await save({
        defaultPath: filename,
        filters: [
          {
            name: 'PNG Images',
            extensions: ['png'],
          },
        ],
      });

      if (filePath) {
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
          }, 'image/png');
        });

        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        await writeFile(filePath, uint8Array);
        toast.success(`Image saved successfully.`);
      } else {
        // User cancelled the save dialog
        toast.info('Download cancelled');
      }
    } catch (error) {
      console.error('Error saving theme preview:', error);
      toast.error('Failed to save theme preview. Please try again.');
      throw error; // Re-throw to be caught by the main handler
    }
  };

  const handleDownload = async () => {
    if (!previewRef.current || !currentTheme) return;

    try {
      const canvas = await html2canvas(previewRef.current, {
        backgroundColor: null,
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: false,
        logging: false,
      });

      const filename = `${currentTheme.displayName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_theme_preview.png`;

      if (isTauriEnvironment()) {
        await downloadForTauri(canvas, filename);
      } else {
        downloadForWeb(canvas, filename);
      }
    } catch (error) {
      console.error('Error generating theme preview:', error);
      toast.error('Failed to generate theme preview. Please try again.');
    }
  };

  if (!currentTheme) {
    return (
      <div className='flex items-center justify-center p-8'>
        <span>No theme available</span>
      </div>
    );
  }

  return (
    <div className='max-w-4xl mx-auto space-y-8'>
      <div className='text-center'>
        <h2 className='text-2xl font-bold mb-2'>NFT Images</h2>
        <p className='text-muted-foreground'>
          Upload images for your NFT collection. The NFT icon is required.
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* Left Column - NFT Icon */}
        <div className='space-y-4'>
          <div>
            <Label className='text-base font-medium'>NFT Icon *</Label>
            <p className='text-sm text-muted-foreground mb-4'>
              This is what will be shown as your theme preview. You can download
              the generated preview or upload your own. The icon file should be
              320x320px.
            </p>
          </div>

          {/* Theme Preview */}
          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Current Theme Preview</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div
                ref={previewRef}
                className='w-80 h-80 mx-auto aspect-square border border-border rounded-none shadow-lg theme-card-isolated'
              >
                <div className='p-6 h-full flex flex-col'>
                  {/* Header */}
                  <div className='flex items-center justify-between mb-6'>
                    <h3 className='font-bold text-lg text-foreground font-heading'>
                      {currentTheme.displayName}
                    </h3>
                    <div className='w-6 h-6 bg-primary rounded-full relative'>
                      <span
                        className='text-primary-foreground text-xs font-bold absolute inset-0 flex items-center justify-center'
                        style={{
                          lineHeight: '1',
                          transform: 'translateY(-1px)',
                        }}
                      >
                        {' '}
                      </span>
                    </div>
                  </div>

                  {/* Main Content Area */}
                  <div className='flex-1 space-y-4'>
                    {/* Primary Button */}
                    <div className='h-12 px-4 bg-primary text-primary-foreground rounded-lg shadow-button relative'>
                      <span
                        className='font-medium font-body absolute inset-0 flex items-center'
                        style={{
                          lineHeight: '1',
                          transform: 'translateY(-1px)',
                        }}
                      >
                        {' '}
                      </span>
                    </div>

                    {/* Color Palette */}
                    <div className='space-y-2'>
                      <h4 className='text-sm font-medium text-foreground font-heading'>
                        Color Palette
                      </h4>
                      <div className='grid grid-cols-4 gap-2'>
                        <div className='h-8 bg-primary rounded-md relative'>
                          <span
                            className='text-primary-foreground text-xs font-bold absolute inset-0 flex items-center justify-center'
                            style={{
                              lineHeight: '1',
                              transform: 'translateY(-1px)',
                            }}
                          >
                            {' '}
                          </span>
                        </div>
                        <div className='h-8 bg-secondary rounded-md relative'>
                          <span
                            className='text-secondary-foreground text-xs font-bold absolute inset-0 flex items-center justify-center'
                            style={{
                              lineHeight: '1',
                              transform: 'translateY(-1px)',
                            }}
                          >
                            {' '}
                          </span>
                        </div>
                        <div className='h-8 bg-accent rounded-md relative'>
                          <span
                            className='text-accent-foreground text-xs font-bold absolute inset-0 flex items-center justify-center'
                            style={{
                              lineHeight: '1',
                              transform: 'translateY(-1px)',
                            }}
                          >
                            {' '}
                          </span>
                        </div>
                        <div className='h-8 bg-destructive rounded-md relative'>
                          <span
                            className='text-destructive-foreground text-xs font-bold absolute inset-0 flex items-center justify-center'
                            style={{
                              lineHeight: '1',
                              transform: 'translateY(-1px)',
                            }}
                          >
                            {' '}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Sample Card */}
                    <div className='bg-card text-card-foreground border border-border rounded-lg p-3'>
                      <div className='text-sm font-medium font-heading mb-1'>
                        {' '}
                      </div>
                      <div className='text-xs text-muted-foreground font-body'></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className='flex gap-2 justify-center'>
                <Button onClick={handleDownload}>
                  <Download className='w-4 h-4 mr-2' />
                  Download PNG
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* NFT Icon Upload */}
          <Card>
            <CardHeader>
              <CardTitle className='text-base'>
                Upload Custom NFT Icon
              </CardTitle>
            </CardHeader>
            <CardContent>
              {nftIcon ? (
                <div className='space-y-3'>
                  <div className='w-32 h-32 mx-auto border border-border rounded-lg overflow-hidden'>
                    <img
                      src={nftIcon}
                      alt='NFT Icon'
                      className='w-full h-full object-cover'
                    />
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setNftIcon(null)}
                    className='w-full'
                  >
                    <X className='w-3 h-3 mr-2' />
                    Remove
                  </Button>
                </div>
              ) : (
                <div className='border-2 border-dashed border-border rounded-lg p-6 text-center'>
                  <input
                    type='file'
                    accept='image/*'
                    onChange={(e) => handleFileSelect(e, setNftIcon)}
                    className='hidden'
                    id='nft-icon-upload'
                  />
                  <label htmlFor='nft-icon-upload' className='cursor-pointer'>
                    <Upload className='w-8 h-8 mx-auto mb-2 text-muted-foreground' />
                    <div className='text-sm text-muted-foreground'>
                      Click to upload NFT icon
                    </div>
                  </label>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Collection Banner & Background */}
        <div className='space-y-6'>
          {/* Collection Banner */}
          <Card>
            <CardHeader>
              <CardTitle className='text-base'>
                Collection Banner (optional)
              </CardTitle>
              <p className='text-sm text-muted-foreground'>
                Banner image for your collection. Should be 4:1 aspect ratio
                (e.g., 800x200px).
              </p>
            </CardHeader>
            <CardContent>
              {collectionBanner ? (
                <div className='space-y-3'>
                  <div className='w-full h-24 border border-border rounded-lg overflow-hidden'>
                    <img
                      src={collectionBanner}
                      alt='Collection Banner'
                      className='w-full h-full object-cover'
                    />
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setCollectionBanner(null)}
                    className='w-full'
                  >
                    <X className='w-3 h-3 mr-2' />
                    Remove
                  </Button>
                </div>
              ) : (
                <div className='border-2 border-dashed border-border rounded-lg p-6 text-center'>
                  <input
                    type='file'
                    accept='image/*'
                    onChange={(e) => handleFileSelect(e, setCollectionBanner)}
                    className='hidden'
                    id='banner-upload'
                  />
                  <label htmlFor='banner-upload' className='cursor-pointer'>
                    <Upload className='w-8 h-8 mx-auto mb-2 text-muted-foreground' />
                    <div className='text-sm text-muted-foreground'>
                      Upload banner (4:1 aspect ratio)
                    </div>
                  </label>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Background Image Preview */}
          {backgroundImage && (
            <Card>
              <CardHeader>
                <CardTitle className='text-base'>
                  Theme Background Image
                </CardTitle>
                <p className='text-sm text-muted-foreground'>
                  This background image is currently applied to your theme and
                  will be included in the NFT.
                </p>
              </CardHeader>
              <CardContent>
                <div className='w-full h-32 border border-border rounded-lg overflow-hidden'>
                  <img
                    src={backgroundImage}
                    alt='Background'
                    className='w-full h-full object-cover'
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className='flex justify-between w-full pt-6'>
        <Button
          variant='outline'
          onClick={onBack}
          className='flex items-center gap-2'
        >
          <ArrowLeft className='w-4 h-4' />
          Back to Info
        </Button>
        <Button
          onClick={onNext}
          disabled={!isFormValid()}
          className='flex items-center gap-2'
        >
          Next Step
          <ArrowRight className='w-4 h-4' />
        </Button>
      </div>
    </div>
  );
}
