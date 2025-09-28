import { PasteInput } from '@/components/PasteInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCollectionInfo } from '@/hooks/useCollectionInfo';
import { useUploadedUrls } from '@/hooks/useUploadedUrls';
import { useWorkingThemeState } from '@/hooks/useWorkingThemeState';
import {
  detectMimeTypeFromBlob,
  getFileExtensionFromMimeType,
  isTauriEnvironment,
} from '@/lib/utils';
import { Upload } from 'lucide-react';
import { PinataSDK, type GroupResponseItem } from 'pinata';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Input } from '../ui/input';

export default function UploadToIPFS() {
  const { collectionInfo } = useCollectionInfo();
  const { getBackgroundImage } = useWorkingThemeState();
  const { uploadedUrls, setUploadedUrls } = useUploadedUrls();
  const [apiKey, setApiKey] = useState<string>('');
  const [gatewayUrl, setGatewayUrl] = useState<string>('');
  const [groupName, setGroupName] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const openLink = async (url: string) => {
    if (isTauriEnvironment()) {
      const { openUrl } = await import('@tauri-apps/plugin-opener');
      await openUrl(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Load saved configuration from localStorage and sessionStorage
  useEffect(() => {
    const savedGateway = localStorage.getItem('pinata-gateway');
    const savedGroupName = localStorage.getItem('pinata-group-name');
    const savedJwt = sessionStorage.getItem('pinata-jwt');

    if (savedGateway) {
      setGatewayUrl(savedGateway);
    }
    if (savedGroupName) {
      setGroupName(savedGroupName);
    }
    if (savedJwt) {
      setApiKey(savedJwt);
    }
  }, []);

  // Save gateway URL to localStorage whenever it changes
  useEffect(() => {
    if (gatewayUrl) {
      localStorage.setItem('pinata-gateway', gatewayUrl);
    }
  }, [gatewayUrl]);

  // Save group name to localStorage whenever it changes
  useEffect(() => {
    if (groupName) {
      localStorage.setItem('pinata-group-name', groupName);
    }
  }, [groupName]);

  // Save JWT token to sessionStorage whenever it changes
  useEffect(() => {
    if (apiKey) {
      sessionStorage.setItem('pinata-jwt', apiKey);
    } else {
      sessionStorage.removeItem('pinata-jwt');
    }
  }, [apiKey]);

  // Get images from localStorage
  const nftIcon = localStorage.getItem('nft-icon');
  const collectionBanner = localStorage.getItem('nft-banner');
  const backgroundImage = getBackgroundImage();

  const handleUpload = async () => {
    if (!apiKey.trim() || !gatewayUrl.trim()) {
      toast.error('JWT token and gateway URL are required');
      return;
    }

    setIsUploading(true);
    setUploadedUrls([]); // Clear previous uploads
    const nftBaseName = collectionInfo.baseName;
    try {
      const filesToUpload: {
        file: File;
        fileType: 'icon' | 'banner' | 'background';
      }[] = [];

      if (nftIcon) {
        const response = await fetch(nftIcon);
        const blob = await response.blob();
        const mimeType = detectMimeTypeFromBlob(blob);
        const extension = getFileExtensionFromMimeType(mimeType);
        filesToUpload.push({
          file: new File([blob], `${nftBaseName}.${extension}`, {
            type: mimeType,
          }),
          fileType: 'icon',
        });
      }

      if (collectionBanner) {
        const response = await fetch(collectionBanner);
        const blob = await response.blob();
        const mimeType = detectMimeTypeFromBlob(blob);
        const extension = getFileExtensionFromMimeType(mimeType);
        filesToUpload.push({
          file: new File([blob], `${nftBaseName}-banner.${extension}`, {
            type: mimeType,
          }),
          fileType: 'banner',
        });
      }

      if (backgroundImage && backgroundImage.startsWith('data:')) {
        const response = await fetch(backgroundImage);
        const blob = await response.blob();
        const mimeType = detectMimeTypeFromBlob(blob);
        const extension = getFileExtensionFromMimeType(mimeType);
        filesToUpload.push({
          file: new File([blob], `${nftBaseName}-background.${extension}`, {
            type: mimeType,
          }),
          fileType: 'background',
        });
      }

      if (filesToUpload.length === 0) {
        toast.error('No images to upload');
        return;
      }

      toast.info(`Uploading ${filesToUpload.length} files to Pinata...`);

      const pinata = new PinataSDK({
        pinataJwt: apiKey,
        pinataGateway: gatewayUrl,
      });
      let group: GroupResponseItem | null = null;
      if (groupName) {
        const groups = await pinata.groups.public.list();
        group = groups.groups.find((g) => g.name === groupName) || null;
      }

      const uploadedFiles = await Promise.all(
        filesToUpload.map(async (fileObj) => {
          const uploadResult = await pinata.upload.public.file(
            fileObj.file,
            group ? { groupId: group.id } : undefined,
          );
          return {
            ...uploadResult,
            fileType: fileObj.fileType,
          };
        }),
      );
      const uploadedUrls = await Promise.all(
        uploadedFiles.map(async (file) => ({
          url: await pinata.gateways.public.convert(file.cid),
          fileType: file.fileType,
        })),
      );

      setUploadedUrls(uploadedUrls);
      toast.success('Files uploaded successfully');
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
          <CardTitle className='text-base'>Pinata Configuration</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='api-key'>JWT Token</Label>
            <Textarea
              id='api-key'
              placeholder='Enter your Pinata JWT token'
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className='font-mono text-sm resize-none'
              rows={3}
            />
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='gateway-url'>Gateway URL</Label>
              <PasteInput
                id='gateway-url'
                placeholder='some-random-words-887.mypinata.cloud'
                value={gatewayUrl}
                onChange={(e) => setGatewayUrl(e.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='group-name'>Group Name</Label>
              <Input
                id='group-name'
                placeholder='Enter an optional group name'
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
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
                Upload to Pinata
              </>
            )}
          </Button>
        </div>
      )}

      {/* Uploaded Images Display */}
      {uploadedUrls.length > 0 && (
        <div className='space-y-4'>
          <div className='text-center'>
            <h3 className='text-lg font-semibold mb-2'>Uploaded Images</h3>
            <p className='text-sm text-muted-foreground'>
              Your images have been successfully uploaded to IPFS
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {uploadedUrls.map((uploadedItem) => {
              const getItemInfo = (fileType: string) => {
                switch (fileType) {
                  case 'icon':
                    return {
                      title: 'NFT Icon',
                    };
                  case 'banner':
                    return {
                      title: 'Collection Banner',
                    };
                  case 'background':
                    return {
                      title: 'Background Image',
                    };
                  default:
                    return {
                      title: 'Uploaded Image',
                    };
                }
              };

              const itemInfo = getItemInfo(uploadedItem.fileType);

              return (
                <Card key={`uploaded-${uploadedItem.fileType}`}>
                  <CardHeader>
                    <CardTitle className='text-base flex items-center gap-2'>
                      {itemInfo.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='border border-border rounded-lg overflow-hidden'>
                      <a
                        href={uploadedItem.url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-xs text-blue-600 hover:text-blue-800 underline break-all cursor-pointer'
                        onClick={async (e) => {
                          e.preventDefault();
                          openLink(uploadedItem.url);
                        }}
                      >
                        <img
                          src={uploadedItem.url}
                          alt={itemInfo.title}
                          title={uploadedItem.url}
                          className='w-full h-32 object-cover'
                        />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
