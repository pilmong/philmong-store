'use client'

import { useState, useEffect } from "react"
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from "date-fns"
import { ko } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronLeft, ChevronRight, Save } from "lucide-react"
import { ClientOrder } from "@prisma/client"
import { getClientOrders, upsertClientOrder } from "../../actions"

interface WeeklyOrderManagerProps {
    clientId: string
}

export function WeeklyOrderManager({ clientId }: WeeklyOrderManagerProps) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [orders, setOrders] = useState<ClientOrder[]>([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    // Week navigation
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }) // Monday
    const weekDays = Array.from({ length: 5 }, (_, i) => addDays(startDate, i)) // Mon-Fri

    useEffect(() => {
        fetchOrders()
    }, [currentDate])

    const fetchOrders = async () => {
        setLoading(true)
        const res = await getClientOrders(clientId, currentDate)
        if (res.success && res.data) {
            setOrders(res.data)
        }
        setLoading(false)
    }

    const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1))
    const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1))

    const getOrderForDate = (date: Date) => {
        return orders.find(o => isSameDay(new Date(o.date), date))
    }

    const handleSave = async (date: Date, lunchQty: number, saladQty: number, note: string) => {
        setSaving(true)
        const res = await upsertClientOrder(clientId, {
            date,
            lunchBoxQuantity: lunchQty,
            saladQuantity: saladQty,
            note
        })

        if (res.success) {
            await fetchOrders() // Refresh to get updated IDs etc
        } else {
            alert("저장 실패")
        }
        setSaving(false)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between bg-slate-100 p-4 rounded-lg">
                <Button variant="outline" onClick={handlePrevWeek}>
                    <ChevronLeft className="h-4 w-4 mr-2" /> 이전 주
                </Button>
                <h2 className="text-xl font-bold">
                    {format(startDate, "yyyy년 M월")} {format(startDate, "w")}주차
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                        ({format(startDate, "MM.dd")} ~ {format(weekDays[4], "MM.dd")})
                    </span>
                </h2>
                <Button variant="outline" onClick={handleNextWeek}>
                    다음 주 <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {weekDays.map(day => {
                    const order = getOrderForDate(day)
                    const isToday = isSameDay(day, new Date())

                    return (
                        <DailyOrderCard
                            key={day.toISOString()}
                            date={day}
                            order={order}
                            onSave={handleSave}
                            isToday={isToday}
                            disabled={saving}
                        />
                    )
                })}
            </div>
        </div>
    )
}

function DailyOrderCard({ date, order, onSave, isToday, disabled }: any) {
    const [lunchQty, setLunchQty] = useState(order?.lunchBoxQuantity || 0)
    const [saladQty, setSaladQty] = useState(order?.saladQuantity || 0)
    const [note, setNote] = useState(order?.note || "")
    const [isDirty, setIsDirty] = useState(false)

    // Update local state when order prop updates (from fetch)
    useEffect(() => {
        setLunchQty(order?.lunchBoxQuantity || 0)
        setSaladQty(order?.saladQuantity || 0)
        setNote(order?.note || "")
        setIsDirty(false)
    }, [order])

    const handleSaveClick = () => {
        onSave(date, lunchQty, saladQty, note)
        setIsDirty(false)
    }

    const handleChange = (setter: any, val: any) => {
        setter(val)
        setIsDirty(true)
    }

    return (
        <Card className={isToday ? "border-blue-500 shadow-md" : ""}>
            <CardHeader className="pb-2">
                <CardTitle className={`text-center ${isToday ? "text-blue-600" : ""}`}>
                    {format(date, "M/d (EEE)", { locale: ko })}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-1">
                    <Label className="text-xs">도시락</Label>
                    <Input
                        type="number"
                        min="0"
                        value={lunchQty}
                        onChange={e => handleChange(setLunchQty, Number(e.target.value))}
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">샐러드</Label>
                    <Input
                        type="number"
                        min="0"
                        value={saladQty}
                        onChange={e => handleChange(setSaladQty, Number(e.target.value))}
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">비고</Label>
                    <Input
                        className="text-xs"
                        placeholder="특이사항"
                        value={note}
                        onChange={e => handleChange(setNote, e.target.value)}
                    />
                </div>

                <Button
                    className="w-full"
                    size="sm"
                    variant={isDirty ? "default" : "outline"}
                    onClick={handleSaveClick}
                    disabled={disabled}
                >
                    {isDirty ? <Save className="h-3 w-3 mr-1" /> : null}
                    {isDirty ? "저장" : "완료"}
                </Button>
            </CardContent>
        </Card>
    )
}
