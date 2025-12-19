import { z } from 'zod'
import { ApiResponse } from '~~/server/utils/ApiResponse'
import authenticated from '~~/server/utils/middleware/authenticated'
import { unlink } from 'fs/promises'
import { join } from 'path'

const allowedCollections = ['avatar', 'music'] as const
type Collection = typeof allowedCollections[number]

const bodySchema = z.object({
    path: z.string().min(1, 'File path is required'),
})

export default eventHandler({
    onRequest: [authenticated],
    handler: async (event) => {
        const collection = getRouterParam(event, 'collection') as Collection

        // Validate collection
        if (!collection || !allowedCollections.includes(collection)) {
            return ApiResponse.error(400, `Invalid collection. Allowed: ${allowedCollections.join(', ')}`)
        }

        const { path } = await readValidatedBody(event, bodySchema.parse)

        // Security: Ensure the path is within the uploads directory
        const expectedPrefix = `/uploads/${collection === 'avatar' ? 'avatars' : 'music'}/`
        if (!path.startsWith(expectedPrefix)) {
            return ApiResponse.error(400, `Invalid file path for collection ${collection}`)
        }

        try {
            // Convert relative path to absolute path
            const fullPath = join(process.cwd(), 'public', path)

            // Delete the file
            await unlink(fullPath)

            return ApiResponse.success({ path }, `${collection} deleted successfully`)
        } catch (e: any) {
            console.error('Delete error:', e)

            if (e.code === 'ENOENT') {
                return ApiResponse.error(404, 'File not found')
            }

            return ApiResponse.error(500, `Failed to delete ${collection}`)
        }
    },
})