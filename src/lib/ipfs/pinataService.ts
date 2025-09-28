import { IPFSFile, IPFSProviderService, IPFSUploadOptions, IPFSUploadResult } from './types';

export class PinataService implements IPFSProviderService {
    private apiKey: string;
    private gatewayUrl: string;

    constructor(config: { apiKey: string; gatewayUrl?: string }) {
        this.apiKey = config.apiKey;
        this.gatewayUrl = config.gatewayUrl || 'https://gateway.pinata.cloud/ipfs/';
    }

    async uploadFile(file: IPFSFile, options: IPFSUploadOptions = {}): Promise<IPFSUploadResult> {
        try {
            const formData = new FormData();

            // Convert content to File if it's a data URL
            let fileToUpload: File;
            if (typeof file.content === 'string' && file.content.startsWith('data:')) {
                // Convert data URL to File
                const response = await fetch(file.content);
                const blob = await response.blob();
                fileToUpload = new File([blob], file.name, { type: file.type });
            } else if (file.content instanceof File) {
                fileToUpload = file.content;
            } else if (file.content instanceof Blob) {
                fileToUpload = new File([file.content], file.name, { type: file.type });
            } else {
                throw new Error('Unsupported file content type');
            }

            formData.append('file', fileToUpload);

            // Add pinning options
            formData.append('pinataMetadata', JSON.stringify({
                name: file.name,
                keyvalues: {
                    ...options.metadata,
                    uploadedAt: new Date().toISOString(),
                }
            }));

            formData.append('pinataOptions', JSON.stringify({
                cidVersion: 0,
                wrapWithDirectory: false,
            }));

            const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
                method: 'POST',
                headers: {
                    'pinata_api_key': this.apiKey,
                    'pinata_secret_api_key': this.apiKey, // Pinata uses the same key for both
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Pinata upload failed: ${response.status} - ${errorData.error || response.statusText}`);
            }

            const result = await response.json();
            const hash = result.IpfsHash;

            return {
                success: true,
                hash,
                url: `${this.gatewayUrl}${hash}`,
            };
        } catch (error) {
            console.error('Pinata upload error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    async uploadFiles(files: IPFSFile[], options: IPFSUploadOptions = {}): Promise<IPFSUploadResult[]> {
        const uploadPromises = files.map(file => this.uploadFile(file, options));
        return Promise.all(uploadPromises);
    }
}
