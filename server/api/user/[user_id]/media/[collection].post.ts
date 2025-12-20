import { ApiResponse } from "~~/server/http/utils/ApiResponse";
import { User } from "~~/server/models/User";
import authenticated from "~~/server/http/middleware/authenticated";

export default eventHandler({
    onRequest: [authenticated],
    handler: async (event) => {
        try {
            const idParam = getRouterParam(event, 'user_id')
            const collectionParam = getRouterParam(event, 'collection')
            const id = idParam ? Number(idParam) : NaN

            if (!idParam || Number.isNaN(id)) {
                return ApiResponse.error(400, 'Invalid user id')
            }

            if (!collectionParam) {
                return ApiResponse.error(400, 'Missing collection parameter')
            }

            // Check if user exists
            const targetUser: User | null = await User.find(id)
            if (!targetUser) {
                return ApiResponse.error(404, 'User not found')
            }

            // Authorization check
            const auth = await Auth.user(event)
            if (!auth?.can('update', targetUser)) {
                return ApiResponse.error(403, 'Forbidden')
            }

            // Validate field is configured
            const collection = User.mediaCollections().find(f => f.field === collectionParam)
            if (!collection) {
                return ApiResponse.error(400, `Invalid media collection: ${collectionParam}`)
            }

            // Parse multipart form data
            const form = await readMultipartFormData(event)
            if (!form) {
                return ApiResponse.error(400, 'No file uploaded')
            }

            // Extract file
            const fileEntry = form.find(item => item.name === 'file')
            if (!fileEntry) {
                return ApiResponse.error(400, 'Missing file')
            }

            const filename = fileEntry.filename || 'upload'
            const contentType = fileEntry.type

            // Validate file type
            const fileExt = filename.includes('.')
                ? filename.substring(filename.lastIndexOf('.') + 1).toLowerCase()
                : ''

            const isValidType = collection.accept.some(acceptType => {
                if (acceptType.endsWith('/*')) {
                    // Handle wildcards like 'image/*'
                    const category = acceptType.split('/')[0]
                    return contentType?.startsWith(category + '/') ?? false
                }
                return acceptType === fileExt || contentType === acceptType
            })

            if (!isValidType) {
                return ApiResponse.error(400, `Invalid file type. Accepted: ${collection.accept.join(', ')}`)
            }

            // Validate file size (maxSize is in MB)
            const maxSizeBytes = collection.maxSize * 1024 * 1024
            if (fileEntry.data.length > maxSizeBytes) {
                return ApiResponse.error(400, `File too large. Maximum size: ${collection.maxSize}MB`)
            }

            // Save media
            const mediaPath = await User.saveMedia(
                id,
                collectionParam,
                fileEntry.data,
                filename,
                contentType
            )

            // Get updated user
            const updatedUser = await User.find(id)

            // Generate signed URL for immediate access
            const signedUrl = await User.getSignedUrl(updatedUser, collectionParam, 3600)

            return ApiResponse.success({
                user: updatedUser,
                mediaPath,
                signedUrl
            }, 'Media uploaded successfully')

        } catch (e: any) {
            console.error('Failed to upload media:', e)
            return ApiResponse.error(500, e.message || 'Failed to upload media')
        }
    },
})