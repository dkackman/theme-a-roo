import Header from '@/components/Header';
import Layout from '@/components/Layout';
import CollectionInfoForm from '@/components/nft/CollectionInfoForm';
import NftImagesForm from '@/components/nft/NftImagesForm';
import { useCollectionInfo } from '@/hooks/useCollectionInfo';
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

  return (
    <Layout>
      <Header title='Theme NFT' back={handleBack} />
      <div className='flex-1 overflow-auto backdrop-blur-sm bg-background/80'>
        <div className='container mx-auto p-6'>
          {currentStep === 1 ? (
            <CollectionInfoForm
              collectionInfo={collectionInfo}
              onInfoChange={updateCollectionInfo}
              onNext={handleNextStep}
            />
          ) : currentStep === 2 ? (
            <NftImagesForm onBack={handlePrevStep} onNext={handleNextStep3} />
          ) : (
            <div className='flex items-center justify-center p-8'>
              <span>Step 3 - Coming Soon</span>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
