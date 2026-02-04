'use server'

import { prisma } from "@/lib/prisma"

export async function getAdminUsers(query: string = "") {
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { name: { contains: query } }, // Case sensitive in Postgres usually, but Prisma handles it? checking mode needed for insensitive
                { phone: { contains: query } },
            ]
        },
        orderBy: { createdAt: 'desc' },
        include: {
            _count: {
                select: { orders: true }
            }
        },
        take: 50
    })

    return users
}
