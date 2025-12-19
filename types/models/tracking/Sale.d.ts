import {User} from "~/src/types/models/User";
import type {Meeting} from "~/src/types/models/Meeting";

export type Sale = {
    id: number;

    external_id: string;
    name: string | null;
    company: string;

    date: string;
    meeting: Meeting;
    user: User

    created_at: string;
    updated_at: string;
}