import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Product } from '@prisma/client'
import { format } from 'date-fns'

export interface CartItem {
    product: Product
    quantity: number
}

interface CartStore {
    items: CartItem[]
    cartDate: string | null // 장바구니 생성/갱신 날짜 (yyyy-MM-dd)
    addItem: (product: Product) => void
    removeItem: (productId: string) => void
    updateQuantity: (productId: string, quantity: number) => void
    clearCart: () => void
    checkAndReset: () => void // 날짜 변경 체크 및 초기화
    totalItems: () => number
    totalPrice: () => number
}

// 한국 시간 기준 날짜 문자열 가져오기
const getTodayStr = () => {
    const now = new Date()
    const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000))
    return format(kst, "yyyy-MM-dd")
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            cartDate: null,

            addItem: (product) => set((state) => {
                const today = getTodayStr()
                // 날짜가 다르면 기존 것 비우고 새로 시작
                const isDateMatched = state.cartDate === today
                const baseItems = isDateMatched ? state.items : []

                const existing = baseItems.find(i => i.product.id === product.id)
                if (existing) {
                    return {
                        cartDate: today,
                        items: baseItems.map(i =>
                            i.product.id === product.id
                                ? { ...i, quantity: i.quantity + 1 }
                                : i
                        )
                    }
                }
                return {
                    cartDate: today,
                    items: [...baseItems, { product, quantity: 1 }]
                }
            }),

            removeItem: (id) => set((state) => ({
                items: state.items.filter(i => i.product.id !== id)
            })),

            updateQuantity: (id, qty) => set((state) => {
                const today = getTodayStr()
                if (state.cartDate !== today) {
                    return { items: [], cartDate: null }
                }

                if (qty <= 0) {
                    return { items: state.items.filter(i => i.product.id !== id) }
                }
                return {
                    items: state.items.map(i =>
                        i.product.id === id ? { ...i, quantity: qty } : i
                    )
                }
            }),

            clearCart: () => set({ items: [], cartDate: null }),

            checkAndReset: () => set((state) => {
                const today = getTodayStr()
                // 날짜 정보가 없거나, 현재 날짜와 다른데 장바구니에 물건이 있다면 초기화
                if (state.items.length > 0 && state.cartDate !== today) {
                    console.log("Cart session expired or invalid. Resetting.", { prev: state.cartDate, today })
                    return { items: [], cartDate: null }
                }
                return {}
            }),

            totalItems: () => get().items.reduce((acc, item) => acc + item.quantity, 0),
            totalPrice: () => get().items.reduce((acc, item) => acc + (item.product.basePrice * item.quantity), 0),
        }),
        {
            name: 'philmong-cart', // local storage key
        }
    )
)
