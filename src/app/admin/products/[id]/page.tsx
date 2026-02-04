import { getProductById } from "../actions"
import { ProductForm } from "../product-form"
import { notFound } from "next/navigation"

interface Props {
    params: {
        id: string
    }
}

export default async function ProductEditPage({ params }: Props) {
    const { success, data: product } = await getProductById(params.id)

    if (!success || !product) {
        notFound()
    }

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-2xl font-bold mb-6">상품 수정</h1>
            <div className="border rounded-md p-6 bg-white">
                <ProductForm initialData={product} />
            </div>
        </div>
    )
}
