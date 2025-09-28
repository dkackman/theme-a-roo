import Header from '@/components/Header';
import Layout from '@/components/Layout';
import CollectionInfoForm from '@/components/nft/CollectionInfoForm';
import NftImagesForm from '@/components/nft/NftImagesForm';
import UploadToIPFS from '@/components/nft/UploadToIPFS';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useCollectionInfo } from '@/hooks/useCollectionInfo';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PrepareNft() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const { collectionInfo, updateCollectionInfo } = useCollectionInfo();

  const handleBack = () => {
    navigate(-1);
  };

  const handleNextStep = () => {
    setCurrentStep(2);
  };

  const handleNextStep3 = () => {
    setCurrentStep(3);
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
  };

  const handlePrevStep2 = () => {
    setCurrentStep(2);
  };

  const isFormValid = () => {
    switch (currentStep) {
      case 1:
        return (
          collectionInfo.description.trim() !== '' &&
          collectionInfo.author.trim() !== '' &&
          collectionInfo.sponsor.trim() !== ''
        );
      case 2:
        // Check if NFT icon is uploaded
        return localStorage.getItem('nft-icon') !== null;
      case 3:
        // No validation needed for upload step
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
                  </h2>
                  <p className='text-muted-foreground'>
                    {currentStep === 1 &&
                      'Provide details about your theme collection. Required fields are marked with *.'}
                    {currentStep === 2 &&
                      'Upload images for your NFT collection. The NFT icon is required.'}
                    {currentStep === 3 &&
                      'Review your images and upload them to create your NFT collection.'}
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
                          : handlePrevStep2
                    }
                    className='flex items-center gap-2'
                  >
                    <ArrowLeft className='w-4 h-4' />
                    Back
                  </Button>

                  {currentStep < 3 && (
                    <Button
                      onClick={
                        currentStep === 1 ? handleNextStep : handleNextStep3
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
                <NftImagesForm />
              ) : (
                <UploadToIPFS />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
