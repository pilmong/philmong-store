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
import { getDailyOperations } from "./actions"
import { ChevronLeft, ChevronRight, RefreshCw, Printer } from "lucide-react"

// ... inside page component ...




export default function DailyOperationsPage() {
    const [date, setDate] = useState(new Date())
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [printTarget, setPrintTarget] = useState<any>(null)

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
                                            main: { text: "메인반찬", isEmpty: true },
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
                            <CardTitle>🚛 배송 및 결제 장부</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-b">
                                        <tr>
                                            <th className="p-3 text-left">고객사</th>
                                            <th className="p-3 text-center">도시락</th>
                                            <th className="p-3 text-center">샐러드</th>
                                            <th className="p-3 text-right">금액</th>
                                            <th className="p-3 text-center">결제정보</th>
                                            <th className="p-3 text-left">특이사항</th>
                                            <th className="p-3 text-center">관리</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {data?.clients.map((client: any) => (
                                            <tr key={client.id} className="hover:bg-slate-50/50">
                                                <td className="p-3 font-medium">{client.name}</td>
                                                <td className="p-3 text-center">
                                                    {client.lunchQty > 0 ? <span className="font-bold text-blue-600">{client.lunchQty}</span> : "-"}
                                                </td>
                                                <td className="p-3 text-center">
                                                    {client.saladQty > 0 ? <span className="font-bold text-green-600">{client.saladQty}</span> : "-"}
                                                </td>
                                                <td className="p-3 text-right font-medium">
                                                    {(client.totalAmount || 0).toLocaleString()}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <div className="flex justify-center">
                                                        <PaymentBadge method={client.paymentMethod} timing={client.paymentTiming} />
                                                    </div>
                                                </td>
                                                <td className="p-3 text-xs max-w-[150px]">
                                                    {client.generalNote && <div className="text-amber-600 mb-1">📢 {client.generalNote}</div>}
                                                    {client.dailyNote && <div className="text-slate-600">📝 {client.dailyNote}</div>}
                                                </td>
                                                <td className="p-3 text-center">
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
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
