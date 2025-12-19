import {defineEventHandler, setResponseStatus} from 'h3'
import {ApiResponse} from '~~/server/http/ApiResponse'

export default defineEventHandler(async (event) => {
    const path = getRequestURL(event).pathname
    const method = getMethod(event)
    if (!path.startsWith('/api') || method === 'OPTIONS') {
        return
    }

    const session = await getUserSession(event)

    // Must be authenticated
    if (!session?.user) {
        setResponseStatus(event, 401)
        return ApiResponse.error(401, 'Unauthenticated')
    }

    // Must be admin
    if (!session.user.admin) {
        setResponseStatus(event, 403)
        return ApiResponse.error(403, 'Admin only')
    }

    // Continue to the next handler if authenticated and admin
})