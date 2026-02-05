import { ProductForm } from "../product-form"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"

export default function NewProductPage() {
    return (
        <div className="container mx-auto py-10">
            <h1 className="text-2xl font-bold mb-6">상품 등록</h1>
            <Suspense fallback={
                <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
            }>
                <ProductForm />
            </Suspense>
        </div>
    )
}
