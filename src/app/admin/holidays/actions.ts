'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export type HolidayRecord = {
    id: string
    date: Date
    type: "PUBLIC" | "REGULAR" | "TEMPORARY"
    category: string
    reason: string | null
    isStoreClosed: boolean
}

export async function getHolidays(year: number, month?: number) {
    try {
        let startDate, endDate

        if (month !== undefined) {
            // Fetch for a specific month
            startDate = new Date(Date.UTC(year, month, 1))
            endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59))
        } else {
            // Fetch for the whole year
            startDate = new Date(Date.UTC(year, 0, 1))
            endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59))
        }

        const holidays = await prisma.holiday.findMany({
            where: {
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            orderBy: {
                date: 'asc'
            }
        })

        return { success: true, data: holidays as HolidayRecord[] }
    } catch (error) {
        console.error("Failed to fetch holidays:", error)
        return { success: false, error: "일정 목록을 불러오지 못했습니다." }
    }
}

export async function upsertHoliday(data: {
    date: string
    category: string
    reason: string
    isStoreClosed: boolean
    type?: "PUBLIC" | "REGULAR" | "TEMPORARY"
}) {
    try {
        const targetDate = new Date(data.date)
        targetDate.setUTCHours(0, 0, 0, 0)

        const existing = await prisma.holiday.findUnique({
            where: { date: targetDate }
        })

        if (existing) {
            await prisma.holiday.update({
                where: { id: existing.id },
                data: {
                    category: data.category,
                    reason: data.reason,
                    isStoreClosed: data.isStoreClosed,
                    type: data.type || "TEMPORARY"
                }
            })
        } else {
            await prisma.holiday.create({
                data: {
                    date: targetDate,
                    category: data.category,
                    reason: data.reason,
                    isStoreClosed: data.isStoreClosed,
                    type: data.type || "TEMPORARY"
                }
            })
        }

        revalidatePath("/admin/holidays")
        return { success: true }
    } catch (error) {
        console.error("Failed to upsert holiday:", error)
        return { success: false, error: "일정 저장에 실패했습니다." }
    }
}

export async function deleteHoliday(dateString: string) {
    try {
        const targetDate = new Date(dateString)
        targetDate.setUTCHours(0, 0, 0, 0)

        await prisma.holiday.delete({
            where: { date: targetDate }
        })

        revalidatePath("/admin/holidays")
        return { success: true }
    } catch (error) {
        console.error("Failed to delete holiday:", error)
        return { success: false, error: "일정 삭제에 실패했습니다." }
    }
}
