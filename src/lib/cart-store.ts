import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Product } from '@prisma/client'

export interface CartItem {
    product: Product
    quantity: number
}

interface CartStore {
    items: CartItem[]
    addItem: (product: Product) => void
    removeItem: (productId: string) => void
    updateQuantity: (productId: string, quantity: number) => void
    clearCart: () => void
    totalItems: () => number
    totalPrice: () => number
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (product) => set((state) => {
                const existing = state.items.find(i => i.product.id === product.id)
                if (existing) {
                    return {
                        items: state.items.map(i =>
                            i.product.id === product.id
                                ? { ...i, quantity: i.quantity + 1 }
                                : i
                        )
                    }
                }
                return { items: [...state.items, { product, quantity: 1 }] }
            }),
            removeItem: (id) => set((state) => ({
                items: state.items.filter(i => i.product.id !== id)
            })),
            updateQuantity: (id, qty) => set((state) => {
                if (qty <= 0) {
                    return { items: state.items.filter(i => i.product.id !== id) }
                }
                return {
                    items: state.items.map(i =>
                        i.product.id === id ? { ...i, quantity: qty } : i
                    )
                }
            }),
            clearCart: () => set({ items: [] }),
            totalItems: () => get().items.reduce((acc, item) => acc + item.quantity, 0),
            totalPrice: () => get().items.reduce((acc, item) => acc + (item.product.basePrice * item.quantity), 0),
        }),
        {
            name: 'philmong-cart', // local storage key
        }
    )
)
