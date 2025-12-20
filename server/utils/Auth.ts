import type { H3Event } from 'h3'
import { User } from '~~/server/models/User'
import type { User as PrismaUser } from '@prisma/client'

export class Auth {
    /**
     * Get the authenticated user from the session
     */
    static async user(event: H3Event): Promise<PrismaUser | null> {
        const session = await getUserSession(event)
        const sessionUser = session?.user as { id: number } | undefined
        if (!sessionUser?.id) {
            return null
        }
        return await User.find<PrismaUser>(sessionUser.id)
    }

    /**
     * Get the authenticated user's ID
     */
    static async id(event: H3Event): Promise<number | null> {
        const session = await getUserSession(event)
        const sessionUser = session?.user as { id: number } | undefined

        return sessionUser?.id ?? null
    }

    /**
     * Check if the user is authenticated
     */
    static async check(event: H3Event): Promise<boolean> {
        const id = await this.id(event)
        return id !== null
    }

    /**
     * Check if the authenticated user is an admin
     */
    static async isAdmin(event: H3Event): Promise<boolean> {
        const session = await getUserSession(event)
        const sessionUser = session?.user as { admin?: boolean } | undefined
        return sessionUser?.admin ?? false
    }

    /**
     * Verify password for the authenticated user
     */
    static async validatePassword(event: H3Event, password: string): Promise<boolean> {
        const user = await this.user(event)
        if (!user) {
            return false
        }
        return await (user as any).validatePassword(password)
    }
}