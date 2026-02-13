'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Utensils, CalendarDays, Truck, Users, User, Store, Ticket, ShoppingBag, ClipboardList, Package } from "lucide-react"
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import React from "react"

export function AdminHeader() {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-14 items-center">
                <div className="mr-4 hidden md:flex">
                    <Link href="/admin" className="mr-6 flex items-center space-x-2">
                        <LayoutDashboard className="h-5 w-5 text-emerald-500" />
                        <span className="hidden font-bold sm:inline-block">
                            Philmong Admin
                        </span>
                    </Link>
                    <NavigationMenu>
                        <NavigationMenuList>
                            <NavigationMenuItem>
                                <Link href="/admin" className={navigationMenuTriggerStyle()}>
                                    📊 대시보드
                                </Link>
                            </NavigationMenuItem>

                            {/* B2B Group */}
                            <NavigationMenuItem>
                                <NavigationMenuTrigger>🏢 B2B 관리</NavigationMenuTrigger>
                                <NavigationMenuContent>
                                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                                        <ListItem href="/admin/clients" title="기업 관리 (Clients)">
                                            B2B 거래처 및 계약 관리
                                        </ListItem>
                                        <ListItem href="/admin/daily-operations" title="작업/배송 관리">
                                            일일 조리 및 배송 송장 출력
                                        </ListItem>
                                    </ul>
                                </NavigationMenuContent>
                            </NavigationMenuItem>

                            {/* B2C Group */}
                            <NavigationMenuItem>
                                <NavigationMenuTrigger>🛒 B2C 관리</NavigationMenuTrigger>
                                <NavigationMenuContent>
                                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                                        <ListItem href="/admin/users" title="회원 관리 (Users)">
                                            가입 회원 및 등급 관리
                                        </ListItem>
                                        <ListItem href="/admin/coupons" title="쿠폰 관리 (Coupons)">
                                            할인 쿠폰 발급 및 현황
                                        </ListItem>
                                    </ul>
                                </NavigationMenuContent>
                            </NavigationMenuItem>

                            {/* Common Group */}
                            <NavigationMenuItem>
                                <NavigationMenuTrigger>🌐 공통 관리</NavigationMenuTrigger>
                                <NavigationMenuContent>
                                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                                        <ListItem href="/admin/menus" title="식단 편성 (Planning)">
                                            월간 식단표 기획 및 구성
                                        </ListItem>
                                        <ListItem href="/admin/products" title="상품 관리 (Products)">
                                            전체 판매 상품 DB 및 재고
                                        </ListItem>
                                        <ListItem href="/admin/orders" title="주문 관리 (Orders)">
                                            전체 통합 주문 내역 조회
                                        </ListItem>

                                        <ListItem href="/admin/delivery-zones" title="배달 구역 (Zones)">
                                            배송 가능 지역 설정
                                        </ListItem>
                                        <ListItem href="/admin/holidays" title="휴무일 관리 (Holidays)">
                                            연간 달력 및 공휴일 운영 설정
                                        </ListItem>
                                        <ListItem href="/admin/settings" title="시스템 설정 (Settings)">
                                            마감 시각 및 운영 정책 설정
                                        </ListItem>
                                    </ul>
                                </NavigationMenuContent>
                            </NavigationMenuItem>

                        </NavigationMenuList>
                    </NavigationMenu>
                </div>
                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                    <Button variant="outline" asChild size="sm" className="bg-blue-50/50 hover:bg-blue-50 border-blue-200 text-blue-700">
                        <Link href="/b2b/login" target="_blank">
                            <ShoppingBag className="mr-2 h-4 w-4" />
                            고객사 포털
                        </Link>
                    </Button>
                    <Button variant="outline" asChild size="sm">
                        <Link href="/" target="_blank">
                            <Store className="mr-2 h-4 w-4" />
                            스토어
                        </Link>
                    </Button>
                </div>
            </div>
        </header>
    )
}

const ListItem = React.forwardRef<
    React.ElementRef<"a">,
    React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
    return (
        <li>
            <NavigationMenuLink asChild>
                <a
                    ref={ref}
                    className={cn(
                        "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                        className
                    )}
                    {...props}
                >
                    <div className="text-sm font-medium leading-none">{title}</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        {children}
                    </p>
                </a>
            </NavigationMenuLink>
        </li>
    )
})
ListItem.displayName = "ListItem"
