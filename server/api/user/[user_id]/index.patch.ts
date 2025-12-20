import { z } from 'zod'
import { ApiResponse } from "~~/server/http/utils/ApiResponse";
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
        try {
            const idParam = getRouterParam(event, 'user_id')
            const id = idParam ? Number(idParam) : NaN

            if (!idParam || Number.isNaN(id)) {
                return ApiResponse.error(400, 'Invalid user id')
            }

            // Check if user exists
            const targetUser = await User.find(id)
            if (!targetUser) {
                return ApiResponse.error(404, 'User not found')
            }

            // Authorization check
            const auth = await Auth.user(event)
            if (!auth?.can('update', targetUser)) {
                return ApiResponse.error(403, 'Forbidden')
            }

            // Validation
            const body = await readValidatedBody(event, bodySchema.parse)
            const data: any = { ...body }

            // Non-admins cannot escalate privileges
            if (!auth.admin && 'admin' in data) {
                delete data.admin
            }

            // Handle password change
            const confirm = (body as any).new_password_confirm ?? (body as any).confirm_password
            const wantsPasswordChange = !!(body.old_password || body.new_password || confirm)
            if (wantsPasswordChange) {
                if (!body.new_password || !confirm) {
                    return ApiResponse.error(400, 'New password and confirmation are required')
                }
                if (body.new_password !== confirm) {
                    return ApiResponse.error(400, 'New passwords do not match')
                }
                data.password = await Hash.make(body.new_password)
            }

            // Remove transient fields
            delete data.old_password
            delete (data as any).new_password
            delete (data as any).new_password_confirm
            delete (data as any).confirm_password

            // Check for email uniqueness if email is being changed
            if (data.email && data.email !== targetUser.email) {
                const existingUser = await User.where({ email: data.email }).first()
                if (existingUser) {
                    return ApiResponse.error(409, 'A user with the provided email already exists.')
                }
            }

            // Update user
            const user = await User.update(id, data)

            return ApiResponse.success(user, 'User updated')
        } catch (e: any) {
            if (e instanceof z.ZodError) {
                return ApiResponse.error(422, 'Validation failed', e.errors);
            }
            const msg = (e?.message || '').toLowerCase()
            if (msg.includes('unique constraint')) {
                return ApiResponse.error(409, 'A user with the provided unique field already exists.')
            }
            console.error('Failed to update user:', e)
            return ApiResponse.error(500, 'Failed to update user')
        }
    },
})

