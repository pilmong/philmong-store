'use server'

import { prisma } from "@/lib/prisma"

// 회원 상세 정보 조회
export async function getAdminUserDetail(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            orders: {
                orderBy: { createdAt: 'desc' },
                take: 20, // 최근 20건
                include: {
                    items: true
                }
            },
            coupons: {
                include: {
                    coupon: true
                }
            }
        }
    })
    return user
}

// 관리자 메모 업데이트
export async function updateAdminNote(userId: string, note: string) {
    try {
        await prisma.user.update({
            where: { id: userId },
            data: { adminNote: note }
        })
        return { success: true }
    } catch (error: any) {
        console.error("Update Note Error:", error)
        return { success: false, message: error.message || "메모 저장 중 오류가 발생했습니다." }
    }
}

// 쿠폰 지급
export async function grantCoupon(userId: string, couponId: string) {
    try {
        await prisma.userCoupon.create({
            data: {
                userId,
                couponId
            }
        })
        return { success: true, message: "쿠폰이 지급되었습니다." }
    } catch (error) {
        console.error("Grant Coupon Error:", error)
        return { success: false, message: "쿠폰 지급 중 오류가 발생했습니다. (이미 지급된 쿠폰일 수 있습니다)" }
    }
}

// 지급 가능한 쿠폰 목록 조회
export async function getAvailableCoupons() {
    return await prisma.coupon.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
    })
}
