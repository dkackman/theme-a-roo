import { PasteInput } from '@/components/PasteInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWorkingThemeState } from '@/hooks/useWorkingThemeState';
import { IPFSFile, IPFSManager, IPFSProvider } from '@/lib/ipfs';
import { Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

export default function UploadToIPFS() {
  const { getBackgroundImage } = useWorkingThemeState();
  const [ipfsProvider, setIpfsProvider] = useState<string>('filebase');
  const [apiKey, setApiKey] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Load saved IPFS provider from localStorage
  useEffect(() => {
    const savedProvider = localStorage.getItem('ipfs-provider');
    if (savedProvider) {
      setIpfsProvider(savedProvider);
    }
  }, []);

  // Save IPFS provider to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('ipfs-provider', ipfsProvider);
  }, [ipfsProvider]);

  // Get images from localStorage
  const nftIcon = localStorage.getItem('nft-icon');
  const collectionBanner = localStorage.getItem('nft-banner');
  const backgroundImage = (() => {
    const bgImg = getBackgroundImage();
    // Only show if it's a data URL (not a regular URL)
    return bgImg && (bgImg.startsWith('data:') || bgImg.startsWith('blob:'))
      ? bgImg
      : null;
  })();

  const handleUpload = async () => {
    if (!apiKey.trim()) {
      toast.error('API key is required');
      return;
    }

    setIsUploading(true);
    try {
      // Create IPFS manager
      const ipfsManager = new IPFSManager(ipfsProvider as IPFSProvider, {
        apiKey: apiKey.trim(),
      });

      // Prepare files for upload
      const filesToUpload: IPFSFile[] = [];

      if (nftIcon) {
        filesToUpload.push(
          IPFSManager.createFileFromDataUrl(
            nftIcon,
            'nft-icon.png',
            'image/png',
          ),
        );
      }

      if (collectionBanner) {
        filesToUpload.push(
          IPFSManager.createFileFromDataUrl(
            collectionBanner,
            'collection-banner.png',
            'image/png',
          ),
        );
      }

      if (backgroundImage) {
        filesToUpload.push(
          IPFSManager.createFileFromDataUrl(
            backgroundImage,
            'background-image.png',
            'image/png',
          ),
        );
      }

      if (filesToUpload.length === 0) {
        toast.error('No images to upload');
        return;
      }

      toast.info(
        `Uploading ${filesToUpload.length} files to ${ipfsProvider}...`,
      );

      // Upload files
      const results = await ipfsManager.uploadFiles(filesToUpload, {
        pinToIPFS: true,
        metadata: {
          themeName: 'Theme NFT',
          uploadedAt: new Date().toISOString(),
        },
      });

      // Check results
      const successCount = results.filter((r) => r.success).length;
      const failedCount = results.length - successCount;

      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} files to IPFS!`);

        // Log successful uploads
        results.forEach((result, index) => {
          if (result.success) {
            console.log(`File ${filesToUpload[index].name}:`, {
              hash: result.hash,
              url: result.url,
            });
          }
        });
      }

      if (failedCount > 0) {
        toast.error(`${failedCount} files failed to upload`);
        results.forEach((result, index) => {
          if (!result.success) {
            console.error(
              `File ${filesToUpload[index].name} failed:`,
              result.error,
            );
          }
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(
        `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    } finally {
      setIsUploading(false);
    }
  };

  const imagesToUpload = [
    {
      id: 'nft-icon',
      title: 'NFT Icon',
      description: 'The main icon for your theme NFT',
      image: nftIcon,
      required: true,
    },
    {
      id: 'collection-banner',
      title: 'Collection Banner',
      description: 'Banner image for your collection (optional)',
      image: collectionBanner,
      required: false,
    },
    {
      id: 'background-image',
      title: 'Background Image',
      description: 'Theme background image (if available)',
      image: backgroundImage,
      required: false,
    },
  ].filter((item) => item.image); // Only show images that exist

  const requiredImagesUploaded =
    imagesToUpload.filter((img) => img.required).length > 0;

  return (
    <div className='max-w-4xl mx-auto space-y-8'>
      {/* IPFS Provider Selection */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>IPFS Provider</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='ipfs-provider'>Choose your IPFS provider</Label>
            <Select value={ipfsProvider} onValueChange={setIpfsProvider}>
              <SelectTrigger id='ipfs-provider'>
                <SelectValue placeholder='Select IPFS provider' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='filebase'>Filebase</SelectItem>
                <SelectItem value='pinata'>Pinata</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-2'>
            <Label htmlFor='api-key'>
              {ipfsProvider === 'filebase' ? 'Filebase' : 'Pinata'} API Key
            </Label>
            <PasteInput
              id='api-key'
              placeholder={`Enter your ${ipfsProvider === 'filebase' ? 'Filebase' : 'Pinata'} API key`}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              type='password'
            />
          </div>
        </CardContent>
      </Card>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {imagesToUpload.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle className='text-base flex items-center gap-2'>
                {item.title}
                {item.required && (
                  <span className='text-red-500 text-sm'>*</span>
                )}
              </CardTitle>
              <p className='text-sm text-muted-foreground'>
                {item.description}
              </p>
            </CardHeader>
            <CardContent className='space-y-4'>
              {item.image && (
                <div className='border border-border rounded-lg overflow-hidden'>
                  <img
                    src={item.image}
                    alt={item.title}
                    className='w-full h-32 object-cover'
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {imagesToUpload.length === 0 && (
        <Card>
          <CardContent className='text-center py-8'>
            <p className='text-muted-foreground'>
              No images to upload. Please go back to step 2 to add images.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Upload Button */}
      {imagesToUpload.length > 0 && (
        <div className='flex justify-center'>
          <Button
            onClick={handleUpload}
            disabled={!requiredImagesUploaded || !apiKey.trim() || isUploading}
            size='lg'
            className='px-8 py-3'
          >
            {isUploading ? (
              <>
                <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2' />
                Uploading...
              </>
            ) : (
              <>
                <Upload className='w-5 h-5 mr-2' />
                Upload to {ipfsProvider === 'filebase' ? 'Filebase' : 'Pinata'}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
