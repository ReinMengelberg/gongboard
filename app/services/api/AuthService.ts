// Auth connects to the resource API endpoints.
import ApiService from "./ApiService";
import type { IApiResponse } from "@/server/utils/ApiResponse";
import type { User } from "@/src/types/models/user";

export interface LoginRequest {
    email: string
    password: string
}

export interface RequestResetRequest {
    email: string
}

export interface PerformResetRequest {
    token: string
    password: string
    password_confirmation: string
}

export default class AuthService extends ApiService {
    protected override namespace = '/api/auth';
    constructor() {
        super()
    }

    // Log in the user
    public login(request: LoginRequest): Promise<IApiResponse<string|null>> {
        return this.post('/login', request)
    }

    // Get the authenticated user
    public user(): Promise<IApiResponse<User|null>> {
        return this.get('/user')
    }

    // Log out the user
    public logout(): Promise<IApiResponse<string|null>> {
        return this.post('/logout')
    }
}
