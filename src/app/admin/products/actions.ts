'use server'

import { prisma } from "@/lib/prisma"
import { Product, ProductType, ProductCategory, WorkDivision, ProductStatus } from "@prisma/client"
import { revalidatePath } from "next/cache"

export type ProductCreateInput = {
    name: string
    basePrice: number
    type: ProductType
    category: ProductCategory
    description?: string
    workDivision?: WorkDivision
    status?: ProductStatus
    standardQuantity?: number
}

export async function getProducts() {
    try {
        const products = await prisma.product.findMany({
            orderBy: { createdAt: 'desc' }
        })
        return { success: true, data: products }
    } catch (error) {
        console.error("Failed to fetch products:", error)
        return { success: false, error: "Failed to fetch products" }
    }
}

export async function createProduct(data: ProductCreateInput) {
    try {
        const product = await prisma.product.create({
            data: {
                name: data.name,
                basePrice: data.basePrice,
                type: data.type,
                category: data.category,
                description: data.description,
                workDivision: data.workDivision,
                status: data.status,
                standardQuantity: data.standardQuantity
            }
        })

        revalidatePath('/admin/products')
        return { success: true, data: product }
    } catch (error) {
        console.error("Failed to create product:", error)
        return { success: false, error: "Failed to create product" }
    }
}


export async function getProductById(id: string) {
    try {
        const product = await prisma.product.findUnique({ where: { id } })
        return { success: true, data: product }
    } catch (error) {
        return { success: false, error: "Failed to fetch product" }
    }
}

export async function updateProduct(id: string, data: ProductCreateInput) {
    try {
        const product = await prisma.product.update({
            where: { id },
            data: {
                name: data.name,
                basePrice: data.basePrice,
                type: data.type,
                category: data.category,
                description: data.description,
                workDivision: data.workDivision,
                status: data.status,
                standardQuantity: data.standardQuantity
            }
        })
        revalidatePath('/admin/products')
        revalidatePath(`/admin/products/${id}`)
        return { success: true, data: product }
    } catch (error) {
        console.error("Update error detail:", error)
        return { success: false, error: "Failed to update product" }
    }
}

export async function deleteProduct(id: string) {
    try {
        await prisma.product.delete({ where: { id } })
        revalidatePath('/admin/products')
        return { success: true }
    } catch (error) {
        console.error("Delete error detail:", error)
        return { success: false, error: "상품이 식단 편성 등에 사용 중이라 삭제할 수 없습니다. 먼저 관련 식단을 삭제해 주세요." }
    }
}
