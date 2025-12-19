// server/utils/fileUpload.ts
import { MultiPartData } from 'h3'
import { randomUUID } from 'crypto'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export interface UploadedFile {
    path: string      // Relative path to store in DB
    fullPath: string  // Absolute path on disk
    filename: string
    size: number
    mimetype?: string
}

export async function saveUploadedFile(
    file: MultiPartData,
    model: string,
    modelId: number | string,
    collection: string
): Promise<UploadedFile> {
    // Generate unique filename
    const ext = file.filename?.split('.').pop() || ''
    const filename = `${randomUUID()}.${ext}`

    // Create upload directory: /uploads/{model}/{model_id}/{collection}/
    const uploadDir = join(process.cwd(), 'public', 'uploads', model, String(modelId), collection)
    await mkdir(uploadDir, { recursive: true })

    // Save file
    const fullPath = join(uploadDir, filename)
    await writeFile(fullPath, file.data)

    return {
        path: `/uploads/${model}/${modelId}/${collection}/${filename}`,
        fullPath,
        filename,
        size: file.data.length,
        mimetype: file.type,
    }
}

export const allowedAudioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg']
export const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

export function validateFileType(file: MultiPartData, allowedTypes: string[]): boolean {
    return file.type ? allowedTypes.includes(file.type) : false
}