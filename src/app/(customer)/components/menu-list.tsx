'use client'

import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { MenuPlan, Product, ProductType, ProductCategory } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShoppingBag, Plus } from "lucide-react"
import { useCartStore } from "@/lib/cart-store"
import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"

interface MenuListProps {
    date: Date
    plans: (MenuPlan & { product: Product })[]
}

const CATEGORIES = [
    { id: 'ALL', label: '전체' },
    { id: 'DAILY', label: '데일리' },
    { id: 'MAIN', label: '요리' },
    { id: 'SOUP', label: '국/찌개' },
    { id: 'SIDE', label: '반찬/김치' },
    { id: 'ETC', label: '샐러드/기타' },
]

export function MenuList({ date, plans }: MenuListProps) {
    const [selectedCategory, setSelectedCategory] = useState('ALL')

    const filteredPlans = useMemo(() => {
        if (selectedCategory === 'ALL') return plans

        return plans.filter(({ product }) => {
            switch (selectedCategory) {
                case 'DAILY':
                    return product.type === ProductType.DAILY
                case 'MAIN':
                    return product.category === ProductCategory.MAIN_DISH
                case 'SOUP':
                    return product.category === ProductCategory.SOUP
                case 'SIDE':
                    return [ProductCategory.SIDE_DISH, ProductCategory.KIMCHI, ProductCategory.PICKLE].includes(product.category as any)
                case 'ETC':
                    return product.type === ProductType.SALAD || product.type === ProductType.LUNCH_BOX || product.category === ProductCategory.SAUCE
                default:
                    return true
            }
        })
    }, [plans, selectedCategory])

    if (plans.length === 0) {
        return (
            <div className="text-center py-20 bg-slate-50 rounded-lg">
                <p className="text-muted-foreground mb-2">오늘 준비된 식단이 없습니다.</p>
                <p className="text-sm text-slate-400">관리자가 메뉴를 준비 중입니다. 잠시 후 다시 확인해주세요.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-xl font-bold flex items-center">
                    <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm mr-2">
                        {format(date, "M월 d일 (EEE)", { locale: ko })}
                    </span>
                    오늘의 메뉴 ({filteredPlans.length})
                </h2>

                {/* Category Tabs */}
                <div className="flex overflow-x-auto pb-2 md:pb-0 gap-2 no-scrollbar">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={cn(
                                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                                selectedCategory === cat.id
                                    ? "bg-slate-900 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            )}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* List View */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPlans.map((plan) => (
                    <MenuListItem key={plan.id} product={plan.product} />
                ))}
            </div>

            {filteredPlans.length === 0 && (
                <div className="text-center py-12 text-muted-foreground bg-slate-50 rounded-lg">
                    해당 카테고리에 메뉴가 없습니다.
                </div>
            )}
        </div>
    )
}

function MenuListItem({ product }: { product: Product }) {
    const addItem = useCartStore(state => state.addItem)
    const isSoldOut = product.status === "NOT_SELLING"

    const handleAddToCart = () => {
        addItem(product)
        // Toast notification would be better here, but alert is fine for now as per previous code
        // We can upgrade to toast if available context allows, but sticking to logic
        // Let's use a simple window alert or console log to avoid breaking if toast isn't set up perfectly yet
        // actually toast is used in cart page. let's try to be consistent if possible, but alert is safe.
        // User saw alert before.
    }

    return (
        <div className={cn(
            "group flex items-center gap-4 p-3 rounded-xl border bg-white transition-all hover:shadow-md",
            isSoldOut && "opacity-60 bg-slate-50"
        )}>
            {/* Image Thumbnail */}
            <div className="relative h-20 w-20 flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center">
                <span className="text-[10px] text-slate-400">No Image</span>
                {isSoldOut && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-xs font-bold border border-white px-1 transform -rotate-12">
                            품절
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 text-slate-500 border-slate-200">
                        {product.category || '기타'}
                    </Badge>
                    {product.type === 'DAILY' && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-orange-50 text-orange-600 hover:bg-orange-100">
                            데일리
                        </Badge>
                    )}
                </div>

                <h3 className="font-bold text-base truncate pr-2">{product.name}</h3>
                <p className="text-sm text-muted-foreground truncate">
                    {product.description || "설명이 없습니다."}
                </p>

                <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-orange-600">
                        {product.basePrice.toLocaleString()}원
                    </span>
                </div>
            </div>

            {/* Action */}
            <Button
                size="sm"
                disabled={isSoldOut}
                onClick={handleAddToCart}
                className={cn(
                    "h-9 w-9 p-0 rounded-full flex-shrink-0 shadow-sm",
                    !isSoldOut ? "bg-white border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white" : ""
                )}
                variant={isSoldOut ? "secondary" : "outline"}
            >
                <Plus className="h-5 w-5" />
                <span className="sr-only">담기</span>
            </Button>
        </div>
    )
}
