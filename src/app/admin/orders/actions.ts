'use server'

import { prisma } from "@/lib/prisma"
import { OrderStatus, PaymentStatus } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { startOfDay, endOfDay, subHours } from "date-fns"

export async function getOrders(dateStr?: string) {
    try {
        const date = dateStr ? new Date(dateStr) : new Date()
        const start = startOfDay(date)
        const end = endOfDay(date)

        // Lazy Auto Cancel Check: Only for ACTIVE, UNPAID orders passed deadline
        // Better to do this in specific cron or robust trigger, but for MVP, check on read.
        // Or cleaner: Don't modify DB on Read, just visual.
        // User asked "Automatic cancellation proceeds".
        // Let's implement active update.

        // Update expired orders
        await prisma.order.updateMany({
            where: {
                status: 'PENDING',
                paymentStatus: 'UNPAID',
                paymentDeadline: {
                    lt: new Date()
                },
                paymentNotified: false
            },
            data: {
                status: 'CANCELLED'
            }
        })

        const orders = await prisma.order.findMany({
            where: {
                createdAt: {
                    gte: start,
                    lte: end
                }
            },
            include: {
                items: true // OrderItem stores productName, price, etc.
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return { success: true, data: orders }
    } catch (error) {
        console.error("Failed to fetch orders:", error)
        return { success: false, error: "주문 목록을 불러오지 못했습니다." }
    }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
    try {
        // If cancelling, restore/increment sold quantity (Refund stock)
        if (status === 'CANCELLED') {
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                include: { items: true }
            })

            if (order && order.status !== 'CANCELLED') {
                // Restore Loop
                for (const item of order.items) {
                    if (item.menuPlanId) {
                        await prisma.menuPlan.update({
                            where: { id: item.menuPlanId },
                            data: { soldQuantity: { decrement: item.quantity } }
                        })
                    }
                }
            }
        }
        // If restoring from CANCELLED to active state (Un-cancel), consume stock again
        else {
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                include: { items: true }
            })

            if (order && order.status === 'CANCELLED') {
                // Consume Loop (Re-apply stock usage)
                for (const item of order.items) {
                    if (item.menuPlanId) {
                        await prisma.menuPlan.update({
                            where: { id: item.menuPlanId },
                            data: { soldQuantity: { increment: item.quantity } }
                        })
                    }
                }
            }
        }

        await prisma.order.update({
            where: { id: orderId },
            data: { status }
        })

        revalidatePath('/admin/orders')
        return { success: true }
    } catch (error) {
        console.error("Failed to update order status:", error)
        return { success: false, error: "상태 변경 실패" }
    }
}

export async function confirmOrderPayment(orderId: string) {
    try {
        await prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'CONFIRMED',
                paymentStatus: 'PAID'
            }
        })
        revalidatePath('/admin/orders')
        return { success: true }
    } catch (error) {
        console.error("Failed to confirm payment:", error)
        return { success: false, error: "입금 확인 처리 실패" }
    }
}

export async function extendPaymentDeadline(orderId: string) {
    try {
        // Fetch current to add 1 hour
        const order = await prisma.order.findUnique({ where: { id: orderId } })
        if (!order || !order.paymentDeadline) return { success: false, error: "주문을 찾을 수 없습니다." }

        const newDeadline = new Date(order.paymentDeadline.getTime() + 60 * 60 * 1000)

        await prisma.order.update({
            where: { id: orderId },
            data: { paymentDeadline: newDeadline }
        })
        revalidatePath('/admin/orders')
        return { success: true }
    } catch (error) {
        console.error("Failed to extend deadline:", error)
        return { success: false, error: "연장 실패" }
    }
}
