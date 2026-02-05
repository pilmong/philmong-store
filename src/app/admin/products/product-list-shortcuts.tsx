'use client'

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export function ProductListShortcuts() {
    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl + Q for New Product
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'q') {
                e.preventDefault()
                const params = searchParams.toString()
                router.push(`/admin/products/new${params ? `?${params}` : ''}`)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [router])

    return null
}
