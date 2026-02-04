'use client'

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteProduct } from "./actions"
import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface DeleteProductButtonProps {
    id: string
    name: string
}

export function DeleteProductButton({ id, name }: DeleteProductButtonProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleDelete = async () => {
        if (!confirm(`정말 '${name}' 상품을 삭제하시겠습니까?\n삭제 후 복구할 수 없습니다.`)) {
            return
        }

        setLoading(true)
        try {
            const result = await deleteProduct(id)
            if (result.success) {
                toast.success("상품이 삭제되었습니다.")
                router.refresh()
            } else {
                toast.error(result.error || "삭제에 실패했습니다.")
            }
        } catch (error) {
            console.error(error)
            toast.error("오류가 발생했습니다.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
            disabled={loading}
        >
            <Trash2 className="h-4 w-4" />
        </Button>
    )
}
