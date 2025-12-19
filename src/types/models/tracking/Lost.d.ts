import {User} from "./User";

export type Lost = {
    id: number;

    external_id: string;
    name: string;
    company: string;

    reason: string;
    user: User

    created_at: string;
    updated_at: string;
}