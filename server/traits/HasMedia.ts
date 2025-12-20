import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export interface MediaCollection {
    field: string;
    accept: string[];
    maxSize: number;
}

// Initialize S3 client (can be S3 or R2)
const getS3Client = () => {
    const config = useRuntimeConfig()
    return new S3Client({
        region: config.s3Region || 'auto',
        endpoint: config.s3Endpoint, // For R2: https://<account-id>.r2.cloudflarestorage.com
        credentials: {
            accessKeyId: config.s3AccessKeyId,
            secretAccessKey: config.s3SecretAccessKey,
        },
    })
}

export function HasMedia<T extends abstract new (...args: any[]) => any>(Base: T) {
    abstract class MediaMixin extends Base {
        static mediaCollections(): MediaCollection[] {
            return [];
        }

        static getModelName(): string {
            return this.name.toLowerCase();
        }

        static getMediaPath(record: any, field: string): string | null {
            const collection = this.mediaCollections().find(f => f.field === field);
            if (!collection) {
                throw new Error(`Media collection '${field}' not configured`);
            }

            const value = record[field];
            if (!value) return null;

            return typeof value === 'string' ? value : null;
        }

        static getStorageKey(id: number | string, field: string, filename: string): string {
            const modelName = this.getModelName();
            return `media/${modelName}/${id}/${field}/${filename}`;
        }

        /**
         * Generate a signed URL for private media access
         * @param mediaPath - The storage key/path of the media
         * @param expiresIn - Expiration time in seconds (default: 1 hour)
         */
        static async getSignedMediaUrl(mediaPath: string, expiresIn: number = 3600): Promise<string> {
            if (!mediaPath) {
                throw new Error('Media path is required');
            }

            const config = useRuntimeConfig()
            const s3Client = getS3Client()

            const storageKey = mediaPath.startsWith('/') ? mediaPath.substring(1) : mediaPath

            const command = new GetObjectCommand({
                Bucket: config.s3Bucket,
                Key: storageKey,
            })

            return await getSignedUrl(s3Client, command, { expiresIn })
        }

        /**
         * Get signed URL for a specific field on a record
         */
        static async getSignedUrl(record: any, field: string, expiresIn: number = 3600): Promise<string | null> {
            const mediaPath = this.getMediaPath(record, field)
            if (!mediaPath) return null

            return await this.getSignedMediaUrl(mediaPath, expiresIn)
        }

        static async saveMedia(
            id: number | string,
            field: string,
            fileBuffer: Buffer,
            filename: string,
            contentType?: string
        ): Promise<string> {
            const collection = this.mediaCollections().find(f => f.field === field);
            if (!collection) {
                throw new Error(`Media collection '${field}' not configured`);
            }

            // @ts-ignore - static methods from BaseModel
            const record = await this.find(id);
            if (!record) {
                throw new Error(`Record with id ${id} not found`);
            }

            // Delete existing file if present
            const existingMedia = this.getMediaPath(record, field);
            if (existingMedia) {
                await this.deleteMediaFile(existingMedia);
            }

            // Generate unique filename
            const timestamp = Date.now();
            const ext = filename.includes('.') ? filename.substring(filename.lastIndexOf('.')) : '';
            const basename = filename.includes('.') ? filename.substring(0, filename.lastIndexOf('.')) : filename;
            const uniqueFilename = `${basename}-${timestamp}${ext}`;

            const storageKey = this.getStorageKey(id, field, uniqueFilename);

            // Upload to S3
            const config = useRuntimeConfig()
            const s3Client = getS3Client()

            await s3Client.send(new PutObjectCommand({
                Bucket: config.s3Bucket,
                Key: storageKey,
                Body: fileBuffer,
                ContentType: contentType,
            }))

            const relativePath = storageKey;

            // Update database with storage key
            // @ts-ignore - static methods from BaseModel
            await this.update(id, { [field]: relativePath });

            return relativePath;
        }

        static async deleteMediaFile(mediaPath: string): Promise<void> {
            const storageKey = mediaPath.startsWith('/') ? mediaPath.substring(1) : mediaPath;
            const config = useRuntimeConfig()
            const s3Client = getS3Client()

            try {
                await s3Client.send(new DeleteObjectCommand({
                    Bucket: config.s3Bucket,
                    Key: storageKey,
                }))
            } catch (error) {
                console.warn(`Failed to delete file: ${storageKey}`, error);
            }
        }

        static async deleteMedia(id: number | string, field: string): Promise<void> {
            // @ts-ignore - static methods from BaseModel
            const record = await this.find(id);
            if (!record) {
                throw new Error(`Record with id ${id} not found`);
            }

            const collection = this.mediaCollections().find(f => f.field === field);
            if (!collection) {
                throw new Error(`Media collection '${field}' not configured`);
            }

            const existingMedia = this.getMediaPath(record, field);

            if (existingMedia) {
                await this.deleteMediaFile(existingMedia);
            }

            // @ts-ignore - static methods from BaseModel
            await this.update(id, { [field]: null });
        }

        static async replaceMedia(
            id: number | string,
            field: string,
            fileBuffer: Buffer,
            filename: string,
            contentType?: string
        ): Promise<string> {
            return await this.saveMedia(id, field, fileBuffer, filename, contentType);
        }

        static async getMediaBuffer(mediaPath: string): Promise<Buffer | null> {
            if (!mediaPath) {
                return null;
            }

            const storageKey = mediaPath.startsWith('/') ? mediaPath.substring(1) : mediaPath;
            const config = useRuntimeConfig()
            const s3Client = getS3Client()

            try {
                const response = await s3Client.send(new GetObjectCommand({
                    Bucket: config.s3Bucket,
                    Key: storageKey,
                }))

                const stream = response.Body as any
                const chunks: Buffer[] = []

                for await (const chunk of stream) {
                    chunks.push(chunk)
                }

                return Buffer.concat(chunks)
            } catch (error) {
                console.warn(`Failed to get file: ${storageKey}`, error);
                return null;
            }
        }
    }

    return MediaMixin;
}