'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea" // Add Textarea import
import { Label } from "@/components/ui/label"       // Add Label import
import { logoutB2B, getB2BSession, getClientOrders, updateClientOrder, getClientNote, updateClientNote } from "../actions"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { startOfWeek, endOfWeek, addDays, format, addWeeks, subWeeks, isSameDay } from "date-fns"
import { ko } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Loader2, Save } from "lucide-react"
import { toast } from "sonner"

export default function B2BDashboardPage() {
    const router = useRouter()
    const [client, setClient] = useState<{ id: string, name: string } | null>(null)
    const [currentDate, setCurrentDate] = useState(new Date())
    const [orders, setOrders] = useState<any[]>([])
    // inputValues: dateStr -> { lunch, salad, note }
    const [inputValues, setInputValues] = useState<{ [key: string]: { lunch: string, salad: string, note: string } }>({})
    const [generalNote, setGeneralNote] = useState("")
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Load Session
    useEffect(() => {
        getB2BSession().then(session => {
            if (!session) {
                router.replace("/b2b/login")
            } else {
                setClient(session)
                // Fetch general note
                getClientNote(session.id).then(res => {
                    if (res.success) setGeneralNote(res.note)
                })
            }
        })
    }, [router])

    // Load Orders for the week
    useEffect(() => {
        if (!client) return

        const fetchOrders = async () => {
            setLoading(true)
            const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
            const weekEnd = addDays(weekStart, 4)

            const res = await getClientOrders(client.id, weekStart, weekEnd)
            if (res.success && res.orders) {
                setOrders(res.orders)

                const initialInputs: any = {}
                for (let i = 0; i < 5; i++) {
                    const day = addDays(weekStart, i)
                    const existing = res.orders.find((o: any) => isSameDay(new Date(o.date), day))
                    const dateKey = format(day, "yyyy-MM-dd")

                    initialInputs[dateKey] = {
                        lunch: existing ? existing.lunchBoxQuantity.toString() : "0",
                        salad: existing ? existing.saladQuantity.toString() : "0",
                        note: existing ? existing.note || "" : ""
                    }
                }
                setInputValues(initialInputs)
            }
            setLoading(false)
        }

        fetchOrders()
    }, [client, currentDate])

    const handleInputChange = (dateStr: string, type: 'lunch' | 'salad' | 'note', value: string) => {
        if (type !== 'note' && !/^\d*$/.test(value)) return

        setInputValues(prev => ({
            ...prev,
            [dateStr]: {
                ...prev[dateStr],
                [type]: value
            }
        }))
    }

    const handleSave = async () => {
        if (!client) return
        setSaving(true)

        try {
            // Save Client General Note
            await updateClientNote(client.id, generalNote)

            // Save Daily Orders
            const promises = Object.entries(inputValues).map(([dateStr, values]) => {
                const lunchQty = parseInt(values.lunch) || 0
                const saladQty = parseInt(values.salad) || 0
                const note = values.note

                return updateClientOrder(client.id, new Date(dateStr), lunchQty, saladQty, note)
            })

            const results = await Promise.all(promises)
            const failure = results.find(r => !r.success)

            if (failure) {
                toast.error("일부 주문 저장에 실패했습니다.")
            } else {
                toast.success("주문 및 요청사항이 저장되었습니다.")
            }
        } catch (e) {
            console.error(e)
            toast.error("저장 중 오류가 발생했습니다.")
        } finally {
            setSaving(false)
        }
    }

    if (!client) return null

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
    const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i))

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold">B</div>
                    <span className="font-bold text-lg">{client.name}</span>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={() => logoutB2B()} className="text-muted-foreground">로그아웃</Button>
                </div>
            </header>

            <main className="container mx-auto p-4 md:p-8 max-w-4xl pb-32">
                {/* General Note Section */}
                <div className="bg-white p-6 rounded-xl border shadow-sm mb-8">
                    <Label className="text-base font-bold mb-2 block">🏢 배송 요청사항 (공통)</Label>
                    <p className="text-sm text-muted-foreground mb-3">매일 배송 시 참고해야 할 고정적인 요청사항을 적어주세요.</p>
                    <Textarea
                        placeholder="예: 1층 로비에 맡겨주세요 / 문 앞에 놔주세요"
                        value={generalNote}
                        onChange={(e) => setGeneralNote(e.target.value)}
                        className="resize-none"
                    />
                </div>

                {/* Week Navigation */}
                <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-xl border shadow-sm">
                    <Button variant="ghost" size="icon" onClick={() => setCurrentDate(subWeeks(currentDate, 1))}>
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <div className="text-center">
                        <h2 className="text-xl font-bold">{format(weekStart, "yyyy년 M월", { locale: ko })}</h2>
                        <p className="text-sm text-muted-foreground">
                            {format(weekStart, "M.d(iii)", { locale: ko })} ~ {format(addDays(weekStart, 4), "M.d(iii)", { locale: ko })}
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addWeeks(currentDate, 1))}>
                        <ChevronRight className="h-6 w-6" />
                    </Button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {weekDays.map(day => {
                            const dateStr = format(day, "yyyy-MM-dd")
                            const dayValues = inputValues[dateStr] || { lunch: "0", salad: "0", note: "" }
                            const isToday = isSameDay(day, new Date())

                            return (
                                <div key={dateStr} className={`bg-white p-5 rounded-xl border shadow-sm ${isToday ? 'border-primary ring-1 ring-primary/20' : ''}`}>
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                        {/* Date & Quantities */}
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className={`text-center w-12 py-1 rounded-lg flex-shrink-0 ${isToday ? 'bg-primary text-white' : 'bg-slate-100'}`}>
                                                <div className="font-bold">{format(day, "d")}</div>
                                                <div className="text-xs">{format(day, "E", { locale: ko })}</div>
                                            </div>

                                            <div className="flex flex-col w-full gap-2">
                                                <div className="font-medium mb-1 hidden md:block">{format(day, "M월 d일")}</div>
                                                <div className="flex gap-2">
                                                    <div className="flex-1 bg-slate-50 p-2 rounded border">
                                                        <label className="text-[10px] text-slate-500 font-bold block mb-1">도시락</label>
                                                        <Input
                                                            type="text"
                                                            className="bg-white text-lg font-bold text-center h-9 p-0"
                                                            value={dayValues.lunch}
                                                            onChange={(e) => handleInputChange(dateStr, 'lunch', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="flex-1 bg-slate-50 p-2 rounded border">
                                                        <label className="text-[10px] text-slate-500 font-bold block mb-1">샐러드</label>
                                                        <Input
                                                            type="text"
                                                            className="bg-white text-lg font-bold text-center h-9 p-0"
                                                            value={dayValues.salad}
                                                            onChange={(e) => handleInputChange(dateStr, 'salad', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Daily Note */}
                                        <div className="w-full md:w-1/2">
                                            <Label className="text-xs text-muted-foreground mb-1 block">일자별 메모</Label>
                                            <Input
                                                placeholder="오늘의 특이사항 (선택)"
                                                value={dayValues.note}
                                                onChange={(e) => handleInputChange(dateStr, 'note', e.target.value)}
                                                className="text-sm bg-slate-50/50"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t md:relative md:bg-transparent md:border-t-0 md:p-0 md:mt-8">
                    <Button className="w-full h-14 text-lg font-bold shadow-lg" onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                        모든 변경사항 저장하기
                    </Button>
                </div>
            </main>
        </div>
    )
}
