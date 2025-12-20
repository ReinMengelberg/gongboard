import {User} from "./User";

export type Lead = {
    id: number;

    external_id: string;
    name: string;
    company: string;

    user: User

    created_at: string;
    updated_at: string;
}