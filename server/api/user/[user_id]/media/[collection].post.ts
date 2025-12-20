import { ApiResponse } from "~~/server/http/utils/ApiResponse";
import { User } from "~~/server/models/User";
import authenticated from "~~/server/http/middleware/authenticated";

export default eventHandler({
    onRequest: [authenticated],
    handler: async (event) => {
        try {
            const idParam = getRouterParam(event, 'user_id')
            const id = idParam ? Number(idParam) : NaN

            if (!idParam || Number.isNaN(id)) {
                return ApiResponse.error(400, 'Invalid user id')
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

            // Parse multipart form data
            const form = await readMultipartFormData(event)
            if (!form) {
                return ApiResponse.error(400, 'No file uploaded')
            }

            // Extract field name and file
            const fieldEntry = form.find(item => item.name === 'field')
            const fileEntry = form.find(item => item.name === 'file')

            if (!fieldEntry || !fileEntry) {
                return ApiResponse.error(400, 'Missing field name or file')
            }

            const field = fieldEntry.data.toString('utf-8')
            const filename = fileEntry.filename || 'upload'

            // Validate field is configured
            const collection = User.mediaCollections().find(f => f.field === field)
            if (!collection) {
                return ApiResponse.error(400, `Invalid media field: ${field}`)
            }

            // Validate file type
            const fileExt = filename.includes('.')
                ? filename.substring(filename.lastIndexOf('.') + 1).toLowerCase()
                : ''

            const isValidType = collection.accept.some(acceptType => {
                if (acceptType.endsWith('/*')) {
                    // Handle wildcards like 'image/*'
                    const category = acceptType.split('/')[0]
                    return fileEntry.type?.startsWith(category + '/') ?? false
                }
                return acceptType === fileExt || fileEntry.type === acceptType
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
            const mediaPath = await User.saveMedia(id, field, fileEntry.data, filename)

            // Get updated user
            const updatedUser = await User.find(id)

            return ApiResponse.success({
                user: updatedUser,
                mediaPath
            }, 'Media uploaded successfully')

        } catch (e: any) {
            console.error('Failed to upload media:', e)
            return ApiResponse.error(500, e.message || 'Failed to upload media')
        }
    },
})