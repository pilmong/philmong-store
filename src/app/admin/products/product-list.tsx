'use client'

import { useState, useMemo, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Product, ProductType, ProductCategory, ProductStatus } from "@prisma/client"
import Link from "next/link"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

// Translation Maps
const TYPE_LABEL: Record<string, string> = {
    REGULAR: "정규",
    DAILY: "데일리",
    SPECIAL: "스페셜",
    LUNCH_BOX: "도시락",
    SALAD: "샐러드",
}

const CATEGORY_LABEL: Record<string, string> = {
    TODAY_MENU: "오늘의 메뉴",
    MAIN_DISH: "요리 곁들임",
    SOUP: "국물 곁들임",
    SIDE_DISH: "반찬 곁들임",
    KIMCHI: "김치 곁들임",
    PICKLE: "장아찌 곁들임",
    SAUCE: "청/소스 곁들임",
    LUNCH_RICE: "도시락 밥",
    LUNCH_SOUP: "도시락 국",
    LUNCH_MAIN: "도시락 메인",
    LUNCH_SIDE: "도시락 반찬",
    SALAD_MAIN: "샐러드 메인",
}

const STATUS_LABEL: Record<string, string> = {
    SELLING: "판매중",
    NOT_SELLING: "판매중지",
    PENDING: "보류(품절)",
}

interface ProductListProps {
    initialProducts: Product[]
}

export function ProductList({ initialProducts }: ProductListProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Initialize state from URL params
    const [search, setSearch] = useState(searchParams.get('search') || "")
    const [typeFilter, setTypeFilter] = useState<string>(searchParams.get('type') || "ALL")
    const [categoryFilter, setCategoryFilter] = useState<string>(searchParams.get('category') || "ALL")
    const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || "ALL")

    // Update URL when filters change
    const updateQueryParams = useCallback((updates: Record<string, string>) => {
        const params = new URLSearchParams(searchParams.toString())
        Object.entries(updates).forEach(([key, value]) => {
            if (value === "ALL" || value === "") {
                params.delete(key)
            } else {
                params.set(key, value)
            }
        })
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }, [searchParams, router, pathname])

    // Effect to sync URL with local state on changes
    useEffect(() => {
        const timer = setTimeout(() => {
            updateQueryParams({
                search,
                type: typeFilter,
                category: categoryFilter,
                status: statusFilter
            })
        }, 300) // Debounce search
        return () => clearTimeout(timer)
    }, [search, typeFilter, categoryFilter, statusFilter, updateQueryParams])

    // Sync state with URL when searchParams change (e.g. Back button)
    useEffect(() => {
        const urlSearch = searchParams.get('search') || ""
        const urlType = searchParams.get('type') || "ALL"
        const urlCategory = searchParams.get('category') || "ALL"
        const urlStatus = searchParams.get('status') || "ALL"

        if (urlSearch !== search) setSearch(urlSearch)
        if (urlType !== typeFilter) setTypeFilter(urlType)
        if (urlCategory !== categoryFilter) setCategoryFilter(urlCategory)
        if (urlStatus !== statusFilter) setStatusFilter(urlStatus)
    }, [searchParams]) // Only check when URL changes

    const filteredProducts = useMemo(() => {
        return initialProducts.filter((product) => {
            const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase())
            const matchesType = typeFilter === "ALL" || product.type === typeFilter
            const matchesCategory = categoryFilter === "ALL" || product.category === categoryFilter
            const matchesStatus = statusFilter === "ALL" || product.status === statusFilter
            return matchesSearch && matchesType && matchesCategory && matchesStatus
        })
    }, [initialProducts, search, typeFilter, categoryFilter, statusFilter])

    const resetFilters = () => {
        setSearch("")
        setTypeFilter("ALL")
        setCategoryFilter("ALL")
        setStatusFilter("ALL")
    }

    const isFiltered = search !== "" || typeFilter !== "ALL" || categoryFilter !== "ALL" || statusFilter !== "ALL"

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-end bg-slate-50 p-4 rounded-lg border">
                <div className="flex-1 min-w-[200px] space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground ml-1">상품명 검색</label>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="상품명을 입력하세요..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 bg-white"
                        />
                    </div>
                </div>

                <div className="w-[140px] space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground ml-1">유형</label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="bg-white">
                            <SelectValue placeholder="모든 유형" />
                        </SelectTrigger>
                        <SelectContent position="popper" className="max-h-[600px]">
                            <SelectItem value="ALL">모든 유형</SelectItem>
                            {Object.values(ProductType).map((type) => (
                                <SelectItem key={type} value={type}>{TYPE_LABEL[type] || type}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="w-[140px] space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground ml-1">카테고리</label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="bg-white">
                            <SelectValue placeholder="모든 카테고리" />
                        </SelectTrigger>
                        <SelectContent position="popper" className="max-h-[600px]">
                            <SelectItem value="ALL">모든 카테고리</SelectItem>
                            {Object.values(ProductCategory).map((cat) => (
                                <SelectItem key={cat} value={cat}>{CATEGORY_LABEL[cat] || cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="w-[140px] space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground ml-1">상태</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="bg-white">
                            <SelectValue placeholder="모든 상태" />
                        </SelectTrigger>
                        <SelectContent position="popper" className="max-h-[600px]">
                            <SelectItem value="ALL">모든 상태</SelectItem>
                            {Object.values(ProductStatus).map((status) => (
                                <SelectItem key={status} value={status}>{STATUS_LABEL[status] || status}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Button
                    variant="ghost"
                    onClick={resetFilters}
                    disabled={!isFiltered}
                    className={cn(
                        "h-10 px-3 transition-opacity whitespace-nowrap",
                        !isFiltered ? "opacity-20 cursor-default" : "opacity-100 hover:bg-slate-100 text-slate-600 font-medium"
                    )}
                >
                    <X className="mr-1.5 h-4 w-4" /> 초기화
                </Button>
            </div>

            <div className="text-sm text-muted-foreground ml-1">
                검색 결과: <strong>{filteredProducts.length}</strong>건 / 전체 {initialProducts.length}건
            </div>

            <div className="border rounded-md bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>상품명</TableHead>
                            <TableHead>유형</TableHead>
                            <TableHead>카테고리</TableHead>
                            <TableHead>기본가격</TableHead>
                            <TableHead>설명</TableHead>
                            <TableHead>상태</TableHead>
                            <TableHead className="text-right">관리</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProducts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                    {isFiltered ? "검색 결과가 없습니다." : "등록된 상품이 없습니다."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredProducts.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell>
                                        <Badge variant={product.type === 'REGULAR' ? 'secondary' : 'outline'}>
                                            {TYPE_LABEL[product.type] || product.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{CATEGORY_LABEL[product.category || ""] || product.category || "-"}</TableCell>
                                    <TableCell>{product.basePrice.toLocaleString()}원</TableCell>
                                    <TableCell className="max-w-[200px] truncate" title={product.description || ""}>
                                        {product.description}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={product.status === 'SELLING' ? 'default' : product.status === 'NOT_SELLING' ? 'destructive' : 'outline'}>
                                            {STATUS_LABEL[product.status] || product.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/admin/products/${product.id}?${searchParams.toString()}`}>
                                            <Button variant="outline" size="sm">수정</Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
