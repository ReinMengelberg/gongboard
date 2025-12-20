import {User} from "./User";

export type Meeting = {
    id: number;

    external_id: string;
    name: string;
    company: string;

    date: string;
    user: User

    created_at: string;
    updated_at: string;
}