'use client'

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function ProductListShortcuts() {
    const router = useRouter()

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl + N for New Product
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
                e.preventDefault()
                router.push("/admin/products/new")
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [router])

    return null
}
