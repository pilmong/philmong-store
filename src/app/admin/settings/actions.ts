'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getSystemPolicy(key: string, defaultValue: string) {
    try {
        const policy = await prisma.systemPolicy.findUnique({
            where: { key }
        })
        return policy?.value || defaultValue
    } catch (error) {
        console.error(`Failed to get system policy ${key}:`, error)
        return defaultValue
    }
}

export async function updateSystemPolicy(key: string, value: string) {
    try {
        await prisma.systemPolicy.upsert({
            where: { key },
            update: { value },
            create: { key, value }
        })
        revalidatePath('/')
        return { success: true }
    } catch (error) {
        console.error(`Failed to update system policy ${key}:`, error)
        return { success: false, error: "설정 저장에 실패했습니다." }
    }
}
