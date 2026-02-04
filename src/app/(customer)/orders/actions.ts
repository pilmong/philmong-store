'use server'

import { prisma } from "@/lib/prisma"
import { OrderStatus, PaymentStatus, DeliveryType } from "@prisma/client"
import { format, startOfDay, endOfDay } from "date-fns"

interface OrderInput {
    userId?: string
    items: {
        productId: string
        quantity: number
        price: number
    }[]
    customer: {
        name: string
        phone: string
        password?: string
    }
    delivery: {
        address?: string
        detailAddress?: string
        fee: number
    }
    payment: string
    note?: string
    couponId?: string
    discountAmount?: number
}

export async function validateCoupon(code: string, orderAmount: number) {
    try {
        const coupon = await prisma.coupon.findUnique({
            where: { code: code.toUpperCase() }
        })

        if (!coupon) return { success: false, error: "유효하지 않은 쿠폰 코드입니다." }
        if (!coupon.isActive) return { success: false, error: "사용이 중지된 쿠폰입니다." }
        if (coupon.minOrderAmount > orderAmount) {
            return {
                success: false,
                error: `최소 ${coupon.minOrderAmount.toLocaleString()}원 이상 주문 시 사용 가능합니다.`
            }
        }

        // Check validity dates if applicable (assuming schema has them)
        const now = new Date()
        if (coupon.validFrom && coupon.validFrom > now) return { success: false, error: "아직 사용할 수 없는 쿠폰입니다." }
        if (coupon.validUntil && coupon.validUntil < now) return { success: false, error: "유효기간이 만료된 쿠폰입니다." }

        return {
            success: true,
            coupon: {
                id: coupon.id,
                name: coupon.name,
                discountAmount: coupon.discountAmount
            }
        }
    } catch (error) {
        console.error("Coupon validation error:", error)
        return { success: false, error: "쿠폰 확인 중 오류가 발생했습니다." }
    }
}

export async function createOrder(data: OrderInput) {
    try {
        const today = new Date()
        const orderDateStr = format(today, "yyyyMMdd")
        const start = startOfDay(today)
        const end = endOfDay(today)

        // 1. Generate Order Number
        const count = await prisma.order.count({
            where: {
                createdAt: { gte: start, lte: end }
            }
        })
        const suffix = (count + 1).toString().padStart(4, '0')
        const orderNumber = `${orderDateStr}-${suffix}`

        // 2. Fetch Plans
        const todayPlans = await prisma.menuPlan.findMany({
            where: {
                planDate: { gte: start, lte: end }
            },
            include: { product: true }
        })

        // 3. Create Order Transaction
        const result = await prisma.$transaction(async (tx) => {
            let totalAmount = 0
            const orderItemsCreate = []

            for (const item of data.items) {
                const plan = todayPlans.find(p => p.productId === item.productId)

                if (!plan) {
                    throw new Error(`오늘의 메뉴 정보를 찾을 수 없습니다. (ID: ${item.productId})`)
                }

                const price = plan.price
                const amount = price * item.quantity
                totalAmount += amount

                // Update Sold Quantity
                await tx.menuPlan.update({
                    where: { id: plan.id },
                    data: { soldQuantity: { increment: item.quantity } }
                })

                orderItemsCreate.push({
                    menuPlanId: plan.id,
                    productName: plan.product.name,
                    price: price,
                    quantity: item.quantity,
                    amount: amount
                })
            }

            totalAmount += data.delivery.fee

            const order = await tx.order.create({
                data: {
                    orderNumber,
                    customerName: data.customer.name,
                    customerPhone: data.customer.phone,
                    password: data.customer.password,

                    totalAmount,
                    pickupDate: format(today, "yyyy-MM-dd"),
                    deliveryType: data.delivery.address ? DeliveryType.DELIVERY : DeliveryType.PICKUP,

                    address: data.delivery.address,
                    detailAddress: data.delivery.detailAddress,
                    deliveryFee: data.delivery.fee,

                    requestNote: data.note,

                    status: OrderStatus.PENDING,
                    paymentStatus: PaymentStatus.UNPAID,

                    items: {
                        create: orderItemsCreate
                    },
                    paymentDeadline: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours later
                }
            })

            return order
        })

        return { success: true, orderId: result.id, orderNumber: result.orderNumber }

    } catch (e: any) {
        console.error("Order Creation Error:", e)
        return { success: false, message: e.message || "주문 생성 중 오류가 발생했습니다." }
    }
}

export async function notifyPayment(orderId: string) {
    try {
        await prisma.order.update({
            where: { id: orderId },
            data: { paymentNotified: true }
        })
        return { success: true }
    } catch (error) {
        console.error("Notify Payment Error:", error)
        return { success: false, error: "입금 알림 처리에 실패했습니다." }
    }
}

export async function lookupOrder(phone: string, password: string) {
    try {
        const order = await prisma.order.findFirst({
            where: {
                customerPhone: phone,
                password: password
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        if (!order) {
            return { success: false, error: "일치하는 주문 정보가 없습니다." }
        }

        return { success: true, orderId: order.id }
    } catch (error) {
        console.error("Lookup Order Error:", error)
        return { success: false, error: "주문 조회 중 오류가 발생했습니다." }
    }
}

export async function getOrder(orderId: string) {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: true
            }
        })

        if (!order) return { success: false, error: "주문을 찾을 수 없습니다." }
        return { success: true, data: order }
    } catch (error) {
        console.error("Get Order Error:", error)
        return { success: false, error: "주문 정보를 불러오지 못했습니다." }
    }
}

export async function getAvailableCoupons(orderAmount: number) {
    try {
        const coupons = await prisma.coupon.findMany({
            where: {
                isAuto: true,
                isActive: true,
                minOrderAmount: { lte: orderAmount },
                OR: [
                    { validFrom: null },
                    { validFrom: { lte: new Date() } }
                ],
                AND: [
                    { OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }] }
                ]
            },
            orderBy: {
                discountAmount: 'desc'
            }
        })

        return {
            success: true,
            coupons: coupons.map(c => ({
                id: c.id,
                name: c.name,
                discountAmount: c.discountAmount,
                minOrderAmount: c.minOrderAmount
            }))
        }
    } catch (error) {
        console.error("Available coupons error:", error)
        return { success: false, coupons: [] }
    }
}
