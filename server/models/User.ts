import { Model } from "~~/server/models/utils/BaseModel"
import type { User as PrismaUser } from '@prisma/client'
import { HasMedia } from "~~/server/traits/HasMedia"
import type { H3Event } from "h3"
import type { MediaCollection } from "~~/server/traits/HasMedia"
import { Lost } from "~~/server/models/Lost"
import { Lead } from "~~/server/models/Lead"
import { Meeting } from "~~/server/models/Meeting"
import { Sale } from "~~/server/models/Sale"
import UserPolicy from "~~/server/policies/UserPolicy"

export class User extends HasMedia(Model) {
    protected static modelName = "User"
    protected static policy = UserPolicy

    declare id: number
    declare name: string
    declare email: string
    declare admin: boolean
    declare avatar: string | string[]
    declare sound: string | string[]
    declare drop: number
    declare verified_at: string
    declare created_at: string
    declare updated_at: string
    declare lost?: Lost[]
    declare leads?: Lead[]
    declare meetings?: Meeting[]
    declare sales?: Sale[]

    protected static override fillable = [
        'name',
        'email',
        'password',
        'drop',
        'avatar',
        'sound',
    ]

    protected static override hidden = [
        'password'
    ]

    /**
     * Instance method to verify this user
     */
    public async verify(): Promise<void> {
        this.verified_at = new Date().toISOString()
        await this.save()
    }

    static async isAdmin(event: H3Event): Promise<boolean> {
        const session = await getUserSession(event)
        const sessionUser = session?.user as { admin?: boolean } | undefined
        return sessionUser?.admin ?? false
    }

    /**
     * Authorization
     */
    public can(permission: string, instance: Model): boolean {
        const modelClass = instance.constructor as typeof Model
        const policy = modelClass.getPolicy()
        if (!policy) {
            throw new Error(`No policy found for model ${modelClass.name}`)
        }
        const policyInstance = new policy()
        if (typeof policyInstance[permission] !== 'function') {
            throw new Error(`Permission method '${permission}' not found in policy for ${modelClass.name}`)
        }
        return policyInstance[permission](this, instance)
    }

    /**
     * Media
     */
    static override mediaCollections(): MediaCollection[] {
        return [
            {
                field: 'avatar',
                accept: ['image/*'],
                maxSize: 10,
            },
            {
                field: 'sound',
                accept: ['mp3'],
                maxSize: 10,
            }
        ]
    }
}

/**
 * Authentication Registration
 */

declare module '#auth-utils' {
    interface User extends PrismaUser {}

    interface UserSession {
        extendedAt: number
    }
}