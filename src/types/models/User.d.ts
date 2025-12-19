import {Meeting} from "./Meeting";
import {Sale} from "./Sale";
import {Lead} from "./Lead";
import {PhoneCall} from "./Lost"

export interface User {
    id: number;
    name: string;
    email: string;
    admin: boolean;
    password: string;
    verified_at: string;
    created_at: string;
    updated_at: string;

    phone_calls: PhoneCall[];
    leads: Lead[];
    meetings: Meeting[];
    sales: Sale[];
}

declare module '#auth-utils' {
    interface User extends User {}

    interface UserSession {
        // You can also extend the session object itself if needed
        extendedAt: number
    }
}