'use client'

import { useState, useEffect } from "react"
import { getOrders, updateOrderStatus, confirmOrderPayment, extendPaymentDeadline } from "./actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format, differenceInMinutes } from "date-fns"
import { ko } from "date-fns/locale"
import { toast } from "sonner"
import { Loader2, Phone, MapPin, Clock, Timer, Printer, CheckCircle2, Truck, Package, RotateCcw } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AdminOrderPage() {
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [activeTab, setActiveTab] = useState("ALL")

    const fetchOrders = async () => {
        setLoading(true)
        const dateStr = format(selectedDate, 'yyyy-MM-dd')
        const result = await getOrders(dateStr)
        if (result.success) {
            setOrders(result.data || [])
        } else {
            toast.error(result.error)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchOrders()
    }, [selectedDate])

    const handleConfirmPayment = async (orderId: string) => {
        if (!confirm("입금 확인 처리하시겠습니까?")) return
        const result = await confirmOrderPayment(orderId)
        if (result.success) {
            toast.success("입금 확인 완료")
            fetchOrders()
        } else {
            toast.error(result.error)
        }
    }

    const handleUpdateStatus = async (orderId: string, status: any, message: string) => {
        if (!confirm(message)) return
        const result = await updateOrderStatus(orderId, status)
        if (result.success) {
            toast.success("상태 변경 완료")
            fetchOrders()
        } else {
            toast.error(result.error)
        }
    }

    const handleCancelOrder = async (orderId: string) => {
        const reason = prompt("취소 사유를 입력하세요:")
        if (reason === null) return

        const result = await updateOrderStatus(orderId, 'CANCELLED')
        if (result.success) {
            toast.success("주문 취소 완료")
            fetchOrders()
        } else {
            toast.error(result.error)
        }
    }

    const handleExtendDeadline = async (orderId: string) => {
        const result = await extendPaymentDeadline(orderId)
        if (result.success) {
            toast.success("입금 기한 1시간 연장됨")
            fetchOrders()
        } else {
            toast.error(result.error)
        }
    }

    const handlePrintInvoice = (order: any) => {
        const printContent = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>주문서 #${order.orderNumber}</title>
                    <style>
                        @page { margin: 0; }
                        body { 
                            font-family: sans-serif;
                            font-weight: bold;
                            margin: 0; 
                            padding: 0; 
                            width: 100%; 
                            /* Reduced further to 64mm to be extremely safe against right-side cutoff */
                            /* Standard 80mm paper has ~72mm printable area, but margins vary */
                            max-width: 64mm; 
                            font-size: 11px; 
                            line-height: 1.3;
                            color: #000;
                        }
                        .container {
                            padding: 5px 6px 5px 2px; /* Extra padding on right */
                        }
                        .header { text-align: center; margin-bottom: 5px; border-bottom: 2px dashed #000; padding-bottom: 5px; }
                        .title { font-size: 16px; font-weight: 900; display: block; margin-bottom: 2px;}
                        .sub-title { font-size: 10px; }
                        
                        .section { margin-bottom: 5px; border-bottom: 1px solid #000; padding-bottom: 3px; }
                        .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
                        .label { font-weight: 800; white-space: nowrap; margin-right: 5px; }
                        .value { text-align: right; word-break: break-all; font-weight: 700;}
                        
                        .items { margin-bottom: 5px; border-bottom: 2px solid #000; }
                        .item-row { margin-bottom: 6px; }
                        .item-line1 { display: flex; justify-content: space-between; font-weight: 900; font-size: 12px; }
                        .item-line2 { text-align: right; font-size: 11px; font-weight: 700; }
                        
                        .totals { text-align: right; margin-top: 5px; }
                        .total-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
                        .final-total { font-weight: 900; font-size: 16px; margin-top: 5px; border-top: 2px dashed #000; padding-top: 5px; }
                        
                        .footer { margin-top: 15px; text-align: center; font-size: 9px; font-weight: normal; }
                        
                        @media print {
                            .no-print { display: none !important; }
                        }
                        .action-bar {
                            background: #f0f0f0;
                            padding: 10px;
                            text-align: center;
                            margin-bottom: 10px;
                            border-bottom: 1px solid #ddd;
                        }
                        .btn {
                            background: #000;
                            color: #fff;
                            border: none;
                            padding: 5px 10px;
                            cursor: pointer;
                            font-size: 12px;
                            border-radius: 4px;
                            margin: 0 5px;
                        }
                        .btn-close { background: #666; }
                    </style>
                </head>
                <body>
                    <div class="action-bar no-print">
                        <button class="btn" onclick="window.print()">🖨 인쇄하기</button>
                        <button class="btn btn-close" onclick="window.close()">닫기</button>
                    </div>

                    <div class="container">
                        <div class="header">
                            <span class="title">필몽(Philmong)</span>
                            <span class="sub-title">주문번호: ${order.orderNumber}</span><br/>
                            <span class="sub-title">${format(new Date(order.createdAt), "yyyy-MM-dd HH:mm")}</span>
                        </div>

                        <div class="section">
                            <div class="row">
                                <span class="label">고객:</span>
                                <span class="value">${order.customerName}</span>
                            </div>
                            <div class="row">
                                <span class="label">연락처:</span>
                                <span class="value">${order.customerPhone}</span>
                            </div>
                            <div class="row">
                                <span class="label">유형:</span>
                                <span class="value" style="font-size: 14px;">
                                    ${order.deliveryType === 'DELIVERY' ? '[배달]' : '[포장/픽업]'}
                                </span>
                            </div>
                            ${order.deliveryType === 'DELIVERY' ? `
                            <div class="row" style="margin-top: 4px;">
                                <span class="label">주소:</span>
                                <span class="value" style="font-size: 14px; font-weight: 800; line-height: 1.2;">${order.address} ${order.detailAddress || ''}</span>
                            </div>
                            ` : ''}
                            ${order.requestNote ? `
                            <div class="row" style="margin-top: 8px; border: 2px solid #000; padding: 5px;">
                                <span class="label" style="font-size: 12px;">요청:</span>
                                <span class="value" style="font-size: 14px; font-weight: 800; text-align: left; width: 100%; display: block; margin-top: 2px;">${order.requestNote}</span>
                            </div>
                            ` : ''}
                        </div>
                        
                        <div class="items">
                            ${order.items.map((item: any) => `
                            <div class="item-row">
                                <div class="item-line1">
                                    <span>${item.productName}</span>
                                    <span>x ${item.quantity}</span>
                                </div>
                                <div class="item-line2">
                                    ${(item.price * item.quantity).toLocaleString()}
                                </div>
                            </div>
                            `).join('')}
                        </div>
                        
                        <div class="totals">
                            ${order.deliveryFee > 0 ? `
                            <div class="total-row">
                                <span>배달비</span>
                                <span>+${order.deliveryFee.toLocaleString()}</span>
                            </div>
                            ` : ''}
                            <div class="total-row">
                                <span>할인</span>
                                <span>-${order.discountAmount?.toLocaleString() || 0}</span>
                            </div>
                            <div class="total-row" style="margin-top: 5px;">
                                <span style="font-size: 14px; font-weight: 900;">합계</span>
                                <span class="final-total">${order.totalAmount.toLocaleString()}원</span>
                            </div>
                        </div>
                        
                        <div class="footer">
                            맛있게 드세요! 감사합니다.<br/>
                            (문의: 010-0000-0000)
                        </div>
                    </div>
                </body>
            </html>
        `
        const printWindow = window.open('', '_blank', 'width=380,height=600')
        if (printWindow) {
            printWindow.document.write(printContent)
            printWindow.document.close()
            printWindow.focus()
            // Auto-print removed to allow preview. User must click button.
        }
    }

    const filteredOrders = orders.filter(order => {
        if (activeTab === 'ALL') return true
        if (activeTab === 'PENDING') return order.status === 'PENDING'
        if (activeTab === 'PREPARING') return order.status === 'CONFIRMED' || order.status === 'PREPARING'
        if (activeTab === 'READY') return order.status === 'READY'
        if (activeTab === 'COMPLETED') return order.status === 'COMPLETED'
        if (activeTab === 'CANCELLED') return order.status === 'CANCELLED'
        return true
    })

    const getStatusBadge = (status: string, paymentStatus: string) => {
        if (status === 'CANCELLED') return <Badge variant="destructive">취소됨</Badge>
        if (status === 'CONFIRMED') return <Badge className="bg-blue-500">주문확인(입금완료)</Badge>
        if (status === 'PREPARING') return <Badge className="bg-orange-500">준비중(조리/포장)</Badge>
        if (status === 'READY') return <Badge className="bg-purple-600">준비완료(배송/픽업대기)</Badge>
        if (status === 'COMPLETED') return <Badge className="bg-green-600">완료됨</Badge>

        if (status === 'PENDING') {
            if (paymentStatus === 'PAID') return <Badge className="bg-blue-500">결제완료(확인대기)</Badge>
            return <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">입금대기</Badge>
        }
        return <Badge>{status}</Badge>
    }

    return (
        <div className="container mx-auto p-4 max-w-5xl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">주문 관리</h1>
                <div className="text-sm text-muted-foreground bg-slate-100 px-3 py-1 rounded-full">
                    {format(selectedDate, "yyyy년 MM월 dd일 (EEE)", { locale: ko })}
                </div>
            </div>

            <Tabs defaultValue="ALL" onValueChange={setActiveTab} className="w-full mb-6">
                <TabsList className="grid w-full grid-cols-5 h-12">
                    <TabsTrigger value="ALL">전체</TabsTrigger>
                    <TabsTrigger value="PENDING">접수대기</TabsTrigger>
                    <TabsTrigger value="PREPARING">준비중</TabsTrigger>
                    <TabsTrigger value="READY">배송/픽업</TabsTrigger>
                    <TabsTrigger value="COMPLETED">완료</TabsTrigger>
                    {/* <TabsTrigger value="CANCELLED">취소</TabsTrigger> */}
                </TabsList>
            </Tabs>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-20 border rounded-lg bg-slate-50 text-muted-foreground">
                    해당 상태의 주문이 없습니다.
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredOrders.map((order) => {
                        const isPending = order.status === 'PENDING' && order.paymentStatus === 'UNPAID' // Truly pending payment
                        const isPaidPending = order.status === 'PENDING' && order.paymentStatus === 'PAID' // Paid but not confirmed by admin logic? Or Auto confirmed?
                        // Actually logic: 
                        // Transfer -> PENDING/UNPAID -> Admin Compirm -> CONFIRMED/PAID
                        // OnSite -> PENDING/UNPAID (wait for pickup pay) -> Admin Confirm -> CONFIRMED/PAID

                        // Status Flow:
                        // 1. PENDING (UNPAID) -> [입금확인] -> CONFIRMED (PAID)
                        // 2. CONFIRMED (PAID) -> [준비시작] -> PREPARING
                        // 3. PREPARING -> [준비완료] -> READY
                        // 4. READY -> [픽업/배송완료] -> COMPLETED

                        const deadline = order.paymentDeadline ? new Date(order.paymentDeadline) : null
                        const now = new Date()
                        const timeLeftMinutes = deadline ? differenceInMinutes(deadline, now) : 0
                        const isExpired = deadline && timeLeftMinutes < 0

                        return (
                            <Card key={order.id} className={`overflow-hidden transition-all hover:shadow-md ${order.status === 'CANCELLED' ? 'opacity-60 bg-slate-50' : ''}`}>
                                <CardHeader className="bg-slate-50 border-b py-3 px-4">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-lg">#{order.orderNumber}</span>
                                            {getStatusBadge(order.status, order.paymentStatus)}

                                            {/* Payment Notification Badge */}
                                            {order.paymentNotified && isPending && (
                                                <Badge className="bg-purple-600 hover:bg-purple-700 animate-pulse">
                                                    🔔 입금 확인 요청
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-sm text-muted-foreground">
                                                {format(new Date(order.createdAt), "HH:mm")} 접수
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-black" onClick={() => handlePrintInvoice(order)} title="주문서 인쇄">
                                                <Printer className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        {/* Customer & Delivery Info */}
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-bold text-lg">{order.customerName}</p>
                                                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                                                        <Phone className="w-3 h-3 mr-1" />
                                                        {order.customerPhone}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-lg text-orange-600">{order.totalAmount.toLocaleString()}원</p>
                                                    <p className="text-xs text-muted-foreground">{order.paymentMethod === 'TRANSFER' ? '무통장입금' : '현장결제'}</p>
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 p-3 rounded text-sm">
                                                <div className="flex items-start gap-2">
                                                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        {order.deliveryType === 'DELIVERY' ? (
                                                            <>
                                                                <span className="font-bold text-blue-600">[배달]</span> {order.address}
                                                                <p className="text-slate-500 pl-[38px]">{order.detailAddress}</p>
                                                            </>
                                                        ) : (
                                                            <p className="font-bold text-primary">[매장 픽업]</p>
                                                        )}
                                                        {order.requestNote && (
                                                            <p className="mt-2 text-orange-600 font-medium">" {order.requestNote} "</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Order Items */}
                                        <div className="flex-1 border-l pl-0 md:pl-6 border-slate-100 pt-4 md:pt-0">
                                            <h4 className="font-semibold mb-2 text-sm text-slate-500">주문 내역</h4>
                                            <ul className="space-y-2">
                                                {order.items.map((item: any) => (
                                                    <li key={item.id} className="flex justify-between text-sm">
                                                        <span>{item.productName} <span className="text-slate-400">x {item.quantity}</span></span>
                                                        <span>{(item.price * item.quantity).toLocaleString()}원</span>
                                                    </li>
                                                ))}
                                            </ul>
                                            {order.deliveryFee > 0 && (
                                                <div className="flex justify-between text-sm text-blue-600 mt-2 pt-2 border-t border-dashed">
                                                    <span>배달비</span>
                                                    <span>+{order.deliveryFee.toLocaleString()}원</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons based on Status */}
                                    <div className="flex justify-between gap-2 mt-4 pt-4 border-t items-center bg-gray-50/50 -mx-4 -mb-4 px-4 py-3">
                                        <div className="text-xs text-muted-foreground">
                                            {isPending && deadline && !isExpired && `자동 취소 예정: ${format(deadline, "HH:mm")}`}
                                            {order.status === 'CANCELLED' && "취소된 주문입니다."}
                                            {order.status === 'COMPLETED' && "처리가 완료된 주문입니다."}
                                        </div>

                                        <div className="flex gap-2">
                                            {/* PENDING -> CONFIRMED */}
                                            {order.status === 'PENDING' && (
                                                <>
                                                    <Button size="sm" variant="outline" className="text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => handleCancelOrder(order.id)}>
                                                        취소
                                                    </Button>
                                                    {isPending && (
                                                        <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => handleExtendDeadline(order.id)}>
                                                            + 연장
                                                        </Button>
                                                    )}
                                                    <Button size="sm" onClick={() => handleConfirmPayment(order.id)}>
                                                        입금/주문 확인
                                                    </Button>
                                                </>
                                            )}

                                            {/* CONFIRMED -> PREPARING */}
                                            {order.status === 'CONFIRMED' && (
                                                <>
                                                    <Button size="sm" variant="ghost" className="text-slate-500 hover:text-slate-700" onClick={() => handleUpdateStatus(order.id, 'PENDING', '접수 대기 상태로 되돌리시겠습니까?')} title="이전 단계로(접수대기)">
                                                        <RotateCcw className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="sm" variant="outline" onClick={() => handleCancelOrder(order.id)}>
                                                        취소
                                                    </Button>
                                                    <Button size="sm" className="bg-orange-500 hover:bg-orange-600" onClick={() => handleUpdateStatus(order.id, 'PREPARING', '조리 및 준비를 시작하시겠습니까?')}>
                                                        <Package className="w-4 h-4 mr-2" />
                                                        준비 시작
                                                    </Button>
                                                </>
                                            )}

                                            {/* PREPARING -> READY */}
                                            {order.status === 'PREPARING' && (
                                                <>
                                                    <Button size="sm" variant="ghost" className="text-slate-500 hover:text-slate-700" onClick={() => handleUpdateStatus(order.id, 'CONFIRMED', '준비 전(주문확인) 상태로 되돌리시겠습니까?')} title="이전 단계로(주문확인)">
                                                        <RotateCcw className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => handleUpdateStatus(order.id, 'READY', order.deliveryType === 'DELIVERY' ? '배달 출발 처리하시겠습니까?' : '픽업 준비 완료 처리하시겠습니까?')}>
                                                        {order.deliveryType === 'DELIVERY' ? <Truck className="w-4 h-4 mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                                        {order.deliveryType === 'DELIVERY' ? '배달 출발' : '픽업 준비 완료'}
                                                    </Button>
                                                </>
                                            )}

                                            {/* READY -> COMPLETED */}
                                            {order.status === 'READY' && (
                                                <>
                                                    <Button size="sm" variant="ghost" className="text-slate-500 hover:text-slate-700" onClick={() => handleUpdateStatus(order.id, 'PREPARING', '준비중 상태로 되돌리시겠습니까?')} title="이전 단계로(준비중)">
                                                        <RotateCcw className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleUpdateStatus(order.id, 'COMPLETED', '최종 완료 처리하시겠습니까?')}>
                                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                                        {order.deliveryType === 'DELIVERY' ? '배달 완료' : '픽업 완료'}
                                                    </Button>
                                                </>
                                            )}

                                            {/* COMPLETED -> Revert Option */}
                                            {order.status === 'COMPLETED' && (
                                                <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(order.id, 'READY', '완료 처리를 취소하고 배송/픽업 중 상태로 되돌리시겠습니까?')}>
                                                    <RotateCcw className="w-4 h-4 mr-2" />
                                                    상태 되돌리기
                                                </Button>
                                            )}

                                            {/* CANCELLED -> Restore Option */}
                                            {order.status === 'CANCELLED' && (
                                                <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(order.id, 'PENDING', '취소를 철회하고 접수 대기 상태로 복구하시겠습니까? (재고가 다시 차감됩니다)')}>
                                                    <RotateCcw className="w-4 h-4 mr-2" />
                                                    취소 철회 (복구)
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
