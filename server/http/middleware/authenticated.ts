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

    if (!isAuthenticated) {
        setResponseStatus(event, 401)
        return ApiResponse.error(401, 'Unauthenticated')
    }

    // Continue to the next handler if authenticated
})