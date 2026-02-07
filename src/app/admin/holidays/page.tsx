'use client'

import React, { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Plus,
    Trash2,
    Info,
    Store,
    Briefcase,
    GraduationCap,
    User,
    Wrench,
    AlertTriangle,
    CheckCircle2
} from "lucide-react"
import { toast } from "sonner"
import { getHolidays, upsertHoliday, deleteHoliday, type HolidayRecord } from "./actions"
import { cn } from "@/lib/utils"
import { PUBLIC_HOLIDAYS_2026 } from "@/lib/constants"
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay } from "date-fns"
import { ko } from "date-fns/locale"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

const CATEGORIES = [
    { value: "HOLIDAY", label: "공휴일", color: "bg-red-500", text: "text-red-700", bg: "bg-red-50", icon: CalendarDays },
    { value: "EDUCATION", label: "직원교육", color: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50", icon: GraduationCap },
    { value: "ERRAND", label: "외부업무", color: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50", icon: Briefcase },
    { value: "VACATION", label: "직원휴무", color: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", icon: User },
    { value: "MAINTENANCE", label: "정기점검", color: "bg-slate-500", text: "text-slate-700", bg: "bg-slate-50", icon: Wrench },
    { value: "PRIVATE", label: "개인사정", color: "bg-purple-500", text: "text-purple-700", bg: "bg-purple-50", icon: Info },
]

export default function HolidayManagementPage() {
    const [viewDate, setViewDate] = useState(new Date())
    const [holidays, setHolidays] = useState<HolidayRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    // Form States
    const [category, setCategory] = useState("HOLIDAY")
    const [reason, setReason] = useState("")
    const [isStoreClosed, setIsStoreClosed] = useState("true")

    const fetchHolidays = async () => {
        setLoading(true)
        const res = await getHolidays(viewDate.getFullYear(), viewDate.getMonth())
        if (res.success && res.data) {
            setHolidays(res.data)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchHolidays()
    }, [viewDate])

    const handleDateClick = (date: Date) => {
        const dateStr = format(date, "yyyy-MM-dd")
        const existing = holidays.find(h => format(new Date(h.date), "yyyy-MM-dd") === dateStr)

        setSelectedDate(date)
        if (existing) {
            setCategory(existing.category)
            setReason(existing.reason || "")
            setIsStoreClosed(existing.isStoreClosed ? "true" : "false")
        } else {
            // Default for new entry
            const isPublic = !!PUBLIC_HOLIDAYS_2026[dateStr]
            setCategory(isPublic ? "HOLIDAY" : "PRIVATE")
            setReason(PUBLIC_HOLIDAYS_2026[dateStr] || "")
            setIsStoreClosed("true") // Default to closed
        }
        setIsDialogOpen(true)
    }

    const handleSave = async () => {
        if (!selectedDate) return

        const res = await upsertHoliday({
            date: format(selectedDate, "yyyy-MM-dd"),
            category,
            reason,
            isStoreClosed: isStoreClosed === "true"
        })

        if (res.success) {
            toast.success("일정이 저장되었습니다.")
            setIsDialogOpen(false)
            fetchHolidays()
        } else {
            toast.error(res.error)
        }
    }

    const handleDelete = async () => {
        if (!selectedDate) return
        const res = await deleteHoliday(format(selectedDate, "yyyy-MM-dd"))
        if (res.success) {
            toast.success("일정이 삭제되었습니다.")
            setIsDialogOpen(false)
            fetchHolidays()
        } else {
            toast.error(res.error)
        }
    }

    // Calendar Calculations
    const startObj = startOfMonth(viewDate)
    const endObj = endOfMonth(viewDate)
    const calendarStart = startOfWeek(startObj)
    const calendarEnd = endOfWeek(endObj)

    const calendarDays = eachDayOfInterval({
        start: calendarStart,
        end: calendarEnd
    })

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-6 max-w-7xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">운영 플래너</h1>
                    <p className="text-muted-foreground mt-1">
                        매장의 모든 일정과 영업 상태를 한눈에 관리하세요.
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border">
                    <Button variant="ghost" size="icon" onClick={() => setViewDate(subMonths(viewDate, 1))}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="px-4 font-bold text-lg min-w-[140px] text-center">
                        {format(viewDate, "yyyy년 M월", { locale: ko })}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setViewDate(addMonths(viewDate, 1))}>
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                    <Button variant="outline" size="sm" className="ml-2 font-semibold" onClick={() => setViewDate(new Date())}>
                        오늘
                    </Button>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 p-4 bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2 flex items-center">범례:</div>
                {CATEGORIES.map(cat => (
                    <div key={cat.value} className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-slate-50">
                        <div className={cn("w-2 h-2 rounded-full", cat.color)} />
                        <span className="text-sm font-medium text-slate-600">{cat.label}</span>
                    </div>
                ))}
            </div>

            {/* Main Calendar Grid */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                {/* Day Header */}
                <div className="grid grid-cols-7 bg-slate-50 border-b">
                    {["일", "월", "화", "수", "목", "금", "토"].map((day, i) => (
                        <div key={day} className={cn(
                            "py-3 text-center text-xs font-bold uppercase tracking-tighter",
                            i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-slate-400"
                        )}>
                            {day}요일
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 auto-rows-fr min-h-[600px] divide-x divide-y divide-slate-100">
                    {calendarDays.map((date, i) => {
                        const dateStr = format(date, "yyyy-MM-dd")
                        const isCurrentMonth = isSameMonth(date, viewDate)
                        const isToday = isSameDay(date, new Date())
                        const dayOfWeek = date.getDay()
                        const schedule = holidays.find(h => format(new Date(h.date), "yyyy-MM-dd") === dateStr)
                        const isPublicHoliday = !!PUBLIC_HOLIDAYS_2026[dateStr]

                        return (
                            <div
                                key={dateStr}
                                onClick={() => handleDateClick(date)}
                                className={cn(
                                    "p-3 min-h-[120px] transition-all hover:bg-slate-50 cursor-pointer group flex flex-col gap-2 relative",
                                    !isCurrentMonth && "bg-slate-50/50 opacity-40",
                                    isToday && "bg-blue-50/30"
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <span className={cn(
                                        "text-base font-bold flex items-center justify-center w-7 h-7 rounded-full",
                                        isToday && "bg-blue-600 text-white",
                                        !isToday && (dayOfWeek === 0 || isPublicHoliday) && "text-red-500", // 일요일/공휴일 빨강
                                        !isToday && dayOfWeek === 6 && !isPublicHoliday && "text-blue-500", // 토요일 파랑
                                        !isToday && !isCurrentMonth && "text-slate-300",
                                        !isToday && isCurrentMonth && dayOfWeek !== 0 && dayOfWeek !== 6 && !isPublicHoliday && "text-slate-700"
                                    )}>
                                        {date.getDate()}
                                    </span>
                                    {schedule ? (
                                        schedule.isStoreClosed && (
                                            <Badge variant="destructive" className="h-5 px-1.5 text-[10px] whitespace-nowrap">
                                                반영 휴무
                                            </Badge>
                                        )
                                    ) : (
                                        // DB 기록은 없지만 기본 정책상 휴무인 경우
                                        (dayOfWeek === 0 || dayOfWeek === 6 || isPublicHoliday) && (
                                            <Badge variant="outline" className="h-5 px-1.5 text-[10px] border-slate-200 text-slate-400 whitespace-nowrap bg-slate-50">
                                                기본 휴무
                                            </Badge>
                                        )
                                    )}
                                </div>

                                {/* Event List */}
                                <div className="space-y-1 mt-1 overflow-hidden font-bold">
                                    {isPublicHoliday && (
                                        <div className="text-[10px] font-black text-red-500 px-1 truncate line-clamp-1 flex items-center gap-1">
                                            <div className="w-1 h-1 rounded-full bg-red-500" />
                                            {PUBLIC_HOLIDAYS_2026[dateStr]}
                                        </div>
                                    )}
                                    {schedule && (
                                        <div className={cn(
                                            "rounded-md px-2 py-1.5 border flex flex-col gap-0.5",
                                            CATEGORIES.find(c => c.value === schedule.category)?.bg || "bg-slate-50",
                                            CATEGORIES.find(c => c.value === schedule.category)?.text || "text-slate-700"
                                        )}>
                                            <div className="flex items-center gap-1">
                                                {React.createElement(CATEGORIES.find(c => c.value === schedule.category)?.icon || Info, { className: "h-3 w-3" })}
                                                <span className="text-[11px] font-black leading-none">
                                                    {CATEGORIES.find(c => c.value === schedule.category)?.label}
                                                </span>
                                            </div>
                                            <div className="text-[12px] font-bold truncate leading-tight mt-0.5">
                                                {schedule.reason || "일정"}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Action Hint */}
                                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Plus className="h-4 w-4 text-slate-300" />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Dialog for Edit/Add */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl flex items-center gap-2">
                            <CalendarDays className="h-5 w-5 text-blue-600" />
                            {selectedDate ? format(selectedDate, "yyyy년 M월 d일", { locale: ko }) : ""} 일정 관리
                        </DialogTitle>
                        <DialogDescription>
                            이 날짜의 일정 성격과 매장 운영 상태를 설정하세요.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">일정 카테고리</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat.value}
                                        onClick={() => setCategory(cat.value)}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-1.5",
                                            category === cat.value
                                                ? "bg-slate-900 text-white border-slate-900 shadow-lg scale-[1.03]"
                                                : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                                        )}
                                    >
                                        <cat.icon className={cn("h-5 w-5", category === cat.value ? "text-white" : "text-slate-400")} />
                                        <span className="text-[11px] font-bold">{cat.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reason" className="text-xs font-bold text-slate-400 uppercase tracking-widest">일정 설명 / 휴무 사유</Label>
                            <Input
                                id="reason"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="ex: 설날, 주간 정기 교육, 정비 등"
                                className="h-11 font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">스토어 영업 상태</Label>
                            <Select value={isStoreClosed} onValueChange={setIsStoreClosed}>
                                <SelectTrigger className={cn(
                                    "h-12 text-base font-bold transition-all",
                                    isStoreClosed === "true" ? "bg-red-50 text-red-600 border-red-200 shadow-inner" : "bg-emerald-50 text-emerald-600 border-emerald-200"
                                )}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="true" className="font-bold text-red-600">
                                        <div className="flex items-center gap-2">
                                            <Store className="h-4 w-4" />
                                            영업 중단 (주문 차단)
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="false" className="font-bold text-emerald-600">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4" />
                                            정상 영업 유지
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-[11px] text-slate-400 px-1 leading-relaxed">
                                {isStoreClosed === "true"
                                    ? "⚠️ 고객들에게 '쉬어갑니다' 안내가 표시되며 주문이 차단됩니다."
                                    : "✅ 일정만 기록하며, 스토어는 정상적으로 운영됩니다."}
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        {holidays.some(h => format(new Date(h.date), "yyyy-MM-dd") === (selectedDate ? format(selectedDate, "yyyy-MM-dd") : "")) && (
                            <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleDelete}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                삭제
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>취소</Button>
                        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">저장하기</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Card className="bg-slate-900 border-none shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <CalendarDays className="h-32 w-32 text-white" />
                </div>
                <CardContent className="pt-8 pb-8">
                    <div className="flex gap-5 relative z-10">
                        <div className="h-12 w-12 shrink-0 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-900/40 font-black text-xl italic">TIP</div>
                        <div className="space-y-3">
                            <p className="text-white text-lg font-bold tracking-tight">작은 매장 일정도 꼼꼼하게 관리하세요</p>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm text-slate-300 opacity-80">
                                <li className="flex gap-2">
                                    <div className="mt-1.5 w-1.5 h-1.5 shrink-0 bg-blue-500 rounded-full" />
                                    <span>일정을 기록하면 '오늘의 작업' 장부에서도 일정을 확인할 수 있습니다.</span>
                                </li>
                                <li className="flex gap-2">
                                    <div className="mt-1.5 w-1.5 h-1.5 shrink-0 bg-blue-500 rounded-full" />
                                    <span>공휴일은 이미 입력되어 있지만, 매장 사정에 맞춰 편집이 가능합니다.</span>
                                </li>
                                <li className="flex gap-2">
                                    <div className="mt-1.5 w-1.5 h-1.5 shrink-0 bg-blue-500 rounded-full" />
                                    <span>일정 색상만 보고도 교육일인지, 휴무일인지 즉시 파악할 수 있어요.</span>
                                </li>
                                <li className="flex gap-2">
                                    <div className="mt-1.5 w-1.5 h-1.5 shrink-0 bg-blue-500 rounded-full" />
                                    <span>외부 업무가 있더라도 영업을 계속한다면 '정상 영업'으로 세팅하세요!</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
