import { BulkProductForm } from "../bulk-product-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export default function BulkProductPage() {
    return (
        <div className="container mx-auto py-10">
            <div className="max-w-4xl mx-auto mb-8">
                <Link href="/admin/products" className="text-slate-500 hover:text-slate-900 transition-colors inline-flex items-center text-sm mb-4">
                    <ChevronLeft className="mr-1 h-4 w-4" /> 상품 목록으로 돌아가기
                </Link>
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">다량 상품 일괄 등록</h1>
                    <p className="text-slate-500">동일한 유형과 카테고리의 상품 수십 개를 한 번에 빠르게 등록하세요.</p>
                </div>
            </div>

            <BulkProductForm />
        </div>
    )
}
