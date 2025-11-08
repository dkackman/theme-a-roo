import { CopyBox } from '@/components/CopyBox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUploadedUrls } from '@/contexts/UploadedUrlsContext';
import { useCollectionInfo } from '@/hooks/useCollectionInfo';
import { useWorkingThemeState } from '@/hooks/useWorkingThemeState';
import { PinataSDK, type GroupResponseItem } from 'pinata';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useTheme } from 'theme-o-rama';

export default function UploadMetadata() {
  const { currentTheme } = useTheme();
  const { collectionInfo } = useCollectionInfo();
  const { uploadedUrls } = useUploadedUrls();
  const { WorkingTheme } = useWorkingThemeState();
  const [metadata, setMetadata] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [metadataUrl, setMetadataUrl] = useState<string>('');

  const generateMetadata = useCallback(() => {
    if (!currentTheme) {
      toast.error('No theme available');
      return;
    }

    // Find uploaded URLs by type
    const iconUrl = uploadedUrls.find((url) => url.fileType === 'icon')?.url;
    const bannerUrl = uploadedUrls.find(
      (url) => url.fileType === 'banner',
    )?.url;
    const backgroundUrl = uploadedUrls.find(
      (url) => url.fileType === 'background',
    )?.url;

    const finalTheme = JSON.parse(JSON.stringify(WorkingTheme));
    finalTheme.name = collectionInfo.collectionName;
    if (backgroundUrl) {
      finalTheme.backgroundImage = backgroundUrl;
    }

    const metadataObject = {
      format: 'CHIP-0007',
      name: currentTheme.displayName,
      description: collectionInfo.description,
      attributes: [
        {
          trait_type: 'Theme',
          value: currentTheme.displayName,
        },
        {
          trait_type: 'Author',
          value: collectionInfo.author,
        },
        ...(backgroundUrl
          ? [
              {
                trait_type: 'Background',
                // ipfs strips file extensions, so we need to check the source url
                value: currentTheme?.backgroundImage
                  ?.toLowerCase()
                  .endsWith('.gif')
                  ? 'Animated GIF'
                  : 'Image',
              },
            ]
          : []),
      ],
      collection: {
        id: crypto.randomUUID(),
        name: `${currentTheme.displayName} Theme`,
        attributes: [
          {
            type: 'description',
            value: collectionInfo.description,
          },
          ...(collectionInfo.twitterHandle
            ? [
                {
                  type: 'twitter',
                  value: collectionInfo.twitterHandle,
                },
              ]
            : []),
          ...(collectionInfo.sponsor
            ? [
                {
                  type: 'sponsor',
                  value: collectionInfo.sponsor,
                },
              ]
            : []),
          ...(collectionInfo.website
            ? [
                {
                  type: 'website',
                  value: collectionInfo.website,
                },
              ]
            : []),
          ...(iconUrl
            ? [
                {
                  type: 'icon',
                  value: iconUrl,
                },
              ]
            : []),
          ...(bannerUrl
            ? [
                {
                  type: 'banner',
                  value: bannerUrl,
                },
              ]
            : []),
        ],
      },
      data: {
        theme: finalTheme,
      },
    };

    const metadataJson = JSON.stringify(metadataObject, null, 2);
    setMetadata(metadataJson);
  }, [currentTheme, collectionInfo, uploadedUrls, WorkingTheme]);

  // Auto-generate metadata when component loads
  useEffect(() => {
    if (currentTheme && uploadedUrls.length > 0) {
      generateMetadata();
    }
  }, [currentTheme, uploadedUrls, generateMetadata]);

  const copyMetadata = async () => {
    try {
      await navigator.clipboard.writeText(metadata);
      toast.success('Metadata copied to clipboard');
    } catch (error) {
      console.error('Failed to copy metadata:', error);
      toast.error('Failed to copy metadata');
    }
  };

  const downloadMetadata = () => {
    const blob = new Blob([metadata], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${collectionInfo.collectionName}-metadata.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Metadata file downloaded');
  };

  const uploadToPinata = async () => {
    if (!metadata.trim()) {
      toast.error('Please generate metadata first');
      return;
    }

    // Get Pinata configuration from localStorage and sessionStorage
    const apiKey = sessionStorage.getItem('pinata-jwt');
    const gatewayUrl = localStorage.getItem('pinata-gateway');
    const groupName = localStorage.getItem('pinata-group-name');

    if (!apiKey || !gatewayUrl) {
      toast.error(
        'Pinata configuration not found. Please complete step 3 first.',
      );
      return;
    }

    setIsUploading(true);
    try {
      const pinata = new PinataSDK({
        pinataJwt: apiKey,
        pinataGateway: gatewayUrl,
      });

      // Find group if specified
      let group: GroupResponseItem | null = null;
      if (groupName) {
        const groups = await pinata.groups.public.list();
        group = groups.groups.find((g) => g.name === groupName) || null;
      }

      // Create metadata file
      const metadataBlob = new Blob([metadata], { type: 'application/json' });
      const metadataFile = new File(
        [metadataBlob],
        `${collectionInfo.collectionName}-metadata.json`,
        {
          type: 'application/json',
        },
      );

      // Upload metadata to Pinata
      const uploadResult = await pinata.upload.public.file(
        metadataFile,
        group ? { groupId: group.id } : undefined,
      );

      const metadataUrl = await pinata.gateways.public.convert(
        uploadResult.cid,
      );

      setMetadataUrl(metadataUrl);
      toast.success('Metadata uploaded to Pinata successfully');

      // Store this URL in localStorage for persistence
      localStorage.setItem('metadata-url', metadataUrl);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(
        `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className='max-w-4xl mx-auto space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Generate NFT Metadata</CardTitle>
          <p className='text-sm text-muted-foreground'>
            Generate chia blockchain-compatible metadata for your theme NFT
            collection.
          </p>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex gap-2'>
            {metadata && (
              <>
                <Button variant='outline' onClick={copyMetadata}>
                  Copy to Clipboard
                </Button>
                <Button variant='outline' onClick={downloadMetadata}>
                  Download JSON
                </Button>
                <Button
                  onClick={uploadToPinata}
                  disabled={isUploading}
                  className='bg-purple-600 hover:bg-purple-700 text-white'
                >
                  {isUploading ? (
                    <>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2' />
                      Uploading...
                    </>
                  ) : (
                    'Upload to Pinata'
                  )}
                </Button>
              </>
            )}
          </div>

          {metadata && (
            <div className='space-y-4'>
              {/* Icon URL Copy Box */}
              {(() => {
                const iconUrl = uploadedUrls.find(
                  (url) => url.fileType === 'icon',
                )?.url;

                return iconUrl ? (
                  <div className='space-y-2'>
                    <Label>NFT Data URL</Label>
                    <CopyBox value={iconUrl} title='Icon URL' />
                  </div>
                ) : null;
              })()}

              {/* Metadata URL Copy Box */}
              {metadataUrl && (
                <div className='space-y-2'>
                  <Label>NFT Metadata URL</Label>
                  <CopyBox value={metadataUrl} title='Metadata URL' />
                </div>
              )}

              <div className='space-y-2'>
                <Label htmlFor='metadata'>Generated Metadata</Label>
                <Textarea
                  id='metadata'
                  readOnly={true}
                  value={metadata}
                  className='font-mono text-sm resize-none'
                  rows={20}
                  placeholder='Metadata will appear here...'
                />
              </div>
            </div>
          )}

          {uploadedUrls.length === 0 && (
            <div className='text-center py-8'>
              <p className='text-muted-foreground'>
                Please upload images in step 3 before generating metadata.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
