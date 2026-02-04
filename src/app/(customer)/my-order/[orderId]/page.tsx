'use client'

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { CustomerHeader } from "../../components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft, Phone, MapPin, CreditCard, Clock } from "lucide-react"
import { getOrder, notifyPayment } from "../../orders/actions"
import { format } from "date-fns"
import { toast } from "sonner"
import Link from "next/link"

export default function MyOrderPage() {
    const params = useParams()
    const router = useRouter()
    const orderId = params.orderId as string
    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchOrder = async () => {
            if (!orderId) return
            const result = await getOrder(orderId)
            if (result.success) {
                setOrder(result.data)
            } else {
                toast.error(result.error)
                router.push('/order-lookup') // Redirect if not found
            }
            setLoading(false)
        }
        fetchOrder()
    }, [orderId, router])

    const handleNotifyPayment = async () => {
        if (!order) return
        const result = await notifyPayment(order.id)
        if (result.success) {
            toast.success("입금 알림을 보냈습니다! 사장님이 확인하실 거예요.")
            // Refresh order data to show updated status
            const updated = await getOrder(order.id)
            if (updated.success) setOrder(updated.data)
        } else {
            toast.error("알림 전송 실패")
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <CustomerHeader />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
                </div>
            </div>
        )
    }

    if (!order) return null

    const isUnpaid = order.status === 'PENDING' && order.paymentStatus === 'UNPAID'

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <CustomerHeader />
            <div className="container mx-auto px-4 py-8 max-w-lg">
                <Button variant="ghost" className="mb-4 pl-0" onClick={() => router.back()}>
                    <ArrowLeft className="w-5 h-5 mr-1" />
                    돌아가기
                </Button>

                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">주문 상세 내역</h1>
                    <span className="font-mono text-sm text-muted-foreground">#{order.orderNumber}</span>
                </div>

                {/* Status Card */}
                <Card className="mb-6 border-orange-200">
                    <CardHeader className="bg-orange-50 border-b border-orange-100 py-4">
                        <div className="flex justify-between items-center">
                            <span className="font-semibold text-orange-900">주문 상태</span>
                            {order.status === 'CANCELLED' ? (
                                <Badge variant="destructive">취소됨</Badge>
                            ) : order.paymentStatus === 'PAID' ? (
                                <Badge className="bg-green-600">결제 완료</Badge>
                            ) : (
                                <Badge variant="outline" className="text-orange-600 border-orange-200 bg-white">
                                    입금 대기 중
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {isUnpaid && (
                            <div className="text-center space-y-4">
                                <div className="p-4 bg-white border rounded-lg shadow-sm">
                                    <p className="text-sm text-muted-foreground mb-1">입금하실 금액</p>
                                    <p className="text-2xl font-bold text-orange-600">{order.totalAmount.toLocaleString()}원</p>
                                    <div className="my-3 border-t border-dashed" />
                                    <p className="text-sm font-medium">카카오뱅크 3333-01-2345678</p>
                                    <p className="text-xs text-muted-foreground">(예금주: 필몽)</p>
                                </div>

                                {order.paymentNotified ? (
                                    <Button className="w-full bg-purple-100 text-purple-700 hover:bg-purple-200" disabled>
                                        🔔 입금 확인 요청됨
                                    </Button>
                                ) : (
                                    <Button onClick={handleNotifyPayment} className="w-full bg-green-600 hover:bg-green-700">
                                        입금 완료 알림 보내기
                                    </Button>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    * 입금 후 알림을 보내주시면 빠른 확인이 가능합니다.
                                </p>
                            </div>
                        )}
                        {!isUnpaid && order.status !== 'CANCELLED' && (
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <p className="font-bold text-green-700">고객님의 주문이 정상적으로 접수되었습니다.</p>
                                <p className="text-sm text-green-600 mt-1">맛있게 준비해서 보내드릴게요!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Order Items */}
                <Card className="mb-6">
                    <CardHeader className="py-4">
                        <CardTitle className="text-lg">주문 상품</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {order.items.map((item: any) => (
                            <div key={item.id} className="flex justify-between items-start">
                                <div>
                                    <p className="font-medium">{item.productName}</p>
                                    <p className="text-sm text-muted-foreground">{item.price.toLocaleString()}원 x {item.quantity}개</p>
                                </div>
                                <p className="font-bold">{(item.price * item.quantity).toLocaleString()}원</p>
                            </div>
                        ))}
                        {order.deliveryFee > 0 && (
                            <div className="flex justify-between items-center pt-4 border-t">
                                <span className="text-sm text-muted-foreground">배달비</span>
                                <span className="font-medium">{order.deliveryFee.toLocaleString()}원</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-4 border-t">
                            <span className="font-bold">총 결제 금액</span>
                            <span className="font-bold text-xl text-orange-600">{order.totalAmount.toLocaleString()}원</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Delivery Info */}
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-lg">배송 정보</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex items-start gap-3">
                            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="font-medium">
                                    {order.deliveryType === 'DELIVERY' ? '배달 주문' : '매장 방문 포장'}
                                </p>
                                {order.address && (
                                    <p className="text-muted-foreground mt-1">
                                        {order.address} {order.detailAddress}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span>{order.customerPhone}</span>
                        </div>
                        {order.requestNote && (
                            <div className="mt-2 p-3 bg-slate-50 rounded text-muted-foreground">
                                " {order.requestNote} "
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
