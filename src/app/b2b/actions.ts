'use server'

import { prisma } from "@/lib/prisma"
import { isOrderDeadlinePassed, getKSTRange } from "@/lib/utils"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getSystemPolicy } from "@/app/admin/settings/actions"

const COOKIE_NAME = "philmong_b2b_session"

export async function loginB2BClient(code: string) {
    if (!code) {
        return { success: false, message: "기업 코드를 입력해주세요." }
    }

    try {
        const client = await prisma.client.findFirst({
            where: {
                code: code
            }
        })

        if (!client) {
            return { success: false, message: "존재하지 않는 기업 코드입니다." }
        }

        // Set secure cookie
        const sessionData = JSON.stringify({
            id: client.id,
            name: client.name,
            code: client.code
        })

        const cookieStore = await cookies()
        cookieStore.set(COOKIE_NAME, sessionData, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 60 * 60 * 24 * 7 // 1 week
        })

        return { success: true, clientId: client.id }

    } catch (error) {
        console.error("B2B Login Error:", error)
        return { success: false, message: "로그인 중 오류가 발생했습니다." }
    }
}

export async function getB2BSession() {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(COOKIE_NAME)

    if (!sessionCookie?.value) return null

    try {
        return JSON.parse(sessionCookie.value)
    } catch {
        return null
    }
}



export async function logoutB2B() {
    const cookieStore = await cookies()
    cookieStore.delete(COOKIE_NAME)
    redirect("/b2b/login")
}

export async function getClientOrders(clientId: string, startDate: Date, endDate: Date) {
    if (!clientId) return { success: false, message: "Client ID required" }

    try {
        const orders = await prisma.clientOrder.findMany({
            where: {
                clientId: clientId,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            orderBy: {
                date: 'asc'
            }
        })
        return { success: true, orders }
    } catch (error) {
        console.error("getClientOrders Error:", error)
        return { success: false, message: "주문 목록 조회 실패" }
    }
}


export async function updateClientOrder(clientId: string, date: Date, lunchQty: number, saladQty: number, note?: string) {
    if (!clientId) return { success: false, message: "Client ID required" }

    // Deadline check
    const deadlineHourStr = await getSystemPolicy("B2B_DEADLINE_HOUR", "15")
    const deadlineHour = parseInt(deadlineHourStr)
    const deadlineBasis = await getSystemPolicy("B2B_DEADLINE_BASIS", "PREVIOUS")
    const isSameDay = deadlineBasis === "SAME"

    if (isOrderDeadlinePassed(date, deadlineHour, isSameDay)) {
        const basisText = isSameDay ? "당일" : "전날"
        return { success: false, message: `주문 마감 시간이 지났습니다. (${basisText} ${deadlineHour}시 마감)` }
    }

    try {
        const { start } = getKSTRange(date)

        // Find existing order for logging (Optional: if we want to log, but we are removing logging for now to sync with daily operations)

        await prisma.clientOrder.upsert({
            where: {
                clientId_date: {
                    clientId: clientId,
                    date: start
                }
            },
            update: {
                lunchBoxQuantity: lunchQty,
                saladQuantity: saladQty
            },
            create: {
                clientId: clientId,
                date: start,
                lunchBoxQuantity: lunchQty,
                saladQuantity: saladQty,
                status: "PENDING"
            }
        })

        return { success: true }
    } catch (error) {
        console.error("updateClientOrder Error:", error)
        return { success: false, message: "주문 저장 실패" }
    }
}

export async function updateClientNote(clientId: string, note: string) {
    if (!clientId) return { success: false, message: "Client ID required" }

    try {
        await prisma.client.update({
            where: { id: clientId },
            data: { note }
        })
        return { success: true }
    } catch (error) {
        console.error("updateClientNote Error:", error)
        return { success: false, message: "요청사항 저장 실패" }
    }
}

export async function getClientNote(clientId: string) {
    try {
        const client = await prisma.client.findUnique({
            where: { id: clientId },
            select: { note: true }
        })
        return { success: true, note: client?.note || "" }
    } catch (error) {
        return { success: false, note: "" }
    }
}
