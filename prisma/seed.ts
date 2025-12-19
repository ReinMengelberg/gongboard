import 'dotenv/config'
import { hash } from 'bcryptjs'
import { PrismaClient } from './generated/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const url = new URL(process.env.DATABASE_URL!)

const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: parseInt(url.port || '3306'),
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    connectionLimit: 1
})

const prisma = new PrismaClient({ adapter })

async function main() {
    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminEmail || !adminPassword) {
        throw new Error('Missing ADMIN_EMAIL or ADMIN_PASSWORD environment variables.')
    }

    const hashedPassword = await hash(adminPassword, 10)

    console.log(`Seeding admin user: ${adminEmail}...`)

    await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            password: hashedPassword,
        },
        create: {
            email: adminEmail,
            name: 'System Admin',
            password: hashedPassword,
            admin: true,
            verified_at: new Date(),
        },
    })

    console.log('Admin user is ready.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })