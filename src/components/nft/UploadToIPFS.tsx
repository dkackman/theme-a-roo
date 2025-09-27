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
import { ArrowLeft, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';

interface UploadToIPFSProps {
  onBack: () => void;
}

export default function UploadToIPFS({ onBack }: UploadToIPFSProps) {
  const { getBackgroundImage } = useWorkingThemeState();
  const [ipfsProvider, setIpfsProvider] = useState<string>('filebase');
  const [apiKey, setApiKey] = useState<string>('');

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

  const handleUpload = () => {
    // TODO: Implement actual upload functionality
    console.log('Upload functionality to be implemented');
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
      <div className='text-center'>
        <h2 className='text-2xl font-bold mb-2'>Upload to IPFS</h2>
        <p className='text-muted-foreground'>
          Review your images and upload them to create your NFT collection.
        </p>
      </div>

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
            disabled={!requiredImagesUploaded}
            size='lg'
            className='px-8 py-3'
          >
            <Upload className='w-5 h-5 mr-2' />
            Upload to {ipfsProvider === 'filebase' ? 'Filebase' : 'Pinata'}
          </Button>
        </div>
      )}

      {/* Navigation */}
      <div className='flex justify-between w-full pt-6'>
        <Button
          variant='outline'
          onClick={onBack}
          className='flex items-center gap-2'
        >
          <ArrowLeft className='w-4 h-4' />
          Back to Images
        </Button>
      </div>
    </div>
  );
}
