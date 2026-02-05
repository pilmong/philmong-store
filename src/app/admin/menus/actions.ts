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
    id?: string
    planDate: Date
    productId: string
    price: number
    quantityLimit?: number
    descriptionOverride?: string
}

export async function updateMenuPlanDescription(id: string, description: string) {
    try {
        const updated = await prisma.menuPlan.update({
            where: { id },
            data: { descriptionOverride: description }
        })
        // revalidatePath('/admin/menus')
        const plans = await getMenuPlans(updated.planDate)
        return { success: true, plan: updated, allPlans: plans.data }
    } catch (error) {
        console.error("Update error:", error)
        return { success: false, error: "Failed to update description" }
    }
}

export async function upsertMenuPlan(data: MenuPlanInput) {
    try {
        let plan;
        if (data.id) {
            plan = await prisma.menuPlan.update({
                where: { id: data.id },
                data: {
                    price: data.price,
                    quantityLimit: data.quantityLimit,
                    descriptionOverride: data.descriptionOverride,
                }
            })
        } else {
            // Check if plan already exists for this product on this day to avoid duplicates
            const existing = await prisma.menuPlan.findFirst({
                where: {
                    planDate: {
                        gte: startOfDay(data.planDate),
                        lte: endOfDay(data.planDate)
                    },
                    productId: data.productId
                }
            })

            if (existing) {
                plan = await prisma.menuPlan.update({
                    where: { id: existing.id },
                    data: {
                        price: data.price,
                        quantityLimit: data.quantityLimit,
                        descriptionOverride: data.descriptionOverride,
                    }
                })
            } else {
                plan = await prisma.menuPlan.create({
                    data: {
                        planDate: data.planDate,
                        productId: data.productId,
                        price: data.price,
                        quantityLimit: data.quantityLimit,
                        descriptionOverride: data.descriptionOverride,
                        status: 'OPEN'
                    }
                })
            }
        }

        // revalidatePath('/admin/menus')
        const plans = await getMenuPlans(plan.planDate)
        return { success: true, plan, allPlans: plans.data }
    } catch (error) {
        console.error("Failed to save menu plan:", error)
        return { success: false, error: "Failed to save menu plan" }
    }
}

export async function deleteMenuPlan(id: string) {
    try {
        const deleted = await prisma.menuPlan.delete({ where: { id } })
        // revalidatePath('/admin/menus')
        const plans = await getMenuPlans(deleted.planDate)
        return { success: true, allPlans: plans.data }
    } catch (error) {
        return { success: false, error: "Failed to delete" }
    }
}

import { Product, ProductType, ProductCategory } from "@prisma/client"

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

export async function updateProduct(id: string, data: Partial<Product>) {
    try {
        const updated = await prisma.product.update({
            where: { id },
            data: {
                name: data.name,
                type: data.type,
                category: data.category,
                basePrice: data.basePrice,
                description: data.description,
                status: data.status
            }
        })
        return { success: true, data: updated }
    } catch (error) {
        console.error("Failed to update product:", error)
        return { success: false, error: "Failed to update product" }
    }
}

export async function copyMenuPlans(sourceDate: Date, targetDate: Date) {
    try {
        // 1. Get source plans
        const sourcePlans = await prisma.menuPlan.findMany({
            where: {
                planDate: {
                    gte: startOfDay(sourceDate),
                    lte: endOfDay(sourceDate)
                }
            }
        })

        if (sourcePlans.length === 0) {
            return { success: false, error: "복사할 식단이 없습니다." }
        }

        // 2. Clear target plans (Optional, but safer for a clean copy)
        await prisma.menuPlan.deleteMany({
            where: {
                planDate: {
                    gte: startOfDay(targetDate),
                    lte: endOfDay(targetDate)
                }
            }
        })

        // 3. Create new plans for target date
        await prisma.$transaction(
            sourcePlans.map(plan => prisma.menuPlan.create({
                data: {
                    planDate: targetDate, // Use startOfDay(targetDate) or exact targetDate
                    productId: plan.productId,
                    price: plan.price,
                    quantityLimit: plan.quantityLimit,
                    descriptionOverride: plan.descriptionOverride,
                    status: 'OPEN'
                }
            }))
        )

        const plans = await getMenuPlans(targetDate)
        revalidatePath('/admin/menus')
        return { success: true, allPlans: plans.data }
    } catch (error) {
        console.error("Failed to copy menu plans:", error)
        return { success: false, error: "식단 복사에 실패했습니다." }
    }
}
