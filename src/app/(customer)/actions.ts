'use server'

import { prisma } from "@/lib/prisma"
import { getKSTDate, getKSTRange } from "@/lib/utils"
import { PUBLIC_HOLIDAYS_2026 } from "@/lib/constants"
import { format } from "date-fns"

export async function getTodayMenu(date?: Date) {
    try {
        const today = date || getKSTDate()
        const { start, end } = getKSTRange(today)
        const dateStr = format(today, "yyyy-MM-dd")

        // 0. Check for Holiday (Explicit DB setting)
        const holiday = await prisma.holiday.findFirst({
            where: {
                date: {
                    gte: start,
                    lte: end
                }
            }
        })

        if (holiday) {
            // DB 기록이 있으면 그 설정을 최우선으로 따름 (휴무/영업 오버라이드 가능)
            if (holiday.isStoreClosed) {
                return {
                    success: true,
                    data: [],
                    isHoliday: true,
                    holidayReason: holiday.reason || "정기 휴무"
                }
            }
            // isStoreClosed가 false라면 아래의 기본 주말/공휴일 정책을 무시하고 통과(영업)
        } else {
            // DB 기록이 없을 때 기본 정책 (토, 일, 공휴일 자동 휴무)
            const dayOfWeek = today.getDay() // 0: 일, 6: 토
            const isPublicHoliday = !!PUBLIC_HOLIDAYS_2026[dateStr]

            if (dayOfWeek === 0 || dayOfWeek === 6 || isPublicHoliday) {
                return {
                    success: true,
                    data: [],
                    isHoliday: true,
                    holidayReason: PUBLIC_HOLIDAYS_2026[dateStr] || (dayOfWeek === 0 || dayOfWeek === 6 ? "주말 정기 휴무" : "공휴일 휴무")
                }
            }
        }

        // 1. Fetch planned items for today
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

        // 2. Fetch permanent (REGULAR) items that are currently SELLING
        const permanentProducts = await prisma.product.findMany({
            where: {
                type: 'REGULAR',
                status: 'SELLING'
            }
        })

        // 3. Combine and remove duplicates (if a permanent product is also in the plan)
        // We use productId as the unique key
        const plannedProductIds = new Set(menuPlans.map(p => p.productId))

        const combinedData = [...menuPlans]

        permanentProducts.forEach(product => {
            if (!plannedProductIds.has(product.id)) {
                // Mock a MenuPlan structure for consistency with the UI
                combinedData.push({
                    id: `perm-${product.id}`,
                    planDate: today,
                    productId: product.id,
                    product: product,
                    price: product.basePrice,
                    quantityLimit: null,
                    soldQuantity: 0,
                    descriptionOverride: null,
                    status: 'OPEN',
                    createdAt: product.createdAt,
                    updatedAt: product.updatedAt
                } as any)
            }
        })

        // 4. Sort by category or price for better display
        combinedData.sort((a, b) => {
            // Sort by price descending as before
            return b.product.basePrice - a.product.basePrice
        })

        return { success: true, data: combinedData, isHoliday: false }
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
