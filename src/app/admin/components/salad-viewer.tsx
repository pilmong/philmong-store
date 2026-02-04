'use client'

import React from 'react'
import { cn } from "@/lib/utils"
import { Plus } from "lucide-react"

export interface SaladSlotData {
    id?: string
    text: string
    isEmpty?: boolean
}

interface SaladViewerProps {
    className?: string
    main: SaladSlotData // Salad Name
    ingredients: SaladSlotData // Description/Ingredients
    onSlotClick?: (slotKey: 'main' | 'ingredients', currentId?: string) => void
    readOnly?: boolean
}

export function SaladViewer({ className, main, ingredients, onSlotClick, readOnly = false }: SaladViewerProps) {
    const isInteractive = !readOnly && !!onSlotClick

    return (
        <div className={cn("relative w-full max-w-[500px] h-[120px] bg-[#e6f4ea] border-2 border-[#1e8e3e] rounded-xl overflow-hidden shadow-sm mx-auto flex", className)}>
            {/* Left: Main Name */}
            <div
                onClick={() => isInteractive && onSlotClick && onSlotClick('main', main.id)}
                className={cn(
                    "w-[40%] h-full flex items-center justify-center p-4 border-r-2 border-[#1e8e3e] border-dashed relative select-none",
                    isInteractive && "cursor-pointer hover:bg-[#ceuid0] transition-colors group"
                )}
            >
                <div className="absolute top-2 left-2 text-[10px] text-[#1e8e3e] font-bold uppercase tracking-wider">Salad Name</div>
                {main.isEmpty ? (
                    isInteractive && <Plus className="w-8 h-8 text-[#1e8e3e]/30 group-hover:text-[#1e8e3e]" />
                ) : (
                    <span className="text-xl md:text-2xl font-black text-[#134f25] text-center break-keep leading-tight">
                        {main.text}
                    </span>
                )}
            </div>

            {/* Right: Ingredients */}
            <div
                onClick={() => isInteractive && onSlotClick && onSlotClick('ingredients', ingredients.id)}
                className={cn(
                    "flex-1 h-full flex items-center justify-center p-6 relative select-none",
                    isInteractive && "cursor-pointer hover:bg-[#ceuid0] transition-colors group"
                )}
            >
                <div className="absolute top-2 left-2 text-[10px] text-[#1e8e3e] font-bold uppercase tracking-wider">Ingredients</div>
                {ingredients.isEmpty ? (
                    isInteractive && <Plus className="w-8 h-8 text-[#1e8e3e]/30 group-hover:text-[#1e8e3e]" />
                ) : (
                    <span className="text-sm md:text-base text-[#1b5e20] text-center font-medium leading-relaxed break-keep">
                        {ingredients.text}
                    </span>
                )}
            </div>
        </div>
    )
}
