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
import { ProductListShortcuts } from "./product-list-shortcuts"
import { ProductList } from "./product-list"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"

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
                <div className="flex gap-2">
                    <Link href="/admin/products/bulk">
                        <Button variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50">
                            <Plus className="mr-2 h-4 w-4" /> 대량 등록
                        </Button>
                    </Link>
                    <Link href="/admin/products/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> 개별 등록
                        </Button>
                    </Link>
                </div>
            </div>

            <Suspense fallback={
                <div className="flex justify-center py-20 bg-white border rounded-lg">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
            }>
                <ProductList initialProducts={products} />
            </Suspense>
        </div>
    )
}
