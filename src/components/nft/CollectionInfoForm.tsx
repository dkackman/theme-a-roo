import { PasteInput } from '@/components/PasteInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';

export interface CollectionInfo {
  description: string;
  author: string;
  sponsor: string;
  twitterHandle: string;
  website: string;
  licenseUrl: string;
}

interface CollectionInfoFormProps {
  collectionInfo: CollectionInfo;
  onInfoChange: (info: CollectionInfo) => void;
  onNext: () => void;
}

export default function CollectionInfoForm({
  collectionInfo,
  onInfoChange,
  onNext,
}: CollectionInfoFormProps) {
  const handleInputChange = (field: keyof CollectionInfo, value: string) => {
    onInfoChange({
      ...collectionInfo,
      [field]: value,
    });
  };

  const isFormValid = () => {
    return (
      collectionInfo.description.trim() !== '' &&
      collectionInfo.author.trim() !== '' &&
      collectionInfo.sponsor.trim() !== ''
    );
  };

  const validateForm = () => {
    if (!collectionInfo.description.trim()) {
      toast.error('Theme description is required');
      return false;
    }
    if (!collectionInfo.author.trim()) {
      toast.error('Author name is required');
      return false;
    }
    if (!collectionInfo.sponsor.trim()) {
      toast.error('Sponsor is required');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext();
    }
  };

  return (
    <div className='max-w-2xl mx-auto space-y-6'>
      <div className='text-center'>
        <h2 className='text-2xl font-bold mb-2'>Collection Information</h2>
        <p className='text-muted-foreground mb-6'>
          Provide details about your theme collection for the NFT.
        </p>
      </div>

      <div className='space-y-4'>
        {/* Theme Description */}
        <div className='space-y-2'>
          <Label htmlFor='description'>Theme Description *</Label>
          <Textarea
            id='description'
            placeholder='Describe your theme, its inspiration, and what makes it unique...'
            value={collectionInfo.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={4}
            className='resize-none'
          />
        </div>

        {/* Author Name */}
        <div className='space-y-2'>
          <Label htmlFor='author'>Author Name *</Label>
          <Input
            id='author'
            placeholder='Your name or pseudonym'
            value={collectionInfo.author}
            onChange={(e) => handleInputChange('author', e.target.value)}
          />
        </div>

        {/* Sponsor */}
        <div className='space-y-2'>
          <Label htmlFor='sponsor'>Sponsor *</Label>
          <Input
            id='sponsor'
            placeholder='Organization or individual sponsoring this theme'
            value={collectionInfo.sponsor}
            onChange={(e) => handleInputChange('sponsor', e.target.value)}
          />
        </div>

        {/* Twitter Handle */}
        <div className='space-y-2'>
          <Label htmlFor='twitter'>Twitter Handle (optional)</Label>
          <Input
            id='twitter'
            placeholder='@yourhandle'
            value={collectionInfo.twitterHandle}
            onChange={(e) => handleInputChange('twitterHandle', e.target.value)}
          />
        </div>

        {/* Website */}
        <div className='space-y-2'>
          <Label htmlFor='website'>Website (optional)</Label>
          <PasteInput
            id='website'
            placeholder='https://yourwebsite.com'
            value={collectionInfo.website}
            onChange={(e) => handleInputChange('website', e.target.value)}
          />
        </div>

        {/* License URL */}
        <div className='space-y-2'>
          <Label htmlFor='license'>License URL (optional)</Label>
          <PasteInput
            id='license'
            placeholder='https://license-url.com'
            value={collectionInfo.licenseUrl}
            onChange={(e) => handleInputChange('licenseUrl', e.target.value)}
          />
        </div>
      </div>

      <div className='flex justify-end pt-4'>
        <Button
          onClick={handleNext}
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
