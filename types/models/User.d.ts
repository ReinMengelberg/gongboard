import {Meeting} from "./tracking/Meeting";
import {Sale} from "./tracking/Sale";
import {Lead} from "./tracking/Lead";
import {Lost} from "./tracking/Lost"

export interface User {
    id: number;
    name: string;
    email: string;
    password: string;
    admin: boolean;
    avatar: string;
    verified_at: string;
    created_at: string;
    updated_at: string;

    lost: Lost[];
    leads: Lead[];
    meetings: Meeting[];
    sales: Sale[];
}

declare module '#auth-utils' {
    interface User {
        id: number;
        name: string;
        email: string;
        admin: boolean;
        avatar: string;
        verified_at: string;
        created_at: string;
        updated_at: string;
    }

    interface UserSession {
        // You can also extend the session object itself if needed
        extendedAt: number
    }
}