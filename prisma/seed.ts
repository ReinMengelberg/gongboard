import { PrismaClient } from '../app/generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminEmail || !adminPassword) {
        throw new Error('Missing ADMIN_EMAIL or ADMIN_PASSWORD environment variables.')
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10)

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