'use server'

import { prisma } from "@/lib/prisma"
import { startOfDay, endOfDay } from "date-fns"

export async function getDailyOperations(date: Date) {
    try {
        const start = startOfDay(date)
        const end = endOfDay(date)

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
            // Use defaults if price is missing (schema has defaults but just in case)
            const lunchPrice = client.lunchUnitPrice || 0
            const saladPrice = client.saladUnitPrice || 0

            const totalAmount = (lunchQty * lunchPrice) + (saladQty * saladPrice)

            return {
                id: client.id,
                name: client.name,
                lunchQty,
                saladQty,
                lunchPrice,
                saladPrice,
                totalAmount,
                paymentMethod: client.paymentMethod,
                paymentTiming: client.paymentTiming,
                generalNote: client.note || "",
                dailyNote: order?.note || ""
            }
        })

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
            rice: { text: "잡곡밥", isEmpty: false },
            soup: { text: "", isEmpty: true },
            main: { text: "", isEmpty: true },
            side1: { text: "", isEmpty: true },
            side2: { text: "", isEmpty: true },
            side3: { text: "", isEmpty: true },
            // Salad Slots
            saladMain: { text: "", isEmpty: true },
            saladIng: { text: "", isEmpty: true }
        }

        const sides: string[] = []

        menuPlans.forEach(plan => {
            const p = plan.product
            const item = { text: p.name, isEmpty: false }

            if (p.category === 'SOUP') slots.soup = item
            else if (p.category === 'MAIN_DISH') slots.main = item
            else if (['SIDE_DISH', 'KIMCHI', 'PICKLE', 'SAUCE'].includes(p.category || '')) {
                sides.push(p.name)
            }
            // Salad Logic: 
            // Assuming ProductType 'SALAD' is used.
            // Or category? Schema has ProductType SALAD.
            else if (p.type === 'SALAD') {
                // If it's a Salad Product, put it in Main Name
                slots.saladMain = item
                // Where to get ingredients? descriptionOverride? or description?
                if (plan.descriptionOverride || p.description) {
                    slots.saladIng = { text: plan.descriptionOverride || p.description || "", isEmpty: false }
                }
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
