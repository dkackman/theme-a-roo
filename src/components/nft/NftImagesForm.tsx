import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useWorkingThemeState } from '@/hooks/useWorkingThemeState';
import { IMAGE_STORAGE_KEYS } from '@/lib/constants';
import { imageStorage } from '@/lib/imageStorage';
import { isTauriEnvironment, makeValidFileName } from '@/lib/utils';
import html2canvas from 'html2canvas-pro';
import { Download, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { applyThemeIsolated, useTheme } from 'theme-o-rama';

interface NftImagesFormProps {
  onNftIconChange: (hasIcon: boolean) => void;
}

export default function NftImagesForm({ onNftIconChange }: NftImagesFormProps) {
  const { currentTheme } = useTheme();
  const { getBackgroundImage } = useWorkingThemeState();
  const previewRef = useRef<HTMLDivElement>(null);
  const [nftIcon, setNftIcon] = useState<string | null>(null);
  const [isIntentionallyDeleting, setIsIntentionallyDeleting] = useState(false);

  // Validation function to check if NFT icon is present
  const isNftIconValid = () => {
    return nftIcon !== null && nftIcon.trim() !== '';
  };

  // Use setNftIcon with deletion tracking
  const setNftIconWithLogging = (value: string | null) => {
    if (value === null) {
      setIsIntentionallyDeleting(true);
    }
    setNftIcon(value);
  };
  const [collectionBanner, setCollectionBanner] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  // Load saved images from IndexedDB
  useEffect(() => {
    const loadImages = async () => {
      try {
        // Load background image
        const bgImage = await getBackgroundImage();
        setBackgroundImage(bgImage);

        // Load NFT icon
        const nftIconUrl = await imageStorage.getImageUrl(
          IMAGE_STORAGE_KEYS.NFT_ICON_IMAGE,
        );
        if (nftIconUrl) {
          setNftIcon(nftIconUrl);
        }

        // Load collection banner
        const bannerUrl = await imageStorage.getImageUrl(
          IMAGE_STORAGE_KEYS.NFT_BANNER_IMAGE,
        );
        if (bannerUrl) {
          setCollectionBanner(bannerUrl);
        }
      } catch (error) {
        console.error('Failed to load images from IndexedDB:', error);
      }
    };

    loadImages();
  }, [getBackgroundImage]);

  // Save images to IndexedDB whenever they change
  useEffect(() => {
    const saveNftIcon = async () => {
      if (nftIcon) {
        try {
          await imageStorage.storeImage(
            IMAGE_STORAGE_KEYS.NFT_ICON_IMAGE,
            nftIcon,
          );
          // Notify parent component that NFT icon is present
          onNftIconChange(true);
          // Reset the deletion flag after successful save
          setIsIntentionallyDeleting(false);
        } catch (error) {
          console.error('Failed to save NFT icon to IndexedDB:', error);
        }
      } else if (isIntentionallyDeleting) {
        // Only delete if this is an intentional deletion (red X button)
        try {
          await imageStorage.deleteImage(IMAGE_STORAGE_KEYS.NFT_ICON_IMAGE);
          // Notify parent component that NFT icon is removed
          onNftIconChange(false);
          // Reset the deletion flag after successful deletion
          setIsIntentionallyDeleting(false);
        } catch (error) {
          console.error('Failed to delete NFT icon from IndexedDB:', error);
        }
      }
    };

    saveNftIcon();
  }, [nftIcon, isIntentionallyDeleting, onNftIconChange]);

  useEffect(() => {
    const saveBanner = async () => {
      if (collectionBanner) {
        try {
          await imageStorage.storeImage(
            IMAGE_STORAGE_KEYS.NFT_BANNER_IMAGE,
            collectionBanner,
          );
        } catch (error) {
          console.error(
            'Failed to save collection banner to IndexedDB:',
            error,
          );
        }
      } else {
        try {
          await imageStorage.deleteImage(IMAGE_STORAGE_KEYS.NFT_BANNER_IMAGE);
        } catch (error) {
          console.error(
            'Failed to delete collection banner from IndexedDB:',
            error,
          );
        }
      }
    };

    saveBanner();
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

      const filename = `${makeValidFileName(currentTheme.displayName)}_theme_preview.png`;

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
    <div className='max-w-4xl mx-auto'>
      {/* Validation Status */}
      <div className='mb-6 p-4 rounded-lg border'>
        <div className='flex items-center gap-2'>
          {isNftIconValid() ? (
            <>
              <div className='w-2 h-2 bg-green-500 rounded-full'></div>
              <span className='text-sm font-medium text-green-700'>
                NFT Icon: Ready
              </span>
            </>
          ) : (
            <>
              <div className='w-2 h-2 bg-red-500 rounded-full'></div>
              <span className='text-sm font-medium text-red-700'>
                NFT Icon: Required
              </span>
            </>
          )}
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* Left Column - NFT Icon */}
        <div className='space-y-4'>
          {/* Theme Preview */}
          <Card>
            <CardHeader>
              <CardTitle className='text-base'>NFT Icon *</CardTitle>
              <CardDescription className='text-sm text-muted-foreground mb-4'>
                This is what will be shown as your NFT preview. You can download
                this generated preview or upload your own. The icon file should
                be 320x320px.
              </CardDescription>
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
                Upload Custom NFT Icon *
              </CardTitle>
              <CardDescription className='text-sm text-muted-foreground'>
                {!nftIcon && (
                  <span className='text-destructive font-medium'>
                    NFT icon is required to proceed
                  </span>
                )}
                {nftIcon && (
                  <span className='text-green-600 font-medium'>
                    ✓ NFT icon uploaded successfully
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {nftIcon ? (
                <div className='w-32 h-32 mx-auto relative'>
                  <div className='w-full h-full border border-border rounded-lg overflow-hidden'>
                    <img
                      src={nftIcon}
                      alt='NFT Icon'
                      className='w-full h-full object-cover'
                    />
                  </div>
                  <Button
                    variant='destructive'
                    size='sm'
                    onClick={() => setNftIconWithLogging(null)}
                    className='absolute -top-2 -right-2 h-6 w-6 rounded-full p-0'
                  >
                    <X className='h-3 w-3' />
                  </Button>
                </div>
              ) : (
                <div className='border-2 border-dashed border-destructive rounded-lg p-6 text-center bg-destructive/5'>
                  <input
                    type='file'
                    accept='image/*'
                    onChange={(e) => handleFileSelect(e, setNftIconWithLogging)}
                    className='hidden'
                    id='nft-icon-upload'
                  />
                  <label htmlFor='nft-icon-upload' className='cursor-pointer'>
                    <Upload className='w-8 h-8 mx-auto mb-2 text-destructive' />
                    <div className='text-sm text-destructive font-medium'>
                      Click to upload NFT icon (Required)
                    </div>
                    <div className='text-xs text-muted-foreground mt-1'>
                      Icon should be 320x320px
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
                <div className='relative'>
                  <div className='w-full h-24 border border-border rounded-lg overflow-hidden'>
                    <img
                      src={collectionBanner}
                      alt='Collection Banner'
                      className='w-full h-full object-cover'
                    />
                  </div>
                  <Button
                    variant='destructive'
                    size='sm'
                    onClick={() => setCollectionBanner(null)}
                    className='absolute -top-2 -right-2 h-6 w-6 rounded-full p-0'
                  >
                    <X className='h-3 w-3' />
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
    </div>
  );
}
