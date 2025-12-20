import { Model } from "~~/server/models/BaseModel";
import { HasMedia } from "~~/server/traits/HasMedia";
import type {H3Event} from "h3";
import type { MediaCollection } from "~~/server/traits/HasMedia";
import {Lost} from "~~/server/models/Lost";
import {Lead} from "~~/server/models/Lead";
import {Meeting} from "~~/server/models/Meeting";
import {Sale} from "~~/server/models/Sale";
import UserPolicy from "~~/server/policies/UserPolicy";

export interface User {
    id: number;
    name: string;
    email: string;
    admin: boolean;
    avatar: string | string[];
    sound: string | string[];
    drop: number;
    verified_at: string;

    // Relations
    lost: Lost[];
    leads: Lead[];
    meetings: Meeting[];
    sales: Sale[];

    created_at: string;
    updated_at: string;
}

const ModelWithTraits = HasMedia(Model);

export class User extends ModelWithTraits {
    protected static modelName = "User";
    protected static policy = UserPolicy

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
    ];

    /**
     * Functions
     */

    public static async verifyUser(userId: number): Promise<void> {
        await this.update(userId, { verified_at: new Date().toISOString() });
    }

    static async isAdmin(event: H3Event): Promise<boolean> {
        const session = await getUserSession(event)
        const sessionUser = session?.user as { admin?: boolean } | undefined
        return sessionUser?.admin ?? false
    }

    /**
     * Relation getters
     */
    public async getLost() {
        return this.with({ lost: true }).first({ id: this.id });
    }

    public async getLeads() {
        return this.with({ leads: true }).first({ id: this.id });
    }

    public async getMeetings() {
        return this.with({ meetings: true }).first({ id: this.id });
    }

    public async getSales() {
        return this.with({ meetings: true }).first({ id: this.id });
    }

    /**
     * Authorization
     */
    public can(permission: string, model: typeof Model): boolean {
        const policy = model.getPolicy();
        if (!policy) {
            throw new Error(`No policy found for model ${model.name}`);
        }
        const policyInstance = new policy();
        if (typeof policyInstance[permission] !== 'function') {
            throw new Error(`Permission method '${permission}' not found in policy for ${model.name}`);
        }
        return policyInstance[permission](this);
    }

    /**
     * Media
     */
    static override mediaCollections(): MediaCollection[] {
        return [
            {
                field: 'avatar',
                accept: ['image/*'],
                maxSize: 10, // 10MB
                singleFile: true
            },
            {
                field: 'sound',
                accept: ['mp3'],
                maxSize: 10, // 10MB
                singleFile: false
            }
        ];
    }
}

/**
 * Authentication Registration
 */

declare module '#auth-utils' {
    interface User extends User {}

    interface UserSession {
        extendedAt: number
    }
}