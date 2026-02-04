'use client'

import React from 'react'
import { cn } from "@/lib/utils"
import { Plus } from "lucide-react"

export interface SlotData {
    id?: string
    text: string
    isEmpty?: boolean
}

interface LunchBoxGuideProps {
    className?: string
    slots: {
        rice: SlotData
        soup: SlotData
        main: SlotData
        side1: SlotData
        side2: SlotData
        side3: SlotData
    }
    onSlotClick?: (slotKey: string, currentId?: string) => void
    readOnly?: boolean
}

export function LunchBoxGuide({ className, slots, onSlotClick, readOnly = false }: LunchBoxGuideProps) {
    const isInteractive = !readOnly && !!onSlotClick

    const Slot = ({
        data,
        label,
        className,
        textClass = "text-white"
    }: {
        data: SlotData,
        label: string,
        className?: string,
        textClass?: string
    }) => (
        <div
            onClick={() => isInteractive && onSlotClick && onSlotClick(label, data.id)}
            className={cn(
                "rounded-lg shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] flex items-center justify-center p-2 relative transition-all",
                className,
                data.isEmpty ? "bg-[#2a1d15]/50" : "bg-[#2a1d15]",
                isInteractive && "cursor-pointer hover:ring-2 hover:ring-emerald-400 hover:ring-offset-2 hover:ring-offset-[#4a3525] group"
            )}
        >
            <div className={cn("absolute top-1 left-2 text-[10px] text-gray-500 font-bold pointer-events-none transition-colors", isInteractive && "group-hover:text-emerald-400")}>{label}</div>

            {data.isEmpty ? (
                isInteractive && <Plus className="w-5 h-5 text-gray-600 group-hover:text-emerald-400 transition-colors" />
            ) : (
                <span className={cn("text-xs md:text-sm text-center font-medium break-keep leading-tight", textClass)}>
                    {data.text}
                </span>
            )}
        </div>
    )

    return (
        <div className={cn("relative w-full max-w-[500px] aspect-[265/195] bg-[#4a3525] rounded-xl p-2 shadow-inner mx-auto", className)}>
            <div className="flex flex-col h-full gap-2">
                {/* Top Row: Side 1, Main, Side 2, Side 3 */}
                <div className="flex h-[45%] gap-2">
                    <Slot data={slots.side1} label="반찬1" className="w-[18%]" />
                    <Slot data={slots.main} label="메인" className="w-[28%]" textClass="text-amber-200 font-bold sm:text-base" />
                    <Slot data={slots.side2} label="반찬2" className="w-[18%]" />
                    <Slot data={slots.side3} label="반찬3" className="flex-1" />
                </div>

                {/* Bottom Row: Rice, Soup */}
                <div className="flex flex-1 gap-2">
                    {/* Rice */}
                    <div
                        onClick={() => isInteractive && onSlotClick && onSlotClick('밥', slots.rice.id)}
                        className={cn(
                            "w-[45%] rounded-lg shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] flex items-center justify-center p-4 relative transition-all",
                            slots.rice.isEmpty ? "bg-[#2a1d15]/50" : "bg-[#2a1d15]",
                            isInteractive && "cursor-pointer hover:ring-2 hover:ring-emerald-400 hover:ring-offset-2 hover:ring-offset-[#4a3525] group"
                        )}
                    >
                        <div className={cn("absolute top-2 left-3 text-xs text-gray-500 font-bold transition-colors", isInteractive && "group-hover:text-emerald-400")}>밥</div>
                        {slots.rice.isEmpty ? (
                            isInteractive && <Plus className="w-6 h-6 text-gray-600 group-hover:text-emerald-400" />
                        ) : (
                            <span className="text-white text-lg font-bold text-center break-keep">{slots.rice.text}</span>
                        )}
                    </div>

                    {/* Soup - Circle Container */}
                    <div className="flex-1 bg-[#4a3525] relative flex items-center justify-center">
                        <div
                            onClick={() => isInteractive && onSlotClick && onSlotClick('국', slots.soup.id)}
                            className={cn(
                                "w-[90%] aspect-square rounded-full shadow-[inset_0_2px_6px_rgba(0,0,0,0.6)] flex items-center justify-center p-6 relative transition-all",
                                slots.soup.isEmpty ? "bg-[#2a1d15]/50" : "bg-[#2a1d15]",
                                isInteractive && "cursor-pointer hover:ring-2 hover:ring-emerald-400 hover:ring-offset-2 hover:ring-offset-[#4a3525] group"
                            )}
                        >
                            <div className={cn("absolute top-4 left-1/2 -translate-x-1/2 text-xs text-gray-500 font-bold transition-colors", isInteractive && "group-hover:text-emerald-400")}>국</div>
                            {slots.soup.isEmpty ? (
                                isInteractive && <Plus className="w-6 h-6 text-gray-600 group-hover:text-emerald-400" />
                            ) : (
                                <span className="text-white text-lg font-bold text-center break-keep">{slots.soup.text}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
