'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getCoupons() {
    try {
        const coupons = await prisma.coupon.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { usedOrders: true }
                }
            }
        })
        return { success: true, data: coupons }
    } catch (error) {
        console.error("Failed to fetch coupons:", error)
        return { success: false, error: "쿠폰 목록을 불러오지 못했습니다." }
    }
}

export async function createCoupon(data: {
    name: string
    code?: string
    discountAmount: number
    minOrderAmount: number
    isAuto?: boolean
}) {
    try {
        let code = data.code?.toUpperCase()

        // Generate code for Auto coupons if missing
        if (data.isAuto && !code) {
            code = "AUTO-" + Math.random().toString(36).substring(2, 8).toUpperCase()
        }

        if (!code) {
            return { success: false, error: "쿠폰 코드가 필요합니다." }
        }

        // Check duplicate code
        const existing = await prisma.coupon.findUnique({
            where: { code: code }
        })
        if (existing) return { success: false, error: "이미 존재하는 쿠폰 코드입니다. 다시 시도해주세요." }

        await prisma.coupon.create({
            data: {
                name: data.name,
                code: code,
                discountAmount: data.discountAmount,
                minOrderAmount: data.minOrderAmount,
                isActive: true,
                isAuto: data.isAuto || false
            }
        })

        revalidatePath('/admin/coupons')
        return { success: true }
    } catch (error: any) {
        console.error("Failed to create coupon. Data:", data, "Error:", error)
        return { success: false, error: `쿠폰 생성 실패: ${error.message || "알 수 없는 오류"}` }
    }
}

export async function deleteCoupon(id: string) {
    try {
        await prisma.coupon.delete({
            where: { id }
        })
        revalidatePath('/admin/coupons')
        return { success: true }
    } catch (error) {
        console.error("Failed to delete coupon:", error)
        return { success: false, error: "쿠폰 삭제 실패" }
    }
}
