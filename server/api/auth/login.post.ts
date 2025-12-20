import { z } from 'zod'
import { ApiResponse } from "~~/server/http/utils/ApiResponse";
import { User } from "~~/server/models/User";
import unauthenticated from "~~/server/http/middleware/unauthenticated";

const bodySchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
})

export default eventHandler({
    onRequest: [unauthenticated],
    handler: async (event) => {
        const { email, password } = await readValidatedBody(event, bodySchema.parse)

        // Use the Laravel-style authenticate method
        const user = await Auth.challenge(email, password)

        if (!user) {
            return ApiResponse.error(401, 'Invalid credentials')
        }

        // Establish a session with Auth utils
        await setUserSession(event, {
            user: user,
            extendedAt: Date.now(),
        })

        return ApiResponse.success('Logged in successfully')
    },
})

