'use server'

import { prisma } from "@/lib/prisma"
import { getKSTRange } from "@/lib/utils"
import { getSession } from "@/lib/auth"

export async function getDailyOperations(date: Date) {
    try {
        const { start, end } = getKSTRange(date)

        // Fetch all active clients
        // We might want to filter by those who have orders or are active?
        // For now, fetch all regular B2B clients.
        // If we have a way to distinguish B2B vs others? 
        // Currently Client model is mainly for B2B.

        const clients = await prisma.client.findMany({
            include: {
                orders: {
                    where: {
                        date: {
                            gte: start,
                            lte: end
                        }
                    }
                }
            },
            orderBy: { name: 'asc' }
        })

        const mappedClients = clients.map(client => {
            const order = client.orders[0] // Should be only one per date
            const lunchQty = order?.lunchBoxQuantity || 0
            const saladQty = order?.saladQuantity || 0

            // Calculate Amounts
            const lunchPrice = client.lunchUnitPrice || 0
            const saladPrice = client.saladUnitPrice || 0
            const totalAmount = (lunchQty * lunchPrice) + (saladQty * saladPrice)

            return {
                id: client.id,
                name: client.name,
                lunchQty: lunchQty,
                saladQty: saladQty,
                lunchPrice,
                saladPrice,
                totalAmount,
                paymentMethod: client.paymentMethod,
                paymentTiming: client.paymentTiming,
                paymentDay: (client as any).paymentDay || 0,
                generalNote: client.note || "",
                dailyNote: order?.note || ""
            }
        })

        // 2. Fetch B2C Store Orders for the same day
        const storeOrderItems = await prisma.orderItem.findMany({
            where: {
                menuPlan: {
                    planDate: {
                        gte: start,
                        lte: end
                    }
                },
                order: {
                    status: { not: 'CANCELLED' }
                }
            },
            include: {
                menuPlan: {
                    include: {
                        product: true
                    }
                }
            }
        })

        let storeLunchQty = 0
        let storeSaladQty = 0
        storeOrderItems.forEach(item => {
            if (item.menuPlan.product.type === 'LUNCH_BOX') storeLunchQty += item.quantity
            else if (item.menuPlan.product.type === 'SALAD') storeSaladQty += item.quantity
        })

        if (storeLunchQty > 0 || storeSaladQty > 0) {
            mappedClients.push({
                id: "STORE_SALES",
                name: "매장 및 개별 주문 (스토어)",
                lunchQty: storeLunchQty,
                saladQty: storeSaladQty,
                lunchPrice: 0,
                saladPrice: 0,
                totalAmount: 0, // B2C Revenue is tracked in Orders management
                paymentMethod: 'CASH' as any,
                paymentTiming: 'IMMEDIATE' as any,
                paymentDay: 0,
                generalNote: "스토어 웹주문 합계",
                dailyNote: "실시간 스토어 결제 완료 물량"
            })
        }

        // Summary Statistics
        const summary = mappedClients.reduce((acc, curr) => {
            return {
                totalLunch: acc.totalLunch + curr.lunchQty,
                totalSalad: acc.totalSalad + curr.saladQty,
                totalRevenue: acc.totalRevenue + curr.totalAmount
            }
        }, { totalLunch: 0, totalSalad: 0, totalRevenue: 0 })

        // Fetch Menu Plan for the day
        const menuPlans = await prisma.menuPlan.findMany({
            where: {
                planDate: {
                    gte: start,
                    lte: end
                }
            },
            include: {
                product: true
            }
        })

        // Map Menu Plan to Slots
        const slots: any = {
            rice: { text: "밥", isEmpty: true },
            soup: { text: "국", isEmpty: true },
            main: { text: "메인", isEmpty: true },
            side1: { text: "반찬1", isEmpty: true },
            side2: { text: "반찬2", isEmpty: true },
            side3: { text: "반찬3", isEmpty: true },
            // Salad Slots
            saladMain: { text: "한끼든든 샐러드", isEmpty: true },
            saladIng: { text: "신선한 재료 구성", isEmpty: true }
        }

        const sides: string[] = []

        menuPlans.forEach(plan => {
            const p = plan.product
            const cat = p.category as string
            const item = { text: p.name, isEmpty: false }

            // New Lunch Categories
            if (cat === 'LUNCH_RICE') slots.rice = item
            else if (cat === 'LUNCH_SOUP') slots.soup = item
            else if (cat === 'LUNCH_MAIN') slots.main = item
            else if (cat === 'LUNCH_SIDE') sides.push(p.name)

            // Salad Categories
            else if (cat === 'SALAD_MAIN' || p.type === 'SALAD') {
                slots.saladMain = item
                if (plan.descriptionOverride || p.description) {
                    slots.saladIng = { text: plan.descriptionOverride || p.description || "", isEmpty: false }
                }
            }

            // Legacy / Shared Categories
            else if (cat === 'SOUP') slots.soup = item
            else if (cat === 'MAIN_DISH') slots.main = item
            else if (['SIDE_DISH', 'KIMCHI', 'PICKLE', 'SAUCE'].includes(cat || '')) {
                sides.push(p.name)
            }
        })

        // Fill sides
        if (sides.length > 0) slots.side1 = { text: sides[0], isEmpty: false }
        if (sides.length > 1) slots.side2 = { text: sides[1], isEmpty: false }
        if (sides.length > 2) slots.side3 = { text: sides[2], isEmpty: false }

        return {
            success: true,
            data: {
                clients: mappedClients,
                summary,
                menuSlots: slots
            }
        }

    } catch (error) {
        console.error("getDailyOperations Error:", error)
        return { success: false, error: "데이터 로드 실패" }
    }
}

