// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    devtools: {enabled: true},
    css: [
        '~/assets/css/tailwind.css',
        'remixicon/fonts/remixicon.css',
    ],
    vite: {
        plugins: [
            tailwindcss(),
        ],
    },
    runtimeConfig: {
        s3Region: process.env.S3_REGION || 'us-east-1',
        s3Endpoint: process.env.S3_ENDPOINT, // For R2 or custom S3 endpoint
        s3Bucket: process.env.S3_BUCKET,
        s3AccessKeyId: process.env.S3_ACCESS_KEY_ID,
        s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
    routeRules: {
        '/': { redirect: '/app/home' },
    },

    modules: [
        'shadcn-nuxt',
        'nuxt-auth-utils',
        '@pinia/nuxt',
        '@nuxtjs/color-mode',
    ],

    colorMode: {
        classSuffix: '',
        preference: 'system',
        fallback: 'light',
        storageKey: 'nuxt-color-mode'
    },

    shadcn: {
        /**
         * Prefix for all the imported component.
         * @default "Ui"
         */
        prefix: '',
        /**
         * Directory that the component lives in.
         * Will respect the Nuxt aliases.
         * @link https://nuxt.com/docs/api/nuxt-config#alias
         * @default "@/components/ui"
         */
        componentDir: '@/components/ui'
    },

    postcss: {
        plugins: {
            '@tailwindcss/postcss': {
                config: {
                    darkMode: 'selector'
                }
            }
        }
    }
})