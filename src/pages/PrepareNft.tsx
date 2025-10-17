import Header from '@/components/Header';
import Layout from '@/components/Layout';
import CollectionInfoForm from '@/components/nft/CollectionInfoForm';
import NftImagesForm from '@/components/nft/NftImagesForm';
import UploadMetadata from '@/components/nft/UploadMetadata';
import UploadToIPFS from '@/components/nft/UploadToIPFS';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useUploadedUrls } from '@/contexts/UploadedUrlsContext';
import { useCollectionInfo } from '@/hooks/useCollectionInfo';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PrepareNft() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const { collectionInfo, updateCollectionInfo } = useCollectionInfo();
  const { uploadedUrls } = useUploadedUrls();
  const [hasNftIcon, setHasNftIcon] = useState(false);

  const handleBack = () => {
    navigate(-1);
  };

  const handleNextStep = () => {
    setCurrentStep(2);
  };

  const handleNextStep3 = () => {
    setCurrentStep(3);
  };

  const handleNextStep4 = () => {
    setCurrentStep(4);
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
  };

  const handlePrevStep2 = () => {
    setCurrentStep(2);
  };

  const handlePrevStep3 = () => {
    setCurrentStep(3);
  };

  const isFormValid = () => {
    switch (currentStep) {
      case 1:
        return (
          collectionInfo.collectionName.trim() !== '' &&
          collectionInfo.description.trim() !== '' &&
          collectionInfo.author.trim() !== '' &&
          collectionInfo.sponsor.trim() !== ''
        );
      case 2:
        // NFT icon is required for step 2
        return hasNftIcon;
      case 3:
        // Check if files have been uploaded and at least the NFT icon is present
        return uploadedUrls.some((url) => url.fileType === 'icon');
      case 4:
        // No validation needed for metadata step
        return true;
      default:
        return false;
    }
  };

  return (
    <Layout>
      <Header title='Theme NFT' back={handleBack} />
      <div className='flex-1 overflow-auto bg-background/80'>
        <div className='container mx-auto p-6'>
          <Card>
            <CardHeader>
              {/* Step Title, Description, and Navigation */}
              <div className='flex justify-between items-center w-full'>
                <div className='flex-1'>
                  <h2 className='text-2xl font-bold mb-2'>
                    {currentStep === 1 && 'Collection Information'}
                    {currentStep === 2 && 'NFT Images'}
                    {currentStep === 3 && 'Upload to IPFS'}
                    {currentStep === 4 && 'Generate Metadata'}
                  </h2>
                  <p className='text-muted-foreground'>
                    {currentStep === 1 &&
                      'Provide details about your theme collection. Required fields are marked with *.'}
                    {currentStep === 2 &&
                      'Upload images for your NFT collection. The NFT icon is required.'}
                    {currentStep === 3 &&
                      'Review your images and upload them to create your NFT collection.'}
                    {currentStep === 4 &&
                      'Generate OpenSea-compatible metadata for your NFT collection.'}
                  </p>
                </div>

                <div className='flex items-center gap-4'>
                  <Button
                    variant='outline'
                    onClick={
                      currentStep === 1
                        ? handleBack
                        : currentStep === 2
                          ? handlePrevStep
                          : currentStep === 3
                            ? handlePrevStep2
                            : handlePrevStep3
                    }
                    className='flex items-center gap-2'
                  >
                    <ArrowLeft className='w-4 h-4' />
                    Back
                  </Button>

                  {currentStep < 4 && (
                    <Button
                      onClick={
                        currentStep === 1
                          ? handleNextStep
                          : currentStep === 2
                            ? handleNextStep3
                            : handleNextStep4
                      }
                      disabled={!isFormValid()}
                      className='flex items-center gap-2'
                    >
                      Next Step
                      <ArrowRight className='w-4 h-4' />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {currentStep === 1 ? (
                <CollectionInfoForm
                  collectionInfo={collectionInfo}
                  onInfoChange={updateCollectionInfo}
                />
              ) : currentStep === 2 ? (
                <NftImagesForm onNftIconChange={setHasNftIcon} />
              ) : currentStep === 3 ? (
                <UploadToIPFS />
              ) : (
                <UploadMetadata />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
