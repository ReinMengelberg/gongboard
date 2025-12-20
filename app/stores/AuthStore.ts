import {defineStore} from 'pinia'
import AuthService, {type LoginRequest} from '../services/api/AuthService'
import type {User} from "~~/server/models/User";
import NotificationService from '../services/utils/NotificationService'
import ErrorService from '../services/utils/ErrorService'

let authService: AuthService | null = null
let userSession: ReturnType<typeof useUserSession> | null = null

function ensureServices() {
    if (!authService) authService = new AuthService()
    if (!userSession) userSession = useUserSession()
    return {
        authService,
        userSession
    }
}

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null as User | null,
        loggedIn: null,
        needsRefresh: false,
        loading: false,
        error: null
    }),

    getters: {
        isAuthenticated: (state) => !!state.user,
        currentUser: (state) => state.user,
        isAdmin: (state) => !!state.user?.admin, // <- make null-safe
    },

    actions: {
        async login(credentials: LoginRequest): Promise<boolean> {
            this.loading = true
            this.error = null
            try {
                const authService = new AuthService()
                const response = await authService.login(credentials)
                if (response.success) {
                    NotificationService.showSuccess('Logged in successfully.')
                    await this.fetchUser()
                    navigateTo('/app/home')
                    return true
                }
                return false
            } catch (error: any) {
                this.error = error.message
                console.log('FAILED TO LOGIN', error)
                return ErrorService.returnFalse(error, error?.message || 'Login failed.')
            } finally {
                this.loading = false
            }
        },

        async fetchUser(): Promise<boolean> {
            this.loading = true
            try {
                const session = useUserSession()

                // Ensure the session is current (fetch is available on client)
                if (typeof (session as any).fetch === 'function') {
                    await (session as any).fetch()
                }

                this.user = (session.user.value as User) ?? null
                return true
            } catch (error: any) {
                this.error = error.message
                return ErrorService.returnFalse(error, error?.message || 'Failed to fetch user.')
            } finally {
                this.loading = false
            }
        },

        async logout(): Promise<boolean> {
            this.loading = true
            try {
                const authService = new AuthService()
                const response = await authService.logout()
                if (response.success) {
                    this.user = null
                    NotificationService.showInfo('Logged out.')
                    navigateTo('/auth/login')
                    return true
                }
                return false
            } catch (error: any) {
                this.error = error.message
                return ErrorService.returnFalse(error, error?.message || 'Logout failed.')
            } finally {
                this.loading = false
            }
        }
    }
})
