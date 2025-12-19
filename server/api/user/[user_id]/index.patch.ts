import { z } from 'zod'
import { ApiResponse } from "~~/server/http/ApiResponse";
import { User } from "~~/server/models/User";
import authenticated from "~~/server/http/middleware/authenticated";

const bodySchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    drop: z.number().optional(),
    old_password: z.string().min(8).optional(),
    new_password: z.string().min(8).optional(),
    new_password_confirm: z.string().min(8).optional(),
    admin: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
})

export default eventHandler({
    onRequest: [authenticated],
    handler: async (event) => {
        const idParam = getRouterParam(event, 'user_id')
        const id = idParam ? Number(idParam) : NaN

        if (!idParam || Number.isNaN(id)) {
            return ApiResponse.error(400, 'Invalid user id')
        }

        // AuthZ: determine acting user and permissions
        const session = await getUserSession(event)
        const actor = session?.user as { id: number; admin?: boolean } | undefined
        if (!actor?.id) {
            return ApiResponse.error(401, 'Unauthorized')
        }
        const isAdmin = !!actor.admin
        const isSelf = actor.id === id
        if (!isAdmin && !isSelf) {
            return ApiResponse.error(403, 'Forbidden')
        }

        const body = await readValidatedBody(event, bodySchema.parse)
        const data: any = { ...body }

        // Non-admins cannot escalate privileges
        if (!isAdmin && 'admin' in data) {
            delete data.admin
        }

        // Handle password change if any of the password-related fields are present
        const confirm = (body as any).new_password_confirm ?? (body as any).confirm_password
        const wantsPasswordChange = !!(body.old_password || body.new_password || confirm)

        if (wantsPasswordChange) {
            if (!body.new_password || !confirm) {
                return ApiResponse.error(400, 'New password and confirmation are required')
            }
            if (body.new_password !== confirm) {
                return ApiResponse.error(400, 'New passwords do not match')
            }
            // Hash password using Laravel-style method
            data.password = await User.hashPassword(body.new_password)
        }

        // Remove transient fields so they are not persisted
        delete data.old_password
        delete (data as any).new_password
        delete (data as any).new_password_confirm
        delete (data as any).confirm_password

        try {
            // Check if user exists
            const existingUser = await User.find(id)
            if (!existingUser) {
                return ApiResponse.error(404, 'User not found')
            }

            // Update user using Laravel-style method
            const user = await User.update(id, data)

            // Return user without password
            return ApiResponse.success(user, 'User updated')
        } catch (e: any) {
            const msg = (e?.message || '').toLowerCase()
            if (msg.includes('unique constraint')) {
                return ApiResponse.error(409, 'A user with the provided unique field already exists.')
            }
            return ApiResponse.error(400, 'Failed to update user')
        }
    },
})

