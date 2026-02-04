'use server'

import { prisma } from "@/lib/prisma"
import { startOfDay, endOfDay } from "date-fns"

export async function getTodayMenu() {
    try {
        const today = new Date()

        const menuPlans = await prisma.menuPlan.findMany({
            where: {
                planDate: {
                    gte: startOfDay(today),
                    lte: endOfDay(today)
                }
            },
            include: {
                product: true
            },
            orderBy: {
                product: {
                    basePrice: 'desc'
                }
            }
        })

        return { success: true, data: menuPlans }
    } catch (error) {
        console.error("Failed to fetch today menu:", error)
        return { success: false, error: "오늘의 메뉴를 불러오지 못했습니다." }
    }
}

export async function calculateDeliveryFee(address: string, extraAddress: string = "") {
    if (!address) return { success: false, fee: 0, message: "주소를 입력해주세요." }

    const searchTarget = (address + " " + extraAddress).trim()

    try {
        // 모든 활성화된 배달 구역을 가져옵니다.
        const zones = await prisma.deliveryZone.findMany({
            where: { isActive: true },
            orderBy: { price: 'asc' } // 가격 오름차순 (여러 구역 겹치면 싼 가격 적용?? 정책에 따라 다름. 일단 싼거 우선)
        })

        let matchedZone = null

        // 단순 키워드 매칭 (includes)
        for (const zone of zones) {
            for (const area of zone.areas) {
                if (searchTarget.includes(area)) {
                    matchedZone = zone
                    break
                }
            }
            if (matchedZone) break
        }

        if (matchedZone) {
            return { success: true, fee: matchedZone.price, zoneName: matchedZone.name }
        } else {
            return { success: false, fee: 0, message: "배달 가능 지역이 아닙니다." }
        }

    } catch (error) {
        console.error("Delivery fee cal error:", error)
        return { success: false, fee: 0, message: "배달비 계산 중 오류 발생" }
    }
}
