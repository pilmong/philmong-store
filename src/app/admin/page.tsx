import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, ShoppingCart, Calendar, ClipboardList, Users, Building, Settings, Truck } from "lucide-react"
import Link from "next/link"

const dashboardItems = [
    {
        title: "상품 관리",
        description: "전체 메뉴 및 상품 등록/수정/삭제",
        icon: Package,
        href: "/admin/products",
        color: "text-blue-500",
    },
    {
        title: "주문 관리",
        description: "고객 주문 확인 및 상태 변경",
        icon: ShoppingCart,
        href: "/admin/orders",
        color: "text-green-500",
    },

    {
        title: "식단 편성",
        description: "월간 식단표 구성 및 캘린더",
        icon: Calendar,
        href: "/admin/menus",
        color: "text-purple-500",
    },
    {
        title: "일일 작업",
        description: "송장 출력 및 조리 지시서",
        icon: ClipboardList,
        href: "/admin/daily-operations",
        color: "text-orange-500",
    },
    {
        title: "회원 관리",
        description: "가입 회원 및 등급/쿠폰 관리",
        icon: Users,
        href: "/admin/users",
        color: "text-indigo-500",
    },
    {
        title: "B2B 관리",
        description: "기업 고객 및 계약 관리",
        icon: Building,
        href: "/admin/clients",
        color: "text-slate-500",
    },
]

export default function AdminDashboardPage() {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">대시보드</h2>
                <p className="text-muted-foreground">
                    필몽 스토어 관리자 시스템에 오신 것을 환영합니다.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {dashboardItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="block h-full"
                    >
                        <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-lg font-medium">
                                    {item.title}
                                </CardTitle>
                                <item.icon className={`h-6 w-6 ${item.color}`} />
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="text-base mt-2">
                                    {item.description}
                                </CardDescription>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    )
}
