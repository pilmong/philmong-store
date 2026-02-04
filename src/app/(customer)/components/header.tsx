'use client'

import Link from "next/link"
import { ShoppingCart, LogIn, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/lib/cart-store"
import { useEffect, useState } from "react"
import { getUserSession, logoutUser } from "../auth/actions"

export function CustomerHeader() {
    const totalItems = useCartStore(state => state.totalItems())
    const [mounted, setMounted] = useState(false)
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        setMounted(true)
        getUserSession().then(setUser)
    }, [])

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link href="/" className="flex items-center space-x-2">
                    <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
                        Philmong
                    </span>
                    <span className="text-xs font-medium text-muted-foreground mt-1 hidden sm:inline-block">오늘의 식탁</span>
                </Link>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" asChild className="text-sm font-medium hidden sm:flex">
                        <Link href="/order-lookup">주문 조회</Link>
                    </Button>
                    <Link href="/cart">
                        <Button variant="ghost" size="icon" className="relative">
                            <ShoppingCart className="h-5 w-5" />
                            {mounted && totalItems > 0 && (
                                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                                    {totalItems}
                                </span>
                            )}
                        </Button>
                    </Link>

                    {mounted && (
                        user ? (
                            <div className="flex items-center gap-2 ml-1">
                                <span className="text-sm font-medium hidden sm:inline-block">{user.name}님</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={async () => {
                                        await logoutUser()
                                        setUser(null)
                                        window.location.reload()
                                    }}
                                    title="로그아웃"
                                >
                                    <LogOut className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <Link href="/auth/login">
                                <Button variant="ghost" size="sm">
                                    <LogIn className="h-4 w-4 mr-2" />
                                    <span>로그인</span>
                                </Button>
                            </Link>
                        )
                    )}
                </div>
            </div>
        </header>
    )
}
