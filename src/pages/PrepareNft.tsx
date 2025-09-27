import Header from '@/components/Header';
import Layout from '@/components/Layout';
import CollectionInfoForm from '@/components/nft/CollectionInfoForm';
import NftImagesForm from '@/components/nft/NftImagesForm';
import UploadToIPFS from '@/components/nft/UploadToIPFS';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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

  const handlePrevStep2 = () => {
    setCurrentStep(2);
  };

  return (
    <Layout>
      <Header title='Theme NFT' back={handleBack} />
      <div className='flex-1 overflow-auto bg-background/80'>
        <div className='container mx-auto p-6'>
          <Card>
            <CardHeader></CardHeader>
            <CardContent>
              {currentStep === 1 ? (
                <CollectionInfoForm
                  collectionInfo={collectionInfo}
                  onInfoChange={updateCollectionInfo}
                  onNext={handleNextStep}
                />
              ) : currentStep === 2 ? (
                <NftImagesForm
                  onBack={handlePrevStep}
                  onNext={handleNextStep3}
                />
              ) : (
                <UploadToIPFS onBack={handlePrevStep2} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
