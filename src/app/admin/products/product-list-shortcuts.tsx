'use client'

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function ProductListShortcuts() {
    const router = useRouter()

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Alt + N for New Product
            if (e.altKey && e.key.toLowerCase() === 'n') {
                e.preventDefault()
                router.push("/admin/products/new")
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [router])

    return null
}
