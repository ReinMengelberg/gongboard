import {defineEventHandler, setResponseStatus} from 'h3'
import {ApiResponse} from '~~/server/http/utils/ApiResponse'
import {Auth} from '~~/server/utils/Auth'

export default defineEventHandler(async (event) => {
    const path = getRequestURL(event).pathname
    const method = getMethod(event)
    if (!path.startsWith('/api') || method === 'OPTIONS') {
        return
    }

    const isAuthenticated = await Auth.check(event)

    // If the user is authenticated, block access to unauthenticated-only routes
    if (isAuthenticated) {
        setResponseStatus(event, 400)
        return ApiResponse.error(400, 'Only unauthenticated')
    }

    // Continue to the next handler if NOT authenticated
})
