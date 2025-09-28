import { IPFSFile, IPFSProviderService, IPFSUploadOptions, IPFSUploadResult } from './types';

export class FilebaseService implements IPFSProviderService {
    private apiKey: string;
    private gatewayUrl: string;

    constructor(config: { apiKey: string; gatewayUrl?: string }) {
        this.apiKey = config.apiKey;
        this.gatewayUrl = config.gatewayUrl || 'https://gateway.filebase.io/ipfs/';
    }

    async uploadFile(file: IPFSFile, _options: IPFSUploadOptions = {}): Promise<IPFSUploadResult> {
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

            // Filebase API endpoint
            const response = await fetch('https://api.filebase.io/v1/ipfs/pins', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'multipart/form-data',
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Filebase upload failed: ${response.status} - ${errorData.error || response.statusText}`);
            }

            const result = await response.json();
            const hash = result.cid;

            return {
                success: true,
                hash,
                url: `${this.gatewayUrl}${hash}`,
            };
        } catch (error) {
            console.error('Filebase upload error:', error);
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
