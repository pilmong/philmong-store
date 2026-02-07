'use client'

import React, { useState, useEffect, useRef } from "react"
import { format, addDays, subDays } from "date-fns"
import { ko } from "date-fns/locale"
import { useReactToPrint } from "react-to-print"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SaladViewer } from "../components/salad-viewer"
import { LunchBoxGuide } from "../components/lunchbox-guide"
import { Invoice } from "../components/invoice"
import { getDailyOperations, updateClientOrderAction, getOrderLogs } from "./actions"
import { ChevronLeft, ChevronRight, RefreshCw, Printer, Edit2, History, ArrowRight } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"

// ... inside page component ...




export default function DailyOperationsPage() {
    const [date, setDate] = useState(new Date())
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [printTarget, setPrintTarget] = useState<any>(null)
    const [editingClient, setEditingClient] = useState<any>(null)
    const [viewingLogs, setViewingLogs] = useState<any>(null)
    const [orderLogs, setOrderLogs] = useState<any[]>([])
    const [logsLoading, setLogsLoading] = useState(false)
    const [editValues, setEditValues] = useState({ lunch: 0, salad: 0, note: "" })
    const [saving, setSaving] = useState(false)

    // Invoice Print Ref
    const invoiceRef = useRef<HTMLDivElement>(null)
    const handlePrint = useReactToPrint({
        contentRef: invoiceRef,
        onAfterPrint: () => setPrintTarget(null)
    })

    // Trigger print when target changes
    useEffect(() => {
        if (printTarget) {
            // Short delay to ensure state update renders the correct invoice data
            setTimeout(() => {
                handlePrint()
            }, 100)
        }
    }, [printTarget])

    const loadData = async () => {
        setLoading(true)
        const res = await getDailyOperations(date)
        if (res.success) {
            setData(res.data)
        }
        setLoading(false)
    }

    useEffect(() => {
        loadData()
    }, [date])

    const handleOpenEdit = (client: any) => {
        setEditingClient(client)
        setEditValues({
            lunch: client.lunchQty,
            salad: client.saladQty,
            note: client.dailyNote || ""
        })
    }

    const handleSaveEdit = async () => {
        if (!editingClient) return
        setSaving(true)
        const res = await updateClientOrderAction(
            editingClient.id,
            date,
            editValues.lunch,
            editValues.salad,
            editValues.note
        )
        if (res.success) {
            toast.success("수량이 저장되었습니다.")
            setEditingClient(null)
            loadData()
        } else {
            toast.error(res.error)
        }
        setSaving(false)
    }

    const handleViewLogs = async (client: any) => {
        setViewingLogs(client)
        setLogsLoading(true)
        const res = await getOrderLogs(client.id, date)
        if (res.success) {
            setOrderLogs(res.logs)
        } else {
            toast.error(res.error)
        }
        setLogsLoading(false)
    }

    const PaymentBadge = ({ method, timing }: { method: string, timing: string }) => {
        const isCash = method === 'CASH'
        const isImmediate = timing === 'IMMEDIATE'

        return (
            <div className="flex gap-1">
                <Badge variant={isCash ? "outline" : "default"} className="text-[10px] h-5 px-1">
                    {isCash ? "현금" : "카드"}
                </Badge>
                <Badge variant={isImmediate ? "secondary" : "secondary"} className={`text-[10px] h-5 px-1 ${isImmediate ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                    {isImmediate ? "즉시" : "합산"}
                </Badge>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            {/* Header / Date Nav */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h1 className="text-2xl font-bold">작업 및 배송/결제 관리</h1>

                <div className="flex items-center gap-4 bg-white p-2 rounded-lg border shadow-sm">
                    <Button variant="ghost" size="icon" onClick={() => setDate(subDays(date, 1))}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="text-center w-40">
                        <div className="font-bold text-lg">{format(date, "M월 d일 (EEE)", { locale: ko })}</div>
                        <div className="text-xs text-muted-foreground">{format(date, "yyyy.MM.dd")}</div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setDate(addDays(date, 1))}>
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={loadData} title="새로고침">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Hidden Invoice Component for Printing */}
            <div className="hidden">
                {printTarget && data && (
                    <Invoice
                        ref={invoiceRef}
                        clientName={printTarget.clientName}
                        date={date}
                        items={[
                            { name: "도시락 (Lunch Box)", quantity: printTarget.lunchQty, unitPrice: printTarget.lunchPrice, amount: printTarget.lunchQty * printTarget.lunchPrice },
                            { name: "샐러드 (Salad)", quantity: printTarget.saladQty, unitPrice: printTarget.saladPrice, amount: printTarget.saladQty * printTarget.saladPrice }
                        ].filter(i => i.quantity > 0)}
                        totalAmount={(printTarget.lunchQty * printTarget.lunchPrice) + (printTarget.saladQty * printTarget.saladPrice)}
                    />
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-blue-50 border-blue-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-800">총 도시락 수량</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-blue-900">
                            {data?.summary.totalLunch || 0} <span className="text-lg font-normal text-blue-600">EA</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-50 border-slate-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-800">전체 상품 합계</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-slate-900">
                            {(data?.summary.totalLunch || 0) + (data?.summary.totalSalad || 0)} <span className="text-lg font-normal text-slate-600">EA</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-800">총 샐러드 수량</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-green-900">
                            {data?.summary.totalSalad || 0} <span className="text-lg font-normal text-green-600">EA</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-orange-50 border-orange-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-orange-800">예상 매출액</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-orange-900">
                            {data?.summary.totalRevenue?.toLocaleString() || 0} <span className="text-lg font-normal text-orange-600">원</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Production Guide (Placeholder for now) */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>🧑‍🍳 금일 작업 가이드</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* LunchBox Visualizer */}
                            <div>
                                <h3 className="text-center font-bold text-sm mb-2 text-muted-foreground">🍱 도시락 (Lunch Box)</h3>
                                <div className="flex justify-center">
                                    <LunchBoxGuide
                                        readOnly={true}
                                        slots={data?.menuSlots || {
                                            rice: { text: "밥", isEmpty: true },
                                            soup: { text: "국", isEmpty: true },
                                            main: { text: "메인", isEmpty: true },
                                            side1: { text: "반찬1", isEmpty: true },
                                            side2: { text: "반찬2", isEmpty: true },
                                            side3: { text: "반찬3", isEmpty: true }
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Salad Visualizer */}
                            <div>
                                <h3 className="text-center font-bold text-sm mb-2 text-muted-foreground">🥗 샐러드 (Salad)</h3>
                                <div className="flex justify-center">
                                    <SaladViewer
                                        readOnly={true}
                                        main={data?.menuSlots?.saladMain || { text: "오늘의 샐러드", isEmpty: true }}
                                        ingredients={data?.menuSlots?.saladIng || { text: "신선한 재료", isEmpty: true }}
                                    />
                                </div>
                            </div>

                            <Textarea placeholder="조리팀 전달사항 (예: 샐러드 소스 별도 포장)" className="min-h-[100px]" />

                            <div className="bg-amber-50 p-4 rounded-md text-sm text-amber-900">
                                <strong>💡 Tip:</strong> 작업 전 위생장갑 착용 필수. 알러지 유발 성분 표기 확인해주세요.
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Delivery & Payment Table */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>🚛 B2B 고객별 작업 현황</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-b">
                                        <tr>
                                            <th className="p-3 text-left">고객사</th>
                                            <th className="p-3 text-center">도시락</th>
                                            <th className="p-3 text-center">샐러드</th>
                                            <th className="p-3 text-center bg-slate-100/50 font-bold">합계</th>
                                            <th className="p-3 text-right text-slate-400 font-normal">정산 금액</th>
                                            <th className="p-3 text-center text-slate-400 font-normal">결제 정보</th>
                                            <th className="p-3 text-left">특이사항</th>
                                            <th className="p-3 text-center">관리</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {data?.clients.map((client: any) => (
                                            <tr key={client.id} className="hover:bg-slate-50/50">
                                                <td className="p-3 font-medium">{client.name}</td>
                                                <td className="p-3 text-center border-x">
                                                    {client.lunchQty > 0 ? <span className="font-bold text-blue-600">{client.lunchQty}</span> : "-"}
                                                </td>
                                                <td className="p-3 text-center border-r">
                                                    {client.saladQty > 0 ? <span className="font-bold text-green-600">{client.saladQty}</span> : "-"}
                                                </td>
                                                <td className="p-3 text-center bg-slate-50 font-bold text-slate-900 border-r">
                                                    {client.lunchQty + client.saladQty > 0 ? (client.lunchQty + client.saladQty) : "-"}
                                                </td>
                                                <td className="p-3 text-right text-slate-400 border-r">
                                                    {(client.totalAmount || 0).toLocaleString()}원
                                                </td>
                                                <td className="p-3 text-center border-r">
                                                    <div className="flex flex-col items-center justify-center gap-1 opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0 transition-all">
                                                        <PaymentBadge method={client.paymentMethod} timing={client.paymentTiming} />
                                                        {client.paymentDay > 0 && (
                                                            <div className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                                                {client.paymentDay === 99 ? "말일" : `${client.paymentDay}일`}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-3 text-xs max-w-[150px] border-r">
                                                    {client.generalNote && <div className="text-amber-600 mb-1">📢 {client.generalNote}</div>}
                                                    {client.dailyNote && <div className="text-slate-600 font-medium">📝 {client.dailyNote}</div>}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <div className="flex justify-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
                                                            onClick={() => handleViewLogs(client)}
                                                            title="변경 기록 보기"
                                                        >
                                                            <History className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                            onClick={() => handleOpenEdit(client)}
                                                            title="수량 수정"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        {(client.lunchQty > 0 || client.saladQty > 0) && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 w-8 p-0"
                                                                onClick={() => setPrintTarget(client)}
                                                                title="거래명세표 인쇄"
                                                            >
                                                                <Printer className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {(!data?.clients || data.clients.length === 0) && (
                                            <tr>
                                                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                                    해당 날짜에 주문 내역이 없습니다.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                    {data?.clients.length > 0 && (
                                        <tfoot className="bg-slate-100/80 font-bold border-t-2 border-slate-200">
                                            <tr>
                                                <td className="p-3 text-center">총계 (Grand Total)</td>
                                                <td className="p-3 text-center text-blue-700 text-lg border-x">{data.summary.totalLunch}</td>
                                                <td className="p-3 text-center text-green-700 text-lg border-r">{data.summary.totalSalad}</td>
                                                <td className="p-3 text-center text-slate-900 text-xl bg-slate-200/50 border-r">
                                                    {data.summary.totalLunch + data.summary.totalSalad}
                                                </td>
                                                <td className="p-3 text-right text-slate-500 text-xs border-r">
                                                    {data.summary.totalRevenue.toLocaleString()}원
                                                </td>
                                                <td className="p-3 text-center border-r">-</td>
                                                <td className="p-3 text-left border-r">-</td>
                                                <td className="p-3 text-center">-</td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Admin Edit Dialog */}
            <Dialog open={!!editingClient} onOpenChange={(open) => !open && setEditingClient(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingClient?.name} 수량 수정</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>도시락 (Lunch Box)</Label>
                                <Input
                                    type="number"
                                    value={editValues.lunch}
                                    onChange={e => setEditValues(prev => ({ ...prev, lunch: parseInt(e.target.value) || 0 }))}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>샐러드 (Salad)</Label>
                                <Input
                                    type="number"
                                    value={editValues.salad}
                                    onChange={e => setEditValues(prev => ({ ...prev, salad: parseInt(e.target.value) || 0 }))}
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>특이사항 (해당 일자 전용)</Label>
                            <Input
                                placeholder="생오이 제외 등..."
                                value={editValues.note}
                                onChange={e => setEditValues(prev => ({ ...prev, note: e.target.value }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingClient(null)}>취소</Button>
                        <Button onClick={handleSaveEdit} disabled={saving}>
                            {saving ? "저장 중..." : "변경사항 저장"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Audit Log Dialog */}
            <Dialog open={!!viewingLogs} onOpenChange={(open) => !open && setViewingLogs(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{viewingLogs?.name} 변경 기록</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        {logsLoading ? (
                            <div className="flex justify-center p-8">
                                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : orderLogs.length === 0 ? (
                            <div className="text-center p-8 text-muted-foreground">변경 내역이 없습니다.</div>
                        ) : (
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                {orderLogs.map((log) => (
                                    <div key={log.id} className="border-l-2 border-slate-200 pl-4 py-1 relative">
                                        <div className="absolute w-2 h-2 bg-slate-400 rounded-full -left-[5px] top-2" />
                                        <div className="flex justify-between items-start mb-1 text-xs">
                                            <span className="font-bold text-slate-700">
                                                {log.actorName} ({log.actorType === 'ADMIN' ? '관리자' : '고객사'})
                                            </span>
                                            <span className="text-slate-400">
                                                {format(new Date(log.date), "HH:mm:ss", { locale: ko })}
                                            </span>
                                        </div>
                                        <div className="text-[13px] bg-slate-50 p-2 rounded border">
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1">
                                                    <div className="text-[10px] text-slate-400">도시락</div>
                                                    <div className="flex items-center gap-1 font-medium">
                                                        <span>{log.oldLunchQty}</span>
                                                        <ArrowRight className="w-3 h-3 text-slate-300" />
                                                        <span className="text-blue-600 font-bold">{log.newLunchQty}</span>
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-[10px] text-slate-400">샐러드</div>
                                                    <div className="flex items-center gap-1 font-medium">
                                                        <span>{log.oldSaladQty}</span>
                                                        <ArrowRight className="w-3 h-3 text-slate-300" />
                                                        <span className="text-green-600 font-bold">{log.newSaladQty}</span>
                                                    </div>
                                                </div>
                                                <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${log.action === 'CREATE' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                                    {log.action === 'CREATE' ? '최초' : '수정'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="w-full" onClick={() => setViewingLogs(null)}>닫기</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
