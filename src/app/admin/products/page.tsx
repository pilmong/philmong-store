import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { getProducts } from "./actions"
import { Plus } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ProductListShortcuts } from "./product-list-shortcuts"

// Enum Translations
const TYPE_LABEL: Record<string, string> = {
    REGULAR: "정규",
    DAILY: "데일리",
    SPECIAL: "스페셜",
    LUNCH_BOX: "도시락",
    SALAD: "샐러드",
}

const CATEGORY_LABEL: Record<string, string> = {
    MAIN_DISH: "메인요리",
    SOUP: "국/찌개",
    SIDE_DISH: "반찬",
    KIMCHI: "김치",
    PICKLE: "절임/젓갈",
    SAUCE: "소스/양념",
}

export default async function ProductsPage() {
    const { success, data: products } = await getProducts()

    if (!success || !products) {
        return <div>Failed to load products</div>
    }

    return (
        <div className="container mx-auto py-10">
            <ProductListShortcuts />
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">상품 관리 (Product Manager)</h1>
                <Link href="/admin/products/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> 상품 등록
                    </Button>
                </Link>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>상품명</TableHead>
                            <TableHead>유형</TableHead>
                            <TableHead>카테고리</TableHead>
                            <TableHead>기본가격</TableHead>
                            <TableHead>설명</TableHead>
                            <TableHead>상태</TableHead>
                            <TableHead>관리</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                    등록된 상품이 없습니다.
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map((product) => (
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
                                        <Badge variant={product.status === 'SELLING' ? 'default' : 'destructive'}>
                                            {product.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Link href={`/admin/products/${product.id}`}>
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
