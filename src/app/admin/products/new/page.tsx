import { ProductForm } from "../product-form"

export default function NewProductPage() {
    return (
        <div className="container mx-auto py-10">
            <h1 className="text-2xl font-bold mb-6">상품 등록</h1>
            <ProductForm />
        </div>
    )
}
