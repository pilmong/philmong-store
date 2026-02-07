'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

import { B2BPaymentMethod, B2BPaymentTiming } from "@prisma/client"

export type ClientInput = {
    name: string
    code?: string
    manager?: string
    contact?: string
    address?: string
    note?: string
    paymentMethod?: B2BPaymentMethod
    paymentTiming?: B2BPaymentTiming
    paymentDay?: number | null
}

export async function getClients() {
    try {
        const clients = await prisma.client.findMany({
            orderBy: { name: 'asc' }
        })
        return { success: true, data: clients }
    } catch (error) {
        console.error("Failed to fetch clients:", error)
        return { success: false, error: "Failed to fetch clients" }
    }
}

export async function upsertClient(id: string | null, data: ClientInput) {
    try {
        if (id) {
            // Update
            await prisma.client.update({
                where: { id },
                data
            })
        } else {
            // Create
            // If code is not provided, generate one or error? 
            // unique constraint on code might fail if empty string passed?
            // Let's assume code is optional but if provided must be unique.
            // If empty string, set undefined to avoid unique constraint error on empty strings if multiple? 
            // Logic: if code is empty string, make it null or UUID part.
            // For now, let's treat code as optional string.

            await prisma.client.create({
                data: {
                    ...data,
                    code: data.code || undefined // if empty, prisma might insert default? no default.
                    // If code is "" and multiple clients have "", unique constraint error.
                    // Let's handle generic random code if missing.
                }
            })
        }
        revalidatePath('/admin/clients')
        return { success: true }
    } catch (error) {
        console.error("Failed to upsert client:", error)
        return { success: false, error: "저장 중 오류가 발생했습니다." }
    }
}

export async function deleteClient(id: string) {
    try {
        await prisma.client.delete({ where: { id } })
        revalidatePath('/admin/clients')
        return { success: true }
    } catch (error) {
        return { success: false, error: "삭제 실패" }
    }
}

// Client Orders

export async function getClient(id: string) {
    try {
        const client = await prisma.client.findUnique({ where: { id } })
        return { success: true, data: client }
    } catch {
        return { success: false }
    }
}

import { startOfWeek, endOfWeek } from "date-fns"

export async function getClientOrders(clientId: string, date: Date) {
    try {
        const start = startOfWeek(date, { weekStartsOn: 1 }) // Monday
        const end = endOfWeek(date, { weekStartsOn: 1 })

        const orders = await prisma.clientOrder.findMany({
            where: {
                clientId,
                date: {
                    gte: start,
                    lte: end
                }
            }
        })
        return { success: true, data: orders }
    } catch (error) {
        console.error(error)
        return { success: false, error: "주문 조회 실패" }
    }
}

export type OrderInput = {
    date: Date
    lunchBoxQuantity: number
    saladQuantity: number
    note?: string
}

export async function upsertClientOrder(clientId: string, data: OrderInput) {
    try {
        // Upsert based on composite key (clientId_date) is tricky in Prisma upsert if not primary key?
        // But we have @@unique([clientId, date])
        // Let's use upsert with unique where.

        await prisma.clientOrder.upsert({
            where: {
                clientId_date: {
                    clientId,
                    date: data.date
                }
            },
            update: {
                lunchBoxQuantity: data.lunchBoxQuantity,
                saladQuantity: data.saladQuantity,
                note: data.note
            },
            create: {
                clientId,
                date: data.date,
                lunchBoxQuantity: data.lunchBoxQuantity,
                saladQuantity: data.saladQuantity,
                note: data.note,
                status: 'PENDING'
            }
        })

        // No path revalidation here as we manage state in client component usually for week view, 
        // but revalidating the page is good practice.
        revalidatePath(`/admin/clients/${clientId}/orders`)
        return { success: true }
    } catch (error) {
        console.error(error)
        return { success: false, error: "저장 실패" }
    }
}
