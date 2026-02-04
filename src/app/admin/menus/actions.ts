'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { startOfDay, endOfDay } from "date-fns"

export async function getMenuPlans(date: Date) {
    try {
        const plans = await prisma.menuPlan.findMany({
            where: {
                planDate: {
                    gte: startOfDay(date),
                    lte: endOfDay(date)
                }
            },
            include: {
                product: true
            },
            orderBy: {
                createdAt: 'asc'
            }
        })
        return { success: true, data: plans }
    } catch (error) {
        console.error("Failed to fetch menu plans:", error)
        return { success: false, error: "Failed to fetch menu plans" }
    }
}

// Get all products to populate the selector
export async function getAvailableProducts() {
    try {
        const products = await prisma.product.findMany({
            where: {
                status: 'SELLING'
            },
            orderBy: { name: 'asc' }
        })
        return { success: true, data: products }
    } catch (error) {
        return { success: false, error: "Failed to fetch products" }
    }
}

export type MenuPlanInput = {
    planDate: Date
    productId: string
    price: number
    quantityLimit?: number
    descriptionOverride?: string
}

export async function upsertMenuPlan(data: MenuPlanInput) {
    try {
        const plan = await prisma.menuPlan.create({
            data: {
                planDate: data.planDate,
                productId: data.productId,
                price: data.price,
                quantityLimit: data.quantityLimit,
                descriptionOverride: data.descriptionOverride,
                status: 'OPEN'
            }
        })

        revalidatePath('/admin/menus')
        return { success: true, data: plan }
    } catch (error) {
        console.error("Failed to save menu plan:", error)
        return { success: false, error: "Failed to save menu plan" }
    }
}

export async function deleteMenuPlan(id: string) {
    try {
        await prisma.menuPlan.delete({ where: { id } })
        revalidatePath('/admin/menus')
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to delete" }
    }
}

import { ProductType, ProductCategory } from "@prisma/client"

export async function createProductAndPlan(
    name: string,
    type: string,
    category: string,
    planDate: Date,
    price: number = 0
) {
    try {
        const product = await prisma.product.create({
            data: {
                name,
                type: type as ProductType,
                category: category as ProductCategory,
                basePrice: price,
                status: 'SELLING'
            }
        })


        // Immediately plan it
        return await upsertMenuPlan({
            planDate,
            productId: product.id,
            price: price
        })
    } catch (error) {
        console.error("Failed to create and plan:", error)
        return { success: false, error: "Failed to create new product" }
    }
}
