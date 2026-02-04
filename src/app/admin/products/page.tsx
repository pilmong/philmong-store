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

            <ProductList initialProducts={products} />
        </div>
    )
}