export async function updateClientOrderAction(clientId: string, date: Date, lunchQty: number, saladQty: number, note?: string) {
    try {
        const { start } = getKSTRange(date)
        const session = await getSession()

        // Find existing order for logging
        const existingOrder = await prisma.clientOrder.findUnique({
            where: { clientId_date: { clientId, date: start } }
        })

        const order = await prisma.clientOrder.upsert({
            where: {
                clientId_date: {
                    clientId: clientId,
                    date: start
                }
            },
            update: {
                lunchBoxQuantity: lunchQty,
                saladQuantity: saladQty,
                note: note
            },
            create: {
                clientId: clientId,
                date: start,
                lunchBoxQuantity: lunchQty,
                saladQuantity: saladQty,
                note: note,
                status: "PENDING"
            }
        })

        // Create Log
        await prisma.clientOrderLog.create({
            data: {
                orderId: order.id,
                actorType: "ADMIN",
                actorName: (session as any)?.name || "Administrator",
                actorId: (session as any)?.id,
                oldLunchQty: existingOrder?.lunchBoxQuantity || 0,
                newLunchQty: lunchQty,
                oldSaladQty: existingOrder?.saladQuantity || 0,
                newSaladQty: saladQty,
                action: existingOrder ? "UPDATE" : "CREATE"
            }
        })

        return { success: true }
    } catch (error) {
        console.error("updateClientOrderAction Error:", error)
        return { success: false, error: "수량 수정에 실패했습니다." }
    }
}

export async function getOrderLogs(clientId: string, date: Date) {
    try {
        const { start } = getKSTRange(date)

        const order = await prisma.clientOrder.findUnique({
            where: {
                clientId_date: {
                    clientId,
                    date: start
                }
            },
            include: {
                logs: {
                    orderBy: {
                        date: 'desc'
                    }
                }
            }
        })

        return {
            success: true,
            logs: (order as any)?.logs || []
        }
    } catch (error) {
        console.error("getOrderLogs Error:", error)
        return { success: false, error: "기록을 불러오지 못했습니다.", logs: [] }
    }
}
